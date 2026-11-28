import {interpolate} from 'remotion';
import {BrakeDisc, HudLine, Readout, Stage, Wheel, pullBack, ringPath, useScene} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Bosch MSC (KTM cornering ABS): a lean sensor tells the ABS how far the bike is leaned, and it eases brake pressure
// to match the grip left. A front wheel and disc lean about the direction of travel (x), pivoting on the contact patch.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const R = 3.2;

/** The wheel leaned by `lean` radians; `squeeze` clamps the pads. */
const LeanWheel = ({lean, spin, squeeze, heat = 0}: {lean: number; spin: number; squeeze: number; heat?: number}) => (
	<group rotation={[lean, 0, 0]}>
		<group position={[0, R, 0]}>
			<Wheel r={R} angle={-spin} />
			<BrakeDisc squeeze={squeeze} heat={heat} angle={-spin} position={[0, 0, 0.6]} />
		</group>
	</group>
);

/** The upright reference and the leaned line, from the contact patch. */
const LeanLines = ({lean, grow}: {lean: number; grow: number}) => (
	<>
		<HudLine path={[[0, 0.02, 0], [0, 7.4, 0]]} grow={grow} r={0.025} />
		<HudLine path={[[0, 0.02, 0], [0, 7.4 * Math.cos(lean), 7.4 * Math.sin(lean)]]} grow={grow} arrow />
	</>
);

