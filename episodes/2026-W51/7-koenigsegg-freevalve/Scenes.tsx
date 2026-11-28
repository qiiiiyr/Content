import {interpolate} from 'remotion';
import {Car, Engine, HudLine, Readout, Stage, cycleState, pullBack, ringPath, useScene, type EngineState} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Koenigsegg Tiny Friendly Giant with Freevalve: no camshaft, one pneumatic-hydraulic-electric actuator per valve.
// Animation language: docs/styles.md.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ENGINE_IN_CAR: V3 = [2.72, 2.2, 1.49]; // engine bay of the car below (rotated -0.5)
const CAM_LINE: V3[] = [[-1.6, 7.05, 0], [0, 7.05, 0], [1.6, 7.05, 0]]; // where a camshaft would sit, over the valves
const ACT_IN: V3 = [-0.45, 7.1, 0];
const ACT_EX: V3 = [0.45, 7.1, 0];

/** Valves set by the computer, not by a cam: each opens at its own time and lift. */
const free = (deg: number, sec: number, lift: number): EngineState => {
	const s = cycleState(deg, sec);
	return {...s, intake: (s.intake ?? 0) * lift, exhaust: (s.exhaust ?? 0) * (1.2 - lift * 0.4)};
};

const Actuators = ({grow}: {grow: number}) => (
	<>
		<HudLine path={ringPath(ACT_IN, 0.24, true)} closed grow={grow} r={0.035} />
		<HudLine path={ringPath(ACT_EX, 0.24, true)} closed grow={grow} r={0.035} />
	</>
);

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [10, 6.5, 24], look: [1.2, 1.6, 0]},
		{t: 0.4, pos: [8.6, 6, 21], look: [1.6, 1.8, 0]},
		{t: 0.45, pos: [3.4, 7, 9], look: [0, 5.6, 0], cut: true},
		{t: 1, pos: [2.6, 6.8, 7.8], look: [0, 5.7, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				{p < 0.45 ? (
					<Car rotation={[0, -0.5, 0]} xray color="#e0e3e6">
						<Engine s={cycleState(sec * 1300, sec)} valves={false} />
					</Car>
				) : (
					<>
						<Engine s={cycleState(sec * 1300, sec)} focus={['intake', 'exhaust']} />
						<Actuators grow={interpolate(p, [0.5, 0.8], [0, 1], clamp)} />
					</>
				)}
			</Stage>
			<Callout cam={cam} at={ENGINE_IN_CAR} label="Koenigsegg TFG" from={0.05} to={0.43} />
			<Callout cam={cam} at={[0, 7.05, 0]} label={lang === 'id' ? 'Tanpa noken as' : 'No camshaft'} from={0.55} to={0.97} />
			<Readout label={lang === 'id' ? 'TENAGA' : 'POWER'} from={0} to={600} unit=" HP" at={[0.5, 0.95]} />
		</>
	);
};

const Camshaft = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [4.4, 6.4, 9.5], look: [0, 5.6, 0]},
		{t: 0.5, pos: [3.6, 6.2, 8.6], look: [0, 5.7, 0]},
		{t: 0.52, pos: [-3.2, 7.6, 6.6], look: [0, 6.4, 0], cut: true},
		{t: 1, pos: [-2.6, 7.4, 6], look: [0, 6.4, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(200 + p * 900, sec)} focus={['intake', 'exhaust']} />
				<HudLine path={CAM_LINE} grow={interpolate(p, [0.05, 0.4], [0, 1], clamp)} r={0.09} />
			</Stage>
			<Callout cam={cam} at={[1.2, 7.05, 0]} label={lang === 'id' ? 'Noken as' : 'Camshaft'} from={0.1} to={0.5} />
			<Callout cam={cam} at={[0, 7.05, 0]} label={lang === 'id' ? 'Jadwal tetap' : 'Fixed schedule'} from={0.55} to={0.97} />
		</>
	);
};

