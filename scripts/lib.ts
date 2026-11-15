import {existsSync, readdirSync, readFileSync} from 'node:fs';
import type {Lang, Meta} from '../src/types.ts';

export const LANGS: Lang[] = ['en', 'id'];

/** Every episode id ("2026-W47/1-wifi"), oldest week first, then by the number prefix: this is the posting order. */
export const listEpisodes = (): string[] =>
	readdirSync('episodes')
		.sort()
		.flatMap((week) =>
			readdirSync(`episodes/${week}`)
				.filter((d) => existsSync(`episodes/${week}/${d}/meta.json`))
				.sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b))
				.map((d) => `${week}/${d}`),
		);

export const readMeta = (id: string): Meta => JSON.parse(readFileSync(`episodes/${id}/meta.json`, 'utf8'));

export const readJson = <T>(path: string, fallback: T): T => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback);
