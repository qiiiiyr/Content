import {interpolate} from 'remotion';
import {Engine, HudLine, Readout, Stage, Wheel, cycleState, pullBack, ringPath, useScene} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Yamaha YZF-R1 crossplane crank: throws 90 degrees apart, firing at 270-180-90-180 degree gaps (1-3-2-4), against
// the flat-plane four's even 180 (1-3-4-2). Four cutaway cylinders in a row. Animation language: docs/styles.md.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const XS = [-3.45, -1.15, 1.15, 3.45];
const SCALE = 0.5;
// crank offsets per cylinder (degrees): cylinder n fires when its own angle reaches the spark point
const FLAT = [0, -540, -180, -360];
const CROSS = [0, -450, -270, -540];

const Four = ({deg, sec, offsets, focus}: {deg: number; sec: number; offsets: number[]; focus?: string[]}) => (
	<>
		{XS.map((x, i) => (
			<Engine key={i} x={x} scale={SCALE} s={cycleState(deg + offsets[i], sec)} valves={false} focus={focus} />
		))}
	</>
);

/** A short arrow from each crank centre along its throw, so the 90-degree spacing reads. */
const Throws = ({deg, offsets, grow}: {deg: number; offsets: number[]; grow: number}) => (
	<>
		{XS.map((x, i) => {
			const a = ((deg + offsets[i]) * Math.PI) / 180;
			const c: V3 = [x, 1.2, 0.9];
			return <HudLine key={i} path={[c, [x + Math.sin(a) * 0.75, 1.2 + Math.cos(a) * 0.75, 0.9]]} grow={grow} arrow />;
		})}
	</>
);

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [6, 5, 14], look: [0, 2.4, 0]},
		{t: 0.45, pos: [4.8, 4.8, 12.5], look: [0, 2.5, 0]},
		{t: 0.5, pos: [-5.5, 3.6, 9], look: [-1.2, 2.8, 0], cut: true},
		{t: 1, pos: [-4.8, 3.6, 8.2], look: [-1.2, 2.9, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Four deg={sec * 700} sec={sec} offsets={CROSS} />
			</Stage>
			<Callout cam={cam} at={[0, 4.1, 0]} label="Yamaha R1" from={0.08} to={0.45} />
			<Callout cam={cam} at={[-1.15, 3.9, 0.3]} label={lang === 'id' ? 'Nggak rata' : 'Uneven'} from={0.55} to={0.97} />
		</>
	);
};

const Even = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [0, 4, 15], look: [0, 2.6, 0]},
		{t: 0.5, pos: [0.6, 4, 13.8], look: [0, 2.6, 0]},
		{t: 0.52, pos: [5.6, 3, 8.6], look: [1.6, 2.4, 0], cut: true},
		{t: 1, pos: [5, 3, 7.9], look: [1.6, 2.5, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Four deg={sec * 600} sec={sec} offsets={FLAT} />
			</Stage>
			<Readout label={lang === 'id' ? 'JARAK LEDAKAN' : 'FIRING GAP'} from={180} to={180} unit="°" at={[0.05, 0.95]} />
			<Callout cam={cam} at={[1.15, 1.2, 0.9]} label={lang === 'id' ? 'Kruk as rata' : 'Flat-plane crank'} from={0.56} to={0.97} />
		</>
	);
};

const Crossplane = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const deg = 90 + p * 180;
	const cam = pullBack([
		{t: 0, pos: [3, 2.2, 10], look: [0, 1.4, 0]},
		{t: 0.5, pos: [2.4, 2.2, 9], look: [0, 1.4, 0]},
		{t: 0.52, pos: [-4, 3.4, 7.6], look: [-1.2, 1.6, 0], cut: true},
		{t: 1, pos: [-3.4, 3.3, 7], look: [-1.2, 1.6, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Four deg={deg} sec={sec} offsets={CROSS} focus={['crank']} />
				<Throws deg={deg} offsets={CROSS} grow={interpolate(p, [0.1, 0.45], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={[-1.15, 1.2, 0.9]} label="Crossplane" from={0.12} to={0.5} />
			<Callout cam={cam} at={[-3.45, 1.2, 0.9]} label={lang === 'id' ? 'Beda 90°' : '90° apart'} from={0.56} to={0.97} />
		</>
	);
};

const Beat = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.25, 0.8, 0.3);
	const cam = pullBack([
		{t: 0, pos: [0, 5.2, 14], look: [0, 3, 0]},
		{t: 0.5, pos: [0.8, 5, 13], look: [0, 3, 0]},
		{t: 0.55, pos: [-5, 4.4, 9], look: [-1, 3.4, 0], cut: true},
		{t: 1, pos: [-4.4, 4.3, 8.3], look: [-1, 3.4, 0]},
	]);
	const deg = r.q * 1440;
	return (
		<>
			<Stage cam={cam}>
				<Four deg={deg} sec={sec} offsets={CROSS} focus={['spark']} />
			</Stage>
			<Callout cam={cam} at={[0, 4.4, 0]} label="270 · 180 · 90 · 180" from={0.1} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Inertia = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [5, 3.6, 9.6], look: [1.2, 2.6, 0]},
		{t: 0.5, pos: [4.3, 3.6, 8.8], look: [1.2, 2.6, 0]},
		{t: 0.55, pos: [-1, 6.4, 12], look: [0, 2.6, 0], cut: true},
		{t: 1, pos: [-0.8, 6.2, 11], look: [0, 2.7, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Four deg={sec * 700} sec={sec} offsets={CROSS} focus={['piston', 'crank']} />
			</Stage>
			<Callout cam={cam} at={[1.15, 2.6, 0.4]} label={lang === 'id' ? 'Inersia piston' : 'Piston inertia'} from={0.1} to={0.5} />
			<Callout cam={cam} at={[0, 1.2, 0.9]} label={lang === 'id' ? 'Torsi lebih bersih' : 'Cleaner torque'} from={0.6} to={0.97} />
		</>
	);
};

const Traction = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [6, 2.6, 9], look: [0, 1.6, 0]},
		{t: 0.5, pos: [5.2, 2.6, 8.2], look: [0, 1.6, 0]},
		{t: 0.55, pos: [2.4, 1.2, 6], look: [0, 0.4, 0], cut: true},
		{t: 1, pos: [2, 1.1, 5.5], look: [0, 0.4, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Wheel r={2} angle={-sec * 6} position={[0, 2, 0]} />
				<HudLine path={ringPath([0, 0.04, 0], interpolate(p, [0.1, 0.6], [0.2, 0.7], clamp))} closed grow={1} r={0.04} />
				<HudLine path={[[-2.6, 0.3, 1.3], [-1, 0.3, 1.3], [0.6, 0.3, 1.3]]} grow={interpolate(p, [0.2, 0.7], [0, 1], clamp)} arrow />
			</Stage>
			<Callout cam={cam} at={[0, 2, 0.3]} label={lang === 'id' ? 'Torsi linear' : 'Linear torque'} from={0.1} to={0.5} />
			<Callout cam={cam} at={[0, 0.04, 0.6]} label={lang === 'id' ? 'Traksi belakang' : 'Rear traction'} from={0.6} to={0.97} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [6, 5, 14], look: [0, 2.4, 0]}, {t: 1, pos: [7.5, 5.5, 16], look: [0, 2.4, 0]}])}>
				<Four deg={sec * 700} sec={sec} offsets={CROSS} />
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 030'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 030']}} />
		</>
	);
};

export default [Hook, Even, Crossplane, Beat, Inertia, Traction, Finale];
