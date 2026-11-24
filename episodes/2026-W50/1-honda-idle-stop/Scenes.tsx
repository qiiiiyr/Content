import {interpolate} from 'remotion';
import {Engine, Scooter, Stage, Stream, cycleState, useFocus, useScene, type CamKey} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Honda's Idling Stop System: the engine stops at a light and the ACG starter (the generator on the crankshaft, run as a
// motor) restarts it with no gears. Animation language: docs/styles.md.
type V3 = [number, number, number];
const STOP = 200; // the engine always comes to rest early in compression: no gas glow, no flow, so it reads as "off"
const ACG_AT: V3 = [0, 1.2, 0.95]; // generator on the crankshaft's front end (crank centre at y=1.2)

/** Crank angle for an engine that runs at `speed` degrees per scene and coasts to a stop between p0 and p1, landing on STOP. */
const coast = (p: number, p0: number, p1: number, speed: number) => {
	const d = p1 - p0;
	const raw = (q: number) => (q < p0 ? speed * q : q < p1 ? speed * p0 + speed * (q - p0) - (speed * (q - p0) ** 2) / (2 * d) : speed * p0 + (speed * d) / 2);
	const end = raw(1);
	return raw(p) + (STOP - (((end % 720) + 720) % 720));
};

/** Crank angle for an engine at rest (STOP) that is started at p0 and reaches `speed` degrees per scene by p1. */
const start = (p: number, p0: number, p1: number, speed: number) => {
	if (p < p0) return STOP;
	const d = p1 - p0;
	return p < p1 ? STOP + (speed * (p - p0) ** 2) / (2 * d) : STOP + (speed * d) / 2 + speed * (p - p1);
};

/** The ACG: a ring of magnets (rotor, turns with the crank) around copper coils (stator, fixed). `power` lights the coils. */
const ACG = ({deg, power = 0, focus}: {deg: number; power?: number; focus?: string[]}) => {
	const root = useFocus(focus);
	return (
		<group ref={root} position={ACG_AT}>
			<group userData={{part: 'acg'}} rotation={[Math.PI / 2, 0, 0]}>
				<group rotation={[0, (-deg * Math.PI) / 180, 0]}>
					<mesh castShadow>
						<cylinderGeometry args={[0.95, 0.95, 0.3, 48, 1, true]} />
						<meshStandardMaterial color="#4b525d" metalness={0.8} roughness={0.4} side={2} />
					</mesh>
					{Array.from({length: 12}, (_, i) => {
						const a = (i / 12) * Math.PI * 2;
						return (
							<mesh key={i} position={[Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85]} rotation={[0, -a, 0]}>
								<boxGeometry args={[0.12, 0.26, 0.36]} />
								<meshStandardMaterial color={i % 2 ? '#b9c0ca' : '#c0392b'} metalness={0.6} roughness={0.35} />
							</mesh>
						);
					})}
				</group>
				{Array.from({length: 12}, (_, i) => {
					const a = ((i + 0.5) / 12) * Math.PI * 2;
					return (
						<mesh key={i} position={[Math.cos(a) * 0.52, 0, Math.sin(a) * 0.52]} rotation={[0, -a, Math.PI / 2]}>
							<cylinderGeometry args={[0.1, 0.1, 0.36, 16]} />
							<meshStandardMaterial color="#b87333" metalness={0.9} roughness={0.3} emissive="#ff8a3c" emissiveIntensity={power * 1.6} />
						</mesh>
					);
				})}
			</group>
		</group>
	);
};

