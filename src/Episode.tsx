import {AbsoluteFill, Series, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {Captions} from './Captions';
import {Overlay} from './Looks';
import {LOOK_BG, LangContext, LookContext, colors} from './kit';
import {getEpisode} from './episodes';
import type {RenderProps} from './types';

export const Episode = ({id, lang, look: chosen, scenes}: RenderProps) => {
	const {Scenes, meta} = getEpisode(id);
	const look = chosen ?? meta.look ?? 'workshop';
	return (
		<LangContext.Provider value={lang}>
			<LookContext.Provider value={look}>
				<AbsoluteFill style={{background: LOOK_BG[look], fontFamily: 'Inter, sans-serif', color: colors.text}}>
					<Series>
						{Scenes.map((Scene, i) => (
							<Series.Sequence key={i} name={`Scene ${i + 1}`} durationInFrames={scenes[i]?.frames ?? 150}>
								<Scene lang={lang} />
								<Overlay look={look} i={i} n={Scenes.length} hl={scenes[i]?.hl ?? []} lang={lang} />
								{scenes[i] && <Audio src={staticFile(scenes[i].audio)} />}
								{scenes[i] && <Captions words={scenes[i].words} hl={scenes[i].hl} look={look} />}
							</Series.Sequence>
						))}
					</Series>
				</AbsoluteFill>
			</LookContext.Provider>
		</LangContext.Provider>
	);
};
