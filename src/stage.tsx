// 3D miniature-diorama kit: a warm workshop, textured wall and bench, brass and steel parts lit by a studio
// environment, props, a slow macro camera. Episodes compose <Stage> with parts from here.
// Units are arbitrary; the engine is about 7 tall.
import {createContext, useContext, useMemo, useRef, type ReactNode} from 'react';
import {LookContext} from './kit';
import type {Look as LookName} from './types';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

type V3 = [number, number, number];
export type CamKey = {t: number; pos: V3; look: V3; cut?: boolean}; // t = 0..1 progress through the scene, so the move always fits the narration

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

/** Camera position and target at scene progress p. A key with `cut: true` starts a new shot: the camera jumps there
 * instead of moving, so one scene can hold 2-3 shots. Also used by Callout to pin labels to 3D points. */
export const camAt = (keys: CamKey[], p: number, sec: number): {pos: V3; look: V3} => {
	const start = keys.reduce((s, k, i) => (k.cut && k.t <= p ? i : s), 0);
	const end = keys.findIndex((k, i) => i > start && k.cut);
	const shot = keys.slice(start, end < 0 ? undefined : end);
	const ts = shot.map((k) => k.t);
	const at = (pick: (k: CamKey) => V3) =>
		[0, 1, 2].map((i) => (shot.length < 2 ? pick(shot[0])[i] : interpolate(p, ts, shot.map((k) => pick(k)[i]), {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))) as V3;
	const pos = at((k) => k.pos);
	// a little handheld drift keeps the shot alive
	return {pos: [pos[0] + Math.sin(sec * 0.7) * 0.07, pos[1] + Math.sin(sec * 0.9 + 1) * 0.05, pos[2]], look: at((k) => k.look)};
};

const Camera = ({keys}: {keys: CamKey[]}) => {
	const cam = useThree((s) => s.camera);
	const {p, sec} = useScene();
	const {pos, look} = camAt(keys, p, sec);
	cam.position.set(...pos);
	cam.lookAt(...look);
	return null;
};

/**
 * Studio reflections and filmic tone mapping, so brass and steel look like metal and not grey paint.
 * Reflections go on metal materials only: on the software renderer the reflection lookup is the most expensive part of
 * a frame, and the wall and bench (most of the screen) do not need it. That halves render time.
 */
const Look = () => {
	const {gl, scene} = useThree();
	const env = useMemo(() => {
		const pm = new THREE.PMREMGenerator(gl);
		const t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
		pm.dispose();
		gl.toneMapping = THREE.ACESFilmicToneMapping;
		gl.toneMappingExposure = 1.05;
		return t;
	}, [gl]);
	useFrame(() =>
		scene.traverse((o) => {
			const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
			if (m?.isMeshStandardMaterial && m.metalness > 0.5 && m.envMap !== env) {
				m.envMap = env;
				m.envMapIntensity = 0.75;
				m.needsUpdate = true;
			}
		}),
	);
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

/** The set: background, floor, lights and camera for the episode's look (docs/styles.md). Children sit on the floor at y=0. */
export const Stage = ({cam, children}: {cam: CamKey[]; children: ReactNode}) => {
	const look = useContext(LookContext);
	return (
		<ThreeCanvas width={1080} height={1920} shadows camera={{fov: 32, near: 0.1, far: 200}} style={{background: BG[look]}}>
			<Camera keys={cam} />
			<Look />
			{look === 'golden' ? <GoldenSet /> : look === 'editorial' ? <EditorialSet /> : look === 'blueprint' ? <BlueprintSet /> : <WorkshopSet />}
			<AccentContext.Provider value={ACCENT[look]}>{children}</AccentContext.Provider>
		</ThreeCanvas>
	);
};

const BG: Record<LookName, string> = {workshop: '#cdbfa4', golden: '#2a160c', editorial: '#05070a', blueprint: '#071a33'};

const WorkshopSet = () => {
	const wood = useMemo(woodTexture, []);
	const wall = useMemo(wallTexture, []);
	const plan = useMemo(blueprintTexture, []);
	const wrench = useMemo(() => new RoundedBoxGeometry(3.4, 0.26, 0.14, 3, 0.05), []);
	return (
		<>
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
		</>
	);
};

const gradientTexture = (stops: [number, string][], h = 512) =>
	canvasTexture(4, h, (c) => {
		const g = c.createLinearGradient(0, 0, 0, h);
		for (const [at, col] of stops) g.addColorStop(at, col);
		c.fillStyle = g;
		c.fillRect(0, 0, 4, h);
	});

const skyTexture = () =>
	canvasTexture(1024, 512, (c) => {
		const g = c.createLinearGradient(0, 0, 0, 512);
		g.addColorStop(0, '#3a1d12');
		g.addColorStop(0.45, '#c8642a');
		g.addColorStop(0.78, '#f6a24a');
		g.addColorStop(1, '#ffd796');
		c.fillStyle = g;
		c.fillRect(0, 0, 1024, 512);
		const sun = c.createRadialGradient(380, 430, 4, 380, 430, 260);
		sun.addColorStop(0, 'rgba(255,240,200,.95)');
		sun.addColorStop(0.15, 'rgba(255,200,120,.55)');
		sun.addColorStop(1, 'rgba(255,170,90,0)');
		c.fillStyle = sun;
		c.fillRect(0, 0, 1024, 512);
		const r = rnd(11);
		for (let i = 0; i < 14; i++) {
			c.fillStyle = `rgba(255,${190 + r() * 40},${120 + r() * 50},${0.05 + r() * 0.08})`;
			c.fillRect(0, 120 + r() * 260, 1024, 2 + r() * 10); // thin cloud bands
		}
	});

const hillsTexture = () =>
	canvasTexture(1024, 256, (c) => {
		const r = rnd(5);
		for (const [y0, col] of [[150, '#5a2c16'], [185, '#2b140b']] as [number, string][]) {
			c.fillStyle = col;
			c.beginPath();
			c.moveTo(0, 256);
			for (let x = 0; x <= 1024; x += 32) c.lineTo(x, y0 - Math.sin(x / 140 + y0) * 26 - r() * 18);
			c.lineTo(1024, 256);
			c.fill();
		}
	});

const asphaltTexture = () =>
	canvasTexture(512, 512, (c) => {
		const r = rnd(9);
		c.fillStyle = '#2a1c15';
		c.fillRect(0, 0, 512, 512);
		for (let i = 0; i < 7000; i++) {
			c.fillStyle = `rgba(${r() > 0.5 ? '255,190,140' : '0,0,0'},${0.03 + r() * 0.07})`;
			c.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
		}
	}, [12, 12]);

const gridTexture = () =>
	canvasTexture(512, 512, (c) => {
		c.fillStyle = '#071a33';
		c.fillRect(0, 0, 512, 512);
		c.strokeStyle = 'rgba(80,170,255,.16)';
		c.lineWidth = 1;
		for (let i = 0; i <= 512; i += 32) (c.beginPath(), c.moveTo(i, 0), c.lineTo(i, 512), c.stroke(), c.beginPath(), c.moveTo(0, i), c.lineTo(512, i), c.stroke());
		c.strokeStyle = 'rgba(110,200,255,.38)';
		c.lineWidth = 2;
		for (let i = 0; i <= 512; i += 128) (c.beginPath(), c.moveTo(i, 0), c.lineTo(i, 512), c.stroke(), c.beginPath(), c.moveTo(0, i), c.lineTo(512, i), c.stroke());
	}, [6, 6]);

/** Thin rings on the floor under the part, one turning: the HUD lines of the golden look. */
const FloorRing = ({color, r = 3.4}: {color: string; r?: number}) => {
	const {sec} = useScene();
	return (
		<group position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<mesh>
				<ringGeometry args={[r, r + 0.05, 96]} />
				<meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.85} />
			</mesh>
			<mesh rotation={[0, 0, sec * 0.6]}>
				<ringGeometry args={[r + 0.35, r + 0.42, 96, 1, 0, Math.PI * 0.55]} />
				<meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.9} />
			</mesh>
		</group>
	);
};

