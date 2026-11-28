import {interpolate} from 'remotion';
import {Engine, HudLine, Pulley, Scooter, Stage, cycleState, pullBack, useScene} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Scooter CVT (Honda Vario): a V-belt between two pulleys of sliding cones; centrifugal rollers close the front pulley
// as revs rise, the belt pulls the rear one open against its spring. Animation language: docs/styles.md.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const FX = 2.6; // front (drive) pulley, on the crank
const RX = -2.6; // rear (driven) pulley, to the wheel
const Y = 3;
const ENGINE_IN_SCOOTER: V3 = [-2, 2.2, 0];

/** The belt as a closed loop: half round the front pulley at radius f, half round the rear at radius b. */
const belt = (f: number, b: number): V3[] => [
	...Array.from({length: 13}, (_, i): V3 => {
		const a = -Math.PI / 2 + (i / 12) * Math.PI;
		return [FX + Math.cos(a) * f, Y + Math.sin(a) * f, 0];
	}),
	...Array.from({length: 13}, (_, i): V3 => {
		const a = Math.PI / 2 + (i / 12) * Math.PI;
		return [RX + Math.cos(a) * b, Y + Math.sin(a) * b, 0];
	}),
];

/** Front radius f from 0.8 (pulling away) to 1.9 (top speed); the rear does the opposite so the belt length holds. */
const Drive = ({f, sec, rollers, grow = 1}: {f: number; sec: number; rollers?: number; grow?: number}) => {
	const b = 2.7 - f;
	return (
		<>
			<Pulley r={f} angle={-sec * 5} rollers={rollers} position={[FX, Y, 0]} />
			<Pulley r={b} angle={(-sec * 5 * f) / b} position={[RX, Y, 0]} />
			<HudLine path={belt(f, b)} closed grow={grow} r={0.07} />
		</>
	);
};

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [8, 5.5, 18], look: [0, 2.4, 0]},
		{t: 0.42, pos: [6.6, 5.2, 16], look: [0, 2.5, 0]},
		{t: 0.46, pos: [1.5, 5, 13], look: [0, 3, 0], cut: true},
		{t: 1, pos: [1.2, 4.8, 12], look: [0, 3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				{p < 0.46 ? (
					<Scooter xray wheel={sec * 4}>
						<Engine s={cycleState(sec * 900, sec)} valves={false} />
					</Scooter>
				) : (
					<Drive f={interpolate(p, [0.5, 1], [0.9, 1.6], clamp)} sec={sec} />
				)}
			</Stage>
			<Callout cam={cam} at={ENGINE_IN_SCOOTER} label="Honda Vario · CVT" from={0.05} to={0.44} />
			<Callout cam={cam} at={[0, Y + 1.2, 0]} label={lang === 'id' ? 'Tanpa gigi' : 'No gears'} from={0.55} to={0.97} />
		</>
	);
};

const BeltPulleys = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-2, 5.5, 11], look: [0, 3, 0]},
		{t: 0.5, pos: [-1.6, 5.3, 10], look: [0, 3, 0]},
		{t: 0.52, pos: [6.4, 4.2, 5.6], look: [FX, 3, 0], cut: true},
		{t: 1, pos: [5.8, 4.1, 5.1], look: [FX, 3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={1.1} sec={sec} grow={interpolate(p, [0, 0.4], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={[0, Y + 1.25, 0]} label="V-belt" from={0.1} to={0.48} />
			<Callout cam={cam} at={[FX, Y + 1.6, 0.4]} label={lang === 'id' ? 'Dua kerucut' : 'Two cones'} from={0.56} to={0.97} />
		</>
	);
};

const Rollers = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [FX + 1.5, 4.4, 6.5], look: [FX, 3, 0.6]},
		{t: 0.5, pos: [FX + 1.2, 4.3, 6], look: [FX, 3, 0.6]},
		{t: 0.52, pos: [FX - 2.5, 3.6, 6.6], look: [FX, 3, 0.4], cut: true},
		{t: 1, pos: [FX - 2.1, 3.5, 6.1], look: [FX, 3, 0.4]},
	]);
	const out = interpolate(p, [0.1, 0.9], [0.7, 1.7], clamp);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={0.9 + (out - 0.7) * 0.4} sec={sec * (0.5 + p)} rollers={out} />
			</Stage>
			<Callout cam={cam} at={[FX + out, Y, 1.3]} label="Roller" from={0.1} to={0.5} />
			<Callout cam={cam} at={[FX, Y + out, 1.3]} label={lang === 'id' ? 'Terlempar keluar' : 'Flying outward'} from={0.56} to={0.97} />
		</>
	);
};

