// 3D miniature-diorama kit: a warm workbench, brass and dark-metal props, a slow macro camera.
// Episodes compose <Stage> with parts from here. Units are arbitrary; the engine is about 7 tall.
import {type ReactNode} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';

type V3 = [number, number, number];
export type CamKey = {t: number; pos: V3; look: V3}; // t = 0..1 progress through the scene, so the move always fits the narration

export const mat = {
	brass: {color: '#d4aa4f', metalness: 0.35, roughness: 0.4},
	steel: {color: '#a7aeb8', metalness: 0.3, roughness: 0.45},
	dark: {color: '#3a404a', metalness: 0.25, roughness: 0.55},
	wood: {color: '#a97c50', metalness: 0, roughness: 0.85},
	wall: {color: '#cbbfa6', metalness: 0, roughness: 0.95},
	red: {color: '#c0392b', metalness: 0.2, roughness: 0.4},
};

const ease = Easing.inOut(Easing.cubic);

/** Progress through the current scene (0..1) and its length in seconds. Scenes are timed by the narration, so animate with p. */
export const useScene = () => {
	const frame = useCurrentFrame();
	const {durationInFrames, fps} = useVideoConfig();
	return {p: Math.min(1, frame / Math.max(1, durationInFrames - 1)), sec: frame / fps};
};

