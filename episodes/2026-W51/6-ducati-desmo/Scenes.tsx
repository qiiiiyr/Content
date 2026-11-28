import {interpolate} from 'remotion';
import {Engine, HudLine, Stage, cycleState, pullBack, ringPath, useScene, type EngineState} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Ducati Desmodromic: a second cam lobe and a closing rocker pull each valve shut instead of leaving it to a spring.
// Animation language: docs/styles.md.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const IN_HEAD: V3 = [-0.45, 5.15, 0.2]; // intake valve head (engine at the origin)
const IN_SPRING: V3 = [-0.45, 5.75, 0.25];
const IN_TOP: V3 = [-0.45, 6.8, 0];

/** The intake valve driven straight from progress k: open, then forced shut. */
const valveAt = (k: number, sec: number): EngineState => ({...cycleState(60, sec), intake: Math.sin(Math.PI * Math.min(1, Math.max(0, k))), exhaust: 0, spark: 0});

/** The closing rocker's pull: an arrow from the valve head up past the spring. */
const Pull = ({grow}: {grow: number}) => <HudLine path={[[-0.95, 5.0, 0.4], [-0.95, 5.8, 0.4], [-0.95, 6.6, 0.4]]} grow={grow} arrow />;

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [5, 6, 12], look: [0, 3.6, 0]},
		{t: 0.45, pos: [4, 5.8, 10.5], look: [0, 3.8, 0]},
		{t: 0.5, pos: [-2.6, 6.4, 6.4], look: [-0.4, 5.6, 0], cut: true},
		{t: 1, pos: [-2, 6.2, 5.8], look: [-0.4, 5.7, 0]},
	]);
	const explode = interpolate(p, [0, 0.42], [1, 0], clamp);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * 900, sec)} explode={explode} focus={p > 0.5 ? ['intake', 'exhaust'] : undefined} />
			</Stage>
			<Callout cam={cam} at={IN_SPRING} label={lang === 'id' ? 'Per katup' : 'Valve spring'} from={0.55} to={0.97} />
		</>
	);
};

const Normal = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [3.2, 6, 8.5], look: [-0.3, 5.4, 0]},
		{t: 0.5, pos: [2.6, 5.8, 7.8], look: [-0.3, 5.5, 0]},
		{t: 0.52, pos: [-3.4, 5.2, 7], look: [-0.4, 5.4, 0], cut: true},
		{t: 1, pos: [-2.8, 5.1, 6.4], look: [-0.4, 5.5, 0]},
	]);
	const open = p < 0.5;
	return (
		<>
			<Stage cam={cam}>
				<Engine s={valveAt(p * 1.6, sec)} focus={['intake']} />
				{open ? (
					<HudLine path={[[-0.95, 7.2, 0.4], [-0.95, 6.2, 0.4], [-0.95, 5.3, 0.4]]} grow={interpolate(p, [0.05, 0.45], [0, 1], clamp)} arrow />
				) : (
					<HudLine path={[[-0.95, 5.0, 0.4], [-0.95, 5.9, 0.4]]} grow={interpolate(p, [0.55, 0.85], [0, 1], clamp)} arrow />
				)}
			</Stage>
			<Callout cam={cam} at={IN_TOP} label={lang === 'id' ? 'Noken as: buka' : 'Cam: open'} from={0.08} to={0.48} />
			<Callout cam={cam} at={IN_SPRING} label={lang === 'id' ? 'Per: tutup' : 'Spring: shut'} from={0.56} to={0.97} />
		</>
	);
};

