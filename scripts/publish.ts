// Usage: node scripts/publish.ts --lang en|id [--dry-run] [--only youtube|instagram]
// Posts the oldest episode not yet posted in that language to every platform it is missing from.
import {writeFileSync} from 'node:fs';
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

/** Errors from logging in (bad or expired secrets), as opposed to the platform rejecting the video. */
// Meta labels almost every error OAuthException, so go by its code: token (190, 102), permission (10, 200-299) and
// rate limit (4, 17, 32, 613) are setup or temporary problems; anything else is the video's fault.
export const isAuthError = (msg: string): boolean => /oauth2\.googleapis\.com\/token|"code":\s*(190|102|10|4|17|32|613|2\d\d)\b|missing secret/.test(msg);

export const nextToPost = (ids: string[], posted: Posted[], lang: Lang): {id: string; platforms: Platform[]} | null => {
	for (const id of ids) {
		const platforms = PLATFORMS.filter((p) => !posted.some((x) => x.id === id && x.lang === lang && x.platform === p));
		if (platforms.length) return {id, platforms};
	}
	return null;
};

const description = (m: Meta, lang: Lang) =>
	[m.description[lang], '', lang === 'id' ? 'Sumber:' : 'Sources:', ...m.sources, '', lang === 'id' ? 'Narasi: suara AI.' : 'Narration: AI voice.', '', m.hashtags.map((h) => `#${h}`).join(' ')].join('\n');

if (import.meta.main) {
	const lang = process.argv[process.argv.indexOf('--lang') + 1] as Lang;
	if (!['en', 'id'].includes(lang)) throw new Error('usage: node scripts/publish.ts --lang en|id [--dry-run]');
	const dry = process.argv.includes('--dry-run');
	const posted = readJson<Posted[]>(STATE, []);
	const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '';
	const next = nextToPost(listEpisodes(), posted, lang);
	if (next && only) next.platforms = next.platforms.filter((p) => p === only);
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
	const {build} = await import('./build.ts');
	const {uploadYoutube} = await import('./post/youtube.ts');
	const {uploadInstagram} = await import('./post/instagram.ts');
	const file = build(next.id, lang);
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
	if (failed) process.exit(1);
}