const GoldenSet = () => {
	const sky = useMemo(skyTexture, []);
	const hills = useMemo(hillsTexture, []);
	const ground = useMemo(asphaltTexture, []);
	return (
		<>
			<color attach="background" args={['#2a160c']} />
			<fog attach="fog" args={['#b8642f', 28, 95]} />
			<mesh position={[0, 18, -60]}>
				<planeGeometry args={[220, 80]} />
				<meshBasicMaterial map={sky} fog={false} toneMapped={false} />
			</mesh>
			<mesh position={[0, 4, -45]}>
				<planeGeometry args={[200, 24]} />
				<meshBasicMaterial map={hills} transparent fog={false} />
			</mesh>
			<mesh position={[0, 0, -10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[200, 120]} />
				<meshStandardMaterial map={ground} roughness={0.9} />
			</mesh>
			<ambientLight intensity={0.25} />
			<hemisphereLight args={['#ffb070', '#20120a', 0.55]} />
			{/* low sun behind and to the left: the parts get glowing edges */}
			<directionalLight position={[-9, 5, -14]} intensity={4.2} color="#ffae55" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-6} />
			<pointLight position={[6, 7, 10]} intensity={28} color="#ffd2a0" />
			<pointLight position={[-6, 3, 8]} intensity={10} color="#7fb6ff" />
			<FloorRing color="#5ee1ff" />
		</>
	);
};

const EditorialSet = () => {
	const back = useMemo(() => gradientTexture([[0, '#05070a'], [0.55, '#18202b'], [1, '#05070a']]), []);
	return (
		<>
			<color attach="background" args={['#05070a']} />
			<fog attach="fog" args={['#05070a', 26, 70]} />
			<mesh position={[0, 10, -22]}>
				<planeGeometry args={[90, 50]} />
				<meshBasicMaterial map={back} fog={false} />
			</mesh>
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[120, 120]} />
				<meshStandardMaterial color="#020304" metalness={0.35} roughness={0.38} />
			</mesh>
			<ambientLight intensity={0.12} />
			<spotLight position={[4, 18, 8]} angle={0.32} penumbra={0.9} intensity={360} color="#eef3ff" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
			<pointLight position={[-7, 6, -6]} intensity={60} color="#7aa2ff" />
			<pointLight position={[8, 3, 4]} intensity={18} color="#ffb070" />
		</>
	);
};

const BlueprintSet = () => {
	const grid = useMemo(gridTexture, []);
	return (
		<>
			<color attach="background" args={['#071a33']} />
			<fog attach="fog" args={['#071a33', 24, 70]} />
			<mesh position={[0, 12, -14]}>
				<planeGeometry args={[80, 40]} />
				<meshBasicMaterial map={grid} fog={false} />
			</mesh>
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[120, 120]} />
				<meshStandardMaterial map={grid} roughness={1} />
			</mesh>
			<ambientLight intensity={0.35} />
			<hemisphereLight args={['#cfe9ff', '#071a33', 0.7]} />
			<directionalLight position={[6, 14, 10]} intensity={2.2} color="#e6f4ff" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-6} />
			<pointLight position={[-7, 5, 6]} intensity={40} color="#4fc3ff" />
			<FloorRing color="#7fd6ff" r={4} />
		</>
	);
};

