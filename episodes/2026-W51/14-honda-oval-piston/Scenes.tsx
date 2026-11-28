import {interpolate} from 'remotion';
import {Engine, HudLine, Readout, Stage, cycleState, pullBack, ringPath, useScene} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Honda NR500 (1979) and NR (1992): oval pistons with eight valves and two connecting rods per cylinder, so a
// four-cylinder four-stroke could breathe like a two-stroke. The oval and the valves are drawn on a round cutaway.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const TOP = 5.3; // just over the cylinder head
const XS = [-3.45, -1.15, 1.15, 3.45];

/** The oval bore, flat at height y. */
const oval = (y: number, k = 1): V3[] => Array.from({length: 32}, (_, i): V3 => {
	const a = (i / 32) * Math.PI * 2;
	return [Math.cos(a) * (1 + 0.45 * k), y, Math.sin(a) * (1 - 0.3 * k)];
});

/** Eight valve rings in two rows of four; `n` of them shown. */
const Valves = ({n}: {n: number}) => (
	<>
		{[-0.9, -0.3, 0.3, 0.9].flatMap((x, i) =>
			[-0.32, 0.32].map((z, j) => (i * 2 + j < n ? <HudLine key={`${x}${z}`} path={ringPath([x, TOP + 0.05, z], 0.14)} closed grow={1} r={0.025} /> : null)),
		)}
	</>
);

/** Two connecting rods: lines from the piston to the crank on each side. */
const Rods = ({deg, grow}: {deg: number; grow: number}) => {
	const crown = 1.2 + 0.9 * Math.cos((deg * Math.PI) / 180) + 2.6;
	return (
		<>
			<HudLine path={[[-0.55, crown, 0.9], [-0.55, 1.4, 0.9]]} grow={grow} r={0.04} />
			<HudLine path={[[0.55, crown, 0.9], [0.55, 1.4, 0.9]]} grow={grow} r={0.04} />
		</>
	);
};

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [4.4, 6.4, 10.5], look: [0, 4, 0]},
		{t: 0.45, pos: [3.6, 6.2, 9.4], look: [0, 4.2, 0]},
		{t: 0.5, pos: [0.4, 8.8, 5.4], look: [0, 5.2, 0], cut: true},
		{t: 1, pos: [0.3, 8.4, 4.9], look: [0, 5.2, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * 900, sec)} explode={interpolate(p, [0, 0.4], [1, 0], clamp)} valves={false} focus={['piston']} />
				<HudLine path={oval(TOP)} closed grow={interpolate(p, [0.5, 0.85], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={[1.45, TOP, 0]} label={lang === 'id' ? 'Piston lonjong' : 'Oval piston'} from={0.6} to={0.97} />
		</>
	);
};

const Rules = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [0, 5, 15], look: [0, 2.6, 0]},
		{t: 0.5, pos: [0.6, 4.8, 13.8], look: [0, 2.6, 0]},
		{t: 0.52, pos: [5.6, 3.4, 8.6], look: [1.6, 2.6, 0], cut: true},
		{t: 1, pos: [5, 3.3, 7.9], look: [1.6, 2.7, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				{XS.map((x, i) => (
					<Engine key={i} x={x} scale={0.5} s={cycleState(sec * 800 + i * 180, sec)} valves={false} />
				))}
			</Stage>
			<Callout cam={cam} at={[0, 4.1, 0]} label={lang === 'id' ? 'Maksimal 4 silinder' : 'Four cylinders max'} from={0.08} to={0.5} />
			<Callout cam={cam} at={[1.15, 3.6, 0.3]} label="1979" from={0.56} to={0.97} />
		</>
	);
};

