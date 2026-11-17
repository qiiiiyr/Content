// 3D miniature-diorama kit: a warm workshop, textured wall and bench, brass and steel parts lit by a studio
// environment, props, a slow macro camera. Episodes compose <Stage> with parts from here.
// Units are arbitrary; the engine is about 7 tall.
import {useMemo, type ReactNode} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

type V3 = [number, number, number];
export type CamKey = {t: number; pos: V3; look: V3}; // t = 0..1 progress through the scene, so the move always fits the narration

export const mat = {
	brass: {color: '#d9ad4f', metalness: 0.95, roughness: 0.28},
	steel: {color: '#b9c0ca', metalness: 0.95, roughness: 0.32},
	dark: {color: '#4b525d', metalness: 0.7, roughness: 0.5},
	red: {color: '#c0392b', metalness: 0.3, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15},
	ceramic: {color: '#f3efe6', metalness: 0, roughness: 0.25, clearcoat: 0.6},
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
	const {p, sec} = useScene();
	const ts = keys.map((k) => k.t);
	const at = (pick: (k: CamKey) => V3) =>
		[0, 1, 2].map((i) => interpolate(p, ts, keys.map((k) => pick(k)[i]), {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	const [px, py, pz] = at((k) => k.pos);
	const [lx, ly, lz] = at((k) => k.look);
	// a little handheld drift keeps the shot alive
	cam.position.set(px + Math.sin(sec * 0.7) * 0.07, py + Math.sin(sec * 0.9 + 1) * 0.05, pz);
	cam.lookAt(lx, ly, lz);
	return null;
};

/** Studio reflections for the metals and filmic tone mapping, so brass and steel look like metal and not grey paint. */
const Look = () => {
	const {gl, scene} = useThree();
	useMemo(() => {
		const pm = new THREE.PMREMGenerator(gl);
		scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environmentIntensity = 0.75;
		pm.dispose();
		gl.toneMapping = THREE.ACESFilmicToneMapping;
		gl.toneMappingExposure = 1.05;
	}, [gl, scene]);
	return null;
};

const canvasTexture = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1]) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(...repeat);
	t.anisotropy = 8;
	return t;
};

// deterministic pseudo-random so every frame (and every render) draws the same grain
const rnd = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const woodTexture = () =>
	canvasTexture(1024, 512, (c) => {
		const r = rnd(7);
		c.fillStyle = '#a8794a';
		c.fillRect(0, 0, 1024, 512);
		for (let i = 0; i < 260; i++) {
			const y = r() * 512;
			c.strokeStyle = `rgba(${60 + r() * 40},${30 + r() * 25},10,${0.08 + r() * 0.18})`;
			c.lineWidth = 1 + r() * 3;
			c.beginPath();
			c.moveTo(0, y);
			c.bezierCurveTo(300, y + (r() - 0.5) * 14, 700, y + (r() - 0.5) * 14, 1024, y + (r() - 0.5) * 6);
			c.stroke();
		}
		c.strokeStyle = 'rgba(40,20,5,.55)';
		c.lineWidth = 4;
		for (const y of [0, 170, 341, 511]) {
			c.beginPath();
			c.moveTo(0, y);
			c.lineTo(1024, y);
			c.stroke();
		}
	}, [2, 1]);

const wallTexture = () =>
	canvasTexture(1024, 1024, (c) => {
		const r = rnd(3);
		c.fillStyle = '#cdbfa4';
		c.fillRect(0, 0, 1024, 1024);
		for (let i = 0; i < 9000; i++) {
			c.fillStyle = `rgba(${r() > 0.5 ? '255,250,235' : '90,70,40'},${0.03 + r() * 0.06})`;
			c.fillRect(r() * 1024, r() * 1024, 1 + r() * 3, 1 + r() * 3);
		}
		for (let i = 0; i < 6; i++) {
			const g = c.createRadialGradient(r() * 1024, r() * 1024, 10, r() * 1024, r() * 1024, 260);
			g.addColorStop(0, 'rgba(120,95,55,.10)');
			g.addColorStop(1, 'rgba(120,95,55,0)');
			c.fillStyle = g;
			c.fillRect(0, 0, 1024, 1024);
		}
	}, [3, 3]);

