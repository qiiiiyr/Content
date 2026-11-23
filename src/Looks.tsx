// On-screen graphics per look (docs/styles.md), drawn over the 3D. They show information only: where we are in the
// episode and the scene's key words (the *asterisked* words of the narration). They stay out of the caption band.
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/600-italic.css';
import {useContext} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOOK_ACCENT, LookContext} from './kit';
import {camAt, useScene, type CamKey} from './stage';
import type {Lang, Look} from './types';

export const MONO = '"JetBrains Mono", monospace';
export const SERIF = '"Source Serif 4", serif';

/** 0..1 entrance that settles in about 0.4 s with a little overshoot. */
const useIn = (delay = 0) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - delay, fps, config: {damping: 14, stiffness: 170, mass: 0.7}});
};

/** The first number in the key words, if any ("50 times a second" -> 50), for the count-up readout. */
export const keyNumber = (key: string): {value: number; rest: string} | null => {
	const m = key.match(/(\d[\d.,]*)/);
	if (!m) return null;
	const value = Number(m[1].replace(/,/g, ''));
	return Number.isFinite(value) ? {value, rest: key.replace(m[1], '').trim()} : null;
};

export const Overlay = ({look, i, n, hl, lang}: {look: Look; i: number; n: number; hl: string[]; lang: Lang}) => {
	const key = hl.join(' ');
	if (look === 'golden') return <Golden i={i} n={n} k={key} lang={lang} />;
	if (look === 'editorial') return <Editorial i={i} n={n} k={key} lang={lang} />;
	if (look === 'blueprint') return <Blueprint i={i} k={key} />;
	return null;
};

const Golden = ({i, n, k, lang}: {i: number; n: number; k: string; lang: Lang}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const p = Math.min(1, frame / Math.max(1, durationInFrames - 1));
	const enter = useIn();
	const R = 58;
	const C = 2 * Math.PI * R;
	const angle = -Math.PI / 2 + p * 2 * Math.PI;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(10,4,0,.55) 100%)'}} />
			<div style={{position: 'absolute', left: 64, top: 110, transform: `translateX(${(1 - enter) * -60}px)`, opacity: enter}}>
				<svg width={140} height={140} viewBox="-70 -70 140 140">
					<circle r={R} fill="rgba(0,0,0,.28)" stroke="rgba(94,225,255,.55)" strokeWidth={2} />
					{Array.from({length: 24}, (_, t) => {
						const a = (t / 24) * 2 * Math.PI;
						return <line key={t} x1={Math.cos(a) * (R - 6)} y1={Math.sin(a) * (R - 6)} x2={Math.cos(a) * R} y2={Math.sin(a) * R} stroke="rgba(94,225,255,.5)" strokeWidth={1.5} />;
					})}
					<line x1={-R} y1={0} x2={R} y2={0} stroke="rgba(94,225,255,.25)" strokeDasharray="4 4" />
					<line x1={0} y1={-R} x2={0} y2={R} stroke="rgba(94,225,255,.25)" strokeDasharray="4 4" />
					<circle r={R} fill="none" stroke="#5ee1ff" strokeWidth={5} strokeDasharray={`${C * p} ${C}`} transform="rotate(-90)" />
					<circle cx={Math.cos(angle) * R} cy={Math.sin(angle) * R} r={6} fill="#5ee1ff" />
				</svg>
				<div style={{marginTop: 10, fontFamily: MONO, fontWeight: 700, fontSize: 25, letterSpacing: '.08em', color: '#e9fbff', background: 'rgba(0,0,0,.55)', padding: '6px 12px', display: 'inline-block'}}>
					{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
					{k ? ` · ${k.toUpperCase()}` : ''}
				</div>
			</div>
			<div style={{position: 'absolute', right: 64, top: 124, fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: '.14em', color: 'rgba(255,255,255,.85)', border: '1.5px solid rgba(255,255,255,.45)', padding: '5px 10px', transform: `translateY(${(1 - enter) * -30}px)`, opacity: enter}}>
				{lang === 'id' ? 'MODEL 3D' : '3D MODEL'}
			</div>
		</AbsoluteFill>
	);
};

const Editorial = ({i, n, k, lang}: {i: number; n: number; k: string; lang: Lang}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const tag = useIn();
	const big = useIn(6);
	const num = keyNumber(k);
	// the number ticks up over the first 40% of the scene, like a live readout
	const shown = num ? Math.round(interpolate(frame, [6, durationInFrames * 0.4], [0, num.value], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 26%)'}} />
			<div style={{position: 'absolute', left: 64, top: 120}}>
				<div style={{display: 'inline-block', background: '#c1121f', color: '#fff', fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '.16em', padding: '6px 14px', clipPath: `inset(0 ${(1 - tag) * 100}% 0 0)`}}>
					{lang === 'id' ? `BAGIAN ${i + 1} DARI ${n}` : `PART ${i + 1} OF ${n}`}
				</div>
				{k && (
					<div style={{marginTop: 18, transform: `translateY(${(1 - big) * 40}px)`, opacity: big, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,.6)'}}>
						{num ? (
							<>
								<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 150, lineHeight: 1}}>{shown.toLocaleString('en-US')}</div>
								<div style={{fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: '.18em', color: 'rgba(255,255,255,.8)', marginTop: 6}}>{num.rest.toUpperCase()}</div>
							</>
						) : (
							<div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 92, lineHeight: 1.02, maxWidth: 820}}>{k[0].toUpperCase() + k.slice(1)}</div>
						)}
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};

