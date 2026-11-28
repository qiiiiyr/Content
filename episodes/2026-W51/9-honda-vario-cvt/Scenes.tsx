import {interpolate} from 'remotion';
import {Engine, HudLine, Pulley, Scooter, Stage, cycleState, pullBack, useScene} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Scooter CVT (Honda Vario): a V-belt between two pulleys of sliding cones; centrifugal rollers close the front pulley
// as revs rise, the belt pulls the rear one open against its spring. The pulleys are stacked (front on top) so the
// pair fits the portrait frame; the near cone halves are glass so the belt and rollers show. docs/styles.md.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const FY = 7.6; // front (drive) pulley, on the crank
const RY = 2.4; // rear (driven) pulley, to the wheel
const FRONT: V3 = [0, FY, 0];
const REAR: V3 = [0, RY, 0];
const ENGINE_IN_SCOOTER: V3 = [-2, 2.2, 0];

/** The belt as a closed loop: over the top of the front pulley at radius f, under the rear at radius b. */
const belt = (f: number, b: number): V3[] => [
	...Array.from({length: 13}, (_, i): V3 => {
		const a = (i / 12) * Math.PI;
		return [Math.cos(a) * f, FY + Math.sin(a) * f, 0];
	}),
	...Array.from({length: 13}, (_, i): V3 => {
		const a = Math.PI + (i / 12) * Math.PI;
		return [Math.cos(a) * b, RY + Math.sin(a) * b, 0];
	}),
];

/** Front radius f from 0.8 (pulling away) to 1.9 (top speed); the rear does the opposite so the belt length holds. */
const Drive = ({f, sec, rollers, grow = 1}: {f: number; sec: number; rollers?: number; grow?: number}) => {
	const b = 2.7 - f;
	return (
		<>
			<Pulley r={f} angle={-sec * 5} rollers={rollers} xray position={FRONT} />
			<Pulley r={b} angle={(-sec * 5 * f) / b} xray position={REAR} />
			<HudLine path={belt(f, b)} closed grow={grow} r={0.08} />
		</>
	);
};

// three-quarter views: the whole pair, the front pulley, the rear pulley
const WIDE_A: V3 = [7, 9, 17];
const WIDE_B: V3 = [-7, 7.5, 17];

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [8, 5.5, 18], look: [0, 2.4, 0]},
		{t: 0.42, pos: [6.6, 5.2, 16], look: [0, 2.5, 0]},
		{t: 0.46, pos: WIDE_A, look: [0, 5, 0], cut: true},
		{t: 1, pos: [6.4, 8.8, 16], look: [0, 5, 0]},
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
			<Callout cam={cam} at={[1.2, 5, 0]} label={lang === 'id' ? 'Tanpa gigi' : 'No gears'} from={0.55} to={0.97} />
		</>
	);
};

const BeltPulleys = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: WIDE_B, look: [0, 5, 0]},
		{t: 0.5, pos: [-6.4, 7.4, 16], look: [0, 5, 0]},
		{t: 0.52, pos: [4.6, 10.4, 6.6], look: [0, FY, 0], cut: true},
		{t: 1, pos: [4.2, 10.2, 6], look: [0, FY, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={1.1} sec={sec} grow={interpolate(p, [0, 0.4], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={[-1.3, 5, 0]} label="V-belt" from={0.1} to={0.48} />
			<Callout cam={cam} at={[1.6, FY, 0.6]} label={lang === 'id' ? 'Dua kerucut' : 'Two cones'} from={0.56} to={0.97} />
		</>
	);
};

const Rollers = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [2.6, FY + 1.8, 6.4], look: [0, FY, 0.6]},
		{t: 0.5, pos: [2.2, FY + 1.7, 5.9], look: [0, FY, 0.6]},
		{t: 0.52, pos: [-3, FY + 2.6, 6], look: [0, FY, 0.4], cut: true},
		{t: 1, pos: [-2.6, FY + 2.5, 5.5], look: [0, FY, 0.4]},
	]);
	const out = interpolate(p, [0.1, 0.9], [0.7, 1.7], clamp);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={0.9 + (out - 0.7) * 0.4} sec={sec * (0.5 + p)} rollers={out} />
			</Stage>
			<Callout cam={cam} at={[out, FY, 1.3]} label="Roller" from={0.1} to={0.5} />
			<Callout cam={cam} at={[0, FY + out, 1.3]} label={lang === 'id' ? 'Terlempar keluar' : 'Flying outward'} from={0.56} to={0.97} />
		</>
	);
};

