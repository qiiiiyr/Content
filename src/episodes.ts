import type {FC} from 'react';
import type {Meta, SceneProps} from './types';

// webpack finds every episode at bundle time, so adding a folder is all a new episode needs.
const scenes = (require as any).context('../episodes', true, /Scenes\.tsx$/);
const metas = (require as any).context('../episodes', true, /meta\.json$/);

export const episodeIds: string[] = metas.keys().map((k: string) => k.replace(/^\.\//, '').replace(/\/meta\.json$/, ''));

export const getEpisode = (id: string): {meta: Meta; Scenes: FC<SceneProps>[]} => ({
	meta: metas(`./${id}/meta.json`),
	Scenes: scenes(`./${id}/Scenes.tsx`).default,
});
