import {interpolate} from 'remotion';
import {Car, Engine, HudLine, Readout, Stage, cycleState, ringPath, useScene, type CamKey, type EngineState} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Mazda Skyactiv-X (SPCCI): a lean petrol mix squeezed to about 16:1, a small spark flame raises the pressure and the
// rest of the charge ignites by compression. Animation language: docs/styles.md.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CHAMBER: V3 = [0, 5.05, 0.92]; // front of the glass cylinder, just under the head
const ENGINE_IN_CAR: V3 = [2.72, 2.2, 1.49]; // engine bay of the car below (rotated -0.5)

/** The SPCCI moment, k 0..1: a spark kernel first, then the whole lean charge lights at once. */
const spcci = (k: number, sec: number): EngineState => ({
	...cycleState(335 + k * 45, sec),
	spark: interpolate(k, [0.08, 0.16, 0.35], [0, 1, 0], clamp),
	gas: k > 0.5 ? '#ff8a1f' : '#9fd8c0',
	gasGlow: interpolate(k, [0.16, 0.45, 0.55, 1], [0, 0.1, 1, 0.8], clamp),
});

/** The spark kernel: a ring that grows from the plug until the whole charge goes. */
const Kernel = ({k}: {k: number}) => <HudLine path={ringPath(CHAMBER, interpolate(k, [0.15, 0.5], [0.08, 0.8], clamp), true)} closed grow={k > 0.15 && k < 0.6 ? 1 : 0} r={0.03} />;

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam: CamKey[] = [
		{t: 0, pos: [10, 6.5, 24], look: [1.2, 1.6, 0]},
		{t: 0.4, pos: [8.5, 6, 21], look: [1.6, 1.8, 0]},
		{t: 0.45, pos: [3, 5.4, 9], look: [0, 3.9, 0], cut: true},
		{t: 1, pos: [2.2, 5.2, 7.6], look: [0, 4.1, 0]},
	];
	const k = interpolate(p, [0.5, 0.95], [0, 1], clamp);
	return (
		<>
			<Stage cam={cam}>
				{p < 0.45 ? (
					<Car rotation={[0, -0.5, 0]} xray>
						<Engine s={cycleState(sec * 1100, sec)} valves={false} />
					</Car>
				) : (
					<>
						<Engine s={spcci(k, sec)} />
						<Kernel k={k} />
					</>
				)}
			</Stage>
			<Callout cam={cam} at={ENGINE_IN_CAR} label="Mazda Skyactiv-X" from={0.05} to={0.43} />
			<Callout cam={cam} at={CHAMBER} label={lang === 'id' ? 'Menyala sendiri' : 'Lights itself'} from={0.72} to={1} />
		</>
	);
};

const SparkOrNot = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const deg = 250 + p * 900;
	const cam: CamKey[] = [
		{t: 0, pos: [3.5, 6.2, 10], look: [0, 4.2, 0]},
		{t: 0.48, pos: [2.6, 5.8, 8.8], look: [0, 4.2, 0]},
		{t: 0.5, pos: [-3.5, 5.6, 9.5], look: [0, 4, 0], cut: true},
		{t: 1, pos: [-2.6, 5.3, 8.4], look: [0, 4, 0]},
	];
	const petrol = p < 0.5;
	const s = cycleState(deg, sec);
	return (
		<>
			<Stage cam={cam}>{petrol ? <Engine s={s} focus={['spark']} /> : <Engine s={{...s, spark: 0}} injector focus={['spark']} />}</Stage>
			<Callout cam={cam} at={[0, 6.3, 0.5]} label={lang === 'id' ? 'Busi' : 'Spark plug'} from={0.08} to={0.47} />
			<Callout cam={cam} at={[0, 6.3, 0.5]} label={lang === 'id' ? 'Diesel: tanpa busi' : 'Diesel: no spark'} from={0.55} to={0.97} />
		</>
	);
};

