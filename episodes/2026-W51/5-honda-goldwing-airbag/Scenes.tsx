import {interpolate} from 'remotion';
import {HudLine, Rod, Stage, Wheel, mat, ringPath, useFocus, useScene, type CamKey} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Honda's motorcycle airbag (Gold Wing, 2006): four crash sensors on the fork, an airbag ECU, a bag from the dash held
// by tether straps. The bike is a generic touring bike, not the Gold Wing's styling. Front toward +x, about 11 long.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SENSORS: V3[] = [[3.55, 2.6, 0.6], [3.3, 3.5, 0.6], [3.55, 2.6, -0.6], [3.3, 3.5, -0.6]];
const DASH: V3 = [1.8, 5.0, 0];
const ECU: V3 = [-0.6, 3.2, 0.75];

/** A touring bike with a rider. `bag` 0..1 inflates the airbag, `lean` 0..1 throws the rider forward into it,
 * `x` moves the bike. Parts: bike, sensor, ecu, bag, strap. */
const Bike = ({x = 0, bag = 0, lean = 0, wheel = 0, focus}: {x?: number; bag?: number; lean?: number; wheel?: number; focus?: string[]}) => {
	const root = useFocus(focus);
	const body = {color: '#3b4a5a', metalness: 0.4, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15};
	const b = Math.max(0.001, bag);
	return (
		<group position={[x, 0, 0]}>
			<Wheel r={1.45} angle={-wheel} position={[4.1, 1.45, 0]} />
			<Wheel r={1.45} angle={-wheel} position={[-4.2, 1.45, 0]} />
			<group ref={root}>
				<group userData={{part: 'bike'}}>
					{[0.45, -0.45].map((z) => (
						<Rod key={z} from={[4.1, 1.45, z]} to={[2.9, 5.0, z]} r={0.13} material={mat.steel} />
					))}
					<mesh position={[-0.6, 3.6, 0]} castShadow>
						<boxGeometry args={[5.6, 1.6, 1.5]} />
						<meshPhysicalMaterial {...body} />
					</mesh>
					<mesh position={[2.2, 4.7, 0]} rotation={[0, 0, -0.5]} castShadow>
						<boxGeometry args={[1.6, 1.4, 2.2]} />
						<meshPhysicalMaterial {...body} />
					</mesh>
					<mesh position={[2.4, 5.9, 0]} rotation={[0, 0, -0.45]}>
						<boxGeometry args={[0.1, 1.4, 1.9]} />
						<meshPhysicalMaterial color="#d6ecf0" transparent opacity={0.25} roughness={0.05} clearcoat={1} depthWrite={false} />
					</mesh>
					<mesh position={[-2.4, 4.6, 0]} castShadow>
						<boxGeometry args={[3.4, 0.5, 1.4]} />
						<meshStandardMaterial color="#1f2124" roughness={0.7} />
					</mesh>
					<mesh position={[-4.6, 3.9, 0]} castShadow>
						<boxGeometry args={[1.6, 1.4, 2.6]} />
						<meshPhysicalMaterial {...body} />
					</mesh>
				</group>
				<group userData={{part: 'sensor'}}>
					{SENSORS.map((s, i) => (
						<mesh key={i} position={s} castShadow>
							<boxGeometry args={[0.32, 0.4, 0.22]} />
							<meshStandardMaterial color="#e0b13a" metalness={0.4} roughness={0.4} />
						</mesh>
					))}
				</group>
				<group userData={{part: 'ecu'}}>
					<mesh position={ECU} castShadow>
						<boxGeometry args={[0.9, 0.6, 0.12]} />
						<meshStandardMaterial color="#2b6f4f" metalness={0.3} roughness={0.5} />
					</mesh>
				</group>
				<group userData={{part: 'bag'}}>
					<mesh position={[DASH[0] - 0.9 * b, DASH[1] + 0.6 * b, 0]} scale={[1.1 * b, 1.3 * b, 1.4 * b]} castShadow>
						<sphereGeometry args={[1, 32, 24]} />
						<meshStandardMaterial color="#f1ede4" roughness={0.75} />
					</mesh>
				</group>
				<group userData={{part: 'strap'}}>
					{bag > 0.3 && [0.6, -0.6].map((z) => <Rod key={z} from={[DASH[0] - 0.9 * b, DASH[1] + 0.2 * b, z * b]} to={[1.6, 4.3, z]} r={0.05} material={{color: '#e0b13a', roughness: 0.6}} />)}
				</group>
			</group>
			{/* rider */}
			<group position={[-1.9 + lean * 1.3, 4.8, 0]} rotation={[0, 0, -0.15 - lean * 0.5]}>
				<mesh position={[0, 1.2, 0]} castShadow>
					<capsuleGeometry args={[0.55, 1.3, 8, 16]} />
					<meshStandardMaterial color="#26313d" roughness={0.7} />
				</mesh>
				<mesh position={[0, 2.75, 0]} castShadow>
					<sphereGeometry args={[0.55, 24, 24]} />
					<meshStandardMaterial color="#c0392b" metalness={0.3} roughness={0.25} />
				</mesh>
			</group>
		</group>
	);
};