/** The look's accent colour, for parts in focus. Provided inside the 3D canvas, where the episode's context can't reach. */
const AccentContext = createContext('#ffb347');
const ACCENT: Record<LookName, string> = {workshop: '#ffb347', golden: '#5ee1ff', editorial: '#ff4d5e', blueprint: '#5ee1ff'};

/** X-ray focus: meshes in the named parts (nearest userData.part above them) glow in the accent colour and pulse;
 * every other solid part turns see-through. Glass and gas (no part) stay as they are. Returns the ref for the root. */
export const useFocus = (focus?: string[]) => {
	const root = useRef<THREE.Group>(null);
	const accent = useContext(AccentContext);
	const {sec} = useScene();
	useFrame(() => {
		if (!focus || !root.current) return;
		root.current.traverse((o) => {
			const mesh = o as THREE.Mesh;
			if (!mesh.isMesh) return;
			let part: string | undefined;
			for (let a: THREE.Object3D | null = o; a && a !== root.current && !part; a = a.parent) part = a.userData.part;
			if (!part) return;
			const m = mesh.material as THREE.MeshStandardMaterial;
			if (focus.includes(part)) {
				m.emissive?.set(accent);
				m.emissiveIntensity = 0.22 + 0.12 * Math.sin(sec * 6);
			} else if (!m.userData.ghost) {
				m.userData.ghost = true;
				m.transparent = true;
				m.opacity = 0.13;
				m.depthWrite = false;
				m.needsUpdate = true;
			}
		});
	});
	return root;
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

export const Rod = ({from, to, r = 0.12, material = mat.steel}: {from: V3; to: V3; r?: number; material?: object}) => {
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
/**
 * explode: 0..1 pulls the engine apart (head up, piston and crank down) to show the inside; animate it with p.
 * focus: parts to show glowing in the look's accent while the rest turns see-through, e.g. ['intake'] while the
 * narration names the intake valve. Parts: crank, piston, head, intake, exhaust, spark, base.
 */
export const Engine = ({s, x = 0, scale = 1, valves = true, injector = false, explode = 0, focus}: {s: EngineState; x?: number; scale?: number; valves?: boolean; injector?: boolean; explode?: number; focus?: string[]}) => {
	const root = useFocus(focus);
	const e = explode;
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
		<group ref={root} position={[x, 1.2, 0]} scale={scale}>
			<group position={[0, -1.7 * e, 0.6 * e]}>
			<group userData={{part: 'crank'}}>
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
			</group>
			<group userData={{part: 'piston'}}>
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
			</group>
			</group>
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
				<meshStandardMaterial color={s.gas ?? '#7fd6e0'} transparent depthWrite={false} opacity={(0.42 + 0.4 * glow) * (1 - e)} emissive={s.gas ?? '#7fd6e0'} emissiveIntensity={glow * 2.8} />
			</mesh>
			{glow > 0.02 && <pointLight position={[0, HEAD - 0.7, 0.4]} color="#ff9a3c" intensity={glow * 60} distance={9} />}
			<group position={[0, 2.3 * e, 0]}>
			<group userData={{part: 'head'}}>
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
			</group>
			<group userData={{part: 'intake'}}>{valves && <Valve x={-0.45} open={s.intake ?? 0} color="#4fd1c5" spring={springGeo} />}</group>
			<group userData={{part: 'exhaust'}}>{valves && <Valve x={0.45} open={s.exhaust ?? 0} color="#9ca3af" spring={springGeo} />}</group>
			<group userData={{part: 'spark'}}>
			{/* spark plug, or a dark steel fuel injector (diesel) so the picture never contradicts "no spark plug" */}
			<mesh position={[0, HEAD + 1.05, 0.5]} castShadow>
				<cylinderGeometry args={injector ? [0.13, 0.09, 0.9, 20] : [0.1, 0.12, 0.9, 20]} />
				{injector ? <meshStandardMaterial {...mat.dark} /> : <meshPhysicalMaterial {...mat.ceramic} />}
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
			</group>
			</group>
			{s.flow && <Flow {...s.flow} />}
			{/* base plate */}
			<mesh userData={{part: 'base'}} position={[0, -1.6 - 2.4 * e, 0]} geometry={base} receiveShadow castShadow>
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

// ---- drivetrain and accessory parts ---------------------------------------------------------------------------
type Mat = Record<string, unknown>;
const TAU = Math.PI * 2;

/** A spur gear with its axle along local z, turned by `angle` radians. Rotate the group to point the axle elsewhere. */
export const Gear = ({r = 1, teeth = 16, width = 0.4, angle = 0, material = mat.brass, position = [0, 0, 0], rotation = [0, 0, 0]}: {r?: number; teeth?: number; width?: number; angle?: number; material?: Mat; position?: V3; rotation?: V3}) => (
	<group position={position} rotation={rotation}>
		<group rotation={[0, 0, angle]}>
			<mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[r, r, width, 48]} />
				<meshStandardMaterial {...material} />
			</mesh>
			{Array.from({length: teeth}, (_, i) => {
				const a = (i / teeth) * TAU;
				return (
					<mesh key={i} position={[Math.cos(a) * (r + 0.1), Math.sin(a) * (r + 0.1), 0]} rotation={[0, 0, a]} castShadow>
						<boxGeometry args={[0.24, (Math.PI * r) / teeth, width]} />
						<meshStandardMaterial {...material} />
					</mesh>
				);
			})}
			<mesh rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[r * 0.28, r * 0.28, width + 0.12, 24]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
			<mesh position={[r * 0.6, 0, width / 2 + 0.01]}>
				<circleGeometry args={[r * 0.1, 16]} />
				<meshPhysicalMaterial {...mat.red} />
			</mesh>
		</group>
	</group>
);

/** A road wheel with its axle along local z: dark tyre with tread blocks, steel rim and spokes. */
export const Wheel = ({r = 1.3, angle = 0, position = [0, 0, 0], rotation = [0, 0, 0]}: {r?: number; angle?: number; position?: V3; rotation?: V3}) => (
	<group position={position} rotation={rotation}>
		<group rotation={[0, 0, angle]}>
			<mesh castShadow receiveShadow>
				<torusGeometry args={[r - 0.28, 0.32, 18, 48]} />
				<meshStandardMaterial color="#26282c" roughness={0.85} />
			</mesh>
			{Array.from({length: 24}, (_, i) => (
				<mesh key={i} position={[Math.cos((i / 24) * TAU) * (r + 0.02), Math.sin((i / 24) * TAU) * (r + 0.02), 0]} rotation={[0, 0, (i / 24) * TAU]}>
					<boxGeometry args={[0.1, 0.14, 0.5]} />
					<meshStandardMaterial color="#1c1d20" roughness={0.9} />
				</mesh>
			))}
			{Array.from({length: 5}, (_, i) => (
				<mesh key={i} rotation={[0, 0, (i / 5) * TAU]} position={[0, 0, 0.05]} castShadow>
					<boxGeometry args={[0.16, (r - 0.5) * 2, 0.12]} />
					<meshStandardMaterial {...mat.steel} />
				</mesh>
			))}
			<mesh rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.26, 0.26, 0.4, 20]} />
				<meshPhysicalMaterial {...mat.red} />
			</mesh>
		</group>
	</group>
);