const Blueprint = ({i, k}: {i: number; k: string}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const enter = useIn();
	const draw = interpolate(frame, [0, Math.min(45, durationInFrames * 0.3)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const W = 952;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: 64, top: 112, transform: `translateX(${(1 - enter) * -50}px)`, opacity: enter, fontFamily: MONO, color: '#dff4ff'}}>
				<div style={{fontWeight: 700, fontSize: 32, letterSpacing: '.06em'}}>
					<span style={{color: '#5ee1ff'}}>FIG. {i + 1}</span>
					{k ? ` — ${k.toUpperCase()}` : ''}
				</div>
			</div>
			<svg style={{position: 'absolute', left: 64, top: 172}} width={W} height={40}>
				<line x1={0} y1={8} x2={0} y2={32} stroke="#5ee1ff" strokeWidth={2} />
				<line x1={0} y1={20} x2={W * draw} y2={20} stroke="#5ee1ff" strokeWidth={2} />
				{Array.from({length: 20}, (_, t) => (t / 19 <= draw ? <line key={t} x1={(t / 19) * W} y1={14} x2={(t / 19) * W} y2={26} stroke="rgba(94,225,255,.6)" strokeWidth={1.5} /> : null))}
				{draw >= 1 && <line x1={W - 1} y1={8} x2={W - 1} y2={32} stroke="#5ee1ff" strokeWidth={2} />}
			</svg>
		</AbsoluteFill>
	);
};

// ---- animation language (docs/styles.md): labels pinned to 3D parts, slow motion with an honest time tag ----------

const projector = new THREE.PerspectiveCamera(32, 1080 / 1920, 0.1, 200); // same lens as <Stage>

/** Where a 3D point lands on the 1080x1920 frame, for a scene filmed with these camera keys. */
export const toScreen = (cam: CamKey[], at: [number, number, number], p: number, sec: number) => {
	const {pos, look} = camAt(cam, p, sec);
	projector.position.set(...pos);
	projector.lookAt(...look);
	projector.updateMatrixWorld();
	const v = new THREE.Vector3(...at).project(projector);
	return {x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920, behind: v.z > 1};
};

/** A label pinned to a point on a part: a dot on the part, a leader line, the name. Shown between from and to (0..1 of the
 * scene). Give the same camera keys as the scene's <Stage>. `at` may follow a moving part: (p) => [x, y, z]. */
export const Callout = ({cam, at, label, from = 0.1, to = 0.9, side: preferred}: {cam: CamKey[]; at: [number, number, number] | ((p: number) => [number, number, number]); label: string; from?: number; to?: number; side?: 'left' | 'right'}) => {
	const look = useContext(LookContext);
	const {p, sec} = useScene();
	const fps = useVideoConfig().fps;
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	if (p < from || p > to) return null;
	const k = spring({frame: frame - from * durationInFrames, fps, config: {damping: 16, stiffness: 160}});
	const pt = toScreen(cam, typeof at === 'function' ? at(p) : at, p, sec);
	if (pt.behind) return null;
	// the label goes toward the side with room unless the scene asks for one
	const side = preferred ?? (pt.x > 540 ? 'left' : 'right');
	const color = LOOK_ACCENT[look];
	const dx = (side === 'right' ? 1 : -1) * 150 * k;
	const ex = pt.x + dx;
	const ey = Math.max(300, Math.min(pt.y - 90 * k, 1080)); // below the top graphics, above the caption band
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width={1080} height={1920} style={{position: 'absolute'}}>
				<circle cx={pt.x} cy={pt.y} r={9} fill="none" stroke={color} strokeWidth={3} />
				<circle cx={pt.x} cy={pt.y} r={3.5} fill={color} />
				<polyline points={`${pt.x},${pt.y} ${pt.x + dx * 0.4},${ey} ${ex},${ey}`} fill="none" stroke={color} strokeWidth={2.5} />
			</svg>
			<div style={{position: 'absolute', top: ey - 46, left: side === 'right' ? ex + 8 : undefined, right: side === 'left' ? 1080 - ex + 8 : undefined, opacity: k, fontFamily: look === 'editorial' ? SERIF : MONO, fontStyle: look === 'editorial' ? 'italic' : undefined, fontWeight: 700, fontSize: look === 'editorial' ? 44 : 34, letterSpacing: look === 'editorial' ? 0 : '.04em', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.8)', whiteSpace: 'nowrap', background: look === 'workshop' ? 'rgba(27,27,27,.75)' : undefined, padding: look === 'workshop' ? '2px 12px' : undefined, borderRadius: 6}}>
				{look === 'editorial' || look === 'workshop' ? label : label.toUpperCase()}
			</div>
		</AbsoluteFill>
	);
};


export {ramp} from './motion';

/** "SLOW MOTION" while a ramp is slow: says why the shot slows down. Placed under the look's top graphics. */
export const TimeTag = ({show, lang}: {show: boolean; lang: Lang}) => {
	const look = useContext(LookContext);
	if (!show) return null;
	const text = lang === 'id' ? 'GERAK LAMBAT' : 'SLOW MOTION';
	return (
		<div style={{position: 'absolute', right: 64, top: look === 'golden' ? 178 : 124, fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: '.18em', color: '#fff', background: look === 'editorial' ? '#c1121f' : 'rgba(0,0,0,.55)', border: look === 'editorial' ? undefined : `2px solid ${LOOK_ACCENT[look]}`, padding: '6px 12px'}}>
			{text}
		</div>
	);
};