const Barrier = () => (
	<mesh position={[10.5, 1.6, 0]} castShadow receiveShadow>
		<boxGeometry args={[1, 3.2, 6]} />
		<meshStandardMaterial color="#c9a227" roughness={0.6} />
	</mesh>
);

const Hook = ({lang}: SceneProps) => {
	const {p} = useScene();
	const x = interpolate(p, [0, 0.5], [-3, 3.8], clamp);
	const bag = interpolate(p, [0.5, 0.62], [0, 1], clamp);
	const cam: CamKey[] = [
		{t: 0, pos: [-2, 7, 24], look: [1.5, 3.2, 0]},
		{t: 0.45, pos: [0, 6.8, 22], look: [3, 3.4, 0]},
		{t: 0.5, pos: [3.5, 7.2, 11], look: [4.8, 5, 0], cut: true},
		{t: 1, pos: [3, 7, 10], look: [4.6, 5.1, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Bike x={x} bag={bag} lean={bag * 0.6} wheel={x / 1.45} focus={p > 0.5 ? ['bag'] : undefined} />
				<Barrier />
			</Stage>
			<Callout cam={cam} at={[x + DASH[0] - 0.9, DASH[1] + 1.2, 1.2]} label="Airbag" from={0.62} to={1} />
		</>
	);
};

const Where = ({lang}: SceneProps) => {
	const {p} = useScene();
	const cam: CamKey[] = [
		{t: 0, pos: [8, 7.5, 16], look: [1, 4, 0]},
		{t: 0.5, pos: [7, 7, 14.5], look: [1, 4.2, 0]},
		{t: 0.55, pos: [-7, 8, 13], look: [-0.5, 5, 0], cut: true},
		{t: 1, pos: [-6.4, 7.8, 12], look: [-0.4, 5, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Bike />
				<HudLine path={[[-1.6, 7.9, 0.8], [0.4, 7.6, 0.8], [2.6, 6.8, 0.8]]} grow={interpolate(p, [0.6, 0.9], [0, 1], clamp)} arrow />
			</Stage>
			<Callout cam={cam} at={[-1.9, 6.4, 0.6]} label={lang === 'id' ? 'Tanpa sabuk' : 'No seat belt'} from={0.1} to={0.5} />
		</>
	);
};

const Sensors = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam: CamKey[] = [
		{t: 0, pos: [7, 4, 8], look: [3.5, 3, 0]},
		{t: 0.5, pos: [6.4, 3.8, 7.2], look: [3.5, 3, 0]},
		{t: 0.55, pos: [9, 3.2, -4], look: [3.4, 3, 0], cut: true},
		{t: 1, pos: [8.4, 3.1, -3.4], look: [3.4, 3, 0]},
	];
	const pulse = 0.25 + ((sec * 0.8) % 1) * 0.35;
	return (
		<>
			<Stage cam={cam}>
				<Bike focus={['sensor']} />
				{SENSORS.map((s, i) => (
					<HudLine key={i} path={ringPath(s, pulse, true)} closed r={0.02} />
				))}
			</Stage>
			<Readout label={lang === 'id' ? 'SENSOR' : 'CRASH SENSORS'} from={0} to={4} unit={lang === 'id' ? 'DI GARPU' : 'ON THE FORK'} at={[0.05, 0.4]} />
			<Callout cam={cam} at={SENSORS[0]} label={lang === 'id' ? 'Sensor tabrakan' : 'Crash sensor'} from={0.1} to={0.5} />
			<Callout cam={cam} at={SENSORS[3]} label={lang === 'id' ? 'Sisi kanan' : 'Other side'} from={0.6} to={0.97} />
		</>
	);
};

const Decide = ({lang}: SceneProps) => {
	const {p} = useScene();
	const cam: CamKey[] = [
		{t: 0, pos: [2, 4.6, 9], look: [1.2, 3.2, 0]},
		{t: 0.5, pos: [1.4, 4.4, 8], look: [1, 3.2, 0]},
		{t: 0.55, pos: [-2.5, 4.2, 6.5], look: [-0.6, 3.3, 0.7], cut: true},
		{t: 1, pos: [-2.1, 4, 5.8], look: [-0.6, 3.3, 0.7]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Bike focus={['ecu', 'sensor']} />
				<HudLine path={[SENSORS[0], [2.4, 2.6, 0.8], [0.6, 3.0, 0.8], ECU]} grow={interpolate(p, [0.05, 0.5], [0, 1], clamp)} arrow r={0.035} />
			</Stage>
			<Callout cam={cam} at={ECU} label={lang === 'id' ? 'ECU airbag' : 'Airbag ECU'} from={0.5} to={0.97} />
		</>
	);
};

const Inflate = ({lang}: SceneProps) => {
	const {p} = useScene();
	const r = ramp(p, 0.1, 0.75, 0.25);
	const bag = interpolate(r.q, [0.15, 0.6], [0, 1], clamp);
	const cam: CamKey[] = [
		{t: 0, pos: [5, 7.4, 10], look: [1.4, 5.2, 0]},
		{t: 0.5, pos: [4.4, 7.2, 9], look: [1.4, 5.2, 0]},
		{t: 0.55, pos: [-3, 7.6, 9], look: [1, 5.4, 0], cut: true},
		{t: 1, pos: [-2.6, 7.4, 8.2], look: [1, 5.4, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Bike bag={bag} focus={['bag']} />
			</Stage>
			<Callout cam={cam} at={[DASH[0] - 0.9, DASH[1] + 1.3, 1.2]} label={lang === 'id' ? 'Airbag' : 'Airbag'} from={0.6} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Straps = ({lang}: SceneProps) => {
	const {p} = useScene();
	const lean = interpolate(p, [0.15, 0.7], [0, 1], clamp);
	const cam: CamKey[] = [
		{t: 0, pos: [3, 7.5, 7], look: [1.3, 5, 0]},
		{t: 0.5, pos: [2.6, 7.3, 6.4], look: [1.3, 5, 0]},
		{t: 0.55, pos: [0, 7.5, 16], look: [1, 4.6, 0], cut: true},
		{t: 1, pos: [0.5, 7.3, 14.5], look: [1, 4.6, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Bike bag={1} lean={lean} focus={['strap']} />
			</Stage>
			<Callout cam={cam} at={[1.2, 4.9, 0.6]} label={lang === 'id' ? 'Tali pengikat' : 'Tether strap'} from={0.08} to={0.5} />
		</>
	);
};

const Finale = () => (
	<>
		<Stage cam={[{t: 0, pos: [-2, 7, 24], look: [1.5, 3.2, 0]}, {t: 1, pos: [-4, 7.5, 27], look: [1.5, 3.4, 0]}]}>
			<Bike x={3.8} bag={1} lean={0.6} />
			<Barrier />
		</Stage>
		<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'SAFETY LAB', 'No. 027'], id: ['BONGKAR PASANG', 'LAB KESELAMATAN', 'No. 027']}} />
	</>
);

export default [Hook, Where, Sensors, Decide, Inflate, Straps, Finale];