/** Where the lean sensor sits in the bike, above the wheel. */
const sensorAt = (lean: number): V3 => [0, 8.2 * Math.cos(lean), 8.2 * Math.sin(lean)];

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const lean = interpolate(p, [0, 0.4], [0.1, 0.7], clamp);
	const cam = pullBack([
		{t: 0, pos: [14, 4.6, 6], look: [0, 3, 1]},
		{t: 0.45, pos: [13, 4.4, 6.6], look: [0, 3, 1.4]},
		{t: 0.5, pos: [4, 3, 9], look: [0, 2.4, 1.6], cut: true},
		{t: 1, pos: [3.6, 2.9, 8.2], look: [0, 2.4, 1.6]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<LeanWheel lean={lean} spin={sec * 5} squeeze={0.6} />
				<LeanLines lean={lean} grow={interpolate(p, [0.1, 0.4], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={[0, R * Math.cos(lean), R * Math.sin(lean)]} label="KTM · cornering ABS" from={0.06} to={0.45} />
			<Callout cam={cam} at={[0, 4.6 * Math.cos(lean), 4.6 * Math.sin(lean)]} label={lang === 'id' ? 'Tahu miringnya' : 'Knows the lean'} from={0.55} to={0.97} />
		</>
	);
};

const Normal = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const pulse = 0.55 + 0.45 * Math.sin(sec * 30);
	const cam = pullBack([
		{t: 0, pos: [3.4, 4, 9], look: [0, 3.2, 0.6]},
		{t: 0.5, pos: [2.8, 3.9, 8.2], look: [0, 3.2, 0.6]},
		{t: 0.55, pos: [12, 5, 4], look: [0, 3.2, 0], cut: true},
		{t: 1, pos: [11, 4.8, 4.4], look: [0, 3.2, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<LeanWheel lean={0} spin={sec * 3} squeeze={pulse} />
			</Stage>
			<Callout cam={cam} at={[1.6, R + 1.6, 0.7]} label={lang === 'id' ? 'Nyegah ngunci' : 'Stops locking'} from={0.08} to={0.5} />
			<Callout cam={cam} at={[0, R, 0.7]} label={lang === 'id' ? 'Miring? Nggak tahu' : 'Lean? No idea'} from={0.6} to={0.97} />
		</>
	);
};

const Sensor = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const lean = 0.5 + 0.15 * Math.sin(p * Math.PI * 2);
	const cam = pullBack([
		{t: 0, pos: [13, 7, 9], look: [0, 6.4, 4]},
		{t: 0.5, pos: [12, 6.8, 9.4], look: [0, 6.4, 4]},
		{t: 0.55, pos: [5, 4, 11], look: [0, 3.4, 2], cut: true},
		{t: 1, pos: [4.4, 3.9, 10.2], look: [0, 3.4, 2]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<LeanWheel lean={lean} spin={sec * 5} squeeze={0.3} />
				<LeanLines lean={lean} grow={1} />
				<HudLine path={ringPath(sensorAt(lean), 0.4, true)} closed grow={interpolate(p, [0.05, 0.3], [0, 1], clamp)} r={0.04} />
			</Stage>
			<Readout label={lang === 'id' ? 'CEK PER DETIK' : 'CHECKS PER SECOND'} from={0} to={100} unit="+" at={[0.1, 0.8]} />
			<Callout cam={cam} at={sensorAt(lean)} label={lang === 'id' ? 'Sensor miring' : 'Lean sensor'} from={0.12} to={0.5} />
		</>
	);
};

const Ease = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.25, 0.8, 0.3);
	const lean = 0.65;
	const squeeze = interpolate(r.q, [0.2, 0.7], [1, 0.45], clamp);
	const cam = pullBack([
		{t: 0, pos: [4, 3.4, 10], look: [0, 2.6, 2]},
		{t: 0.5, pos: [3.4, 3.3, 9.2], look: [0, 2.6, 2]},
		{t: 0.55, pos: [5, 1.4, 4], look: [0, 0.2, 0.2], cut: true},
		{t: 1, pos: [4.4, 1.3, 3.6], look: [0, 0.2, 0.2]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<LeanWheel lean={lean} spin={r.q * 20} squeeze={squeeze} heat={squeeze * 0.4} />
				<HudLine path={ringPath([0, 0.04, 0], 0.55)} closed grow={1} r={0.04} />
			</Stage>
			<Callout cam={cam} at={[0, R * Math.cos(lean), R * Math.sin(lean) + 0.6]} label={lang === 'id' ? 'Tekanan dikurangi' : 'Less pressure'} from={0.12} to={0.5} />
			<Callout cam={cam} at={[0, 0.04, 0.5]} label={lang === 'id' ? 'Ban tetap nempel' : 'Tyre keeps gripping'} from={0.6} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const First = () => {
	const {p, sec} = useScene();
	const lean = interpolate(p, [0.2, 0.8], [0, 0.6], clamp);
	const cam = pullBack([
		{t: 0, pos: [-12, 5.4, 8], look: [0, 3, 1]},
		{t: 0.5, pos: [-11, 5.2, 8.6], look: [0, 3, 1]},
		{t: 0.55, pos: [-3.4, 4.2, 9.6], look: [0, 3, 1.4], cut: true},
		{t: 1, pos: [-3, 4.1, 8.8], look: [0, 3, 1.4]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<LeanWheel lean={lean} spin={sec * 5} squeeze={0.4} />
				<LeanLines lean={lean} grow={1} />
			</Stage>
			<Callout cam={cam} at={[0, R * Math.cos(lean), R * Math.sin(lean)]} label="KTM 1190 Adventure" from={0.1} to={0.95} />
		</>
	);
};

const Physics = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [3.6, 1.6, 4.4], look: [0, 0.2, 0.3]},
		{t: 0.5, pos: [3.1, 1.5, 4], look: [0, 0.2, 0.3]},
		{t: 0.55, pos: [11, 4.4, 8], look: [0, 3, 2], cut: true},
		{t: 1, pos: [10, 4.2, 8.4], look: [0, 3, 2]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<LeanWheel lean={0.75} spin={sec * 4} squeeze={0.3} />
				<HudLine path={ringPath([0, 0.04, 0], interpolate(p, [0.1, 0.5], [0.7, 0.25], clamp))} closed grow={1} r={0.04} />
			</Stage>
			<Callout cam={cam} at={[0, 0.04, 0.4]} label={lang === 'id' ? 'Grip ada batasnya' : 'Grip has a limit'} from={0.12} to={0.97} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [14, 4.6, 6], look: [0, 3, 1]}, {t: 1, pos: [16, 5, 7.5], look: [0, 3, 1]}])}>
				<LeanWheel lean={0.55} spin={sec * 5} squeeze={0.3} />
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'SAFETY LAB', 'No. 035'], id: ['BONGKAR PASANG', 'LAB KESELAMATAN', 'No. 035']}} />
		</>
	);
};

export default [Hook, Normal, Sensor, Ease, First, Physics, Finale];