const Freevalve = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-2.8, 7.4, 6.4], look: [0, 6.6, 0]},
		{t: 0.5, pos: [-2.2, 7.2, 5.8], look: [0, 6.6, 0]},
		{t: 0.52, pos: [3, 6.4, 7.4], look: [0, 6, 0], cut: true},
		{t: 1, pos: [2.5, 6.3, 6.8], look: [0, 6.1, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={free(300 + p * 900, sec, 1)} focus={['intake', 'exhaust']} />
				<HudLine path={CAM_LINE} grow={interpolate(p, [0, 0.3], [1, 0], clamp)} r={0.09} />
				<Actuators grow={interpolate(p, [0.25, 0.6], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={ACT_IN} label={lang === 'id' ? 'Aktuator' : 'Actuator'} from={0.35} to={0.97} side="left" />
			<Callout cam={cam} at={ACT_EX} label={lang === 'id' ? 'Aktuator' : 'Actuator'} from={0.45} to={0.97} side="right" />
		</>
	);
};

const Decides = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.35, 0.8, 0.3);
	const cam = pullBack([
		{t: 0, pos: [2.6, 6, 6.6], look: [0, 5.5, 0]},
		{t: 0.5, pos: [2, 5.9, 6], look: [0, 5.5, 0]},
		{t: 0.55, pos: [-3.6, 5.2, 8], look: [0, 5, 0], cut: true},
		{t: 1, pos: [-3, 5.1, 7.3], look: [0, 5.1, 0]},
	]);
	const lift = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(r.q * Math.PI * 4));
	return (
		<>
			<Stage cam={cam}>
				<Engine s={free(r.q * 1440, sec, lift)} focus={['intake', 'exhaust']} />
				<Actuators grow={1} />
			</Stage>
			<Callout cam={cam} at={[-0.45, 5.1, 0.3]} label={lang === 'id' ? 'Kapan · seberapa · berapa lama' : 'When · how far · how long'} from={0.1} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Gemera = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-9, 7, 22], look: [0.5, 1.5, 0]},
		{t: 0.5, pos: [-7, 6.5, 20], look: [1, 1.6, 0]},
		{t: 0.55, pos: [7, 4.4, 9], look: [2.7, 1.8, 1.5], cut: true},
		{t: 1, pos: [6.2, 4.2, 8], look: [2.7, 1.9, 1.5]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Car rotation={[0, -0.5, 0]} xray color="#e0e3e6" wheel={sec * 3}>
					<Engine s={cycleState(sec * 1300, sec)} valves={false} focus={['head', 'piston']} />
				</Car>
			</Stage>
			<Callout cam={cam} at={[-0.3, 3.6, -0.2]} label={lang === 'id' ? 'Gemera · 4 kursi' : 'Gemera · 4 seats'} from={0.1} to={0.5} />
			<Callout cam={cam} at={ENGINE_IN_CAR} label="2.0 L twin-turbo" from={0.6} to={0.97} />
		</>
	);
};

const Throttle = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-4.4, 5.6, 8.4], look: [-0.6, 5.2, 0]},
		{t: 0.5, pos: [-3.7, 5.5, 7.7], look: [-0.6, 5.2, 0]},
		{t: 0.55, pos: [3.2, 7, 7.6], look: [0, 6.2, 0], cut: true},
		{t: 1, pos: [2.7, 6.8, 7], look: [0, 6.2, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={free(sec * 500, sec, 0.6)} focus={['intake']} />
				<Actuators grow={1} />
			</Stage>
			<Callout cam={cam} at={[-0.45, 5.15, 0.2]} label={lang === 'id' ? 'Katup = gas' : 'Valve = throttle'} from={0.1} to={0.5} />
			<Callout cam={cam} at={ACT_IN} label={lang === 'id' ? 'Tanpa throttle body' : 'No throttle body'} from={0.6} to={0.97} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [9, 6.5, 24], look: [1.2, 1.6, 0]}, {t: 1, pos: [12, 7, 27], look: [1.5, 1.8, 0]}])}>
				<Car rotation={[0, -0.5, 0]} xray color="#e0e3e6">
					<Engine s={cycleState(sec * 1300, sec)} valves={false} />
				</Car>
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 029'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 029']}} />
		</>
	);
};

export default [Hook, Camshaft, Freevalve, Decides, Gemera, Throttle, Finale];
