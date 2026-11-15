import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors} from './kit';
import type {Word} from './types';

const WORDS_PER_PAGE = 4;

export const Captions = ({words}: {words: Word[]}) => {
	const t = useCurrentFrame() / useVideoConfig().fps;
	const current = words.findLastIndex((w) => w.t <= t);
	if (current < 0) return null;
	const start = current - (current % WORDS_PER_PAGE);
	const page = words.slice(start, start + WORDS_PER_PAGE);
	return (
		// Sits above the platform UI that covers the bottom ~350px of Shorts/Reels.
		<AbsoluteFill style={{top: 1340, height: 240, padding: '0 90px', justifyContent: 'center', alignItems: 'center'}}>
			<div style={{fontSize: 66, fontWeight: 800, textAlign: 'center', lineHeight: 1.15, textShadow: '0 4px 16px rgba(0,0,0,.8)'}}>
				{page.map((w, i) => (
					<span key={i} style={{color: start + i === current ? colors.amber : colors.text}}>
						{w.w}{' '}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};
