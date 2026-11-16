// Brand graphics for the Cutaway (en) / Bongkar Pasang (id) accounts. One drawing (Mark) feeds the
// profile picture, logo, banner and the animated loop, so they always match.
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors} from './kit';
import type {Lang} from './types';

const ACCENT: Record<Lang, string> = {en: colors.cyan, id: colors.amber};
const NAME: Record<Lang, string> = {en: 'Cutaway', id: 'Bongkar Pasang'};
const TAGLINE: Record<Lang, string> = {en: 'how it actually works', id: 'cara kerjanya yang sebenarnya'};
const TEETH = 12;
const [W0, W1] = [-80, -20]; // the cut-away wedge, in SVG degrees (up and to the right)

const pol = (r: number, deg: number): [number, number] => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
const rad = (d: number) => (d * Math.PI) / 180;

const gearPath = (R = 300, r = 246) => {
	const pitch = 360 / TEETH;
	const pts: [number, number][] = [];
	for (let i = 0; i < TEETH; i++) pts.push(pol(r, i * pitch - pitch * 0.3), pol(R, i * pitch - pitch * 0.18), pol(R, i * pitch + pitch * 0.18), pol(r, i * pitch + pitch * 0.3));
	return 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join('L') + 'Z';
};
const wedge = [[0, 0], pol(420, W0), pol(420, W1)].map((p) => p.join(',')).join(' ');

/** The gear with a wedge cut out, and a signal wave running through the cut. rot and phase animate it. */
export const Mark = ({id, lang, cx, cy, scale = 1, rot = 0, phase = 0}: {id: string; lang: Lang; cx: number; cy: number; scale?: number; rot?: number; phase?: number}) => {
	const a = ACCENT[lang];
	const mid = (W0 + W1) / 2;
	const u = [Math.cos(rad(mid)), Math.sin(rad(mid))];
	const n = [-u[1], u[0]];
	const wave = Array.from({length: 52}, (_, i) => {
		const t = 60 + i * 4;
		const off = (16 + t * 0.07) * Math.sin(t / 34 - phase);
		return [u[0] * t + n[0] * off, u[1] * t + n[1] * off].map((v) => v.toFixed(1)).join(',');
	}).join(' ');
	return (
		<g transform={`translate(${cx} ${cy}) scale(${scale})`}>
			<defs>
				<mask id={`${id}-cut`} maskUnits="userSpaceOnUse" x="-400" y="-400" width="800" height="800">
					<rect x="-400" y="-400" width="800" height="800" fill="#fff" />
					<polygon points={wedge} fill="#000" />
				</mask>
				<clipPath id={`${id}-in`}><polygon points={wedge} /></clipPath>
				<clipPath id={`${id}-c`}><circle r="266" /></clipPath>
				<filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
			</defs>
			<g mask={`url(#${id}-cut)`}>
				<g transform={`rotate(${rot})`}>
					<path d={gearPath()} fill={colors.panel} stroke="#3b4768" strokeWidth="7" strokeLinejoin="round" />
					<circle r="170" fill="none" stroke="#3b4768" strokeWidth="6" />
				</g>
			</g>
			<g clipPath={`url(#${id}-in)`}>
				<g clipPath={`url(#${id}-c)`}>
				<circle r="270" fill="#070b17" />
				<circle r="270" fill={a} opacity=".16" />
				<polyline points={wave} fill="none" stroke={a} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity=".55" filter={`url(#${id}-glow)`} />
				<polyline points={wave} fill="none" stroke={a} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
				</g>
			</g>
			{[W0, W1].map((d) => (
				<line key={d} x1={pol(70, d)[0]} y1={pol(70, d)[1]} x2={pol(268, d)[0]} y2={pol(268, d)[1]} stroke={a} strokeWidth="9" strokeLinecap="round" />
			))}
			<circle r="58" fill={colors.bg} stroke={a} strokeWidth="11" />
		</g>
	);
};

const Tag = ({lang, cx, cy}: {lang: Lang; cx: number; cy: number}) => (
	<g>
		<rect x={cx - 120} y={cy - 52} width="240" height="104" rx="52" fill={colors.panel} stroke={ACCENT[lang]} strokeWidth="6" />
		<text x={cx + 4} y={cy + 22} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="66" letterSpacing="8" fill={ACCENT[lang]}>{lang.toUpperCase()}</text>
	</g>
);

// Everything that matters stays within the central 80% (r = 432), because platforms crop profile pictures to a circle.
export const Avatar = ({lang}: {lang: Lang}) => (
	<AbsoluteFill style={{background: colors.bg}}>
		<svg width={1080} height={1080}>
			<Mark id="a" lang={lang} cx={540} cy={458} scale={1.12} />
			<Tag lang={lang} cx={540} cy={868} />
		</svg>
	</AbsoluteFill>
);

/** 4 s seamless loop: the gear turns two teeth, the wave advances one full period. */
export const AvatarLoop = ({lang}: {lang: Lang}) => {
	const f = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const p = f / durationInFrames;
	return (
		<AbsoluteFill style={{background: colors.bg}}>
			<svg width={1080} height={1080}>
				<Mark id="l" lang={lang} cx={540} cy={458} scale={1.12} rot={p * 60} phase={p * 2 * Math.PI} />
				<Tag lang={lang} cx={540} cy={868} />
			</svg>
		</AbsoluteFill>
	);
};

const Lockup = ({lang, id}: {lang: Lang; id: string}) => (
	<g>
		<Mark id={id} lang={lang} cx={250} cy={250} scale={0.7} />
		<text x={520} y={lang === 'en' ? 290 : 280} fontFamily="Inter, sans-serif" fontWeight="800" fontSize={lang === 'en' ? 190 : 128} fill={colors.text}>{NAME[lang]}</text>
		<text x={524} y={lang === 'en' ? 370 : 360} fontFamily="Inter, sans-serif" fontWeight="600" fontSize="52" fill={ACCENT[lang]}>{TAGLINE[lang]}</text>
	</g>
);

export const Logo = ({lang}: {lang: Lang}) => (
	<AbsoluteFill style={{background: colors.bg}}>
		<svg width={1900} height={500}><Lockup lang={lang} id="g" /></svg>
	</AbsoluteFill>
);

// YouTube shows only the middle 1546x423 on every device, so the lockup (1900x500 x 0.78 = 1482x390) sits there.
export const Banner = ({lang}: {lang: Lang}) => {
	const s = 0.78;
	return (
		<AbsoluteFill style={{background: colors.bg}}>
			<svg width={2560} height={1440}>
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<polyline key={i} fill="none" stroke={ACCENT[lang]} strokeWidth="5" opacity=".09" points={Array.from({length: 129}, (_, k) => `${k * 20},${150 + i * 230 + Math.sin(k / 6 + i) * 45}`).join(' ')} />
				))}
				<g transform={`translate(${(2560 - 1900 * s) / 2} ${(1440 - 500 * s) / 2}) scale(${s})`}><Lockup lang={lang} id="b" /></g>
			</svg>
		</AbsoluteFill>
	);
};