const Squeeze = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.3, 0.8, 0.3);
	const f = interpolate(r.q, [0.05, 0.95], [0.9, 1.9], clamp);
	const cam = pullBack([
		{t: 0, pos: [0, 5.8, 13], look: [0, 3, 0]},
		{t: 0.5, pos: [0.4, 5.6, 12], look: [0, 3, 0]},
		{t: 0.55, pos: [6, 5, 6], look: [FX, 3.4, 0], cut: true},
		{t: 1, pos: [5.4, 4.9, 5.5], look: [FX, 3.4, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={f} sec={sec} rollers={0.7 + (f - 0.9)} />
			</Stage>
			<Callout cam={cam} at={[FX, Y + f, 0]} label={lang === 'id' ? 'Belt naik' : 'Belt climbs'} from={0.12} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const RearSpring = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const f = interpolate(p, [0, 0.9], [1.2, 1.9], clamp);
	const cam = pullBack([
		{t: 0, pos: [RX - 2, 4.6, 6.6], look: [RX, 3, 0]},
		{t: 0.5, pos: [RX - 1.6, 4.5, 6], look: [RX, 3, 0]},
		{t: 0.52, pos: [RX + 3.4, 3.8, 6.2], look: [RX, 3, 0], cut: true},
		{t: 1, pos: [RX + 2.9, 3.7, 5.7], look: [RX, 3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={f} sec={sec} />
				<HudLine path={[[RX, Y, 2.4], [RX, Y, 1.6], [RX, Y, 0.8]]} grow={interpolate(p, [0.1, 0.5], [0, 1], clamp)} arrow />
			</Stage>
			<Callout cam={cam} at={[RX, Y, 2.4]} label={lang === 'id' ? 'Per CVT' : 'CVT spring'} from={0.12} to={0.5} />
			<Callout cam={cam} at={[RX - (2.7 - f), Y, 0]} label={lang === 'id' ? 'Belt turun' : 'Belt drops'} from={0.56} to={0.97} />
		</>
	);
};

const Weights = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const light = p < 0.5;
	const k = light ? interpolate(p, [0.05, 0.3], [0, 1], clamp) : interpolate(p, [0.55, 0.95], [0, 1], clamp);
	const out = 0.7 + k * (light ? 1 : 0.6);
	const cam = pullBack([
		{t: 0, pos: [FX + 2, 4.6, 7], look: [FX, 3, 0.5]},
		{t: 0.48, pos: [FX + 1.6, 4.5, 6.4], look: [FX, 3, 0.5]},
		{t: 0.5, pos: [FX - 2.4, 4.8, 6.8], look: [FX, 3, 0.5], cut: true},
		{t: 1, pos: [FX - 2, 4.7, 6.2], look: [FX, 3, 0.5]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={0.9 + (out - 0.7) * 0.6} sec={sec} rollers={out} />
			</Stage>
			<Callout cam={cam} at={[FX, Y + out, 1.3]} label={lang === 'id' ? 'Ringan: tarikan enteng' : 'Light: quick pull'} from={0.08} to={0.47} />
			<Callout cam={cam} at={[FX, Y + out, 1.3]} label={lang === 'id' ? 'Berat: top speed' : 'Heavy: top speed'} from={0.55} to={0.97} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [8, 5.5, 18], look: [0, 2.4, 0]}, {t: 1, pos: [10, 6, 21], look: [0, 2.4, 0]}])}>
				<Scooter xray wheel={sec * 4}>
					<Engine s={cycleState(sec * 900, sec)} valves={false} />
				</Scooter>
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 031'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 031']}} />
		</>
	);
};

export default [Hook, BeltPulleys, Rollers, Squeeze, RearSpring, Weights, Finale];