/** Beads flowing along a polyline: air, fuel or exhaust. t = seconds, so the flow keeps moving whatever the scene length. */
export const Stream = ({path, t, n = 16, color = '#9fe8f0', size = 0.1, speed = 0.8, opacity = 0.95, glow = 1}: {path: V3[]; t: number; n?: number; color?: string; size?: number; speed?: number; opacity?: number; glow?: number}) => {
	const seg = path.length - 1;
	return (
		<>
			{Array.from({length: n}, (_, i) => {
				const u = ((t * speed + i / n) % 1) * seg;
				const k = Math.min(seg - 1, Math.floor(u));
				const q = u - k;
				const [a, b] = [path[k], path[k + 1]];
				return (
					<mesh key={i} position={[a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, a[2] + (b[2] - a[2]) * q]}>
						<sphereGeometry args={[size, 10, 10]} />
						<meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} transparent opacity={opacity} depthWrite={false} />
					</mesh>
				);
			})}
		</>
	);
};

const Blades = ({x, spin, n, material, glow = 0}: {x: number; spin: number; n: number; material: Mat; glow?: number}) => (
	<group position={[x, 0, 0]} rotation={[spin, 0, 0]}>
		<mesh rotation={[0, 0, Math.PI / 2]} castShadow>
			<cylinderGeometry args={[0.18, 0.42, 0.8, 24]} />
			<meshStandardMaterial {...material} />
		</mesh>
		{Array.from({length: n}, (_, i) => (
			<group key={i} rotation={[(i / n) * TAU, 0, 0]}>
				<mesh position={[0, 0.62, 0]} rotation={[0, 0.45, 0]} castShadow>
					<boxGeometry args={[0.7, 0.7, 0.05]} />
					<meshStandardMaterial {...material} emissive="#ff6a1a" emissiveIntensity={glow} />
				</mesh>
			</group>
		))}
	</group>
);

/**
 * Turbocharger cut away, shaft along x: hot turbine on the left (exhaust side), compressor on the right (air side),
 * bearing housing between, glass scrolls around both wheels. `spin` = shaft angle in radians, `heat` 0..1 reddens the turbine.
 */
export const Turbo = ({spin, heat = 0.5, wastegate = 0, position = [0, 3, 0]}: {spin: number; heat?: number; wastegate?: number; position?: V3}) => (
	<group position={position}>
		<mesh rotation={[0, 0, Math.PI / 2]} castShadow>
			<cylinderGeometry args={[0.12, 0.12, 4.2, 20]} />
			<meshStandardMaterial {...mat.steel} />
		</mesh>
		<mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
			<cylinderGeometry args={[0.55, 0.55, 1.1, 32]} />
			<meshStandardMaterial {...mat.dark} />
		</mesh>
		<Blades x={-1.5} spin={spin} n={11} material={mat.dark} glow={heat * 1.4} />
		<Blades x={1.5} spin={spin} n={12} material={mat.steel} />
		{[-1.5, 1.5].map((x) => (
			<mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
				<cylinderGeometry args={[1.35, 1.35, 1.0, 48, 1, true]} />
				<meshPhysicalMaterial color={x < 0 ? '#f0c9a8' : '#d6ecf0'} transparent opacity={0.18} side={THREE.DoubleSide} roughness={0.05} clearcoat={1} depthWrite={false} />
			</mesh>
		))}
		{[-2.0, -1.0, 1.0, 2.0].map((x) => (
			<mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
				<torusGeometry args={[1.38, 0.06, 10, 48]} />
				<meshStandardMaterial {...mat.brass} />
			</mesh>
		))}
		{heat > 0.05 && <pointLight position={[-1.5, 0, 1]} color="#ff8a3c" intensity={heat * 25} distance={5} />}
		{/* wastegate flap on the exhaust side: swings open to let gas bypass the turbine */}
		<group position={[-2.3, 1.45, 0]} rotation={[0, 0, wastegate * 1.1]}>
			<mesh position={[0.3, 0, 0]} castShadow>
				<boxGeometry args={[0.6, 0.08, 0.6]} />
				<meshStandardMaterial {...mat.brass} />
			</mesh>
		</group>
		{/* stand */}
		<mesh position={[0, -1.5, 0]} castShadow>
			<boxGeometry args={[0.4, 1.9, 0.4]} />
			<meshStandardMaterial {...mat.dark} />
		</mesh>
		<mesh position={[0, -2.5, 0]} receiveShadow castShadow>
			<boxGeometry args={[3.4, 0.2, 2.2]} />
			<meshStandardMaterial {...mat.dark} />
		</mesh>
	</group>
);