/** A traffic light beside the bench: red, or green from `green` (0..1 of the scene) on. */
const Light = ({green = 2}: {green?: number}) => {
	const {p} = useScene();
	const go = p >= green;
	return (
		<group position={[-3.1, 0, -0.6]}>
			<mesh position={[0, 2.2, 0]} castShadow>
				<cylinderGeometry args={[0.12, 0.12, 4.4, 12]} />
				<meshStandardMaterial color="#3a3f47" metalness={0.6} roughness={0.5} />
			</mesh>
			<mesh position={[0, 5.2, 0]} castShadow>
				<boxGeometry args={[0.9, 2.4, 0.7]} />
				<meshStandardMaterial color="#1b1e23" roughness={0.6} />
			</mesh>
			{(
				[
					['#ff3b30', 5.95, !go],
					['#ffcc00', 5.2, false],
					['#34c759', 4.45, go],
				] as [string, number, boolean][]
			).map(([c, y, on]) => (
				<mesh key={c} position={[0, y, 0.36]}>
					<sphereGeometry args={[0.28, 20, 20]} />
					<meshStandardMaterial color={on ? c : '#2b2f36'} emissive={c} emissiveIntensity={on ? 3 : 0} toneMapped={!on} />
				</mesh>
			))}
		</group>
	);
};

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const deg = coast(p, 0.2, 0.5, 2600); // running at the light, then it stops by itself
	const cam: CamKey[] = [
		{t: 0, pos: [5, 4.5, 34], look: [1, 1.2, 1.5]},
		{t: 0.55, pos: [4.2, 4.2, 30], look: [1, 1.2, 1.5]},
		{t: 0.6, pos: [3.5, 5, 10], look: [0, 3.4, 0], cut: true},
		{t: 1, pos: [3, 4.6, 9], look: [0, 3.2, 0]},
	];
	const wide = p < 0.6;
	return (
		<>
			<Stage cam={cam}>
				{wide ? (
					<Scooter position={[1.4, 0, 1.6]} rotation={[0, -0.75, 0]} xray>
						<Engine s={cycleState(deg, sec)} valves={false} />
					</Scooter>
				) : (
					<>
						<Engine s={cycleState(deg, sec)} />
						<ACG deg={deg} />
					</>
				)}
				<Light />
			</Stage>
			<Callout cam={cam} at={[0, 2.8, 0.6]} label={lang === 'id' ? 'Mesin: mati' : 'Engine: off'} from={0.66} to={1} />
		</>
	);
};

const Wait = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const deg = coast(p, 0.15, 0.7, 900); // a slow idle that dies
	const cam: CamKey[] = [
		{t: 0, pos: [-5, 6, 14], look: [-1.8, 4, 0]},
		{t: 0.5, pos: [-4, 5.5, 12], look: [-1.5, 4, 0]},
		{t: 0.55, pos: [2.5, 3.2, 8], look: [0, 2.4, 0], cut: true},
		{t: 1, pos: [2, 3, 7], look: [0, 2.2, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(deg, sec)} focus={['crank', 'piston']} />
				<ACG deg={deg} />
				<Light />
			</Stage>
			<Callout cam={cam} at={[0, 1.2, 0.35]} label={lang === 'id' ? 'Poros engkol berhenti' : 'Crankshaft stops'} from={0.6} to={1} />
		</>
	);
};

