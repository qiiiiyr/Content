import {interpolate} from 'remotion';
import {Engine, HudLine, Readout, Rod, Scooter, Stage, cycleState, mat, useFocus, useScene, type CamKey} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Honda eSP+ offset cylinder: the bore's centreline sits beside the crank centre, so during the power stroke the rod
// leans less and pushes the piston less into the wall. The offset is drawn bigger than 4 mm so it can be seen.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const R = 0.9; // crank radius
const L = 2.6; // rod length
const C = 1.4; // crank centre height
const TOP = 5.6; // underside of the head
const OFF = 0.35; // exaggerated offset

const pistonAt = (deg: number, off: number) => {
	const a = (deg * Math.PI) / 180;
	const pin: V3 = [R * Math.sin(a), C + R * Math.cos(a), 0.15];
	const dx = off - pin[0];
	return {pin, y: pin[1] + Math.sqrt(L * L - dx * dx), lean: dx / L};
};

/** How hard the gas pushes, 0..1: strong just after the top of the power stroke, gone by the bottom. */
const push = (deg: number) => {
	const d = ((deg % 360) + 360) % 360;
	return d < 150 ? Math.max(0, 1 - d / 150) * Math.min(1, d / 8 + 0.3) : 0;
};

/** One cylinder, cut open: crank, rod, piston, glass bore offset by `off`. Parts: crank, piston, bore. */
const Bore = ({deg, off, focus, side = true}: {deg: number; off: number; focus?: string[]; side?: boolean}) => {
	const root = useFocus(focus);
	const {pin, y, lean} = pistonAt(deg, off);
	const g = push(deg);
	const gasH = Math.max(0.05, TOP - (y + 0.4));
	const thrust = Math.abs(lean) * g * 5; // side push on the wall, drawn to scale between the two cases
	return (
		<group>
			<group ref={root}>
				<group userData={{part: 'crank'}}>
					<mesh position={[0, C, -0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
						<cylinderGeometry args={[1.25, 1.25, 0.3, 48]} />
						<meshStandardMaterial {...mat.brass} />
					</mesh>
					<mesh position={[pin[0], pin[1], 0.05]} rotation={[Math.PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.2, 0.2, 0.4, 20]} />
						<meshPhysicalMaterial {...mat.red} />
					</mesh>
					<mesh position={[0, C * 0.4, -0.25]} castShadow receiveShadow>
						<boxGeometry args={[3.2, C * 0.8, 1.8]} />
						<meshStandardMaterial {...mat.dark} />
					</mesh>
				</group>
				<group userData={{part: 'piston'}}>
					<Rod from={pin} to={[off, y, 0.15]} r={0.13} />
					<mesh position={[off, y + 0.2, 0]} castShadow>
						<cylinderGeometry args={[0.86, 0.86, 0.75, 40]} />
						<meshStandardMaterial {...mat.steel} />
					</mesh>
				</group>
				<group userData={{part: 'bore'}}>
					<mesh position={[off, 4.1, 0]} renderOrder={2}>
						<cylinderGeometry args={[0.92, 0.92, 3.1, 40, 1, true]} />
						<meshPhysicalMaterial color="#d6ecf0" transparent opacity={0.2} side={2} roughness={0.05} clearcoat={1} depthWrite={false} />
					</mesh>
					<mesh position={[off, TOP + 0.25, 0]} castShadow>
						<boxGeometry args={[2.4, 0.5, 2.2]} />
						<meshStandardMaterial {...mat.dark} />
					</mesh>
				</group>
			</group>
			{/* burning gas above the crown */}
			<mesh position={[off, TOP - gasH / 2, 0]}>
				<cylinderGeometry args={[0.88, 0.88, gasH, 40]} />
				<meshStandardMaterial color="#ff8a1f" transparent opacity={0.25 + 0.5 * g} emissive="#ff8a1f" emissiveIntensity={g * 2.6} depthWrite={false} />
			</mesh>
			{side && thrust > 0.05 && <HudLine path={[[off - 0.95, y + 0.2, 0.6], [off - 0.95 - thrust, y + 0.2, 0.6]]} arrow r={0.06} />}
		</group>
	);
};

/** Two thin centre lines: crankshaft (x=0) and cylinder (x=off). */
const Centres = ({off, grow = 1}: {off: number; grow?: number}) => (
	<>
		<HudLine path={[[0, 0.2, 1.1], [0, 6.6, 1.1]]} grow={grow} r={0.025} />
		<HudLine path={[[off, 6.6, 1.1], [off, 0.2, 1.1]]} grow={grow} r={0.025} />
	</>
);

const ENGINE_IN_SCOOTER: V3 = [-1.65, 2.2, 1.13]; // engine of the scooter below (rotated 0.6)

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam: CamKey[] = [
		{t: 0, pos: [-6, 5, 22], look: [-0.6, 2, 0]},
		{t: 0.4, pos: [-5, 4.6, 19], look: [-0.8, 2, 0]},
		{t: 0.45, pos: [1.5, 4.4, 11], look: [0.2, 3.2, 0], cut: true},
		{t: 1, pos: [1, 4.2, 9.8], look: [0.2, 3.3, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				{p < 0.45 ? (
					<Scooter rotation={[0, 0.6, 0]} xray>
						<Engine s={cycleState(sec * 1000, sec)} valves={false} />
					</Scooter>
				) : (
					<>
						<Bore deg={sec * 400} off={OFF} side={false} />
						<Centres off={OFF} grow={interpolate(p, [0.5, 0.75], [0, 1], clamp)} />
					</>
				)}
			</Stage>
			<Callout cam={cam} at={ENGINE_IN_SCOOTER} label="Honda eSP+" from={0.05} to={0.43} />
			<Callout cam={cam} at={[OFF, 6.2, 1.1]} label={lang === 'id' ? 'Geser (dibesarkan)' : 'Offset (exaggerated)'} from={0.7} to={1} />
		</>
	);
};

const FourMm = ({lang}: SceneProps) => {
	const {sec} = useScene();
	const cam: CamKey[] = [
		{t: 0, pos: [0.4, 5.6, 8.5], look: [0.2, 4.6, 0]},
		{t: 0.5, pos: [0.2, 5.4, 7.6], look: [0.2, 4.6, 0]},
		{t: 0.55, pos: [3.5, 2.6, 9.5], look: [0, 2.4, 0], cut: true},
		{t: 1, pos: [3, 2.5, 8.6], look: [0, 2.4, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Bore deg={sec * 300} off={OFF} focus={['bore']} side={false} />
				<Centres off={OFF} />
			</Stage>
			<Readout label={lang === 'id' ? 'GESER' : 'OFFSET'} from={0} to={4} unit="MM" at={[0.05, 0.5]} />
			<Callout cam={cam} at={[OFF, 6.4, 1.1]} label={lang === 'id' ? 'Tengah silinder' : 'Cylinder centre'} from={0.08} to={0.5} side="right" />
			<Callout cam={cam} at={[0, C, 1.1]} label={lang === 'id' ? 'Tengah poros engkol' : 'Crank centre'} from={0.58} to={0.97} side="left" />
		</>
	);
};

const Bang = ({lang}: SceneProps) => {
	const {p} = useScene();
	const deg = interpolate(p, [0, 0.25, 1], [330, 360, 480], clamp);
	const cam: CamKey[] = [
		{t: 0, pos: [3, 6.4, 8], look: [0, 4.8, 0]},
		{t: 0.45, pos: [2.4, 6.1, 7.2], look: [0, 4.6, 0]},
		{t: 0.5, pos: [-3.5, 4.2, 10], look: [0, 3.4, 0], cut: true},
		{t: 1, pos: [-3, 4, 9.2], look: [0, 3.3, 0]},
	];
	const {y} = pistonAt(deg, 0);
	return (
		<>
			<Stage cam={cam}>
				<Bore deg={deg} off={0} focus={['piston']} side={false} />
				{push(deg) > 0.1 && <HudLine path={[[0, y + 1.6, 0.9], [0, y + 0.7, 0.9]]} arrow r={0.07} />}
			</Stage>
			<Callout cam={cam} at={() => [0, pistonAt(deg, 0).y + 0.5, 0.9]} label={lang === 'id' ? 'Piston' : 'Piston'} from={0.3} to={0.95} />
		</>
	);
};

const Sideways = ({lang}: SceneProps) => {
	const {p} = useScene();
	const r = ramp(p, 0.1, 0.75, 0.3);
	const deg = 360 + r.q * 330;
	const cam: CamKey[] = [
		{t: 0, pos: [0, 4.4, 10], look: [0, 3.5, 0]},
		{t: 0.5, pos: [-0.6, 4.2, 9], look: [-0.2, 3.5, 0]},
		{t: 0.55, pos: [-4, 5, 7], look: [-0.6, 4.2, 0], cut: true},
		{t: 1, pos: [-3.4, 4.8, 6.4], look: [-0.6, 4.2, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Bore deg={deg} off={0} focus={['piston']} />
			</Stage>
			<Callout cam={cam} at={() => [-0.92, pistonAt(deg, 0).y + 0.2, 0.6]} label={lang === 'id' ? 'Gesekan' : 'Friction'} from={0.2} to={0.95} side="left" />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Upright = ({lang}: SceneProps) => {
	const {p} = useScene();
	const deg = 360 + interpolate(p, [0, 1], [0, 330]);
	const cam: CamKey[] = [
		{t: 0, pos: [0.4, 4.4, 10], look: [0.3, 3.5, 0]},
		{t: 0.5, pos: [0, 4.2, 9], look: [0.2, 3.5, 0]},
		{t: 0.55, pos: [4, 3.6, 8], look: [0.4, 3, 0], cut: true},
		{t: 1, pos: [3.4, 3.5, 7.3], look: [0.4, 3, 0]},
	];
	return (
		<>
			<Stage cam={cam}>
				<Bore deg={deg} off={OFF} focus={['piston']} />
				<Centres off={OFF} />
			</Stage>
			<Callout cam={cam} at={() => {
				const s = pistonAt(deg, OFF);
				return [(s.pin[0] + OFF) / 2, (s.pin[1] + s.y) / 2, 0.15];
			}} label={lang === 'id' ? 'Setang lebih tegak' : 'Rod more upright'} from={0.1} to={0.95} />
		</>
	);
};

const Crank = ({lang}: SceneProps) => {
	const {sec} = useScene();
	const cam: CamKey[] = [
		{t: 0, pos: [3.5, 2.6, 8.5], look: [0, 2.2, 0]},
		{t: 0.5, pos: [2.6, 2.4, 7.6], look: [0, 2.1, 0]},
		{t: 0.55, pos: [-6, 5, 22], look: [-0.6, 2, 0], cut: true},
		{t: 1, pos: [-6.5, 5.2, 24], look: [-0.6, 2, 0]},
	];
	const {p} = useScene();
	return (
		<>
			<Stage cam={cam}>
				{p < 0.55 ? (
					<Bore deg={sec * 500} off={OFF} focus={['crank']} />
				) : (
					<Scooter rotation={[0, 0.6, 0]} xray>
						<Engine s={cycleState(sec * 1000, sec)} valves={false} focus={['crank']} />
					</Scooter>
				)}
			</Stage>
			<Callout cam={cam} at={[0, C, 0.2]} label={lang === 'id' ? 'Poros engkol' : 'Crankshaft'} from={0.08} to={0.52} />
		</>
	);
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={[{t: 0, pos: [-6, 5, 22], look: [-0.6, 2, 0]}, {t: 1, pos: [-8, 5.6, 25], look: [-0.6, 2.2, 0]}]}>
				<Scooter rotation={[0, 0.6, 0]} xray>
					<Engine s={cycleState(sec * 1000, sec)} valves={false} />
				</Scooter>
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 024'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 024']}} />
		</>
	);
};

export default [Hook, FourMm, Bang, Sideways, Upright, Crank, Finale];
