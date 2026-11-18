import * as THREE from 'three';
import {Engine, Stage, Stream, cycleState, useScene, type CamKey, type EngineState} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

const teal = new THREE.Color('#7fd6e0');
const fire = new THREE.Color('#ff8a1f');
const hex = (c: THREE.Color) => '#' + c.getHexString();

// two-stroke: fires every turn (360 degrees); ports open near the bottom, no valves
const twoStroke = (deg: number): EngineState => {
	const d = ((deg % 360) + 360) % 360;
	const spark = Math.max(0, 1 - Math.min(d, 360 - d) / 12);
	if (d < 110) return {crank: deg, spark, gas: hex(fire), gasGlow: 1 - d / 140};
	if (d < 250) return {crank: deg, gas: hex(fire.clone().lerp(teal, (d - 110) / 80)), gasGlow: 0};
	return {crank: deg, spark, gas: hex(teal.clone().lerp(fire, ((d - 250) / 110) * 0.4)), gasGlow: ((d - 250) / 110) * 0.3};
};
const portsOpen = (deg: number) => {
	const d = ((deg % 360) + 360) % 360;
	return d > 110 && d < 250;
};

// ports: exhaust on the right, transfer port on the left fed from the crankcase below
const Ports = ({open, sec}: {open: boolean; sec: number}) => (
	<>
		{[1, -1].map((s) => (
			<mesh key={s} position={[s * 1.0, 3.35, 0]}>
				<boxGeometry args={[0.08, 0.5, 0.7]} />
				<meshStandardMaterial color={s > 0 ? '#3a3f47' : '#2f6f78'} emissive={s > 0 ? '#ff8a1f' : '#7fd6e0'} emissiveIntensity={open ? 1.2 : 0.1} />
			</mesh>
		))}
		{open && <Stream path={[[0.2, 3.6, 0.3], [1.2, 3.4, 0.3], [2.6, 3.6, 0.3]]} t={sec} n={10} color="#8a9099" glow={0} size={0.14} opacity={0.7} />}
		{open && <Stream path={[[-1.5, 1.0, 0.3], [-1.4, 3.3, 0.3], [-0.2, 4.6, 0.3]]} t={sec} n={12} />}
	</>
);

const Two = ({cam, from, to}: {cam: CamKey[]; from: number; to: number}) => {
	const {p, sec} = useScene();
	const deg = from + (to - from) * p;
	return (
		<Stage cam={cam}>
			<Engine valves={false} s={twoStroke(deg)} />
			<Ports open={portsOpen(deg)} sec={sec} />
		</Stage>
	);
};

// side by side at the same crank speed: four-stroke left, two-stroke right
const Hook = () => {
	const {p, sec} = useScene();
	const deg = p * 1440;
	return (
		<Stage cam={[{t: 0, pos: [0, 4, 24], look: [0, 2.2, 0]}, {t: 1, pos: [0, 3.6, 18], look: [0, 2.2, 0]}]}>
			<Engine x={-2.4} scale={0.7} s={cycleState(deg, sec)} />
			<Engine x={2.4} scale={0.7} valves={false} s={twoStroke(deg)} />
		</Stage>
	);
};

const Ported = () => <Two from={60} to={200} cam={[{t: 0, pos: [5, 5.5, 9], look: [0, 3.2, 0]}, {t: 1, pos: [3, 3.8, 8], look: [0.4, 3, 0]}]} />;
const Up = () => <Two from={190} to={355} cam={[{t: 0, pos: [-4, 3, 9], look: [0, 2.6, 0]}, {t: 1, pos: [-3, 5.4, 8], look: [0, 3.8, 0]}]} />;
const Bang = () => <Two from={350} to={460} cam={[{t: 0, pos: [2, 6.4, 7], look: [0, 4.4, 0]}, {t: 1, pos: [0, 4, 10], look: [0, 3.2, 0]}]} />;
const Scavenge = () => <Two from={100} to={260} cam={[{t: 0, pos: [-1, 4, 7], look: [0, 3.2, 0]}, {t: 1, pos: [1.5, 3.8, 6.5], look: [0, 3, 0]}]} />;
const Power = () => <Two from={0} to={1440} cam={[{t: 0, pos: [4, 4.5, 12], look: [0, 3, 0]}, {t: 1, pos: [-4, 4.5, 12], look: [0, 3, 0]}]} />;
const Dirty = () => <Two from={100} to={250} cam={[{t: 0, pos: [6, 4.4, 7], look: [1, 3.4, 0]}, {t: 1, pos: [4, 3.6, 5.5], look: [1, 3.4, 0]}]} />;

const Finale = () => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={[{t: 0, pos: [0, 4, 22], look: [0, 1.6, 0]}, {t: 1, pos: [0, 4.6, 27], look: [0, 1.6, 0]}]}>
				<Engine x={-2.4} scale={0.7} s={cycleState(p * 1440, sec)} />
				<Engine x={2.4} scale={0.7} valves={false} s={twoStroke(p * 1440)} />
			</Stage>
			<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 008'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 008']}} />
		</>
	);
};

export default [Hook, Ported, Up, Bang, Scavenge, Power, Dirty, Finale];
