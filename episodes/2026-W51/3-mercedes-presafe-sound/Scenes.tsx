import {interpolate} from 'remotion';
import {Car, HudLine, Readout, Stage, mat, useFocus, pullBack, useScene, type CamKey} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Mercedes-Benz PRE-SAFE Sound: pink noise before a crash triggers the stapedius reflex. Two sets: a car rolling at a
// barrier (sound rings around the driver's head) and a cut-open middle ear (eardrum, the three bones, the stapedius,
// the cochlea), sound travelling along +x. Animation language: docs/styles.md.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const HEAD: V3 = [-0.9, 4.0, 0.9]; // driver's head in the car below (not rotated)
const DRUM_X = -1.6;

/** A ring of points in the yz plane at x: a sound wave front travelling along x. */
const wave = (x: number, c: V3, r: number, n = 24): V3[] => Array.from({length: n}, (_, i) => [x, c[1] + Math.cos((i / n) * Math.PI * 2) * r, c[2] + Math.sin((i / n) * Math.PI * 2) * r]);
/** A ring around a point, facing the camera roughly: sound spreading from the speakers. */
const halo = (c: V3, r: number, n = 24): V3[] => Array.from({length: n}, (_, i) => [c[0] + Math.cos((i / n) * Math.PI * 2) * r, c[1] + Math.sin((i / n) * Math.PI * 2) * r, c[2]]);

/** Sound rings: `n` fronts moving from x0 to the eardrum, repeating with time t. */
const Waves = ({t, x0 = -6, speed = 0.6, big = false, n = 3}: {t: number; x0?: number; speed?: number; big?: boolean; n?: number}) => (
	<>
		{Array.from({length: n}, (_, i) => {
			const u = (t * speed + i / n) % 1;
			const x = x0 + (DRUM_X - x0) * u;
			return <HudLine key={i} path={wave(x, [0, 3.6, 0], (big ? 1.6 : 0.9) * (1 - 0.4 * u))} closed r={big ? 0.07 : 0.035} />;
		})}
	</>
);

/** The middle ear, cut open. `buzz` 0..1 = how much the eardrum and bones shake, `tense` 0..1 = stapedius tightening.
 * Parts: eardrum, bones, stapedius, cochlea. */
