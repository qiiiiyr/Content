import {Composition, type CalculateMetadataFunction} from 'remotion';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import {Episode} from './Episode';
import {episodeIds, getEpisode} from './episodes';
import type {RenderProps} from './types';

const PREVIEW_SCENE_FRAMES = 150; // Studio preview without voiceover

const calculateMetadata: CalculateMetadataFunction<RenderProps> = ({props}) => {
	const n = getEpisode(props.id).meta.scenes.length;
	const frames = props.scenes.length ? props.scenes.reduce((a, s) => a + s.frames, 0) : n * PREVIEW_SCENE_FRAMES;
	return {durationInFrames: frames};
};

export const Root = () => (
	<Composition
		id="Episode"
		component={Episode}
		width={1080}
		height={1920}
		fps={30}
		durationInFrames={300}
		defaultProps={{id: episodeIds[0], lang: 'en', scenes: []} as RenderProps}
		calculateMetadata={calculateMetadata}
	/>
);