const Disc = ({r, w, z, material}: {r: number; w: number; z: number; material: Mat}) => (
	<mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
		<cylinderGeometry args={[r, r, w, 56]} />
		<meshStandardMaterial {...material} />
	</mesh>
);

/**
 * Car clutch, exploded slightly, axle along x (engine side at +x, gearbox at -x).
 * `release` 0..1 = pedal travel (0 = clamped), `engine` / `disc` = angles in radians of the engine side and the gearbox side.
 */
export const Clutch = ({release, engine, disc, heat = 0, position = [0, 3, 0]}: {release: number; engine: number; disc: number; heat?: number; position?: V3}) => {
	const gap = release * 0.35;
	return (
		<group position={position} rotation={[0, Math.PI / 2, 0]}>
			{/* engine side: crank stub, flywheel with starter teeth, pressure plate and diaphragm fingers */}
			<group rotation={[0, 0, engine]}>
				<Disc r={0.25} w={1.6} z={2.2} material={mat.steel} />
				<Gear r={2.1} teeth={48} width={0.35} position={[0, 0, 1.2]} material={mat.steel} />
				<Disc r={1.75} w={0.2} z={0.6 - gap} material={mat.steel} />
				<Disc r={1.9} w={0.08} z={0.4 - gap} material={mat.dark} />
				{Array.from({length: 12}, (_, i) => (
					<group key={i} rotation={[0, 0, (i / 12) * TAU]}>
						<mesh position={[0, 1.0, 0.3 - gap * 0.5]} rotation={[0.35 - release * 0.5, 0, 0]} castShadow>
							<boxGeometry args={[0.3, 1.4, 0.05]} />
							<meshStandardMaterial {...mat.brass} />
						</mesh>
					</group>
				))}
			</group>
			{/* gearbox side: friction disc with lining, input shaft */}
			<group rotation={[0, 0, disc]}>
				<Disc r={1.6} w={0.16} z={0.9 - gap * 0.5} material={{color: '#7a4a2a', roughness: 0.9, metalness: 0.1, emissive: '#ff5a1a', emissiveIntensity: heat}} />
				<Disc r={0.6} w={0.4} z={0.9 - gap * 0.5} material={mat.dark} />
				{Array.from({length: 6}, (_, i) => (
					<mesh key={i} position={[Math.cos((i / 6) * TAU) * 1.1, Math.sin((i / 6) * TAU) * 1.1, 0.8 - gap * 0.5]} castShadow>
						<sphereGeometry args={[0.1, 10, 10]} />
						<meshPhysicalMaterial {...mat.red} />
					</mesh>
				))}
				<Disc r={0.2} w={3.6} z={-1} material={mat.steel} />
				<Gear r={0.7} teeth={14} width={0.4} position={[0, 0, -2.5]} />
			</group>
			{/* release bearing slides toward the fingers as the pedal goes down */}
			<mesh position={[0, 0, -0.4 + release * 0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
				<torusGeometry args={[0.42, 0.14, 12, 32]} />
				<meshStandardMaterial {...mat.brass} />
			</mesh>
			{heat > 0.05 && <pointLight position={[0, 0, 0.9]} color="#ff7a2a" intensity={heat * 30} distance={6} />}
		</group>
	);
};

/**
 * Open differential with wheels, axles along x, driveshaft coming in along +z.
 * `left` / `right` = wheel angles in radians. The cage turns at their average; the spider gears turn with their difference.
 */
export const Differential = ({left, right, position = [0, 2, 0], track = 7}: {left: number; right: number; position?: V3; track?: number}) => {
	const cage = (left + right) / 2;
	const spider = (right - left) * 1.4;
	const ring = 2.2;
	return (
		<group position={position}>
			{/* driveshaft and pinion: pinion turns ring/pinion-ratio times faster than the cage */}
			<group position={[-0.3, 0, 2.6]}>
				<Gear r={0.55} teeth={10} width={0.35} angle={-cage * (ring / 0.55)} position={[0, 0, -1.25]} material={mat.steel} />
				<Disc r={0.14} w={3} z={0.2} material={mat.steel} />
			</group>
			{/* cage: ring gear plus the frame that carries the spider gears */}
			<group rotation={[cage, 0, 0]}>
				<Gear r={ring} teeth={36} width={0.3} rotation={[0, Math.PI / 2, 0]} position={[-0.9, 0, 0]} />
				{[1, -1].map((s) => (
					<mesh key={s} position={[0, s * 1.05, 0]} castShadow>
						<boxGeometry args={[1.8, 0.14, 0.5]} />
						<meshStandardMaterial {...mat.dark} />
					</mesh>
				))}
				{[1, -1].map((s) => (
					<Gear key={s} r={0.38} teeth={9} width={0.22} angle={s * spider} rotation={[Math.PI / 2, 0, 0]} position={[0, s * 0.66, 0]} material={mat.steel} />
				))}
			</group>
			{/* side gears, axles, wheels */}
			{([[-1, left], [1, right]] as const).map(([s, a]) => (
				<group key={s}>
					<Gear r={0.55} teeth={12} width={0.22} angle={a} rotation={[0, Math.PI / 2, 0]} position={[s * 0.62, 0, 0]} material={mat.brass} />
					<group rotation={[a, 0, 0]}>
						<mesh position={[s * (track / 4 + 0.3), 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
							<cylinderGeometry args={[0.13, 0.13, track / 2 - 0.4, 16]} />
							<meshStandardMaterial {...mat.steel} />
						</mesh>
					</group>
					<Wheel angle={a} rotation={[0, Math.PI / 2, 0]} position={[s * track / 2, 0, 0]} />
				</group>
			))}
		</group>
	);
};

/** A spark plug about 6 tall, standing on the bench. `spark` 0..1 fires the arc across the gap. */
export const SparkPlug = ({spark = 0, gap = 0.28, position = [0, 0, 0]}: {spark?: number; gap?: number; position?: V3}) => (
	<group position={position}>
		<mesh position={[0, 0.9, 0]} castShadow>
			<cylinderGeometry args={[0.45, 0.45, 1.2, 32]} />
			<meshStandardMaterial {...mat.steel} />
		</mesh>
		{Array.from({length: 7}, (_, i) => (
			<mesh key={i} position={[0, 0.4 + i * 0.15, 0]}>
				<torusGeometry args={[0.46, 0.035, 8, 32]} />
				<meshStandardMaterial {...mat.steel} />
			</mesh>
		))}
		<mesh position={[0, 1.85, 0]} castShadow>
			<cylinderGeometry args={[0.72, 0.72, 0.7, 6]} />
			<meshStandardMaterial {...mat.steel} />
		</mesh>
		<mesh position={[0, 3.2, 0]} castShadow>
			<cylinderGeometry args={[0.32, 0.42, 2.0, 32]} />
			<meshPhysicalMaterial {...mat.ceramic} />
		</mesh>
		{[2.6, 2.9, 3.2, 3.5, 3.8].map((y) => (
			<mesh key={y} position={[0, y, 0]}>
				<torusGeometry args={[0.37, 0.05, 10, 32]} />
				<meshPhysicalMaterial {...mat.ceramic} />
			</mesh>
		))}
		<mesh position={[0, 4.45, 0]} castShadow>
			<cylinderGeometry args={[0.16, 0.16, 0.6, 20]} />
			<meshStandardMaterial {...mat.brass} />
		</mesh>
		{/* centre electrode, and the bent ground electrode one gap below it */}
		<mesh position={[0, 0.2, 0]}>
			<cylinderGeometry args={[0.07, 0.07, 0.4, 16]} />
			<meshStandardMaterial {...mat.brass} />
		</mesh>
		<mesh position={[0.36, -0.05 - gap / 2, 0]} castShadow>
			<boxGeometry args={[0.12, 0.6 + gap, 0.2]} />
			<meshStandardMaterial {...mat.dark} />
		</mesh>
		<mesh position={[0.15, -gap, 0]} castShadow>
			<boxGeometry args={[0.55, 0.12, 0.2]} />
			<meshStandardMaterial {...mat.dark} />
		</mesh>
		<mesh position={[0, -gap / 2 + 0.03, 0]} scale={[1, 1, 1]}>
			<cylinderGeometry args={[0.03 + spark * 0.05, 0.03 + spark * 0.05, gap - 0.06, 8]} />
			<meshStandardMaterial color="#e8f4ff" emissive="#9fd0ff" emissiveIntensity={spark * 10} transparent opacity={spark} />
		</mesh>
		{spark > 0.05 && <pointLight position={[0, -gap / 2, 0.4]} color="#bfe0ff" intensity={spark * 30} distance={5} />}
	</group>
);

// ---- look upgrade (W49): live readout + honest time tag, drawn over the 3D --------------------------------------
/** A big number that counts with the scene (rpm, bar, °C) with its unit and an optional "SLOW MOTION" tag. Sits at the top, above the captions. */
export const Readout = ({label, from, to, unit, at = [0, 0.8], tag, top = 150, decimals = 0}: {label: string; from: number; to: number; unit: string; at?: [number, number]; tag?: string; top?: number; decimals?: number}) => {
	const {p, sec} = useScene();
	const v = interpolate(p, at, [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const mono = '"Courier New", monospace';
	const shadow = '0 3px 14px rgba(40,20,5,.7)';
	return (
		<div style={{position: 'absolute', top, left: 0, width: 1080, textAlign: 'center', fontFamily: mono, color: '#fff3d6', textShadow: shadow}}>
			<div style={{fontSize: 34, letterSpacing: 6, opacity: 0.9}}>{label}</div>
			<div style={{fontSize: 150, fontWeight: 800, lineHeight: 1.05}}>{v.toLocaleString('en-US', {maximumFractionDigits: decimals, minimumFractionDigits: decimals})}</div>
			<div style={{fontSize: 40, letterSpacing: 4}}>{unit}</div>
			{tag && <div style={{display: 'inline-block', marginTop: 14, padding: '6px 18px', background: '#b3342a', color: '#fff', fontSize: 32, fontWeight: 700, letterSpacing: 3, opacity: 0.75 + 0.25 * Math.sin(sec * 5)}}>{tag}</div>}
		</div>
	);
};

// ---- brakes, suspension, rotary engine, catalytic converter ----------------------------------------------------
/** Brake disc with a caliper, axle along z. `squeeze` 0..1 clamps the pads, `heat` 0..1 turns the disc red hot, `angle` spins it. */
export const BrakeDisc = ({squeeze, heat = 0, angle = 0, position = [0, 3, 0]}: {squeeze: number; heat?: number; angle?: number; position?: V3}) => {
	const gap = 0.45 * (1 - squeeze);
	const disc = {color: '#9aa1ab', metalness: 0.9, roughness: 0.4, emissive: '#ff4a10', emissiveIntensity: heat * 2.2};
	return (
		<group position={position}>
			<group rotation={[0, 0, angle]}>
				<mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
					<cylinderGeometry args={[2.3, 2.3, 0.22, 64]} />
					<meshStandardMaterial {...disc} />
				</mesh>
				<mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
					<cylinderGeometry args={[0.85, 0.85, 0.7, 32]} />
					<meshStandardMaterial {...mat.dark} />
				</mesh>
				{Array.from({length: 12}, (_, i) => (
					<mesh key={i} position={[Math.cos((i / 12) * TAU) * 1.6, Math.sin((i / 12) * TAU) * 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.12, 0.12, 0.24, 14]} />
						<meshStandardMaterial color="#1b1d21" roughness={1} />
					</mesh>
				))}
				{Array.from({length: 5}, (_, i) => (
					<mesh key={i} position={[Math.cos((i / 5) * TAU) * 0.55, Math.sin((i / 5) * TAU) * 0.55, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.09, 0.09, 0.1, 6]} />
						<meshStandardMaterial {...mat.steel} />
					</mesh>
				))}
			</group>
			<mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.18, 0.18, 1.6, 16]} />
				<meshStandardMaterial {...mat.steel} />
			</mesh>
			{/* caliper over the top edge: pads either side, red housing, hydraulic piston */}
			{[1, -1].map((s) => (
				<mesh key={s} position={[0, 1.75, s * (0.11 + gap / 2 + 0.17)]} castShadow>
					<boxGeometry args={[1.5, 1.0, 0.24]} />
					<meshStandardMaterial color="#3a2a22" roughness={0.9} />
				</mesh>
			))}
			<mesh position={[0, 2.55, 0]} castShadow>
				<boxGeometry args={[1.9, 0.5, 1.6]} />
				<meshPhysicalMaterial {...mat.red} />
			</mesh>
			{[1, -1].map((s) => (
				<mesh key={s} position={[0, 1.75, s * (0.11 + gap + 0.5)]} castShadow>
					<boxGeometry args={[1.9, 1.5, 0.3]} />
					<meshPhysicalMaterial {...mat.red} transparent opacity={0.55} depthWrite={false} />
				</mesh>
			))}
			{heat > 0.05 && <pointLight position={[0, 0, 1.2]} color="#ff6a2a" intensity={heat * 45} distance={8} />}
		</group>
	);
};

/** Suspension strut: coil spring, glass tube with oil, piston and rod. `comp` 0..1 compresses it; `heat` 0..1 warms the oil. */
export const Damper = ({comp, heat = 0, position = [0, 0, 0]}: {comp: number; heat?: number; position?: V3}) => {
	const spring = useMemo(() => new THREE.TubeGeometry(new Helix(1.05, 3.2, 8), 160, 0.07, 8, false), []);
	const pistonY = 3.4 - comp * 1.3;
	return (
		<group position={position}>
			<mesh position={[0, 0.1, 0]} receiveShadow castShadow>
				<boxGeometry args={[3, 0.2, 2.2]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
			<mesh position={[0, 2.2, 0]} renderOrder={2}>
				<cylinderGeometry args={[0.75, 0.75, 4, 40, 1, true]} />
				<meshPhysicalMaterial color="#d6ecf0" transparent opacity={0.2} side={THREE.DoubleSide} roughness={0.05} clearcoat={1} depthWrite={false} />
			</mesh>
			<mesh position={[0, 1.2 + (pistonY - 0.2) / 2 - 0.1, 0]} renderOrder={1}>
				<cylinderGeometry args={[0.68, 0.68, pistonY - 1.0, 32]} />
				<meshStandardMaterial color="#e3a02b" transparent opacity={0.5} emissive="#ff6a1a" emissiveIntensity={heat * 1.5} depthWrite={false} />
			</mesh>
			<mesh position={[0, pistonY, 0]} castShadow>
				<cylinderGeometry args={[0.66, 0.66, 0.2, 32]} />
				<meshStandardMaterial {...mat.brass} />
			</mesh>
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[Math.cos((i / 3) * TAU) * 0.33, pistonY, Math.sin((i / 3) * TAU) * 0.33]}>
					<cylinderGeometry args={[0.07, 0.07, 0.22, 10]} />
					<meshStandardMaterial color="#1b1d21" />
				</mesh>
			))}
			<Rod from={[0, pistonY, 0]} to={[0, 5.9 - comp * 1.3, 0]} r={0.14} />
			<mesh position={[0, 5.9 - comp * 1.3, 0]} castShadow>
				<boxGeometry args={[2.6, 0.2, 2.0]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
			<mesh geometry={spring} position={[0, 0.2 + comp * 0.001, 0]} scale={[1, (5.7 - comp * 1.3) / 3.2 / 1.0, 1]} castShadow>
				<meshStandardMaterial {...mat.steel} />
			</mesh>
			{heat > 0.05 && <pointLight position={[0, 1.6, 1.2]} color="#ff8a3c" intensity={heat * 20} distance={5} />}
		</group>
	);
};

/**
 * Wankel rotary engine, flat to the camera (axis along z). `theta` = output shaft angle in radians; the rotor turns at a third of that.
 * `flame` 0..1 lights the combustion chamber at the top.
 */
const WR = 2.6;
const WE = 0.43;
export const Wankel = ({theta, flame = 0, position = [0, 4, 0]}: {theta: number; flame?: number; position?: V3}) => {
	const housing = useMemo(() => {
		const pts = Array.from({length: 120}, (_, i) => {
			const f = (i / 120) * TAU;
			return new THREE.Vector3(WR * Math.cos(f) + WE * Math.cos(3 * f), WR * Math.sin(f) + WE * Math.sin(3 * f), 0);
		});
		const outline = new THREE.CatmullRomCurve3(pts, true);
		return {rim: new THREE.TubeGeometry(outline, 200, 0.09, 8, true), glass: new THREE.ShapeGeometry(new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, p.y))), 4)};
	}, []);
	const rotor = useMemo(() => {
		const s = new THREE.Shape();
		const v = (k: number) => new THREE.Vector2(Math.cos((k * TAU) / 3) * WR, Math.sin((k * TAU) / 3) * WR);
		s.moveTo(v(0).x, v(0).y);
		for (let k = 0; k < 3; k++) {
			const a = ((k + 0.5) * TAU) / 3;
			s.quadraticCurveTo(Math.cos(a) * WR * 0.78, Math.sin(a) * WR * 0.78, v(k + 1).x, v(k + 1).y);
		}
		return new THREE.ExtrudeGeometry(s, {depth: 0.8, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2});
	}, []);
	const ex = WE * Math.cos(theta);
	const ey = WE * Math.sin(theta);
	return (
		<group position={position}>
			<mesh geometry={housing.glass} position={[0, 0, -0.5]} renderOrder={0}>
				<meshStandardMaterial color="#2c3138" roughness={0.8} />
			</mesh>
			<mesh geometry={housing.rim} position={[0, 0, 0.45]} castShadow>
				<meshStandardMaterial {...mat.brass} />
			</mesh>
			<group position={[ex, ey, -0.4]} rotation={[0, 0, theta / 3]}>
				<mesh geometry={rotor} castShadow receiveShadow>
					<meshStandardMaterial {...mat.steel} />
				</mesh>
				<mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.7, 0.7, 0.9, 32]} />
					<meshStandardMaterial {...mat.dark} />
				</mesh>
				{[0, 1, 2].map((k) => (
					<mesh key={k} position={[Math.cos((k * TAU) / 3) * WR, Math.sin((k * TAU) / 3) * WR, 0.4]}>
						<sphereGeometry args={[0.16, 12, 12]} />
						<meshPhysicalMaterial {...mat.red} />
					</mesh>
				))}
			</group>
			{/* eccentric shaft: the small crank the rotor pushes around */}
			<mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.16, 0.16, 1.6, 16]} />
				<meshStandardMaterial {...mat.steel} />
			</mesh>
			<mesh position={[ex, ey, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.2, 0.2, 0.5, 16]} />
				<meshPhysicalMaterial {...mat.red} />
			</mesh>
			{/* spark plug at the top and the flame */}
			<mesh position={[0, WR + 0.5, 0.2]} castShadow>
				<cylinderGeometry args={[0.16, 0.2, 0.9, 16]} />
				<meshPhysicalMaterial {...mat.ceramic} />
			</mesh>
			<mesh position={[0.5, WR - 0.5, 0.3]} scale={0.2 + flame * 1.3}>
				<sphereGeometry args={[0.5, 20, 20]} />
				<meshStandardMaterial color="#ff9a3c" emissive="#ff7a1a" emissiveIntensity={flame * 3} transparent opacity={flame} depthWrite={false} />
			</mesh>
			{flame > 0.05 && <pointLight position={[0.5, WR - 0.5, 1.2]} color="#ff9a3c" intensity={flame * 60} distance={9} />}
		</group>
	);
};