const Ear = ({buzz = 0, tense = 0, focus}: {buzz?: number; tense?: number; focus?: string[]}) => {
	const root = useFocus(focus);
	const {sec} = useScene();
	const shake = Math.sin(sec * 40) * 0.08 * buzz * (1 - 0.75 * tense);
	return (
		<group ref={root} position={[0, 3.6, 0]}>
			<group userData={{part: 'eardrum'}}>
				<mesh position={[DRUM_X + shake, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
					<cylinderGeometry args={[0.95, 0.95, 0.06, 40]} />
					<meshPhysicalMaterial color="#e8c3a8" roughness={0.4} transparent opacity={0.85} />
				</mesh>
			</group>
			<group userData={{part: 'bones'}} position={[shake, 0, 0]}>
				{/* hammer, anvil, stirrup */}
				<mesh position={[-1.25, 0.15, 0]} rotation={[0, 0, 0.5]} castShadow>
					<capsuleGeometry args={[0.15, 0.9, 6, 12]} />
					<meshStandardMaterial {...mat.ceramic} />
				</mesh>
				<mesh position={[-0.55, 0.5, 0]} rotation={[0, 0, -0.9]} castShadow>
					<capsuleGeometry args={[0.15, 0.7, 6, 12]} />
					<meshStandardMaterial {...mat.ceramic} />
				</mesh>
				<mesh position={[0.15, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
					<torusGeometry args={[0.32, 0.07, 10, 24, Math.PI]} />
					<meshStandardMaterial {...mat.ceramic} />
				</mesh>
				<mesh position={[0.55, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
					<cylinderGeometry args={[0.36, 0.36, 0.08, 24]} />
					<meshStandardMaterial {...mat.ceramic} />
				</mesh>
			</group>
			<group userData={{part: 'stapedius'}}>
				<mesh position={[0.15, -0.75 + tense * 0.15, 0]} scale={[1 + tense * 0.4, 1 - tense * 0.35, 1 + tense * 0.4]} castShadow>
					<capsuleGeometry args={[0.13, 0.9, 6, 12]} />
					<meshStandardMaterial color="#c0392b" roughness={0.5} emissive="#ff5a3c" emissiveIntensity={tense * 1.2} />
				</mesh>
			</group>
			<group userData={{part: 'cochlea'}}>
				{[0.75, 0.55, 0.35].map((r, i) => (
					<mesh key={r} position={[1.5, -0.1 + i * 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
						<torusGeometry args={[r, 0.17, 12, 32]} />
						<meshStandardMaterial {...mat.brass} />
					</mesh>
				))}
			</group>
			<mesh position={[0, -1.85, 0]} receiveShadow castShadow>
				<boxGeometry args={[5.4, 0.3, 2.2]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
		</group>
	);
};

const Barrier = () => (
	<mesh position={[8, 1.4, 0]} castShadow receiveShadow>
		<boxGeometry args={[1, 2.8, 6]} />
		<meshStandardMaterial color="#c9a227" roughness={0.6} />
	</mesh>
);

/** The car rolling at the barrier; `x` = how far it has come, `rings` 0..1 shows pink noise around the driver. */
const Approach = ({x, rings, t}: {x: number; rings: number; t: number}) => (
	<>
		<Car position={[x, 0, 0]} wheel={x / 1.05} xray color="#2f3a46">
			<></>
		</Car>
		<mesh position={[HEAD[0] + x, HEAD[1], HEAD[2]]} castShadow>
			<sphereGeometry args={[0.42, 24, 24]} />
			<meshStandardMaterial color="#d9b48f" roughness={0.6} />
		</mesh>
		{rings > 0 && [0, 1, 2].map((i) => <HudLine key={i} path={halo([HEAD[0] + x, HEAD[1], HEAD[2] + 0.5], 0.5 + ((t * 0.9 + i / 3) % 1) * 0.9)} closed r={0.03} grow={rings} />)}
		<Barrier />
	</>
);

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-4, 6, 20], look: [0, 2.4, 0]},
		{t: 0.45, pos: [-2, 5.6, 17], look: [1, 2.6, 0]},
		{t: 0.5, pos: [-2.2, 4.6, 9], look: [-0.6, 3.3, 0], cut: true},
		{t: 1, pos: [-1.6, 4.4, 8], look: [-0.5, 3.3, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>{p < 0.5 ? <Approach x={-3 + p * 4} rings={interpolate(p, [0.15, 0.25], [0, 1], clamp)} t={sec} /> : <><Ear buzz={0.4} /><Waves t={sec} /></>}</Stage>
			<Callout cam={cam} at={[-3.4 + p * 4, HEAD[1] + 0.4, HEAD[2]]} label={lang === 'id' ? 'Suara bising' : 'Noise'} from={0.2} to={0.47} />
			<Callout cam={cam} at={[DRUM_X, 4.4, 0]} label={lang === 'id' ? 'Gendang telinga' : 'Your eardrum'} from={0.58} to={1} />
		</>
	);
};

const Decide = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const x = -2 + p * 3;
	const cam = pullBack([
		{t: 0, pos: [10, 9, 20], look: [2, 2, 0]},
		{t: 0.5, pos: [9, 8, 18], look: [2.5, 2, 0]},
		{t: 0.55, pos: [x - 4.5, 5.2, 7.5], look: [x - 0.9, 3.8, 0.9], cut: true},
		{t: 1, pos: [x - 4, 5, 6.8], look: [x - 0.9, 3.8, 0.9]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Approach x={x} rings={p > 0.55 ? 1 : 0} t={sec} />
				<HudLine path={[[x + 4.9, 1.8, 0], [7.4, 1.8, 0]]} grow={interpolate(p, [0.05, 0.4], [0, 1], clamp)} arrow />
			</Stage>
			<Callout cam={cam} at={[7.4, 2.8, 0]} label={lang === 'id' ? 'Pasti tabrakan' : 'Crash: unavoidable'} from={0.15} to={0.5} side="left" />
			<Callout cam={cam} at={[HEAD[0] + x, HEAD[1] + 0.5, HEAD[2] + 0.5]} label="PRE-SAFE Sound" from={0.6} to={0.97} />
		</>
	);
};

const Loud = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-0.5, 4.4, 9.5], look: [-0.5, 3.0, 0]},
		{t: 0.5, pos: [-1.2, 4.2, 8.5], look: [-0.7, 3.0, 0]},
		{t: 0.55, pos: [-4, 4.6, 7], look: [-1, 3.1, 0], cut: true},
		{t: 1, pos: [-3.5, 4.4, 6.4], look: [-1, 3.1, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Ear buzz={1} focus={['eardrum']} />
				<Waves t={sec} big speed={1.1} />
			</Stage>
			<Callout cam={cam} at={[DRUM_X, 4.5, 0]} label={lang === 'id' ? 'Gendang telinga' : 'Eardrum'} from={0.6} to={0.97} side="right" />
		</>
	);
};

const Muscle = ({lang}: SceneProps) => {
	const {sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [2.5, 3.6, 8], look: [0.2, 3, 0]},
		{t: 0.5, pos: [1.6, 3.4, 7], look: [0.2, 3, 0]},
		{t: 0.55, pos: [-2.5, 2.4, 6.4], look: [0.1, 2.9, 0], cut: true},
		{t: 1, pos: [-2, 2.3, 5.8], look: [0.1, 2.9, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Ear buzz={0.2} focus={['stapedius']} />
				<Waves t={sec} speed={0.4} n={2} />
			</Stage>
			<Callout cam={cam} at={[0.15, 2.85, 0.15]} label={lang === 'id' ? 'Otot stapedius' : 'Stapedius muscle'} from={0.1} to={0.95} />
		</>
	);
};

const Tighten = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.15, 0.7, 0.3);
	const tense = interpolate(r.q, [0.2, 0.55], [0, 1], clamp);
	const cam = pullBack([
		{t: 0, pos: [-3, 4.6, 9], look: [-0.6, 3.2, 0]},
		{t: 0.45, pos: [-2.2, 4.3, 8], look: [-0.4, 3.2, 0]},
		{t: 0.5, pos: [1.8, 2.8, 6], look: [0.2, 2.9, 0], cut: true},
		{t: 1, pos: [1.4, 2.7, 5.4], look: [0.2, 2.9, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Ear buzz={0.5} tense={tense} focus={['stapedius', 'bones']} />
				<Waves t={sec} speed={0.5} />
			</Stage>
			<Readout label="PINK NOISE" from={0} to={80} unit="dB" at={[0.05, 0.4]} />
			<Callout cam={cam} at={[0.15, 2.9, 0.15]} label={lang === 'id' ? 'Mengencang' : 'Tightens'} from={0.55} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Braced = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-0.5, 4.6, 10], look: [-0.4, 3.4, 0]},
		{t: 0.5, pos: [-1, 4.4, 9], look: [-0.5, 3.4, 0]},
		{t: 0.55, pos: [6, 6.5, 18], look: [2.5, 2.2, 0], cut: true},
		{t: 1, pos: [5.4, 6.2, 16.5], look: [2.6, 2.2, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				{p < 0.55 ? (
					<>
						<Ear buzz={1} tense={1} focus={['stapedius']} />
						<Waves t={sec} big speed={1.1} />
					</>
				) : (
					<Approach x={2.2} rings={1} t={sec} />
				)}
			</Stage>
			<Callout cam={cam} at={[0.15, 2.9, 0.15]} label={lang === 'id' ? 'Sudah siaga' : 'Already braced'} from={0.08} to={0.52} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [-6, 7, 22], look: [1, 2.4, 0]}, {t: 1, pos: [-8, 7.5, 25], look: [1, 2.6, 0]}])}>
				<Approach x={2.2} rings={0} t={sec} />
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'SAFETY LAB', 'No. 025'], id: ['BONGKAR PASANG', 'LAB KESELAMATAN', 'No. 025']}} />
		</>
	);
};

export default [Hook, Decide, Loud, Muscle, Tighten, Braced, Finale];