const Restart = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.2, 0.55, 0.3);
	const deg = start(r.q, 0.15, 0.6, 2400);
	const cam: CamKey[] = [
		{t: 0, pos: [-4.5, 6.5, 15], look: [-1.8, 4.2, 0]},
		{t: 0.18, pos: [-4, 6.2, 14], look: [-1.6, 4.2, 0]},
		{t: 0.2, pos: [3, 3.4, 8.5], look: [0, 2.6, 0], cut: true},
		{t: 1, pos: [2.2, 3.8, 9.5], look: [0, 3, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(deg, sec)} focus={['crank']} />
				<ACG deg={deg} power={r.slow ? 1 : 0} />
				<Light green={0.12} />
			</Stage>
			<Callout cam={cam} at={[0, 1.2, 0.35]} label={lang === 'id' ? 'Poros engkol' : 'Crankshaft'} from={0.25} to={0.95} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Generator = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const deg = p * 1600;
	const cam: CamKey[] = [
		{t: 0, pos: [3.5, 3.2, 10], look: [0, 2, 0.6]},
		{t: 0.5, pos: [2.6, 2.8, 9], look: [0, 1.8, 0.6]},
		{t: 0.55, pos: [-3.5, 3, 8.5], look: [0, 1.6, 0.6], cut: true},
		{t: 1, pos: [-2.8, 2.7, 7.8], look: [0, 1.5, 0.6]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(deg, sec)} focus={['none']} />
				<ACG deg={deg} focus={['acg']} />
			</Stage>
			<Callout cam={cam} at={[0.85, 1.2, 0.95]} label={lang === 'id' ? 'Magnet' : 'Magnets'} from={0.12} to={0.5} />
			<Callout cam={cam} at={[-0.52, 1.2, 1.05]} label={lang === 'id' ? 'Kumparan tembaga' : 'Copper coils'} from={0.58} to={0.95} />
		</>
	);
};

const Starter = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const r = ramp(p, 0.15, 0.6, 0.28);
	const deg = start(r.q, 0.1, 0.7, 1800);
	const power = interpolate(r.q, [0.08, 0.15, 0.65, 0.75], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const cam: CamKey[] = [
		{t: 0, pos: [5, 4, 11], look: [1.2, 1.8, 0.8]},
		{t: 0.5, pos: [4.2, 3.5, 10], look: [1, 1.6, 0.8]},
		{t: 0.55, pos: [1, 2.6, 8], look: [0.2, 1.5, 0.8], cut: true},
		{t: 1, pos: [0.8, 2.4, 7.2], look: [0.2, 1.4, 0.8]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(deg, sec)} focus={['none']} />
				<ACG deg={deg} power={power} focus={['acg']} />
				{/* the battery, sending current into the coils */}
				<mesh position={[3.4, 0.55, 1.6]} castShadow>
					<boxGeometry args={[1.5, 1.1, 0.9]} />
					<meshStandardMaterial color="#22262c" roughness={0.6} />
				</mesh>
				<mesh position={[3.0, 1.2, 1.6]}>
					<cylinderGeometry args={[0.1, 0.1, 0.2, 12]} />
					<meshStandardMaterial color="#c0392b" />
				</mesh>
				{power > 0.05 && <Stream path={[[3.0, 1.3, 1.6], [2.2, 1.8, 1.5], [1.1, 1.5, 1.1], [0.6, 1.25, 1.0]]} t={sec} color="#ffb347" n={14} size={0.09} speed={1.4} opacity={power} />}
			</Stage>
			<Callout cam={cam} at={[0.52, 1.2, 1.05]} label={lang === 'id' ? 'ACG starter' : 'ACG starter'} from={0.12} to={0.95} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Silent = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const deg = start(p, 0.35, 0.6, 2200);
	const cam: CamKey[] = [
		{t: 0, pos: [-3, 5.5, 17], look: [-1.6, 4, 0]},
		{t: 0.5, pos: [-2, 5, 15], look: [-1.4, 4, 0]},
		{t: 0.55, pos: [3.4, 3, 9], look: [0, 1.8, 0.6], cut: true},
		{t: 1, pos: [2.8, 2.8, 8.2], look: [0, 1.7, 0.6]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(deg, sec)} />
				<ACG deg={deg} power={p > 0.35 && p < 0.6 ? 1 : 0} />
				<Light green={0.3} />
			</Stage>
			<Callout cam={cam} at={[0.7, 1.2, 1.05]} label={lang === 'id' ? 'Tanpa gigi' : 'No gears'} from={0.6} to={0.95} />
		</>
	);
};

const Finale = () => {
	const {p, sec} = useScene();
	const deg = p * 1400 + STOP;
	const go = Math.max(0, p - 0.15) ** 2 * 18; // green: it rides off
	return (
		<>
			<Stage cam={[{t: 0, pos: [4, 4.5, 33], look: [1.5, 1.2, 1.5]}, {t: 1, pos: [5, 5, 36], look: [3, 1.4, 2]}]}>
				<Scooter position={[1.4 + go * 0.73, 0, 1.6 + go * 0.68]} rotation={[0, -0.75, 0]} wheel={go / 1.1} xray>
					<Engine s={cycleState(deg, sec)} valves={false} />
				</Scooter>
				<Light green={0} />
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 022'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 022']}} />
		</>
	);
};


export default [Hook, Wait, Restart, Generator, Starter, Silent, Finale];