/** Catalytic converter, flow along x: glass shell around a honeycomb of brass-coated channels. `heat` 0..1 makes the honeycomb glow. */
export const Catalyst = ({heat = 0, position = [0, 3, 0]}: {heat?: number; position?: V3}) => {
	const cells = useMemo(() => {
		const out: [number, number][] = [];
		for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
			const x = i * 0.3 + (j % 2) * 0.15;
			const y = j * 0.26;
			if (Math.hypot(x, y) < 0.95) out.push([x, y]);
		}
		return out;
	}, []);
	return (
		<group position={position}>
			<mesh rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
				<cylinderGeometry args={[1.15, 1.15, 3, 40, 1, true]} />
				<meshPhysicalMaterial color="#d6ecf0" transparent opacity={0.16} side={THREE.DoubleSide} roughness={0.05} clearcoat={1} depthWrite={false} />
			</mesh>
			{cells.map(([y, z], i) => (
				<mesh key={i} position={[0, y, z]} rotation={[0, 0, Math.PI / 2]}>
					<cylinderGeometry args={[0.12, 0.12, 2.4, 6]} />
					<meshStandardMaterial {...mat.brass} emissive="#ff5a1a" emissiveIntensity={heat * 1.6} />
				</mesh>
			))}
			{[-1.5, 1.5].map((x) => (
				<mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
					<torusGeometry args={[1.18, 0.08, 10, 40]} />
					<meshStandardMaterial {...mat.steel} />
				</mesh>
			))}
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * 2.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
					<cylinderGeometry args={[0.45, 0.45, 1.6, 24]} />
					<meshStandardMaterial {...mat.dark} />
				</mesh>
			))}
			{heat > 0.05 && <pointLight position={[0, 0, 1.3]} color="#ff7a2a" intensity={heat * 25} distance={6} />}
		</group>
	);
};
