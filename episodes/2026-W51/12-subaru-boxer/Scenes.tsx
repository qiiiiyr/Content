import {interpolate} from 'remotion';
import {Car, Engine, HudLine, Stage, cycleState, pullBack, ringPath, useScene} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Subaru boxer: two cylinder banks lying flat, facing each other across one crank. Opposite pistons move out and in
// together, so their shaking cancels; the flat engine sits low. Two cutaway cylinders turned on their sides.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const C: V3 = [0, 3, 0]; // the shared crank
// the base slab of each cutaway would cut through the other bank, so it stays out of focus (see-through)
const SHOWN = ['piston', 'crank', 'head', 'spark'];

/** Two cylinders on their sides, crank at `center`; the left bank points -x, the right +x. */
const Boxer = ({deg, sec, center = C, scale = 1, focus = SHOWN}: {deg: number; sec: number; center?: V3; scale?: number; focus?: string[]}) => (
	<group position={center} scale={scale}>
		<group position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
			<Engine s={cycleState(deg, sec)} valves={false} focus={focus} />
		</group>
		<group position={[-1.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
			<Engine s={cycleState(deg + 360, sec)} valves={false} focus={focus} />
		</group>
	</group>
);

/** A boxer in the car, its banks pointing across the car, low under the bonnet. */
const BoxerCar = ({sec, rotation = [0, -0.5, 0] as V3, wheel = 0}: {sec: number; rotation?: V3; wheel?: number}) => (
	<Car rotation={rotation} xray color="#1f4f8a" wheel={wheel}>
		<group rotation={[0, Math.PI / 2, 0]}>
			<Boxer deg={sec * 900} sec={sec} center={[0, 2.4, 0]} scale={0.8} />
		</group>
	</Car>
);

/** Arrows along both banks: outward together (k < 0.5) or inward together. */
const Fists = ({k, grow}: {k: number; grow: number}) => {
	const out = k < 0.5;
	const a = out ? 2.2 : 5.4;
	const b = out ? 5.4 : 2.2;
	return (
		<>
			<HudLine path={[[-a, 3, 1.3], [-b, 3, 1.3]]} grow={grow} arrow />
			<HudLine path={[[a, 3, 1.3], [b, 3, 1.3]]} grow={grow} arrow />
		</>
	);
};

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [2, 6, 11], look: [0, 3, 0]},
		{t: 0.45, pos: [1.6, 5.6, 10], look: [0, 3, 0]},
		{t: 0.5, pos: [-7, 5, 9], look: [-2.6, 3, 0], cut: true},
		{t: 1, pos: [-6.2, 4.9, 8.2], look: [-2.6, 3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Boxer deg={sec * 600} sec={sec} />
			</Stage>
			<Callout cam={cam} at={[0, 4.4, 0]} label="Subaru Boxer" from={0.06} to={0.45} />
			<Callout cam={cam} at={[-4.6, 3, 0.9]} label={lang === 'id' ? 'Ninju ke samping' : 'Punching sideways'} from={0.55} to={0.97} />
		</>
	);
};

const Banks = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [0, 10, 9], look: [0, 3, 0]},
		{t: 0.5, pos: [0.4, 9.4, 8.4], look: [0, 3, 0]},
		{t: 0.55, pos: [5, 3.2, 9.6], look: [1, 3, 0], cut: true},
		{t: 1, pos: [4.4, 3.2, 8.8], look: [1, 3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Boxer deg={sec * 500} sec={sec} />
				<HudLine path={[[-6.4, 3, -1.3], [0, 3, -1.3], [6.4, 3, -1.3]]} grow={interpolate(p, [0.1, 0.5], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={[4.6, 3, 1]} label={lang === 'id' ? 'Silinder rebahan' : 'Cylinders lie flat'} from={0.1} to={0.5} />
			<Callout cam={cam} at={[0, 3, 0.8]} label={lang === 'id' ? 'Satu kruk as' : 'One crank'} from={0.6} to={0.97} />
		</>
	);
};

const Together = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.2, 0.8, 0.3);
	const deg = r.q * 720;
	const cam = pullBack([
		{t: 0, pos: [0, 5.4, 12], look: [0, 3, 0]},
		{t: 0.5, pos: [0.5, 5.2, 11], look: [0, 3, 0]},
		{t: 0.55, pos: [-3.4, 6.4, 8], look: [0, 3, 0], cut: true},
		{t: 1, pos: [-2.9, 6.2, 7.3], look: [0, 3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Boxer deg={deg} sec={sec} focus={['piston']} />
				<Fists k={(deg % 360) / 360} grow={1} />
			</Stage>
			<Callout cam={cam} at={[3.6, 3, 1]} label={lang === 'id' ? 'Keluar masuk bareng' : 'Out and in together'} from={0.12} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Cancel = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [6, 4.6, 8], look: [1.4, 3, 0]},
		{t: 0.5, pos: [5.2, 4.5, 7.4], look: [1.4, 3, 0]},
		{t: 0.55, pos: [0, 4, 13], look: [0, 3, 0], cut: true},
		{t: 1, pos: [0.3, 4, 12], look: [0, 3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Boxer deg={sec * 700} sec={sec} />
				<HudLine path={ringPath(C, interpolate(p, [0.2, 0.6], [0.3, 1.2], clamp), true)} closed grow={1} r={0.04} />
			</Stage>
			<Callout cam={cam} at={[3.6, 3, 1]} label={lang === 'id' ? 'Getaran saling batal' : 'Shakes cancel'} from={0.1} to={0.5} />
			<Callout cam={cam} at={C} label={lang === 'id' ? 'Tanpa balancer' : 'No balance shaft'} from={0.6} to={0.97} />
		</>
	);
};

const Low = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [8, 3, 18], look: [1, 1.4, 0]},
		{t: 0.5, pos: [7, 3, 16.5], look: [1.2, 1.4, 0]},
		{t: 0.55, pos: [7.4, 3.2, 7.4], look: [2.7, 1.6, 1.5], cut: true},
		{t: 1, pos: [6.6, 3.1, 6.8], look: [2.7, 1.6, 1.5]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<BoxerCar sec={sec} />
				<HudLine path={ringPath([0.4, 1.6, 0.2], interpolate(p, [0.15, 0.5], [0.1, 0.4], clamp), true)} closed grow={1} r={0.04} />
			</Stage>
			<Callout cam={cam} at={[0.4, 1.6, 0.2]} label={lang === 'id' ? 'Titik berat rendah' : 'Low centre of gravity'} from={0.12} to={0.5} />
			<Callout cam={cam} at={[2.72, 1.75, 1.49]} label={lang === 'id' ? 'Mesin rebahan' : 'Flat engine'} from={0.6} to={0.97} />
		</>
	);
};

const Balance = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-8, 7, 20], look: [0, 1.6, 0]},
		{t: 0.5, pos: [-6.6, 6.6, 18.4], look: [0, 1.7, 0]},
		{t: 0.55, pos: [9, 8, 14], look: [0, 1.6, 0], cut: true},
		{t: 1, pos: [8, 7.6, 13], look: [0, 1.7, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<BoxerCar sec={sec} rotation={[0, -0.5 + p * 1.2, 0]} wheel={sec * 3} />
			</Stage>
			<Callout cam={cam} at={[0, 3.6, 0]} label={lang === 'id' ? 'Lebih seimbang' : 'Better balance'} from={0.2} to={0.95} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [9, 6.5, 24], look: [1.2, 1.6, 0]}, {t: 1, pos: [12, 7, 27], look: [1.5, 1.8, 0]}])}>
				<BoxerCar sec={sec} />
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 034'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 034']}} />
		</>
	);
};

export default [Hook, Banks, Together, Cancel, Low, Balance, Finale];
