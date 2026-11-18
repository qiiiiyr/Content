// Validates every episode before it can be rendered or posted. Exit code 1 on any problem.
import {existsSync, readFileSync} from 'node:fs';
import {LANGS, listEpisodes, readJson, readMeta} from './lib.ts';
import type {Meta} from '../src/types.ts';

const WORDS = {en: [80, 160], id: [70, 160]}; // narration length that lands around 35-60 s

export const checkMeta = (m: Meta, sceneCount: number, themes: string[]): string[] => {
	const errors: string[] = [];
	if (!themes.includes(m.theme)) errors.push(`theme "${m.theme}" is not in themes.json`);
	if (typeof m.test !== 'boolean') errors.push('"test" must be true or false');
	if ((m.sources ?? []).filter((s) => /^https?:\/\//.test(s)).length < 2) errors.push('needs at least 2 source URLs');
	if (!m.hashtags?.length) errors.push('needs hashtags');
	if (m.scenes?.length !== sceneCount) errors.push(`meta.json has ${m.scenes?.length} narrations but Scenes.tsx exports ${sceneCount} scenes`);
	for (const lang of LANGS) {
		if (!m.title?.[lang] || m.title[lang].length > 100) errors.push(`title.${lang} missing or over 100 characters`);
		if (!m.description?.[lang]) errors.push(`description.${lang} missing`);
		if (m.scenes?.some((s) => !s[lang]?.trim())) errors.push(`a scene has no ${lang} narration`);
		const words = (m.scenes ?? []).map((s) => (s[lang] ?? '').replaceAll('*', '')).join(' ').split(/\s+/).filter(Boolean).length;
		const [min, max] = WORDS[lang];
		if (words < min || words > max) errors.push(`${lang} narration is ${words} words, expected ${min}-${max}`);
	}
	return errors;
};

/** Counts the components in `export default [A, B, C]`. */
export const sceneCount = (tsx: string): number => tsx.match(/export default \[([^\]]*)\]/)?.[1].split(',').filter((s) => s.trim()).length ?? 0;

if (import.meta.main) {
	const themes = readJson<{themes: {key: string}[]}>('themes.json', {themes: []}).themes.map((t) => t.key);
	let bad = 0;
	for (const id of listEpisodes()) {
		const tsx = `episodes/${id}/Scenes.tsx`;
		const errors = existsSync(tsx) ? checkMeta(readMeta(id), sceneCount(readFileSync(tsx, 'utf8')), themes) : ['Scenes.tsx is missing'];
		for (const e of errors) console.error(`${id}: ${e}`);
		bad += errors.length;
	}
	// YouTube posts once a day, so a week may send at most 7 episodes there or its queue grows forever
	for (const [week, ids] of Map.groupBy(listEpisodes().filter((id) => readMeta(id).youtube !== false), (id) => id.split('/')[0])) {
		if (ids.length > 7) (console.error(`${week}: ${ids.length} episodes go to YouTube, at most 7 (set "youtube": false on the rest)`), bad++);
	}
	if (bad) process.exit(1);
	console.log(`check: ${listEpisodes().length} episodes OK`);
}
