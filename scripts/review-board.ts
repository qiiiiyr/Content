// For the dashboard review: reads the weekly pull request body on stdin (run inside a checkout of its branch) and prints
// {week, switchLine, episodes: [{episode, title, titleId, theme, test, youtube, en, id}]}, where en/id are the preview
// file names in the `previews` release. Usage: gh api repos/<repo>/pulls/<n> --jq .body | node scripts/review-board.ts
import {readFileSync} from 'node:fs';
import {readMeta} from './lib.ts';
import {videoFile} from './build.ts';

const body = readFileSync(0, 'utf8');
const ids = [...body.matchAll(/^\s*[-*]\s*\[[ xX]\]\s*episodes\/(\d{4}-W\d{2}\/[\w-]+)/gm)].map((m) => m[1]);
const preview = (id: string, lang: 'en' | 'id') => videoFile(id, lang).replace(/^out\//, '');
const episodes = ids.map((id) => {
	const m = readMeta(id);
	return {episode: id, title: m.title.en.replace(/ #shorts$/i, ''), titleId: m.title.id.replace(/ #shorts$/i, ''), theme: m.theme, test: m.test, youtube: m.youtube !== false, en: preview(id, 'en'), id: preview(id, 'id')};
});
const switchLine = body.split('\n').find((l) => /\[[ xX]\]\s*switch theme/i.test(l))?.replace(/^\s*[-*]\s*\[[ xX]\]\s*/, '') ?? '';
console.log(JSON.stringify({week: ids[0]?.split('/')[0] ?? '', switchLine, episodes}, null, 1));