const HighRevs = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-4.5, 4.4, 10], look: [0, 4, 0]},
		{t: 0.48, pos: [-3.6, 4.6, 9], look: [0, 4.2, 0]},
		{t: 0.5, pos: [2.4, 6.6, 6.2], look: [-0.3, 5.8, 0], cut: true},
		{t: 1, pos: [1.9, 6.4, 5.6], look: [-0.3, 5.8, 0]},
	]);
	// the cam's closing flank: steep, drawn as a curve the spring has to chase
	const curve: V3[] = Array.from({length: 12}, (_, i) => {
		const u = i / 11;
		return [-2.6 + u * 2, 7.4 - Math.pow(u, 0.35) * 1.4, 0.6];
	});
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(sec * 2600, sec)} focus={['intake', 'exhaust']} />
				<HudLine path={curve} grow={interpolate(p, [0.55, 0.9], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={IN_HEAD} label={lang === 'id' ? 'Putaran tinggi' : 'High revs'} from={0.08} to={0.46} />
			<Callout cam={cam} at={[-1.6, 6.2, 0.6]} label={lang === 'id' ? 'Nutup curam' : 'Steep closing'} from={0.62} to={0.97} />
		</>
	);
};

const ClosingRocker = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.3, 0.75, 0.3);
	const cam = pullBack([
		{t: 0, pos: [-3, 6.2, 6.8], look: [-0.4, 5.8, 0]},
		{t: 0.5, pos: [-2.4, 6, 6.2], look: [-0.4, 5.8, 0]},
		{t: 0.52, pos: [2.6, 5.4, 7.2], look: [-0.3, 5.5, 0], cut: true},
		{t: 1, pos: [2.1, 5.3, 6.6], look: [-0.3, 5.6, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={valveAt(r.q * 2 - 0.5, sec)} focus={['intake']} />
				<Pull grow={interpolate(r.q, [0.5, 0.85], [0, 1], clamp)} />
			</Stage>
			<Callout cam={cam} at={[-0.95, 6.2, 0.4]} label={lang === 'id' ? 'Pelatuk penutup' : 'Closing rocker'} from={0.5} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Desmo = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [0.5, 6.8, 9], look: [0, 5.4, 0]},
		{t: 0.5, pos: [0.4, 6.6, 8.2], look: [0, 5.5, 0]},
		{t: 0.55, pos: [5, 4.6, 9.5], look: [0, 4.4, 0], cut: true},
		{t: 1, pos: [4.4, 4.5, 8.6], look: [0, 4.5, 0]},
	]);
	const k = (p * 3) % 1;
	return (
		<>
			<Stage cam={cam}>
				<Engine s={{...valveAt(k, sec), exhaust: Math.sin(Math.PI * ((k + 0.5) % 1))}} focus={['intake', 'exhaust']} />
				<HudLine path={[[-0.95, 7.2, 0.4], [-0.95, 5.3, 0.4]]} grow={k < 0.5 ? k * 2 : 0} arrow />
				<HudLine path={[[0.95, 5.0, 0.4], [0.95, 6.6, 0.4]]} grow={k >= 0.5 ? (k - 0.5) * 2 : 0} arrow />
			</Stage>
			<Callout cam={cam} at={[0, 6.9, 0]} label="Desmodromic" from={0.15} to={0.97} />
		</>
	);
};

const Catch = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-2.4, 7, 5.6], look: [-0.45, 6.3, 0]},
		{t: 0.5, pos: [-1.9, 6.9, 5.1], look: [-0.45, 6.3, 0]},
		{t: 0.55, pos: [3.6, 5.6, 8.2], look: [0, 5, 0], cut: true},
		{t: 1, pos: [3.1, 5.5, 7.5], look: [0, 5.1, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={valveAt(0, sec)} focus={['intake', 'exhaust']} />
				<HudLine path={ringPath(IN_TOP, interpolate(p, [0.1, 0.5], [0.05, 0.3], clamp))} closed grow={p > 0.1 ? 1 : 0} r={0.03} />
			</Stage>
			<Callout cam={cam} at={IN_TOP} label={lang === 'id' ? 'Celah katup' : 'Valve clearance'} from={0.15} to={0.97} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [5, 6, 12], look: [0, 3.6, 0]}, {t: 1, pos: [6.5, 6.5, 14], look: [0, 3.6, 0]}])}>
				<Engine s={cycleState(sec * 900, sec)} focus={['intake', 'exhaust']} />
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 028'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 028']}} />
		</>
	);
};

export default [Hook, Normal, HighRevs, ClosingRocker, Desmo, Catch, Finale];
