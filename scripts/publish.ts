// Usage: node scripts/publish.ts --lang en|id [--dry-run]
// Posts the oldest episode not yet posted in that language to every platform it is missing from.
import {writeFileSync} from 'node:fs';
import {listEpisodes, readJson, readMeta} from './lib.ts';
import type {Lang, Meta} from '../src/types.ts';

export type Platform = 'youtube' | 'instagram';
export type Posted = {id: string; lang: Lang; platform: Platform; mediaId: string; postedAt: string};
export const PLATFORMS: Platform[] = ['youtube', 'instagram'];
const STATE = 'state/posted.json';

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
	const next = nextToPost(listEpisodes(), posted, lang);
	if (!next) {
		console.log(`nothing left to post in ${lang}: the queue is empty, merge next week's batch`);
		process.exit(0);
	}
	const meta = readMeta(next.id);
	const title = meta.title[lang];
	const text = description(meta, lang);
	console.log(`${dry ? '[dry run] ' : ''}${lang}: ${next.id} -> ${next.platforms.join(', ')}\n  title: ${title}\n${text.replace(/^/gm, '  | ')}`);
	if (dry) process.exit(0);

	const {build} = await import('./build.ts');
	const {uploadYoutube} = await import('./post/youtube.ts');
	const {uploadInstagram} = await import('./post/instagram.ts');
	const file = build(next.id, lang);
	for (const platform of next.platforms) {
		const mediaId = platform === 'youtube' ? await uploadYoutube(file, lang, title, text, meta.hashtags) : await uploadInstagram(file, lang, `${title.replace(/\s*#shorts/i, '')}\n\n${text}`);
		posted.push({id: next.id, lang, platform, mediaId, postedAt: new Date().toISOString()});
		writeFileSync(STATE, JSON.stringify(posted, null, 2) + '\n'); // saved per platform so a later failure never causes a double post
		console.log(`posted ${platform}: ${mediaId}`);
	}
}
