import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {MONO, SERIF} from './Looks';
import type {Look, Word} from './types';

const WORDS_PER_PAGE = 4;
const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** Captions, a page of 4 words at a time, styled per look (docs/styles.md). Words marked *like this* are key words. */
export const Captions = ({words, hl = [], look = 'workshop'}: {words: Word[]; hl?: string[]; look?: Look}) => {
	const t = useCurrentFrame() / useVideoConfig().fps;
	const current = words.findLastIndex((w) => w.t <= t);
	if (current < 0) return null;
	const start = current - (current % WORDS_PER_PAGE);
	const page = words.slice(start, start + WORDS_PER_PAGE);
	const marked = new Set(hl.map(clean));
	const isKey = (w: Word) => marked.has(clean(w.w));
	// Sits above the platform UI that covers the bottom ~350px of Shorts/Reels.
	const band = {top: 1130, height: 260, padding: '0 80px', justifyContent: 'center'} as const;

	if (look === 'golden')
		return (
			<AbsoluteFill style={{...band, alignItems: 'flex-start'}}>
				<div style={{display: 'flex', alignItems: 'stretch', gap: 22}}>
					<div style={{width: 9, background: '#ff9a3c', transform: 'skewX(-14deg)', borderRadius: 2}} />
					<div style={{fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 70, lineHeight: 1.16, textTransform: 'uppercase', letterSpacing: '-.01em', textShadow: '0 4px 18px rgba(0,0,0,.6)', maxWidth: 860}}>
						{page.map((w, i) => (
							<span key={i} style={{color: isKey(w) ? '#ffb347' : start + i <= current ? '#fff' : 'rgba(255,255,255,.38)'}}>
								{w.w}{' '}
							</span>
						))}
					</div>
				</div>
			</AbsoluteFill>
		);

	if (look === 'editorial')
		return (
			<AbsoluteFill style={{...band, alignItems: 'center'}}>
				<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 68, lineHeight: 1.22, textAlign: 'center', color: '#fff', textShadow: '0 3px 16px rgba(0,0,0,.85)'}}>
					{page.map((w, i) => (
						<span key={i} style={isKey(w) ? {color: '#ff6b7d'} : undefined}>
							{w.w}{' '}
						</span>
					))}
				</div>
			</AbsoluteFill>
		);

	if (look === 'blueprint')
		return (
			<AbsoluteFill style={{...band, alignItems: 'center'}}>
				<div style={{fontFamily: MONO, fontWeight: 700, fontSize: 58, lineHeight: 1.3, textAlign: 'center', color: '#fff', background: 'rgba(7,26,51,.82)', borderLeft: '6px solid #5ee1ff', padding: '14px 26px'}}>
					{page.map((w, i) => (
						<span key={i}>
							<span style={isKey(w) ? {background: '#5ee1ff', color: '#071a33', padding: '0 10px'} : undefined}>{w.w}</span>{' '}
						</span>
					))}
				</div>
			</AbsoluteFill>
		);

	return (
		<AbsoluteFill style={{...band, alignItems: 'center'}}>
			<div style={{fontSize: 74, fontWeight: 800, textAlign: 'center', lineHeight: 1.28, color: '#fff', WebkitTextStroke: '3px rgba(0,0,0,.55)', paintOrder: 'stroke fill', textShadow: '0 4px 14px rgba(0,0,0,.55)'}}>
				{page.map((w, i) => (
					<span key={i}>
						<span style={isKey(w) ? {background: '#d9b36c', color: '#1b1b1b', WebkitTextStroke: 0, textShadow: 'none', padding: '0 14px', borderRadius: 8} : undefined}>{w.w}</span>{' '}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};
