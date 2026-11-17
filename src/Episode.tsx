import {AbsoluteFill, Series, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {Captions} from './Captions';
import {LangContext, colors} from './kit';
import {getEpisode} from './episodes';
import type {RenderProps} from './types';

export const Episode = ({id, lang, scenes}: RenderProps) => {
	const {Scenes} = getEpisode(id);
	return (
		<LangContext.Provider value={lang}>
			<AbsoluteFill style={{background: '#cbbfa6', fontFamily: 'Inter, sans-serif', color: colors.text}}>
				<Series>
					{Scenes.map((Scene, i) => (
						<Series.Sequence key={i} name={`Scene ${i + 1}`} durationInFrames={scenes[i]?.frames ?? 150}>
							<Scene lang={lang} />
							{scenes[i] && <Audio src={staticFile(scenes[i].audio)} />}
							{scenes[i] && <Captions words={scenes[i].words} hl={scenes[i].hl} />}
						</Series.Sequence>
					))}
				</Series>
			</AbsoluteFill>
		</LangContext.Provider>
	);
};
