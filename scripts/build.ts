// Usage: node scripts/build.ts <episode id> [en|id ...]  ->  out/<week>__<slug>.<lang>.mp4
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {LANGS, readMeta} from './lib.ts';
import type {Lang, RenderProps} from '../src/types.ts';

const VOICES: Record<Lang, {voice: string; rate: string}> = {
	en: {voice: 'en-US-AndrewNeural', rate: '+8%'},
	id: {voice: 'id-ID-ArdiNeural', rate: '+5%'},
};
const FPS = 30;
const PAUSE = 0.35; // seconds of breathing room after each scene's narration

/** Words wrapped in *asterisks* in the narration are highlighted in the captions. */
export const highlights = (text: string): string[] => [...text.matchAll(/\*([^*]+)\*/g)].flatMap((m) => m[1].toLowerCase().split(/\s+/));

const seconds = (file: string) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());

export const build = (id: string, lang: Lang): string => {
	const meta = readMeta(id);
	const base = `tts/${id}/${lang}`;
	const items = meta.scenes.map((s, i) => ({text: s[lang].replaceAll('*', ''), out: `public/${base}/${i}`}));
	execFileSync('python3', ['scripts/tts.py'], {input: JSON.stringify({...VOICES[lang], items}), stdio: ['pipe', 'inherit', 'inherit']});

	const props: RenderProps = {
		id,
		lang,
		scenes: items.map((it, i) => ({
			audio: `${base}/${i}.mp3`,
			words: JSON.parse(readFileSync(`${it.out}.json`, 'utf8')),
			frames: Math.ceil((seconds(`${it.out}.mp3`) + PAUSE) * FPS),
			hl: highlights(meta.scenes[i][lang]),
		})),
	};
	mkdirSync('out', {recursive: true});
	const name = `out/${id.replace('/', '__')}.${lang}`;
	writeFileSync(`${name}.props.json`, JSON.stringify(props));
	const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
	execFileSync('npx', ['remotion', 'render', 'src/index.ts', 'Episode', `${name}.mp4`, `--props=${name}.props.json`, '--gl=swangle', '--scale=0.6666666666666666', ...browser], {stdio: 'inherit'});
	return `${name}.mp4`;
};

if (import.meta.main) {
	const [id, ...langs] = process.argv.slice(2);
	if (!id) throw new Error('usage: node scripts/build.ts <episode id> [en|id ...]');
	for (const lang of (langs.length ? langs : LANGS) as Lang[]) console.log(build(id, lang));
}
