// Usage: node scripts/build.ts <episode id> [en|id ...]  ->  out/<week>__<slug>.<lang>.mp4
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {LANGS, readMeta} from './lib.ts';
import {LOOKS, type Lang, type Look, type RenderProps} from '../src/types.ts';

const VOICES: Record<Lang, {voice: string; rate: string}> = {
	en: {voice: 'en-US-BrianMultilingualNeural', rate: '+4%'},
	id: {voice: 'id-ID-ArdiNeural', rate: '+3%'},
};
const FPS = 30;
const PAUSE = 0.35; // seconds of breathing room after each scene's narration

/** Words wrapped in *asterisks* in the narration are highlighted in the captions. */
export const highlights = (text: string): string[] => [...text.matchAll(/\*([^*]+)\*/g)].flatMap((m) => m[1].toLowerCase().split(/\s+/));

const seconds = (file: string) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());

/** Where a render of this episode and language lands, also the asset name in the `videos` release. */
export const videoFile = (id: string, lang: Lang) => `out/${id.replace('/', '__')}.${lang}.mp4`;

/** look: render in another style than the episode's own (samples); the file name then carries the look. */
export const build = (id: string, lang: Lang, look?: Look): string => {
	const meta = readMeta(id);
	const base = `tts/${id}/${lang}`;
	const items = meta.scenes.map((s, i) => ({text: s[lang].replaceAll('*', ''), out: `public/${base}/${i}`}));
	execFileSync('python3', ['scripts/tts.py'], {input: JSON.stringify({...VOICES[lang], items}), stdio: ['pipe', 'inherit', 'inherit']});

	const props: RenderProps = {
		id,
		lang,
		look: look ?? meta.look ?? 'workshop',
		scenes: items.map((it, i) => ({
			audio: `${base}/${i}.mp3`,
			words: JSON.parse(readFileSync(`${it.out}.json`, 'utf8')),
			frames: Math.ceil((seconds(`${it.out}.mp3`) + PAUSE) * FPS),
			hl: highlights(meta.scenes[i][lang]),
		})),
	};
	mkdirSync('out', {recursive: true});
	const name = videoFile(id, lang).replace(/\.mp4$/, '') + (look ? `.${look}` : '');
	writeFileSync(`${name}.props.json`, JSON.stringify(props));
	const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
	execFileSync('npx', ['remotion', 'render', 'src/index.ts', 'Episode', `${name}.mp4`, `--props=${name}.props.json`, '--gl=swangle', '--scale=0.6666666666666666', ...browser], {stdio: 'inherit'});
	return `${name}.mp4`;
};

if (import.meta.main) {
	// node scripts/build.ts <episode id> [en|id ...] [--look workshop|golden|editorial|blueprint]
	const args = process.argv.slice(2);
	const look = args.includes('--look') ? (args.splice(args.indexOf('--look'), 2)[1] as Look) : undefined;
	if (look && !LOOKS.includes(look)) throw new Error(`unknown look ${look}: ${LOOKS.join(', ')}`);
	const [id, ...langs] = args;
	if (!id) throw new Error('usage: node scripts/build.ts <episode id> [en|id ...] [--look name]');
	for (const lang of (langs.length ? langs : LANGS) as Lang[]) console.log(build(id, lang, look));
}
