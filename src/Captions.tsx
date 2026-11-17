import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from './types';

const WORDS_PER_PAGE = 4;
const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** Two-line captions, white with a dark outline; words marked *like this* in the narration get a tan highlight box. */
export const Captions = ({words, hl = []}: {words: Word[]; hl?: string[]}) => {
	const t = useCurrentFrame() / useVideoConfig().fps;
	const current = words.findLastIndex((w) => w.t <= t);
	if (current < 0) return null;
	const start = current - (current % WORDS_PER_PAGE);
	const page = words.slice(start, start + WORDS_PER_PAGE);
	const marked = new Set(hl.map(clean));
	return (
		// Sits above the platform UI that covers the bottom ~350px of Shorts/Reels.
		<AbsoluteFill style={{top: 1130, height: 260, padding: '0 80px', justifyContent: 'center', alignItems: 'center'}}>
			<div style={{fontSize: 74, fontWeight: 800, textAlign: 'center', lineHeight: 1.28, color: '#fff', WebkitTextStroke: '3px rgba(0,0,0,.55)', paintOrder: 'stroke fill', textShadow: '0 4px 14px rgba(0,0,0,.55)'}}>
				{page.map((w, i) => (
					<span key={i}>
						<span style={marked.has(clean(w.w)) ? {background: '#d9b36c', color: '#1b1b1b', WebkitTextStroke: 0, textShadow: 'none', padding: '0 14px', borderRadius: 8} : undefined}>{w.w}</span>{' '}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};
