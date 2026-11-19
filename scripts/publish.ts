// Usage: node scripts/publish.ts --lang en|id [--dry-run] [--only youtube|instagram]
// Posts the oldest episode not yet posted in that language to every platform it is missing from.
import {spawnSync} from 'node:child_process';
import {existsSync, writeFileSync} from 'node:fs';
import {basename} from 'node:path';
import {listEpisodes, readJson, readMeta} from './lib.ts';
import type {Lang, Meta} from '../src/types.ts';

export type Platform = 'youtube' | 'instagram';
export type Posted = {id: string; lang: Lang; platform: Platform; mediaId: string; postedAt: string; error?: string}; // error: failed, skipped; delete the entry to retry
export const PLATFORMS: Platform[] = ['youtube', 'instagram'];
const STATE = 'state/posted.json';

const REQUIRED: Record<Platform, (l: string) => string[]> = {
	youtube: (l) => ['YT_CLIENT_ID', 'YT_CLIENT_SECRET', `YT_REFRESH_TOKEN_${l}`],
	instagram: (l) => [`IG_USER_ID_${l}`, `IG_TOKEN_${l}`],
};

/** Secrets still missing for these platforms. Checked before rendering, so an unfinished setup never burns an episode. */
export const missingSecrets = (platforms: Platform[], lang: Lang, vars: Record<string, string | undefined>): string[] =>
	platforms.flatMap((p) => REQUIRED[p](lang.toUpperCase())).filter((n) => !vars[n]);

/** Errors from logging in (bad or expired secrets), as opposed to the platform rejecting the video. Instagram refusing the
 * upload itself before any processing (rupload ProcessingFailedError) also counts: it points at the account (a block after a
 * security check), and recording it would use up one episode per attempt. */
// Meta labels almost every error OAuthException, so go by its code: token (190, 102), permission (10, 200-299) and
// rate limit (4, 17, 32, 613) are setup or temporary problems, as is a network failure; anything else is the video's fault.
export const isAuthError = (msg: string): boolean => /oauth2\.googleapis\.com\/token|"code":\s*(190|102|10|4|17|32|613|2\d\d)\b|missing secret|network error|fetch failed|rupload\.facebook\.com.*ProcessingFailedError/.test(msg);

/** When each platform posts, per language, as UTC "HH:MM": Instagram twice a day, YouTube once. */
export const SLOTS: Record<Lang, Record<Platform, string[]>> = {
	id: {instagram: ['04:47', '12:19'], youtube: ['12:17']}, // 11:47 and 19:19 WIB; YouTube 19:17 WIB
	en: {youtube: ['17:23'], instagram: ['17:25', '22:25']}, // 12:23 New York; Instagram 12:25 and 17:25 New York (UTC-5)
};

/** Hours from UTC to the audience's clock: posts are counted per audience day, so a slot caught up late (after midnight
 * UTC) still counts for the day it belonged to. New York ignores daylight saving: slots shift an hour in summer, no more. */
