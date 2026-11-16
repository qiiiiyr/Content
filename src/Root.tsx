import {Composition, type CalculateMetadataFunction} from 'remotion';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import {Episode} from './Episode';
import {Avatar, AvatarLoop, Banner, Logo} from './Brand';
import {episodeIds, getEpisode} from './episodes';
import type {Lang, RenderProps} from './types';

const PREVIEW_SCENE_FRAMES = 150; // Studio preview without voiceover

const calculateMetadata: CalculateMetadataFunction<RenderProps> = ({props}) => {
	const n = getEpisode(props.id).meta.scenes.length;
	const frames = props.scenes.length ? props.scenes.reduce((a, s) => a + s.frames, 0) : n * PREVIEW_SCENE_FRAMES;
	return {durationInFrames: frames};
};

const brand = {lang: 'en' as Lang};

export const Root = () => (
	<>
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
		{/* Account artwork, rendered by hand: see assets/profile and docs/SETUP.md. Not part of the episode pipeline. */}
		<Composition id="Avatar" component={Avatar} width={1080} height={1080} fps={30} durationInFrames={1} defaultProps={brand} />
		<Composition id="Logo" component={Logo} width={1900} height={500} fps={30} durationInFrames={1} defaultProps={brand} />
		<Composition id="Banner" component={Banner} width={2560} height={1440} fps={30} durationInFrames={1} defaultProps={brand} />
		<Composition id="AvatarLoop" component={AvatarLoop} width={1080} height={1080} fps={30} durationInFrames={120} defaultProps={brand} />
	</>
);
