import {interpolate} from 'remotion';
import * as THREE from 'three';
import {Engine, Stage, Stream, cycleState, useScene, type CamKey, type EngineState} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const air = new THREE.Color('#dfeefa');
const hot = new THREE.Color('#ff9a5a');
const mod = (deg: number) => ((deg % 720) + 720) % 720;

// diesel: pure air in, air heats as it is squeezed, no spark; the plug on the head is the injector here
const diesel = (deg: number, sec: number): EngineState => {
	const d = mod(deg);
	const s = {...cycleState(deg, sec), spark: 0};
	if (d < 180) s.gas = '#' + air.getHexString();
	else if (d < 360) {
		const k = (d - 180) / 180;
		Object.assign(s, {gas: '#' + air.clone().lerp(hot, k * k).getHexString(), gasGlow: k * k * 0.35});
	} else if (d < 372) s.gasGlow = 0.35;
	return s;
};

// fuel spray from the injector tip, a short burst around top dead centre
const Spray = ({deg, sec}: {deg: number; sec: number}) => {
	const d = mod(deg);
	if (d < 340 || d > 380) return null;
	return (
		<>
			{[-0.6, 0, 0.6].map((dx) => (
				<Stream key={dx} path={[[0, 5.1, 0.5], [dx, 4.6, 0.4]]} t={sec * 3} n={6} size={0.07} color="#ffe08a" />
			))}
		</>
	);
};

const Diesel = ({cam, from, to, glowPlug = 0}: {cam: CamKey[]; from: number; to: number; glowPlug?: number}) => {
	const {p, sec} = useScene();
	const deg = from + (to - from) * p;
	return (
		<Stage cam={cam}>
			<Engine s={diesel(deg, sec)} />
			<Spray deg={deg} sec={sec} />
			{glowPlug > 0 && (
				<>
					<mesh position={[0.5, 4.95, -0.4]}>
						<cylinderGeometry args={[0.06, 0.06, 0.6, 12]} />
						<meshStandardMaterial color="#ff7a2a" emissive="#ff5a10" emissiveIntensity={glowPlug * 4} />
					</mesh>
					<pointLight position={[0.5, 4.6, 0]} color="#ff7a2a" intensity={glowPlug * 15} distance={4} />
				</>
			)}
		</Stage>
	);
};

const Hook = () => <Diesel from={300} to={300 + 1440} cam={[{t: 0, pos: [0, 5, 22], look: [0, 3, 0]}, {t: 1, pos: [-2, 5.6, 11], look: [0, 3.4, 0]}]} />;
const AirIn = () => <Diesel from={0} to={360} cam={[{t: 0, pos: [4, 6.5, 10], look: [0, 3.8, 0]}, {t: 1, pos: [-3, 4.6, 9], look: [0, 3.2, 0]}]} />;
const Heat = () => <Diesel from={250} to={355} cam={[{t: 0, pos: [3, 4, 8], look: [0, 3.6, 0]}, {t: 1, pos: [1.5, 5.4, 6.5], look: [0, 4.2, 0]}]} />;
const Inject = () => <Diesel from={330} to={460} cam={[{t: 0, pos: [-2, 6.4, 6.5], look: [0, 4.4, 0]}, {t: 1, pos: [2, 4.6, 9], look: [0, 3.6, 0]}]} />;

// petrol, squeezed too hard: the mix flashes before the spark (knock)
const Knock = () => {
	const {p, sec} = useScene();
	const deg = 200 + p * 340;
	const s = cycleState(deg, sec);
	const early = Math.max(0, 1 - Math.abs(mod(deg) - 320) / 10);
	return (
		<Stage cam={[{t: 0, pos: [-4, 4.6, 9], look: [0, 3.6, 0]}, {t: 1, pos: [-2, 5.6, 8], look: [0, 4, 0]}]}>
			<Engine s={early > 0 ? {...s, gas: '#ff6a2a', gasGlow: early} : s} />
		</Stage>
	);
};

const Cold = () => {
	const {p} = useScene();
	return <Diesel from={180} to={250} glowPlug={interpolate(p, [0.1, 0.4], [0, 1], clamp)} cam={[{t: 0, pos: [3, 6.8, 7], look: [0, 4.4, 0]}, {t: 1, pos: [2, 5.6, 6], look: [0, 4.4, 0]}]} />;
};

const Finale = () => (
	<>
		<Diesel from={0} to={2160} cam={[{t: 0, pos: [0, 4, 22], look: [0, 1.6, 0]}, {t: 1, pos: [0, 4.6, 27], look: [0, 1.6, 0]}]} />
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 006'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 006']}} />
	</>
);

export default [Hook, AirIn, Heat, Inject, Knock, Cold, Finale];