const blueprintTexture = () =>
	canvasTexture(512, 700, (c) => {
		c.fillStyle = '#e9e4d3';
		c.fillRect(0, 0, 512, 700);
		c.strokeStyle = 'rgba(40,90,140,.18)';
		c.lineWidth = 1;
		for (let x = 0; x < 512; x += 32) (c.beginPath(), c.moveTo(x, 0), c.lineTo(x, 700), c.stroke());
		for (let y = 0; y < 700; y += 32) (c.beginPath(), c.moveTo(0, y), c.lineTo(512, y), c.stroke());
		c.strokeStyle = 'rgba(30,70,125,.85)';
		c.lineWidth = 3;
		c.strokeRect(40, 40, 120, 130); // piston
		c.strokeRect(60, 170, 80, 60);
		c.beginPath();
		c.arc(300, 500, 90, 0, Math.PI * 2); // crank
		c.moveTo(300, 500);
		c.lineTo(250, 250);
		c.stroke();
		c.beginPath();
		c.arc(250, 250, 28, 0, Math.PI * 2);
		c.stroke();
		c.setLineDash([8, 6]);
		c.beginPath();
		c.moveTo(250, 200);
		c.lineTo(250, 640);
		c.stroke();
	});

/** The set: wall, bench, lights, props, camera. Children sit on the bench at y=0. */
export const Stage = ({cam, children}: {cam: CamKey[]; children: ReactNode}) => {
	const wood = useMemo(woodTexture, []);
	const wall = useMemo(wallTexture, []);
	const plan = useMemo(blueprintTexture, []);
	const wrench = useMemo(() => new RoundedBoxGeometry(3.4, 0.26, 0.14, 3, 0.05), []);
	return (
		<ThreeCanvas width={1080} height={1920} shadows camera={{fov: 32, near: 0.1, far: 200}} style={{background: '#cdbfa4'}}>
			<Camera keys={cam} />
			<Look />
			<color attach="background" args={['#cdbfa4']} />
			<fog attach="fog" args={['#cdbfa4', 30, 70]} />
			<ambientLight intensity={0.35} />
			<hemisphereLight args={['#fff1d6', '#6b4a2a', 0.55]} />
			<directionalLight position={[8, 14, 10]} intensity={2.6} color="#ffe2b0" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-6} />
			<pointLight position={[-7, 6, 7]} intensity={45} color="#9fd8d0" />
			<pointLight position={[6, 9, -2]} intensity={30} color="#ffd9a0" />
			{/* back wall: plaster texture with plank seams, a pinned blueprint, a hanging tag hook */}
			<mesh position={[0, 8, -6]} receiveShadow>
				<planeGeometry args={[60, 40]} />
				<meshStandardMaterial map={wall} roughness={0.95} />
			</mesh>
			{[-12, -6, 0, 6, 12].map((x) => (
				<mesh key={x} position={[x, 8, -5.96]}>
					<boxGeometry args={[0.08, 40, 0.03]} />
					<meshStandardMaterial color="#8e8266" roughness={1} />
				</mesh>
			))}
			<mesh position={[-4.2, 6.2, -5.9]} rotation={[0, 0, 0.04]} castShadow receiveShadow>
				<planeGeometry args={[3.2, 4.4]} />
				<meshStandardMaterial map={plan} roughness={0.9} />
			</mesh>
			{[[-5.6, 8.2], [-2.8, 8.25]].map(([x, y]) => (
				<mesh key={x} position={[x, y, -5.8]}>
					<sphereGeometry args={[0.09, 12, 12]} />
					<meshPhysicalMaterial {...mat.red} />
				</mesh>
			))}
			{/* bench with grain */}
			<mesh position={[0, -0.25, 20]} receiveShadow>
				<boxGeometry args={[60, 0.5, 52]} />
				<meshStandardMaterial map={wood} roughness={0.7} />
			</mesh>
			{/* props: a wrench and a few nuts */}
			<group position={[-5.4, 0.13, 2.4]} rotation={[0, 0.5, 0]}>
				<mesh geometry={wrench} castShadow receiveShadow>
					<meshStandardMaterial {...mat.steel} />
				</mesh>
				<mesh position={[1.8, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
					<torusGeometry args={[0.3, 0.1, 12, 24, 4.6]} />
					<meshStandardMaterial {...mat.steel} />
				</mesh>
			</group>
			{[[-3.6, 3.4], [-3.0, 3.9], [5.2, 3.1]].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.11, z]} rotation={[0, i, 0]} castShadow receiveShadow>
					<cylinderGeometry args={[0.3, 0.3, 0.22, 6]} />
					<meshStandardMaterial {...mat.brass} />
				</mesh>
			))}
			{children}
		</ThreeCanvas>
	);
};

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
		<mesh position={mid} quaternion={q} castShadow receiveShadow>
			<cylinderGeometry args={[r, r, a.distanceTo(b), 24]} />
			<meshStandardMaterial {...material} />
		</mesh>
	);
};

