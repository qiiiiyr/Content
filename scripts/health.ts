// Usage: node scripts/health.ts   (daily system check; writes out/health.json {problems, notes, due})
// Checks what yesterday posted against the schedule, failed entries, the queue, the four logins and whether the hourly
// trigger is running. The workflow around it starts a catch-up post and opens an issue (an email) when something is wrong.
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {listEpisodes, readJson, readMeta} from './lib.ts';
import {PLATFORMS, SLOTS, audience, duePlatforms, nextToPost} from './publish.ts';
import type {Platform, Posted} from './publish.ts';
import type {Lang} from '../src/types.ts';

const LANGS: Lang[] = ['id', 'en'];
const PER_DAY = (lang: Lang, p: Platform) => SLOTS[lang][p].length;

/** Slots of the audience's previous day that have no post: [lang, platform, missing count]. Skips days before the first post. */
export const missedYesterday = (posted: Posted[], now: Date): [Lang, Platform, number][] => {
	const out: [Lang, Platform, number][] = [];
	for (const lang of LANGS) {
		const day = audience(new Date(now.getTime() - 86_400_000), lang).slice(0, 10);
		const mine = posted.filter((x) => x.lang === lang && !x.error);
		if (!mine.some((x) => audience(x.postedAt, lang).slice(0, 10) < day)) continue; // nothing existed before that day
		for (const p of PLATFORMS) {
			const made = mine.filter((x) => x.platform === p && audience(x.postedAt, lang).startsWith(day)).length;
			if (made < PER_DAY(lang, p)) out.push([lang, p, PER_DAY(lang, p) - made]);
		}
	}
	return out;
};

/** Days of posts left per language and platform. */
export const queueDays = (ids: string[], posted: Posted[], youtubeOff: (id: string) => boolean): Record<string, number> => {
	const out: Record<string, number> = {};
	for (const lang of LANGS)
		for (const p of PLATFORMS) {
			let left = 0;
			let rest = posted;
			for (let next = nextToPost(ids, rest, lang, (id, q) => q === p && !(p === 'youtube' && youtubeOff(id))); next; next = nextToPost(ids, rest, lang, (id, q) => q === p && !(p === 'youtube' && youtubeOff(id)))) {
				left++;
				rest = [...rest, {id: next.id, lang, platform: p, mediaId: '', postedAt: ''}];
			}
			out[`${lang} ${p}`] = left / PER_DAY(lang, p);
		}
	return out;
};

if (import.meta.main) {
	const problems: string[] = [];
	const notes: string[] = [];
	const now = new Date();
	const posted = readJson<Posted[]>('state/posted.json', []);

	for (const [lang, p, n] of missedYesterday(posted, now)) problems.push(`${lang} ${p}: ${n} slot(s) of yesterday were not posted`);
	for (const e of posted.filter((x) => x.error && now.getTime() - new Date(x.postedAt).getTime() < 3 * 86_400_000)) problems.push(`${e.lang} ${e.platform} ${e.id} was rejected and skipped: ${e.error!.slice(0, 160)}`);
	for (const [k, d] of Object.entries(queueDays(listEpisodes(), posted, (id) => readMeta(id).youtube === false))) if (d < 1.5) problems.push(`${k}: only ${d.toFixed(1)} day(s) of posts left in the queue (merge the weekly batch)`);

	const {checkYoutube} = await import('./post/youtube.ts');
	const {checkInstagram} = await import('./post/instagram.ts');
	for (const lang of LANGS) {
		if (!(await checkYoutube(lang))) problems.push(`${lang} YouTube login failed`);
		if (!(await checkInstagram(lang))) problems.push(`${lang} Instagram login failed`);
	}

	const gh = (...args: string[]) => spawnSync('gh', args, {encoding: 'utf8'}).stdout ?? '';
	const repo = process.env.GITHUB_REPOSITORY ?? 'qiiiiyr/Content';
	const runs: {databaseId: number; conclusion: string; createdAt: string; event: string}[] = JSON.parse(gh('run', 'list', '-R', repo, '-w', 'publish.yml', '-L', '60', '--json', 'databaseId,conclusion,createdAt,event') || '[]');
	const recent = runs.filter((r) => now.getTime() - new Date(r.createdAt).getTime() < 86_400_000);
	// The hourly trigger (GitHub's schedule or the cron-job.org timer) makes about 24 runs a day.
	if (recent.length < 12) problems.push(`only ${recent.length} publish run(s) in the last 24 h: the hourly trigger is not running (docs/SETUP.md part 6)`);
	for (const r of recent.filter((x) => x.conclusion === 'failure' && now.getTime() - new Date(x.createdAt).getTime() < 12 * 3_600_000).slice(0, 3)) {
		const lines = gh('run', 'view', String(r.databaseId), '-R', repo, '--log-failed').split('\n').filter((l) => /FAILED|login FAILED|Error|error:/.test(l)).slice(0, 4).map((l) => l.replace(/^.*?\t.*?\t/, '').slice(0, 220));
		notes.push(`failed run ${r.databaseId} (${r.event}, ${r.createdAt}): ${lines.join(' | ') || 'no error line found'}`);
	}

	const due = LANGS.flatMap((l) => duePlatforms(posted, l, now).map((p) => `${l} ${p}`));
	if (due.length) notes.push(`due right now: ${due.join(', ')}`);
	mkdirSync('out', {recursive: true});
	writeFileSync('out/health.json', JSON.stringify({problems, notes, due}, null, 2));
	console.log(JSON.stringify({problems, notes, due}, null, 2));
}