const Breathe = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const n = Math.floor(interpolate(p, [0.1, 0.7], [2, 8], clamp));
	const cam = pullBack([
		{t: 0, pos: [0.6, 9, 5.6], look: [0, 5.2, 0]},
		{t: 0.5, pos: [0.5, 8.6, 5.2], look: [0, 5.2, 0]},
		{t: 0.55, pos: [3.4, 6.4, 7.4], look: [0, 5, 0], cut: true},
		{t: 1, pos: [2.9, 6.3, 6.8], look: [0, 5, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * 700, sec)} valves={false} focus={['head']} />
				<HudLine path={ringPath([0, TOP, 0], 1.02)} closed grow={1} r={0.03} />
				<Valves n={n} />
			</Stage>
			<Callout cam={cam} at={[0.9, TOP, 0.32]} label={lang === 'id' ? 'Butuh lebih banyak katup' : 'Needs more valves'} from={0.1} to={0.5} />
			<Callout cam={cam} at={[1.02, TOP, 0]} label={lang === 'id' ? 'Piston bulat: nggak muat' : "Round piston: no room"} from={0.6} to={0.97} />
		</>
	);
};

const NR500 = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.3, 0.8, 0.3);
	const deg = r.q * 720;
	const cam = pullBack([
		{t: 0, pos: [0.4, 9, 5.4], look: [0, 5.2, 0]},
		{t: 0.45, pos: [0.3, 8.7, 5], look: [0, 5.2, 0]},
		{t: 0.5, pos: [3.6, 4.4, 8.4], look: [0, 3.4, 0], cut: true},
		{t: 1, pos: [3.1, 4.3, 7.7], look: [0, 3.4, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(deg, sec)} valves={false} focus={['piston', 'crank']} />
				<HudLine path={oval(TOP)} closed grow={1} />
				<Valves n={8} />
				<Rods deg={deg} grow={interpolate(p, [0.5, 0.7], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={[0.9, TOP, 0.32]} label={lang === 'id' ? '8 katup' : '8 valves'} from={0.08} to={0.46} />
			<Callout cam={cam} at={[0.55, 2.6, 0.9]} label={lang === 'id' ? '2 stang piston' : '2 connecting rods'} from={0.6} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Revs = ({lang}: SceneProps) => {
	const {sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-4.4, 5.4, 9], look: [0, 4, 0]},
		{t: 0.5, pos: [-3.7, 5.3, 8.3], look: [0, 4.1, 0]},
		{t: 0.55, pos: [3, 7, 7], look: [0, 5, 0], cut: true},
		{t: 1, pos: [2.5, 6.8, 6.4], look: [0, 5, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * 3000, sec)} valves={false} focus={['piston']} />
				<HudLine path={oval(TOP)} closed grow={1} />
				<Valves n={8} />
			</Stage>
			<Readout label={lang === 'id' ? 'PUTARAN NR500' : 'NR500 REVS'} from={0} to={22000} unit=" rpm" at={[0.05, 0.85]} />
		</>
	);
};

const Production = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [6, 6, 12], look: [0, 3.8, 0]},
		{t: 0.5, pos: [5, 5.8, 11], look: [0, 3.9, 0]},
		{t: 0.55, pos: [-2.6, 8, 6.4], look: [0, 5.2, 0], cut: true},
		{t: 1, pos: [-2.2, 7.8, 5.9], look: [0, 5.2, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * 900, sec)} valves={false} focus={['piston', 'head']} />
				<HudLine path={oval(TOP)} closed grow={interpolate(p, [0, 0.3], [0.3, 1], clamp)} />
				<Valves n={8} />
			</Stage>
			<Callout cam={cam} at={[0, 5.2, 0.9]} label="Honda NR · 1992" from={0.08} to={0.5} />
			<Callout cam={cam} at={[1.45, TOP, 0]} label={lang === 'id' ? 'Motor produksi pertama' : 'First production bike'} from={0.6} to={0.97} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [4.4, 6.4, 10.5], look: [0, 4, 0]}, {t: 1, pos: [5.6, 7, 12.5], look: [0, 4, 0]}])}>
				<Engine s={cycleState(sec * 900, sec)} valves={false} />
				<HudLine path={oval(TOP)} closed grow={1} />
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 036'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 036']}} />
		</>
	);
};

export default [Hook, Rules, Breathe, NR500, Revs, Production, Finale];