class Helix extends THREE.Curve<THREE.Vector3> {
	constructor(private r: number, private h: number, private turns: number) {
		super();
	}
	getPoint(t: number, target = new THREE.Vector3()) {
		const a = t * this.turns * Math.PI * 2;
		return target.set(Math.cos(a) * this.r, t * this.h, Math.sin(a) * this.r);
	}
}

const Valve = ({x, open, color, spring}: {x: number; open: number; color: string; spring: THREE.TubeGeometry}) => {
	const y = HEAD - 0.05 - open * 0.3;
	return (
		<group position={[x, 0, 0]}>
			<Rod from={[0, y, 0]} to={[0, HEAD + 1.6, 0]} r={0.06} />
			<mesh position={[0, y, 0]} castShadow>
				<cylinderGeometry args={[0.34, 0.3, 0.07, 28]} />
				<meshStandardMaterial {...mat.brass} emissive={color} emissiveIntensity={open * 0.6} />
			</mesh>
			{/* spring squeezes as the valve opens */}
			<mesh geometry={spring} position={[0, HEAD + 0.52, 0]} scale={[1, 1 - open * 0.25, 1]} castShadow>
				<meshStandardMaterial {...mat.steel} />
			</mesh>
			<mesh position={[0, HEAD + 1.25, 0]} castShadow>
				<cylinderGeometry args={[0.2, 0.2, 0.07, 20]} />
				<meshStandardMaterial {...mat.brass} />
			</mesh>
		</group>
	);
};

const pistonProfile = [new THREE.Vector2(0, -0.3), new THREE.Vector2(0.92, -0.3), new THREE.Vector2(0.94, -0.25), new THREE.Vector2(0.94, 0.3), new THREE.Vector2(0.86, 0.3), new THREE.Vector2(0, 0.22)];

