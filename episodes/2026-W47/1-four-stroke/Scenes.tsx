import {Engine, Stage, cycleState, pistonY, useScene, type CamKey} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Animation language (docs/styles.md): each scene has 2-3 shots (cut: true), the part being named glows while the rest
// turns see-through, a label is pinned to it, and the key moment runs in slow motion with a tag.
// Points on the engine, in world units (engine base at y=1.2, head at y=5.2).
const INTAKE: [number, number, number] = [-0.45, 5.75, 0];
const EXHAUST: [number, number, number] = [0.45, 5.75, 0];
const PLUG: [number, number, number] = [0, 6.25, 0.5];
const CRANK: [number, number, number] = [0, 1.2, 0.35];
const crown = (deg: number): [number, number, number] => [0.95, 1.2 + pistonY(deg) + 0.25, 0.3];

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	// cold open: the engine flies together while it is already running, then a macro on the spark
	const explode = Math.max(0, 1 - p / 0.38) ** 2;
	const cam: CamKey[] = [
		{t: 0, pos: [3, 7, 26], look: [0, 3.6, 0]},
		{t: 0.5, pos: [1.5, 5, 15], look: [0, 3.8, 0]},
		{t: 0.55, pos: [3.2, 7.4, 9], look: [0, 5.2, 0.3], cut: true},
		{t: 1, pos: [2.4, 7, 8], look: [0, 5.1, 0.3]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(p * 2160 + 300, sec)} explode={explode} focus={p > 0.55 ? ['spark'] : undefined} />
			</Stage>
			<Callout cam={cam} at={PLUG} label={lang === 'id' ? 'Busi' : 'Spark plug'} from={0.6} to={1} />
		</>
	);
};

const Stroke = ({from, to, cam, focus, label, at, slow, lang}: {from: number; to: number; cam: CamKey[]; focus: string[]; label: string; at: [number, number, number] | ((p: number) => [number, number, number]); slow?: [number, number]; lang: SceneProps['lang']}) => {
	const {p, sec} = useScene();
	const r = slow ? ramp(p, slow[0], slow[1], 0.22) : {q: p, slow: false};
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(from + (to - from) * r.q, sec)} focus={focus} />
			</Stage>
			<Callout cam={cam} at={typeof at === 'function' ? (pp) => at(slow ? ramp(pp, slow[0], slow[1], 0.22).q : pp) : at} label={label} from={0.12} to={0.92} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Intake = ({lang}: SceneProps) => (
	<Stroke
		lang={lang}
		from={0}
		to={180}
		focus={['intake']}
		label={lang === 'id' ? 'Katup masuk' : 'Intake valve'}
		at={INTAKE}
		cam={[
			{t: 0, pos: [-4, 7.5, 9.5], look: [-0.3, 5, 0]},
			{t: 0.45, pos: [-3.2, 7, 8.5], look: [-0.3, 4.8, 0]},
			{t: 0.5, pos: [3.5, 4.5, 10], look: [0, 3.8, 0], cut: true},
			{t: 1, pos: [2.5, 4, 9], look: [0, 3.4, 0]},
		]}
	/>
);

const Compression = ({lang}: SceneProps) => (
	<Stroke
		lang={lang}
		from={180}
		to={360}
		focus={['piston']}
		label={lang === 'id' ? 'Piston' : 'Piston'}
		at={(p) => crown(180 + 180 * p)}
		cam={[
			{t: 0, pos: [-4, 3, 9], look: [0, 3, 0]},
			{t: 0.5, pos: [-3, 4.5, 8], look: [0, 4, 0]},
			{t: 0.55, pos: [2.5, 6.2, 8.5], look: [0, 4.4, 0], cut: true},
			{t: 1, pos: [2, 6, 7.8], look: [0, 4.4, 0]},
		]}
	/>
);

// The bang is the key moment: it runs slow (with the tag) right after the spark, then the piston is shoved down.
const Power = ({lang}: SceneProps) => (
	<Stroke
		lang={lang}
		from={360}
		to={540}
		slow={[0.05, 0.5]}
		focus={['spark', 'piston']}
		label={lang === 'id' ? 'Busi memercik' : 'Spark'}
		at={PLUG}
		cam={[
			{t: 0, pos: [3, 7, 8.5], look: [0, 4.8, 0]},
			{t: 0.5, pos: [2.4, 6.4, 8], look: [0, 4.4, 0]},
			{t: 0.55, pos: [0, 3.4, 12], look: [0, 3, 0], cut: true},
			{t: 1, pos: [0, 3, 10.5], look: [0, 2.8, 0]},
		]}
	/>
);

const Exhaust = ({lang}: SceneProps) => (
	<Stroke
		lang={lang}
		from={540}
		to={720}
		focus={['exhaust']}
		label={lang === 'id' ? 'Katup buang' : 'Exhaust valve'}
		at={EXHAUST}
		cam={[
			{t: 0, pos: [4, 7.5, 9.5], look: [0.3, 5, 0]},
			{t: 0.5, pos: [3.2, 7, 8.5], look: [0.3, 4.8, 0]},
			{t: 0.55, pos: [-3, 8.5, 9], look: [0, 5, 0], cut: true},
			{t: 1, pos: [-2.5, 8, 8], look: [0, 4.6, 0]},
		]}
	/>
);

const Crank = ({lang}: SceneProps) => (
	<Stroke
		lang={lang}
		from={0}
		to={720}
		focus={['crank', 'piston']}
		label={lang === 'id' ? 'Poros engkol' : 'Crankshaft'}
		at={CRANK}
		cam={[
			{t: 0, pos: [5, 2, 8], look: [0, 1.4, 0]},
			{t: 0.45, pos: [4, 2.6, 7], look: [0, 1.6, 0]},
			{t: 0.5, pos: [0, 4.5, 16], look: [0, 3.2, 0], cut: true},
			{t: 1, pos: [0, 4.2, 13], look: [0, 3.2, 0]},
		]}
	/>
);

const Finale = () => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={[{t: 0, pos: [0, 4, 28], look: [0, 1.6, 0]}, {t: 1, pos: [0, 4.5, 34], look: [0, 1.6, 0]}]}>
				{[0, 180, 360, 540].map((o, i) => (
					<Engine key={o} x={(i - 1.5) * 2.5} scale={0.45} s={cycleState(p * 2880 + o, sec)} />
				))}
			</Stage>
			<PaperTag at={0.45} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 001'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 001']}} />
		</>
	);
};

export default [Hook, Intake, Compression, Power, Exhaust, Crank, Finale];
