import {interpolate} from 'remotion';
import {Car, Engine, HudLine, Readout, Stage, cycleState, pullBack, ringPath, useScene, type EngineState} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Nissan VC-Turbo: a multi-link and a control shaft turned by an actuator motor move the pistons' top dead centre,
// so compression runs from 14:1 (efficiency) to 8:1 (boost). Glowing rings mark the two top positions.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ENGINE_IN_CAR: V3 = [2.72, 2.2, 1.49];
const TDC_HIGH = 5.0; // piston crown at top dead centre, 14:1
const TDC_LOW = 4.62; // 8:1
const CRANK: V3 = [0, 1.2, 0.6];

/** The two top-dead-centre marks; `k` 0..1 slides the active one from high (14:1) to low (8:1). */
const TopMarks = ({k, grow = 1}: {k: number; grow?: number}) => (
	<>
		<HudLine path={ringPath([0, TDC_HIGH + (TDC_LOW - TDC_HIGH) * k, 0], 1.12)} closed grow={grow} r={0.04} />
		<HudLine path={ringPath([0, k < 0.5 ? TDC_LOW : TDC_HIGH, 0], 1.12)} closed grow={grow * 0.4} r={0.02} />
	</>
);

/** Knock: the charge flickering as it goes off on its own, too early. */
const knock = (sec: number): EngineState => ({...cycleState(352, sec), gas: '#ff8a1f', gasGlow: 0.5 + 0.5 * Math.abs(Math.sin(sec * 37)), spark: 0});

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [10, 6.5, 24], look: [1.2, 1.6, 0]},
		{t: 0.4, pos: [8.5, 6, 21], look: [1.6, 1.8, 0]},
		{t: 0.45, pos: [3.4, 5.4, 9], look: [0, 4.2, 0], cut: true},
		{t: 1, pos: [2.7, 5.2, 7.9], look: [0, 4.3, 0]},
	]);
	const k = interpolate(p, [0.55, 0.95], [0, 1], clamp);
	return (
		<>
			<Stage cam={cam}>
				{p < 0.45 ? (
					<Car rotation={[0, -0.5, 0]} xray color="#3d4a57">
						<Engine s={cycleState(sec * 1000, sec)} valves={false} />
					</Car>
				) : (
					<>
						<Engine s={cycleState(sec * 1000, sec)} focus={['piston']} />
						<TopMarks k={k} />
					</>
				)}
			</Stage>
			<Callout cam={cam} at={ENGINE_IN_CAR} label="Nissan VC-Turbo" from={0.05} to={0.43} />
			<Readout label={lang === 'id' ? 'KOMPRESI' : 'COMPRESSION'} from={14} to={8} unit=": 1" at={[0.55, 0.95]} />
		</>
	);
};

const Squeeze = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [3.6, 5.6, 8.4], look: [0, 4.4, 0]},
		{t: 0.5, pos: [3, 5.5, 7.8], look: [0, 4.5, 0]},
		{t: 0.52, pos: [-2.4, 5.8, 6.4], look: [0, 4.9, 0], cut: true},
		{t: 1, pos: [-2, 5.7, 5.9], look: [0, 4.9, 0]},
	]);
	const deg = interpolate(p, [0, 0.5], [200, 362], clamp);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={p < 0.52 ? cycleState(deg, sec) : knock(sec)} focus={['piston']} />
			</Stage>
			<Callout cam={cam} at={[0, 4.6, 0.95]} label={lang === 'id' ? 'Lebih efisien' : 'More efficient'} from={0.1} to={0.48} />
			<Callout cam={cam} at={[0, 4.9, 0.95]} label={lang === 'id' ? 'Ngelitik' : 'Knock'} from={0.56} to={0.97} />
		</>
	);
};

const MultiLink = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [3.2, 2.4, 6.4], look: [0, 1.6, 0]},
		{t: 0.5, pos: [2.6, 2.4, 5.8], look: [0, 1.6, 0]},
		{t: 0.55, pos: [-3, 4.6, 8.6], look: [0, 3.2, 0], cut: true},
		{t: 1, pos: [-2.5, 4.5, 7.9], look: [0, 3.3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * 500, sec)} focus={['crank', 'piston']} />
				<HudLine path={ringPath(CRANK, interpolate(p, [0.1, 0.4], [0.2, 0.75], clamp), true)} closed grow={1} r={0.04} />
				{p > 0.55 && <TopMarks k={0} />}
			</Stage>
			<Callout cam={cam} at={CRANK} label="Multi-link" from={0.12} to={0.5} />
			<Callout cam={cam} at={[0, TDC_HIGH, 1.1]} label={lang === 'id' ? 'Posisi atas piston' : 'Piston top position'} from={0.6} to={0.97} />
		</>
	);
};