/** One cylinder, cut away: glass wall, piston, rod, crank, two valves with springs, spark plug and the gas inside. */
export const Engine = ({s, x = 0, scale = 1}: {s: EngineState; x?: number; scale?: number}) => {
	const springGeo = useMemo(() => new THREE.TubeGeometry(new Helix(0.17, 0.7, 7), 120, 0.03, 8, false), []);
	const base = useMemo(() => new RoundedBoxGeometry(4.6, 0.4, 3.2, 3, 0.1), []);
	const head = useMemo(() => new RoundedBoxGeometry(2.3, 0.5, 2.3, 3, 0.12), []);
	const py = pistonY(s.crank);
	const a = (s.crank * Math.PI) / 180;
	const pin: V3 = [R * Math.sin(a), R * Math.cos(a), 0];
	const crown = py + 0.3;
	const gasH = Math.max(0.05, HEAD - crown);
	const glow = s.gasGlow ?? 0;
	return (
		<group position={[x, 1.2, 0]} scale={scale}>
			{/* crankcase, crank web with counterweight, journal */}
			<mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[1.4, 1.4, 0.25, 48]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
			<group rotation={[0, 0, -a]}>
				<mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
					<cylinderGeometry args={[1.12, 1.12, 0.2, 48]} />
					<meshStandardMaterial {...mat.brass} />
				</mesh>
				<mesh position={[0, -0.55, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
					<cylinderGeometry args={[0.52, 0.52, 0.2, 32]} />
					<meshStandardMaterial {...mat.steel} />
				</mesh>
				<mesh position={[0, R, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.2, 0.2, 0.36, 24]} />
					<meshPhysicalMaterial {...mat.red} />
				</mesh>
			</group>
			<mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
				<cylinderGeometry args={[0.18, 0.18, 0.5, 24]} />
				<meshStandardMaterial {...mat.steel} />
			</mesh>
			{/* connecting rod and piston */}
			<Rod from={[pin[0], pin[1], 0.1]} to={[0, py, 0.1]} r={0.13} />
			<mesh position={[0, py, 0]} castShadow receiveShadow>
				<latheGeometry args={[pistonProfile, 48]} />
				<meshStandardMaterial {...mat.steel} />
			</mesh>
			{[0.17, 0.07, -0.03].map((dy) => (
				<mesh key={dy} position={[0, py + 0.3 + dy - 0.1, 0]}>
					<cylinderGeometry args={[0.965, 0.965, 0.035, 48]} />
					<meshStandardMaterial {...mat.dark} />
				</mesh>
			))}
			<mesh position={[0, py, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.14, 0.14, 1.7, 20]} />
				<meshStandardMaterial {...mat.brass} />
			</mesh>
			{/* glass cylinder wall with brass collars */}
			<mesh position={[0, (HEAD + 1.0) / 2, 0]} renderOrder={2}>
				<cylinderGeometry args={[1.0, 1.0, HEAD - 1.0, 56, 1, true]} />
				<meshPhysicalMaterial color="#d6ecf0" transparent opacity={0.16} side={THREE.DoubleSide} roughness={0.05} metalness={0} clearcoat={1} depthWrite={false} />
			</mesh>
			{[1.0, HEAD - 0.05].map((y) => (
				<mesh key={y} position={[0, y, 0]} castShadow>
					<cylinderGeometry args={[1.06, 1.06, 0.1, 56]} />
					<meshStandardMaterial {...mat.brass} />
				</mesh>
			))}
			{/* gas, lit from inside by the fire */}
			<mesh position={[0, crown + gasH / 2, 0]} renderOrder={1}>
				<cylinderGeometry args={[0.9, 0.9, gasH, 40]} />
				<meshStandardMaterial color={s.gas ?? '#7fd6e0'} transparent depthWrite={false} opacity={0.42 + 0.4 * glow} emissive={s.gas ?? '#7fd6e0'} emissiveIntensity={glow * 2.8} />
			</mesh>
			{glow > 0.02 && <pointLight position={[0, HEAD - 0.7, 0.4]} color="#ff9a3c" intensity={glow * 60} distance={9} />}
			{/* head with cooling fins and bolts */}
			<mesh position={[0, HEAD + 0.3, 0]} geometry={head} castShadow receiveShadow>
				<meshStandardMaterial {...mat.dark} />
			</mesh>
			{[0.12, 0.3, 0.48].map((dy) => (
				<mesh key={dy} position={[0, HEAD + dy, 0]} castShadow>
					<boxGeometry args={[2.5, 0.07, 2.5]} />
					<meshStandardMaterial {...mat.dark} />
				</mesh>
			))}
			{Array.from({length: 8}, (_, i) => (
				<mesh key={i} position={[Math.cos((i * Math.PI) / 4) * 1.05, HEAD + 0.58, Math.sin((i * Math.PI) / 4) * 1.05]} castShadow>
					<cylinderGeometry args={[0.09, 0.09, 0.1, 6]} />
					<meshStandardMaterial {...mat.steel} />
				</mesh>
			))}
			<Valve x={-0.45} open={s.intake ?? 0} color="#4fd1c5" spring={springGeo} />
			<Valve x={0.45} open={s.exhaust ?? 0} color="#9ca3af" spring={springGeo} />
			{/* spark plug */}
			<mesh position={[0, HEAD + 1.05, 0.5]} castShadow>
				<cylinderGeometry args={[0.1, 0.12, 0.9, 20]} />
				<meshPhysicalMaterial {...mat.ceramic} />
			</mesh>
			<mesh position={[0, HEAD + 0.62, 0.5]} castShadow>
				<cylinderGeometry args={[0.17, 0.17, 0.14, 6]} />
				<meshStandardMaterial {...mat.steel} />
			</mesh>
			<mesh position={[0, HEAD + 1.55, 0.5]} castShadow>
				<cylinderGeometry args={[0.05, 0.05, 0.2, 12]} />
				<meshStandardMaterial {...mat.brass} />
			</mesh>
			<mesh position={[0, HEAD - 0.08, 0.5]}>
				<sphereGeometry args={[0.1 + (s.spark ?? 0) * 0.3, 16, 16]} />
				<meshStandardMaterial color="#fff6c8" emissive="#ffe27a" emissiveIntensity={(s.spark ?? 0) * 8} />
			</mesh>
			{(s.spark ?? 0) > 0.05 && <pointLight position={[0, HEAD - 0.3, 0.6]} color="#fff2b0" intensity={(s.spark ?? 0) * 40} distance={7} />}
			{s.flow && <Flow {...s.flow} />}
			{/* base plate */}
			<mesh position={[0, -1.6, 0]} geometry={base} receiveShadow castShadow>
				<meshStandardMaterial {...mat.dark} />
			</mesh>
		</group>
	);
};

/** Particles that stream through a valve: in = air and fuel entering as bright beads, out = exhaust leaving as puffs that grow and fade. */
const Flow = ({kind, t}: {kind: 'in' | 'out'; t: number}) => {
	const sign = kind === 'in' ? -1 : 1;
	const n = 14;
	return (
		<>
			{Array.from({length: n}, (_, i) => {
				const u = (t * 0.9 + i / n) % 1; // 0..1 along the path
				const p = kind === 'in' ? 1 - u : u;
				const from: V3 = [sign * 1.7, HEAD + 2.6, 0];
				const mid: V3 = [sign * 0.45, HEAD, 0];
				const to: V3 = [sign * 0.2, HEAD - 1.4, 0];
				const q = p < 0.5 ? p * 2 : (p - 0.5) * 2;
				const [a, b] = p < 0.5 ? [from, mid] : [mid, to];
				const grow = kind === 'out' ? 0.08 + (1 - p) * 0.22 : 0.1;
				return (
					<mesh key={i} position={[a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q + (kind === 'out' ? (1 - p) * 0.8 : 0), 0.3]} scale={grow / 0.1}>
						<sphereGeometry args={[0.1, 12, 12]} />
						<meshStandardMaterial color={kind === 'in' ? '#9fe8f0' : '#8a9099'} transparent opacity={kind === 'out' ? 0.2 + p * 0.5 : 0.95} emissive={kind === 'in' ? '#7fd6e0' : '#000'} emissiveIntensity={kind === 'in' ? 1.2 : 0} depthWrite={false} />
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
