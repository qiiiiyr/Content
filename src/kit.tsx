// The building blocks every episode animates with. Coordinates are px on the 1080x1920 frame;
// keep diagrams between y=220 and y=1300 (captions sit below, platform UI below that).
import {createContext, useContext, type ReactNode} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Lang} from './types';

export const colors = {bg: '#0b1020', panel: '#151c33', text: '#e5e7eb', dim: '#94a3b8', cyan: '#38bdf8', amber: '#fbbf24', pink: '#f472b6', green: '#4ade80'};

export const LangContext = createContext<Lang>('en');

/** On-screen text in the episode's language. */
export const T = ({en, id}: {en: string; id: string}) => <>{useContext(LangContext) === 'id' ? id : en}</>;

type Pt = [number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 -> 1 between `at` and `at + dur` seconds into the scene. */
export const useProgress = (at: number, dur = 0.5) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return interpolate(frame, [at * fps, (at + dur) * fps], [0, 1], {...clamp, easing: ease});
};

export const Title = ({children, at = 0}: {children: ReactNode; at?: number}) => {
	const p = useProgress(at);
	return (
		<div style={{position: 'absolute', top: 170, left: 80, right: 80, textAlign: 'center', fontSize: 84, fontWeight: 800, lineHeight: 1.1, opacity: p, translate: `0 ${(1 - p) * 30}px`}}>
			{children}
		</div>
	);
};

export const Box = ({x, y, w = 320, h = 170, color = colors.cyan, at = 0, children}: {x: number; y: number; w?: number; h?: number; color?: string; at?: number; children: ReactNode}) => {
	const p = useProgress(at);
	return (
		<div
			style={{
				position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 28, border: `5px solid ${color}`, background: colors.panel,
				display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 16, fontSize: 46, fontWeight: 600, opacity: p, scale: 0.85 + 0.15 * p,
			}}
		>
			{children}
		</div>
	);
};

export const Arrow = ({from, to, at = 0, dur = 0.6, color = colors.dim}: {from: Pt; to: Pt; at?: number; dur?: number; color?: string}) => {
	const p = useProgress(at, dur);
	const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
	const angle = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920}>
				<line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
				<polygon points="0,-18 30,0 0,18" fill={color} opacity={p > 0.95 ? 1 : 0} transform={`translate(${to[0]} ${to[1]}) rotate(${angle}) translate(-26 0)`} />
			</svg>
		</AbsoluteFill>
	);
};

/** A dot travelling from -> to, `repeat` times back to back. */
export const Packet = ({from, to, at = 0, dur = 1, repeat = 1, color = colors.amber, label}: {from: Pt; to: Pt; at?: number; dur?: number; repeat?: number; color?: string; label?: ReactNode}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps - at;
	if (t < 0 || t > dur * repeat) return null;
	const p = Easing.inOut(Easing.quad)((t % dur) / dur);
	const x = from[0] + (to[0] - from[0]) * p;
	const y = from[1] + (to[1] - from[1]) * p;
	return (
		<div style={{position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: 22, background: color, boxShadow: `0 0 30px ${color}`}}>
			{label && <div style={{position: 'absolute', top: -58, left: -100, width: 244, textAlign: 'center', fontSize: 36, fontWeight: 600, color}}>{label}</div>}
		</div>
	);
};

/** Rings spreading out from a point, e.g. radio signals. */
export const Waves = ({x, y, at = 0, color = colors.cyan, max = 300, period = 1.2}: {x: number; y: number; at?: number; color?: string; max?: number; period?: number}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps - at;
	if (t < 0) return null;
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920}>
				{[0, 1, 2].map((i) => {
					const p = ((t + (i * period) / 3) % period) / period;
					return <circle key={i} cx={x} cy={y} r={p * max} fill="none" stroke={color} strokeWidth={6} opacity={1 - p} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};

export const Callout = ({children, y = 1150, at = 0, color = colors.text, size = 56}: {children: ReactNode; y?: number; at?: number; color?: string; size?: number}) => {
	const p = useProgress(at);
	return <div style={{position: 'absolute', top: y, left: 80, right: 80, textAlign: 'center', fontSize: size, fontWeight: 800, color, opacity: p, scale: 0.9 + 0.1 * p}}>{children}</div>;
};

export const Counter = ({from = 0, to, at = 0, dur = 1.5, x = 540, y = 700, size = 160, suffix = '', color = colors.amber}: {from?: number; to: number; at?: number; dur?: number; x?: number; y?: number; size?: number; suffix?: string; color?: string}) => {
	const p = useProgress(at, dur);
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: y - size / 2, textAlign: 'center', fontSize: size, fontWeight: 800, color, opacity: Math.min(1, p * 4)}}>
			{Math.round(from + (to - from) * p).toLocaleString(useContext(LangContext) === 'id' ? 'id-ID' : 'en-US')}{suffix}
		</div>
	);
};