const Actuator = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-3.4, 2.6, 7], look: [-0.8, 1, 0.6]},
		{t: 0.5, pos: [-2.8, 2.6, 6.4], look: [-0.8, 1, 0.6]},
		{t: 0.55, pos: [3.6, 5, 8.6], look: [0, 3.8, 0], cut: true},
		{t: 1, pos: [3, 4.9, 7.9], look: [0, 3.9, 0]},
	]);
	const k = interpolate(p, [0.55, 0.9], [0, 1], clamp);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * 500, sec)} focus={['crank']} />
				<HudLine path={[[-2.6, 0.7, 0.6], [-1.3, 0.7, 0.6], [0, 0.7, 0.6]]} grow={interpolate(p, [0.05, 0.45], [0, 1], clamp)} arrow />
				<TopMarks k={k} />
			</Stage>
			<Callout cam={cam} at={[-2.6, 0.7, 0.6]} label={lang === 'id' ? 'Motor aktuator' : 'Actuator motor'} from={0.1} to={0.5} />
			<Callout cam={cam} at={[0, TDC_LOW, 1.1]} label={lang === 'id' ? 'Berhenti lebih rendah' : 'Stops lower'} from={0.62} to={0.97} />
		</>
	);
};

const Ratio = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.35, 0.75, 0.3);
	const k = interpolate(r.q, [0.35, 0.65], [0, 1], clamp);
	const cam = pullBack([
		{t: 0, pos: [0.5, 5.8, 9.4], look: [0, 4.4, 0]},
		{t: 0.5, pos: [0.4, 5.6, 8.6], look: [0, 4.5, 0]},
		{t: 0.55, pos: [4.2, 4.6, 7.6], look: [0, 4.4, 0], cut: true},
		{t: 1, pos: [3.6, 4.5, 7], look: [0, 4.5, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * (500 + 900 * k), sec)} focus={['piston']} />
				<TopMarks k={k} />
			</Stage>
			<Readout label={lang === 'id' ? 'KOMPRESI' : 'COMPRESSION'} from={14} to={8} unit=": 1" at={[0.4, 0.7]} />
			<Callout cam={cam} at={[0, TDC_HIGH, 1.1]} label={lang === 'id' ? 'Santai: irit' : 'Cruise: efficient'} from={0.08} to={0.4} />
			<Callout cam={cam} at={[0, TDC_LOW, 1.1]} label={lang === 'id' ? 'Turbo: tenaga' : 'Boost: power'} from={0.7} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const World = ({lang}: SceneProps) => {
	const {sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-9, 7, 22], look: [0.5, 1.5, 0]},
		{t: 0.5, pos: [-7, 6.5, 20], look: [1, 1.6, 0]},
		{t: 0.55, pos: [7, 4.4, 9], look: [2.7, 1.8, 1.5], cut: true},
		{t: 1, pos: [6.2, 4.2, 8], look: [2.7, 1.9, 1.5]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Car rotation={[0, -0.5, 0]} xray color="#3d4a57" wheel={sec * 3}>
					<Engine s={cycleState(sec * 1000, sec)} valves={false} focus={['piston']} />
				</Car>
			</Stage>
			<Callout cam={cam} at={[-0.3, 3.6, -0.2]} label="Infiniti QX50" from={0.1} to={0.5} />
			<Callout cam={cam} at={ENGINE_IN_CAR} label={lang === 'id' ? 'Pertama di dunia' : 'World first'} from={0.6} to={0.97} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [9, 6.5, 24], look: [1.2, 1.6, 0]}, {t: 1, pos: [12, 7, 27], look: [1.5, 1.8, 0]}])}>
				<Car rotation={[0, -0.5, 0]} xray color="#3d4a57">
					<Engine s={cycleState(sec * 1000, sec)} valves={false} />
				</Car>
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 033'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 033']}} />
		</>
	);
};

export default [Hook, Squeeze, MultiLink, Actuator, Ratio, World, Finale];