const Camera = ({keys}: {keys: CamKey[]}) => {
	const cam = useThree((s) => s.camera);
	const t = useScene().p;
	const ts = keys.map((k) => k.t);
	const at = (pick: (k: CamKey) => V3) =>
		[0, 1, 2].map((i) => interpolate(t, ts, keys.map((k) => pick(k)[i]), {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	const [px, py, pz] = at((k) => k.pos);
	const [lx, ly, lz] = at((k) => k.look);
	cam.position.set(px, py, pz);
	cam.lookAt(lx, ly, lz);
	return null;
};

/** The set: wall, bench, lights, camera. Children sit on the bench at y=0. */
export const Stage = ({cam, children}: {cam: CamKey[]; children: ReactNode}) => (
	<ThreeCanvas width={1080} height={1920} shadows camera={{fov: 32, near: 0.1, far: 200}} style={{background: '#cbbfa6'}}>
		<Camera keys={cam} />
		<color attach="background" args={['#cbbfa6']} />
		<fog attach="fog" args={['#cbbfa6', 28, 60]} />
		<ambientLight intensity={0.9} />
		<hemisphereLight args={['#fff4de', '#6b4a2a', 0.7]} />
		<directionalLight position={[8, 14, 10]} intensity={2.2} color="#ffe2b0" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
		<pointLight position={[-6, 6, 6]} intensity={30} color="#9fd8d0" />
		{/* back wall with panel seams, like the reference's workshop */}
		<mesh position={[0, 8, -6]} receiveShadow>
			<planeGeometry args={[60, 40]} />
			<meshStandardMaterial {...mat.wall} />
		</mesh>
		{[-9, -3, 3, 9].map((x) => (
			<mesh key={x} position={[x, 8, -5.95]}>
				<boxGeometry args={[0.06, 40, 0.02]} />
				<meshStandardMaterial color="#9c917c" />
			</mesh>
		))}
		{/* bench */}
		<mesh position={[0, -0.25, 4]} receiveShadow>
			<boxGeometry args={[40, 0.5, 20]} />
			<meshStandardMaterial {...mat.wood} />
		</mesh>
		{children}
	</ThreeCanvas>
);

// ---- engine cutaway -------------------------------------------------------------------------------------------
const R = 0.9; // crank radius
const L = 2.6; // rod length
const HEAD = 4.0; // y of the cylinder head
export const pistonY = (deg: number) => {
	const a = (deg * Math.PI) / 180;
	return R * Math.cos(a) + Math.sqrt(L * L - R * R * Math.sin(a) ** 2);
};

export type EngineState = {
	crank: number; // degrees, 0 = top dead centre
	intake?: number; // valve opening 0..1
	exhaust?: number;
	gas?: THREE.ColorRepresentation; // colour of the gas in the cylinder
	gasGlow?: number; // 0..1
	spark?: number; // 0..1
	flow?: {kind: 'in' | 'out'; t: number}; // particles through a valve, t = seconds
};

const Rod = ({from, to, r = 0.12, material = mat.steel}: {from: V3; to: V3; r?: number; material?: object}) => {
	const a = new THREE.Vector3(...from);
	const b = new THREE.Vector3(...to);
	const mid = a.clone().add(b).multiplyScalar(0.5);
	const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
	return (
		<mesh position={mid} quaternion={q} castShadow>
			<cylinderGeometry args={[r, r, a.distanceTo(b), 20]} />
			<meshStandardMaterial {...material} />
		</mesh>
	);
};

const Valve = ({x, open, color}: {x: number; open: number; color: string}) => {
	const y = HEAD - 0.05 - open * 0.3;
	return (
		<group position={[x, 0, 0]}>
			<Rod from={[0, y, 0]} to={[0, HEAD + 1.5, 0]} r={0.06} />
			<mesh position={[0, y, 0]} castShadow>
				<cylinderGeometry args={[0.34, 0.34, 0.07, 24]} />
				<meshStandardMaterial {...mat.brass} emissive={color} emissiveIntensity={open * 0.5} />
			</mesh>
		</group>
	);
};

/** One cylinder, cut away: glass wall, piston, rod, crank, two valves, spark plug and the gas inside. */
export const Engine = ({s, x = 0, scale = 1}: {s: EngineState; x?: number; scale?: number}) => {
	const py = pistonY(s.crank);
	const a = (s.crank * Math.PI) / 180;
	const pin: V3 = [R * Math.sin(a), R * Math.cos(a), 0];
	const crown = py + 0.3;
	const gasH = Math.max(0.05, HEAD - crown);
	const intake = s.intake ?? 0;
	const exhaust = s.exhaust ?? 0;
	return (
		<group position={[x, 1.2, 0]} scale={scale}>
			{/* crankcase + counterweight disc */}
			<mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
				<cylinderGeometry args={[1.35, 1.35, 0.25, 40]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
			<group rotation={[0, 0, -a]}>
				<mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
					<cylinderGeometry args={[1.15, 1.15, 0.2, 40]} />
					<meshStandardMaterial {...mat.brass} />
				</mesh>
				<mesh position={[0, R, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.2, 0.2, 0.3, 20]} />
					<meshStandardMaterial {...mat.red} />
				</mesh>
			</group>
			{/* connecting rod and piston */}
			<Rod from={[pin[0], pin[1], 0.1]} to={[0, py, 0.1]} r={0.13} />
			<mesh position={[0, py, 0]} castShadow>
				<cylinderGeometry args={[0.93, 0.93, 0.6, 40]} />
				<meshStandardMaterial {...mat.steel} />
			</mesh>
			{[0.12, 0.02, -0.08].map((dy) => (
				<mesh key={dy} position={[0, py + 0.3 + dy, 0]}>
					<cylinderGeometry args={[0.96, 0.96, 0.04, 40]} />
					<meshStandardMaterial {...mat.dark} />
				</mesh>
			))}
			{/* glass cylinder wall */}
			<mesh position={[0, (HEAD + 1.0) / 2, 0]} renderOrder={2}>
				<cylinderGeometry args={[1.0, 1.0, HEAD - 1.0, 48, 1, true]} />
				<meshStandardMaterial color="#cfe9ee" transparent opacity={0.18} side={THREE.DoubleSide} roughness={0.1} depthWrite={false} />
			</mesh>
			{/* gas */}
			<mesh position={[0, crown + gasH / 2, 0]} renderOrder={1}>
				<cylinderGeometry args={[0.9, 0.9, gasH, 40]} />
				<meshStandardMaterial color={s.gas ?? '#7fd6e0'} transparent depthWrite={false} opacity={0.45 + 0.4 * (s.gasGlow ?? 0)} emissive={s.gas ?? '#7fd6e0'} emissiveIntensity={(s.gasGlow ?? 0) * 2.6} />
			</mesh>
			{/* head, valves, plug */}
			<mesh position={[0, HEAD + 0.25, 0]} castShadow>
				<cylinderGeometry args={[1.12, 1.12, 0.5, 48]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
			<Valve x={-0.45} open={intake} color="#4fd1c5" />
			<Valve x={0.45} open={exhaust} color="#9ca3af" />
			<Rod from={[0, HEAD, 0]} to={[0, HEAD + 1.2, 0]} r={0.09} material={mat.brass} />
			<mesh position={[0, HEAD - 0.05, 0]}>
				<sphereGeometry args={[0.12 + (s.spark ?? 0) * 0.25, 16, 16]} />
				<meshStandardMaterial color="#fff6c8" emissive="#ffe27a" emissiveIntensity={(s.spark ?? 0) * 6} />
			</mesh>
			{s.flow && <Flow {...s.flow} />}
			{/* base plate */}
			<mesh position={[0, -1.6, 0]} receiveShadow castShadow>
				<boxGeometry args={[4.4, 0.4, 3]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
		</group>
	);
};

/** Particles that stream through a valve: in = air and fuel entering, out = exhaust leaving. */
const Flow = ({kind, t}: {kind: 'in' | 'out'; t: number}) => {
	const sign = kind === 'in' ? -1 : 1;
	const n = 12;
	return (
		<>
			{Array.from({length: n}, (_, i) => {
				const u = (t * 0.9 + i / n) % 1; // 0..1 along the path
				const p = kind === 'in' ? 1 - u : u;
				const from: V3 = [sign * 1.7, HEAD + 2.4, 0];
				const mid: V3 = [sign * 0.45, HEAD, 0];
				const to: V3 = [sign * 0.2, HEAD - 1.4, 0];
				const q = p < 0.5 ? p * 2 : (p - 0.5) * 2;
				const [a, b] = p < 0.5 ? [from, mid] : [mid, to];
				return (
					<mesh key={i} position={[a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, 0.3]}>
						<sphereGeometry args={[0.1, 10, 10]} />
						<meshStandardMaterial color={kind === 'in' ? '#7fd6e0' : '#6b7280'} emissive={kind === 'in' ? '#7fd6e0' : '#000'} emissiveIntensity={0.6} />
					</mesh>
				);
			})}
		</>
	);
};

const teal = new THREE.Color('#7fd6e0');
const fire = new THREE.Color('#ff8a1f');
const smoke = new THREE.Color('#7b8087');

/** The whole four-stroke cycle as a function of crank angle (720 degrees = one cycle). */
export const cycleState = (deg: number, sec: number): EngineState => {
	const d = ((deg % 720) + 720) % 720;
	const lift = (a: number) => Math.min(1, Math.sin((Math.PI * (d - a)) / 180) * 1.6);
	const mix = (a: THREE.Color, b: THREE.Color, k: number) => '#' + a.clone().lerp(b, Math.min(1, Math.max(0, k))).getHexString();
	const s: EngineState = {crank: deg, spark: Math.max(0, 1 - Math.abs(d - 362) / 14)};
	if (d < 180) Object.assign(s, {intake: lift(0), gas: '#' + teal.getHexString(), gasGlow: 0, flow: {kind: 'in' as const, t: sec}});
	else if (d < 360) Object.assign(s, {gas: mix(teal, fire, (d - 180) / 180), gasGlow: ((d - 180) / 180) * 0.5});
	else if (d < 540) Object.assign(s, {gas: '#' + fire.getHexString(), gasGlow: 1 - ((d - 360) / 180) * 0.65});
	else Object.assign(s, {exhaust: lift(540), gas: mix(fire, smoke, (d - 540) / 60), gasGlow: 0, flow: {kind: 'out' as const, t: sec}});
	return s;
};