const Squeeze = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const deg = interpolate(p, [0, 0.92], [185, 350], clamp);
	const cam: CamKey[] = [
		{t: 0, pos: [4, 4.5, 10], look: [0, 3.4, 0]},
		{t: 0.5, pos: [3.2, 4.2, 9], look: [0, 3.5, 0]},
		{t: 0.52, pos: [-2.4, 5.6, 7.4], look: [0, 4.4, 0], cut: true},
		{t: 1, pos: [-1.8, 5.4, 6.8], look: [0, 4.5, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={{...cycleState(deg, sec), spark: 0}} focus={['piston']} />
				<HudLine path={[[1.3, 2.4, 0.6], [1.3, 3.4, 0.6], [1.3, 4.5, 0.6]]} grow={interpolate(p, [0.05, 0.9], [0, 1], clamp)} arrow />
			</Stage>
			<Readout label={lang === 'id' ? 'KOMPRESI' : 'COMPRESSION'} from={1} to={16} unit=": 1" at={[0.05, 0.9]} />
			<Callout cam={cam} at={CHAMBER} label={lang === 'id' ? 'Campuran irit' : 'Lean mix'} from={0.56} to={0.97} />
		</>
	);
};

const Ignite = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.12, 0.7, 0.3);
	const k = interpolate(r.q, [0.05, 0.85], [0, 1], clamp);
	const cam: CamKey[] = [
		{t: 0, pos: [2.4, 5.6, 6.8], look: [0, 4.7, 0]},
		{t: 0.5, pos: [1.6, 5.4, 6.2], look: [0, 4.8, 0]},
		{t: 0.55, pos: [-3.6, 5, 9.5], look: [0, 4, 0], cut: true},
		{t: 1, pos: [-3, 4.8, 8.8], look: [0, 4, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={spcci(k, sec)} focus={['spark']} />
				<Kernel k={k} />
			</Stage>
			<Callout cam={cam} at={[0, 5.12, 0.5]} label={lang === 'id' ? 'Api kecil' : 'Small flame'} from={0.1} to={0.5} />
			<Callout cam={cam} at={CHAMBER} label={lang === 'id' ? 'Semua menyala' : 'All of it ignites'} from={0.58} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Economy = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam: CamKey[] = [
		{t: 0, pos: [-9, 7, 22], look: [0.5, 1.5, 0]},
		{t: 0.5, pos: [-7, 6.5, 20], look: [1, 1.6, 0]},
		{t: 0.55, pos: [7, 4.4, 9], look: [2.7, 1.8, 1.5], cut: true},
		{t: 1, pos: [6.2, 4.2, 8], look: [2.7, 1.9, 1.5]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Car rotation={[0, -0.5, 0]} xray>
					<Engine s={cycleState(sec * 1000, sec)} valves={false} focus={['head', 'piston']} />
				</Car>
			</Stage>
			<Readout label={lang === 'id' ? 'LEBIH IRIT' : 'BETTER ECONOMY'} from={0} to={20} unit={lang === 'id' ? '% · KLAIM MAZDA' : '% · MAZDA CLAIM'} at={[0.1, 0.8]} />
			<Callout cam={cam} at={ENGINE_IN_CAR} label="SPCCI" from={0.6} to={0.97} />
		</>
	);
};

const Fallback = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const deg = 200 + p * 1100;
	const cam: CamKey[] = [
		{t: 0, pos: [-4, 3.6, 12], look: [0, 3.3, 0]},
		{t: 0.5, pos: [-3, 3.8, 11], look: [0, 3.4, 0]},
		{t: 0.55, pos: [2.8, 6.4, 8], look: [0, 4.6, 0], cut: true},
		{t: 1, pos: [2.2, 6.1, 7.2], look: [0, 4.7, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(deg, sec)} focus={['spark']} />
			</Stage>
			<Callout cam={cam} at={[0, 5.12, 0.5]} label={lang === 'id' ? 'Mode busi' : 'Spark mode'} from={0.15} to={0.95} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={[{t: 0, pos: [9, 6.5, 24], look: [1.2, 1.6, 0]}, {t: 1, pos: [12, 7, 27], look: [1.5, 1.8, 0]}]}>
				<Car rotation={[0, -0.5, 0]} xray>
					<Engine s={cycleState(sec * 1100, sec)} valves={false} />
				</Car>
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 023'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 023']}} />
		</>
	);
};

export default [Hook, SparkOrNot, Squeeze, Ignite, Economy, Fallback, Finale];
