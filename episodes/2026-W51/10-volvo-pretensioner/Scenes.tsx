import {interpolate} from 'remotion';
import {Car, Gear, HudLine, Stage, pullBack, ringPath, useScene} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Volvo belt pretensioner: the crash sensor fires a small gas charge that winds in the belt's slack, so the occupant
// is held tight before being thrown forward. Car unrotated: front toward +x, driver seat at z = +0.9.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SHOULDER: V3 = [-1.25, 3.75, 1.42];
const BUCKLE: V3 = [-0.2, 2.35, 0.48];
const LAP: V3 = [-0.2, 2.35, 1.36];
const RETRACTOR: V3 = [-1.3, 1.55, 1.45];
const SENSOR: V3 = [4.6, 1.8, 0];

/** The three-point belt; `slack` 0..1 bows the diagonal away from the seat. */
const beltPath = (slack: number): V3[] => [RETRACTOR, SHOULDER, [-0.55 + slack * 0.55, 3.05, 1.0], BUCKLE, LAP];

const Cabin = ({slack, wheel = 0}: {slack: number; wheel?: number}) => (
	<>
		<Car xray color="#2c4a6b" wheel={wheel} />
		<HudLine path={beltPath(slack)} grow={1} r={0.06} />
	</>
);

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [10, 6.5, 22], look: [0, 1.8, 0]},
		{t: 0.42, pos: [8.5, 6, 20], look: [0, 1.9, 0]},
		{t: 0.46, pos: [3.4, 4.6, 6.4], look: [-0.7, 2.9, 1], cut: true},
		{t: 1, pos: [2.9, 4.5, 5.8], look: [-0.7, 2.9, 1]},
	]);
	const slack = p < 0.6 ? 1 : interpolate(p, [0.6, 0.7], [1, 0], clamp);
	return (
		<>
			<Stage cam={cam}>
				<Cabin slack={slack} wheel={p < 0.46 ? sec * 3 : 0} />
			</Stage>
			<Callout cam={cam} at={[0, 3.4, 0]} label="Volvo" from={0.05} to={0.44} />
			<Callout cam={cam} at={SHOULDER} label={lang === 'id' ? 'Narik ke belakang' : 'Pulls you back'} from={0.66} to={0.97} />
		</>
	);
};

