import {useContext} from 'react';
import {interpolate} from 'remotion';
import {LangContext} from './kit';
import {useScene} from './stage';
import type {Lang} from './types';

/** The brand's paper tag, hung at the end of an episode (the "inspected" tag of the diorama style). */
export const PaperTag = ({at = 0.5, lines}: {at?: number; lines: Record<Lang, string[]>}) => {
	const {p, sec} = useScene();
	const k = interpolate(p, [at, at + 0.15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const [a, b, c] = lines[useContext(LangContext)];
	const mono = '"Courier New", monospace';
	return (
		<div style={{position: 'absolute', top: 120, left: 340, width: 400, height: 560, transformOrigin: '50% 0', opacity: k, rotate: `${Math.sin(sec * 2.2) * 2.5 * k}deg`, translate: `0 ${(1 - k) * -80}px`}}>
			<div style={{position: 'absolute', left: 190, top: -90, width: 4, height: 110, background: '#2b2b2b'}} />
			<div style={{position: 'absolute', inset: 0, top: 20, background: '#e3c98a', clipPath: 'polygon(14% 0, 86% 0, 100% 9%, 100% 100%, 0 100%, 0 9%)', boxShadow: '0 20px 40px rgba(0,0,0,.35)', textAlign: 'center', fontFamily: mono, color: '#4a2c1a'}}>
				<div style={{margin: '34px auto 0', width: 46, height: 46, borderRadius: 23, background: '#cbbfa6', border: '6px solid #c9a24a'}} />
				<div style={{marginTop: 70, fontSize: 40, fontWeight: 700, letterSpacing: 2}}>{a}</div>
				<div style={{margin: '14px 40px', borderTop: '4px solid #4a2c1a'}} />
				<div style={{fontSize: 52, fontWeight: 800}}>{b}</div>
				<div style={{margin: '14px 40px', borderTop: '4px solid #4a2c1a'}} />
				<div style={{fontSize: 44, fontWeight: 700}}>{c}</div>
				<div style={{margin: '30px auto 0', width: 110, height: 110, borderRadius: 55, border: '6px solid #b3342a', color: '#b3342a', display: 'flex', alignItems: 'center', justifyContent: 'center', rotate: '-12deg', fontSize: 30, fontWeight: 800}}>OK</div>
			</div>
		</div>
	);
};