const Squeeze = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.3, 0.8, 0.3);
	const f = interpolate(r.q, [0.05, 0.95], [0.9, 1.9], clamp);
	const cam = pullBack([
		{t: 0, pos: WIDE_A, look: [0, 5, 0]},
		{t: 0.5, pos: [6.4, 8.8, 16], look: [0, 5, 0]},
		{t: 0.55, pos: [4, FY + 2.6, 6.6], look: [0, FY + 0.4, 0], cut: true},
		{t: 1, pos: [3.6, FY + 2.5, 6.1], look: [0, FY + 0.4, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={f} sec={sec} rollers={0.7 + (f - 0.9)} />
			</Stage>
			<Callout cam={cam} at={[0, FY + f, 0]} label={lang === 'id' ? 'Belt naik' : 'Belt climbs'} from={0.12} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const RearSpring = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const f = interpolate(p, [0, 0.9], [1.2, 1.9], clamp);
	const cam = pullBack([
		{t: 0, pos: [-3.4, RY + 3, 6.6], look: [0, RY, 0.4]},
		{t: 0.5, pos: [-3, RY + 2.9, 6.1], look: [0, RY, 0.4]},
		{t: 0.52, pos: [3.6, RY + 2.4, 6.4], look: [0, RY, 0], cut: true},
		{t: 1, pos: [3.2, RY + 2.3, 5.9], look: [0, RY, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={f} sec={sec} />
				<HudLine path={[[0, RY, 2.6], [0, RY, 1.8], [0, RY, 1]]} grow={interpolate(p, [0.1, 0.5], [0, 1], clamp)} arrow />
			</Stage>
			<Callout cam={cam} at={[0, RY, 2.6]} label={lang === 'id' ? 'Per CVT' : 'CVT spring'} from={0.12} to={0.5} />
			<Callout cam={cam} at={[0, RY - (2.7 - f), 0]} label={lang === 'id' ? 'Belt turun' : 'Belt drops'} from={0.56} to={0.97} />
		</>
	);
};

const Weights = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const light = p < 0.5;
	const k = light ? interpolate(p, [0.05, 0.3], [0, 1], clamp) : interpolate(p, [0.55, 0.95], [0, 1], clamp);
	const out = 0.7 + k * (light ? 1 : 0.6);
	const cam = pullBack([
		{t: 0, pos: [3, FY + 2, 7], look: [0, FY, 0.5]},
		{t: 0.48, pos: [2.6, FY + 1.9, 6.4], look: [0, FY, 0.5]},
		{t: 0.5, pos: [-3, FY + 2.2, 6.8], look: [0, FY, 0.5], cut: true},
		{t: 1, pos: [-2.6, FY + 2.1, 6.2], look: [0, FY, 0.5]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Drive f={0.9 + (out - 0.7) * 0.6} sec={sec} rollers={out} />
			</Stage>
			<Callout cam={cam} at={[0, FY + out, 1.3]} label={lang === 'id' ? 'Ringan: tarikan enteng' : 'Light: quick pull'} from={0.08} to={0.47} />
			<Callout cam={cam} at={[0, FY + out, 1.3]} label={lang === 'id' ? 'Berat: top speed' : 'Heavy: top speed'} from={0.55} to={0.97} />
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