const OFFSET_H: Record<Lang, number> = {id: 7, en: -5};
export const audience = (t: Date | string, lang: Lang) => new Date(new Date(t).getTime() + OFFSET_H[lang] * 3_600_000).toISOString();
const shiftHm = (hm: string, lang: Lang) => {
	const m = (((+hm.slice(0, 2) + OFFSET_H[lang]) * 60 + +hm.slice(3)) % 1440 + 1440) % 1440;
	return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Platforms with more slots passed today (audience's day) than posts made today: what the hourly run posts now. Missed
 * slots (GitHub drops or delays scheduled runs) are caught up on the next hourly run. */
export const duePlatforms = (posted: Posted[], lang: Lang, now: Date): Platform[] => {
	const t = audience(now, lang);
	const day = t.slice(0, 10);
	const hm = t.slice(11, 16);
	return PLATFORMS.filter((p) => SLOTS[lang][p].filter((s) => shiftHm(s, lang) <= hm).length > posted.filter((x) => x.lang === lang && x.platform === p && audience(x.postedAt, lang).startsWith(day)).length);
};

/** Records from this run (`mine`) added to what is on main now (`theirs`), so two runs that save at once both keep theirs. */
export const mergePosted = (theirs: Posted[], mine: Posted[]): Posted[] => [
	...theirs,
	...mine.filter((m) => !theirs.some((t) => t.id === m.id && t.lang === m.lang && t.platform === m.platform)),
];

if (import.meta.main && process.argv[2] === '--merge-into') {
	// node scripts/publish.ts --merge-into state/posted.json /tmp/mine.json
	const [file, mineFile] = process.argv.slice(3);
	writeFileSync(file, JSON.stringify(mergePosted(readJson<Posted[]>(file, []), readJson<Posted[]>(mineFile, [])), null, 2) + '\n');
}

/** Oldest episode still missing a platform in this language; `wants` drops platforms an episode should not go to. */
export const nextToPost = (ids: string[], posted: Posted[], lang: Lang, wants: (id: string, p: Platform) => boolean = () => true): {id: string; platforms: Platform[]} | null => {
	for (const id of ids) {
		const platforms = PLATFORMS.filter((p) => wants(id, p) && !posted.some((x) => x.id === id && x.lang === lang && x.platform === p));
		if (platforms.length) return {id, platforms};
	}
	return null;
};

const description = (m: Meta, lang: Lang) =>
	[m.description[lang], '', lang === 'id' ? 'Sumber:' : 'Sources:', ...m.sources, '', lang === 'id' ? 'Narasi: suara AI.' : 'Narration: AI voice.', '', m.hashtags.map((h) => `#${h}`).join(' ')].join('\n');

if (import.meta.main && process.argv[2] !== '--merge-into') {
	const lang = process.argv[process.argv.indexOf('--lang') + 1] as Lang;
	if (!['en', 'id'].includes(lang)) throw new Error('usage: node scripts/publish.ts --lang en|id [--dry-run]');
	const dry = process.argv.includes('--dry-run');
	const posted = readJson<Posted[]>(STATE, []);
	const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '';
	const due = process.argv.includes('--due') ? duePlatforms(posted, lang, new Date()) : PLATFORMS;
	if (!due.length) {
		console.log(`${lang}: nothing due right now`);
		process.exit(0);
	}
	// Each platform keeps its own place in the queue: YouTube posts once a day, Instagram twice, so they drift apart.
	const next = nextToPost(listEpisodes(), posted, lang, (id, p) => due.includes(p) && (!only || p === only) && !(p === 'youtube' && readMeta(id).youtube === false));
	if (!next || !next.platforms.length) {
		console.error(`nothing left to post in ${lang}: the queue is empty, merge next week's batch`);
		process.exit(1); // a red run makes GitHub email the owner instead of the channel going quiet
	}
	const meta = readMeta(next.id);
	const title = meta.title[lang];
	const text = description(meta, lang);
	console.log(`${dry ? '[dry run] ' : ''}${lang}: ${next.id} -> ${next.platforms.join(', ')}\n  title: ${title}\n${text.replace(/^/gm, '  | ')}`);
	if (dry) {
		// The dry run also proves the YouTube and Instagram logins work, for both accounts, so setup mistakes show before a real post.
		const {checkYoutube} = await import('./post/youtube.ts');
		const {checkInstagram} = await import('./post/instagram.ts');
		const ok = [await checkYoutube('en'), await checkYoutube('id'), await checkInstagram('en'), await checkInstagram('id')];
		process.exit(ok.every(Boolean) ? 0 : 1);
	}

	const missing = missingSecrets(next.platforms, lang, process.env);
	if (missing.length) {
		console.error(`missing secrets: ${missing.join(', ')} (see docs/SETUP.md). Nothing rendered or recorded.`);
		process.exit(1);
	}
	const {build, videoFile} = await import('./build.ts');
	const {uploadYoutube, checkYoutube} = await import('./post/youtube.ts');
	const {uploadInstagram, checkInstagram} = await import('./post/instagram.ts');
	// Log in before the 30-minute render. A platform whose login fails is skipped (its post stays queued) and the run
	// ends red so you hear about it; the other platform still posts on schedule.
	const loggedIn: Platform[] = [];
	for (const platform of next.platforms) {
		if (platform === 'youtube' ? await checkYoutube(lang) : await checkInstagram(lang)) loggedIn.push(platform);
		else console.error(`${platform} login failed (see above): skipped, the post stays queued.`);
	}
	if (!loggedIn.length) process.exit(1);
	const skipped = loggedIn.length < next.platforms.length;
	next.platforms = loggedIn;
	// The weekly preview job saved the exact video the human reviewed in the `videos` release: post that one. Render only
	// if it is missing (seconds instead of a 30-40 minute render, and what was approved is what goes out).
	const saved = videoFile(next.id, lang);
	const repo = process.env.GITHUB_REPOSITORY;
	const got = repo && spawnSync('gh', ['release', 'download', 'videos', '-R', repo, '-p', basename(saved), '-D', 'out', '--clobber'], {stdio: 'inherit'}).status === 0 && existsSync(saved);
	console.log(got ? `using the reviewed render ${basename(saved)} from the videos release` : 'no reviewed render saved for this episode: rendering now');
	const file = got ? saved : build(next.id, lang);
	let failed = false;
	for (const platform of next.platforms) {
		const postedAt = new Date().toISOString();
		try {
			const mediaId = platform === 'youtube' ? await uploadYoutube(file, lang, title, text, meta.hashtags) : await uploadInstagram(file, lang, `${title.replace(/\s*#shorts/i, '')}\n\n${text}`);
			posted.push({id: next.id, lang, platform, mediaId, postedAt});
			console.log(`posted ${platform}: ${mediaId}`);
		} catch (e) {
			failed = true;
			console.error(`FAILED ${platform}: ${(e as Error).message}`);
			// A login failure is a setup problem, not this video's: leave the episode queued so it posts once fixed.
			if (isAuthError((e as Error).message)) continue;
			// Recorded so one rejected video cannot block the queue; the red run tells the owner.
			posted.push({id: next.id, lang, platform, mediaId: '', postedAt, error: (e as Error).message.slice(0, 500)});
		}
		writeFileSync(STATE, JSON.stringify(posted, null, 2) + '\n'); // saved per platform so a later failure never causes a double post
	}
	if (failed || skipped) process.exit(1);
}