const Sensor = ({lang}: SceneProps) => {
	const {p} = useScene();
	const cam = pullBack([
		{t: 0, pos: [9, 5.5, 12], look: [1.5, 1.8, 0.5]},
		{t: 0.5, pos: [8, 5.3, 11], look: [1.5, 1.8, 0.5]},
		{t: 0.55, pos: [1.6, 3.4, 6.4], look: [-1.1, 2, 1.2], cut: true},
		{t: 1, pos: [1.2, 3.3, 5.9], look: [-1.1, 2, 1.2]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Cabin slack={p < 0.7 ? 1 : 0} />
				<HudLine path={[SENSOR, [1.5, 1.3, 1.2], RETRACTOR]} grow={interpolate(p, [0.1, 0.6], [0, 1], clamp)} arrow />
			</Stage>
			<Callout cam={cam} at={SENSOR} label={lang === 'id' ? 'Sensor tabrakan' : 'Crash sensor'} from={0.08} to={0.5} />
			<Callout cam={cam} at={RETRACTOR} label="Pretensioner" from={0.6} to={0.97} />
		</>
	);
};

const Charge = ({lang}: SceneProps) => {
	const {p} = useScene();
	const r = ramp(p, 0.25, 0.75, 0.3);
	const wind = interpolate(r.q, [0.3, 0.9], [0, 1], clamp);
	const cam = pullBack([
		{t: 0, pos: [3.4, 4.4, 6.4], look: [0, 3.2, 0]},
		{t: 0.5, pos: [2.8, 4.2, 5.8], look: [0, 3.2, 0]},
		{t: 0.55, pos: [-3, 3.8, 5.6], look: [0, 3.4, 0], cut: true},
		{t: 1, pos: [-2.6, 3.7, 5.1], look: [0, 3.4, 0]},
	]);
	const burst = interpolate(r.q, [0.2, 0.45], [0.1, 1.5], clamp);
	return (
		<>
			<Stage cam={cam}>
				<Gear r={1.1} teeth={14} width={0.6} angle={-wind * 7} position={[0, 3, 0]} />
				<HudLine path={[[1.1, 3, 0], [1.1, 4.6, 0], [1.1, 6.4, 0]]} grow={1 - wind * 0.45} r={0.08} />
				{r.q > 0.2 && r.q < 0.6 && <HudLine path={ringPath([-1.8, 2.2, 0.4], burst, true)} closed grow={1} r={0.04} />}
			</Stage>
			<Callout cam={cam} at={[-1.8, 2.2, 0.4]} label={lang === 'id' ? 'Muatan gas' : 'Gas charge'} from={0.15} to={0.55} />
			<Callout cam={cam} at={[0, 3, 0.4]} label={lang === 'id' ? 'Gulungan narik' : 'Spool winds in'} from={0.6} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const NoSlack = ({lang}: SceneProps) => {
	const {p} = useScene();
	const cam = pullBack([
		{t: 0, pos: [2.6, 3.8, 5.2], look: [-0.7, 3, 1.1]},
		{t: 0.5, pos: [2.2, 3.7, 4.8], look: [-0.7, 3, 1.1]},
		{t: 0.55, pos: [1.8, 6, 7], look: [-0.6, 2.8, 0.8], cut: true},
		{t: 1, pos: [1.5, 5.8, 6.4], look: [-0.6, 2.8, 0.8]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Cabin slack={interpolate(p, [0.1, 0.4], [1, 0], clamp)} />
			</Stage>
			<Callout cam={cam} at={[-0.55, 3.05, 1.0]} label={lang === 'id' ? 'Nggak ada kendor' : 'No slack'} from={0.4} to={0.97} />
		</>
	);
};

const Invented = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-9, 6.5, 20], look: [0, 1.8, 0]},
		{t: 0.5, pos: [-7.4, 6, 18], look: [0, 1.9, 0]},
		{t: 0.55, pos: [3.6, 5, 7], look: [-0.7, 2.9, 1], cut: true},
		{t: 1, pos: [3.1, 4.9, 6.4], look: [-0.7, 2.9, 1]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Cabin slack={0} wheel={p < 0.55 ? sec * 2 : 0} />
			</Stage>
			<Callout cam={cam} at={[0, 3.4, 0]} label={lang === 'id' ? 'Volvo · sejak 1959' : 'Volvo · since 1959'} from={0.08} to={0.5} />
			<Callout cam={cam} at={BUCKLE} label={lang === 'id' ? 'Tiga titik' : 'Three points'} from={0.6} to={0.97} />
		</>
	);
};

const Replace = ({lang}: SceneProps) => {
	const {p} = useScene();
	const cam = pullBack([
		{t: 0, pos: [3, 4.2, 6], look: [-0.8, 2.7, 1.1]},
		{t: 0.5, pos: [2.5, 4.1, 5.5], look: [-0.8, 2.7, 1.1]},
		{t: 0.55, pos: [-2.6, 5, 6.6], look: [-0.8, 2.8, 1.1], cut: true},
		{t: 1, pos: [-2.2, 4.9, 6.1], look: [-0.8, 2.8, 1.1]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Cabin slack={0} />
				<HudLine path={ringPath(RETRACTOR, interpolate(p, [0.1, 0.5], [0.1, 0.45], clamp), true)} closed grow={1} r={0.03} />
			</Stage>
			<Callout cam={cam} at={RETRACTOR} label={lang === 'id' ? 'Ganti setelah tabrakan' : 'Replace after a crash'} from={0.15} to={0.97} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [10, 6.5, 22], look: [0, 1.8, 0]}, {t: 1, pos: [12.5, 7, 25], look: [0, 1.9, 0]}])}>
				<Cabin slack={0} wheel={sec * 3} />
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'SAFETY LAB', 'No. 032'], id: ['BONGKAR PASANG', 'LAB KESELAMATAN', 'No. 032']}} />
		</>
	);
};

export default [Hook, Sensor, Charge, NoSlack, Invented, Replace, Finale];
