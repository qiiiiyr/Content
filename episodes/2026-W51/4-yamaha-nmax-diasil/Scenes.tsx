import {interpolate} from 'remotion';
import {Engine, HudLine, Readout, Scooter, Stage, Stream, cycleState, mat, pistonY, useFocus, pullBack, useScene, type CamKey} from '../../../src/stage';
import {Callout, TimeTag, ramp} from '../../../src/Looks';
import {PaperTag} from '../../../src/Tag';
import type {SceneProps} from '../../../src/types';

// Yamaha DiASil: an all-aluminium cylinder (about 20% silicon) with no iron sleeve. A cut-open finned cylinder with a
// piston sliding inside; the iron sleeve version for comparison. Animation language: docs/styles.md.
type V3 = [number, number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const MID = 3.8; // cylinder middle height
const WALL = 1.25; // inner radius of the bore

/** Finned aluminium cylinder cut in half (back half only, so the inside shows), a piston at crank angle `deg`, and
 * optionally the iron sleeve (`sleeve` 0 = in place, 1 = lifted out). `specks` shows the silicon. Parts: cylinder, sleeve, piston. */
const Cylinder = ({deg, sleeve, specks = false, focus}: {deg: number; sleeve?: number; specks?: boolean; focus?: string[]}) => {
	const root = useFocus(focus);
	const py = 1.2 + pistonY(deg) * 0.75; // piston height, from the engine kit's motion
	const alu = {color: '#c7ccd2', metalness: 0.85, roughness: 0.38};
	return (
		<group ref={root}>
			<group userData={{part: 'cylinder'}}>
				<mesh position={[0, MID, 0]} castShadow receiveShadow>
					<cylinderGeometry args={[1.75, 1.75, 4, 48, 1, true, Math.PI / 2, Math.PI]} />
					<meshStandardMaterial {...alu} side={2} />
				</mesh>
				<mesh position={[0, MID, 0]}>
					<cylinderGeometry args={[WALL, WALL, 4, 48, 1, true, Math.PI / 2, Math.PI]} />
					<meshStandardMaterial {...alu} side={2} />
				</mesh>
				{Array.from({length: 7}, (_, i) => (
					<mesh key={i} position={[0, MID - 1.7 + i * 0.56, 0]} castShadow>
						<cylinderGeometry args={[2.4, 2.4, 0.12, 48, 1, false, Math.PI / 2, Math.PI]} />
						<meshStandardMaterial {...alu} side={2} />
					</mesh>
				))}
				{specks &&
					Array.from({length: 70}, (_, i) => {
						const a = Math.PI / 2 + ((i * 0.618) % 1) * Math.PI;
						const y = MID - 1.9 + ((i * 0.37) % 1) * 3.8;
						return (
							<mesh key={i} position={[Math.sin(a) * (WALL - 0.02), y, Math.cos(a) * (WALL - 0.02)]}>
								<boxGeometry args={[0.07, 0.07, 0.07]} />
								<meshStandardMaterial color="#5c6670" metalness={0.3} roughness={0.2} />
							</mesh>
						);
					})}
			</group>
			{sleeve !== undefined && (
				<group userData={{part: 'sleeve'}} position={[0, sleeve * 4.8, sleeve * 1.2]}>
					<mesh position={[0, MID, 0]} castShadow>
						<cylinderGeometry args={[WALL - 0.02, WALL - 0.02, 4, 48, 1, true]} />
						<meshStandardMaterial color="#5a5550" metalness={0.6} roughness={0.7} side={2} />
					</mesh>
				</group>
			)}
			<group userData={{part: 'piston'}}>
				<mesh position={[0, py, 0]} castShadow>
					<cylinderGeometry args={[WALL - 0.12, WALL - 0.12, 0.9, 40]} />
					<meshStandardMaterial {...mat.steel} />
				</mesh>
				{[0.25, 0.1].map((dy) => (
					<mesh key={dy} position={[0, py + dy, 0]}>
						<torusGeometry args={[WALL - 0.1, 0.035, 8, 48]} />
						<meshStandardMaterial {...mat.brass} />
					</mesh>
				))}
			</group>
			<mesh position={[0, 0.9, 0]} receiveShadow castShadow>
				<boxGeometry args={[4.6, 0.6, 3.4]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
		</group>
	);
};

const ringAt = (deg: number): V3 => [-0.4, 1.2 + pistonY(deg) * 0.75 + 0.25, WALL - 0.15];

const Hook = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [6, 5, 21], look: [-0.6, 2, 0]},
		{t: 0.4, pos: [5, 4.6, 18], look: [-0.8, 2, 0]},
		{t: 0.45, pos: [0.8, 5.4, 9.5], look: [0, 3.6, 0], cut: true},
		{t: 1, pos: [0.4, 5.1, 8.4], look: [0, 3.6, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				{p < 0.45 ? (
					<Scooter rotation={[0, -0.5, 0]} xray>
						<Engine s={cycleState(sec * 1000, sec)} valves={false} />
					</Scooter>
				) : (
					<Cylinder deg={sec * 600} focus={['cylinder']} />
				)}
			</Stage>
			<Callout cam={cam} at={[-1.75, 2.2, -0.95]} label="Yamaha NMAX" from={0.05} to={0.43} />
			<Callout cam={cam} at={[-WALL, MID + 1, 0]} label={lang === 'id' ? 'Tanpa liner besi' : 'No iron liner'} from={0.55} to={1} />
		</>
	);
};

const Sleeve = ({lang}: SceneProps) => {
	const {p, sec} = useScene();
	const out = interpolate(p, [0.55, 0.85], [0, 1], clamp);
	const cam = pullBack([
		{t: 0, pos: [3, 5, 10], look: [0, 3.6, 0]},
		{t: 0.5, pos: [2.2, 4.8, 9], look: [0, 3.6, 0]},
		{t: 0.55, pos: [-3.5, 7, 13], look: [0, 5.4, 0], cut: true},
		{t: 1, pos: [-3, 7.4, 12], look: [0, 5.8, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Cylinder deg={p < 0.5 ? sec * 600 : 180} sleeve={out} focus={['sleeve']} />
			</Stage>
			<Callout cam={cam} at={() => [-WALL, MID + 1 + out * 4.8, out * 1.2]} label={lang === 'id' ? 'Liner besi cor' : 'Cast-iron sleeve'} from={0.1} to={0.97} />
		</>
	);
};

const DiASil = ({lang}: SceneProps) => {
	const {sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-2.5, 4.4, 9], look: [0, 3.5, 0]},
		{t: 0.5, pos: [-1.6, 4.2, 8], look: [0, 3.5, 0]},
		{t: 0.55, pos: [3.2, 6.5, 8], look: [0, 4.2, 0], cut: true},
		{t: 1, pos: [2.6, 6.2, 7.2], look: [0, 4.2, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Cylinder deg={sec * 500} specks focus={['cylinder']} />
			</Stage>
			<Readout label={lang === 'id' ? 'SILIKON' : 'SILICON'} from={0} to={20} unit="%" at={[0.1, 0.6]} />
			<Callout cam={cam} at={[-1.75, MID - 1, 0]} label="DiASil" from={0.6} to={0.97} />
		</>
	);
};

const Rings = ({lang}: SceneProps) => {
	const {p} = useScene();
	const r = ramp(p, 0.15, 0.8, 0.28);
	const deg = r.q * 540;
	const cam = pullBack([
		{t: 0, pos: [1.2, 4.6, 5], look: [-0.5, 3.6, -0.3]},
		{t: 0.5, pos: [0.8, 4.4, 4.4], look: [-0.5, 3.6, -0.3]},
		{t: 0.55, pos: [-1.8, 3.4, 5], look: [-0.5, 3.4, -0.3], cut: true},
		{t: 1, pos: [-1.4, 3.3, 4.4], look: [-0.5, 3.4, -0.3]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Cylinder deg={deg} specks focus={['piston']} />
			</Stage>
			<Callout cam={cam} at={() => ringAt(deg)} label={lang === 'id' ? 'Ring piston' : 'Piston rings'} from={0.1} to={0.5} />
			<Callout cam={cam} at={[-0.9, MID + 0.6, -0.85]} label={lang === 'id' ? 'Silikon keras' : 'Hard silicon'} from={0.56} to={0.97} />
			<TimeTag show={r.slow} lang={lang} />
		</>
	);
};

const Heat = ({lang}: SceneProps) => {
	const {sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [0.5, 6.5, 11], look: [0, 4, 0]},
		{t: 0.5, pos: [0, 6.2, 10], look: [0, 4, 0]},
		{t: 0.55, pos: [-5, 4.5, 8], look: [-0.8, 3.8, 0], cut: true},
		{t: 1, pos: [-4.4, 4.4, 7.2], look: [-0.8, 3.8, 0]},
	]);
	const paths: V3[][] = [-0.7, 0, 0.7].map((y) => [[-0.2, MID + y, -0.2], [-1.4, MID + y + 0.1, -0.5], [-2.9, MID + y + 0.5, -0.8]]);
	return (
		<>
			<Stage cam={cam}>
				<Cylinder deg={sec * 700} specks focus={['cylinder']} />
				{paths.map((path, i) => (
					<Stream key={i} path={path} t={sec + i * 0.3} color="#ff8a3c" n={10} size={0.08} speed={0.9} />
				))}
				<HudLine path={[[-1.9, MID + 2.4, -0.6], [-3.2, MID + 2.8, -0.9]]} arrow />
			</Stage>
			<Callout cam={cam} at={[-2.4, MID + 0.5, -0.8]} label={lang === 'id' ? 'Panas keluar' : 'Heat out'} from={0.6} to={0.97} side="left" />
		</>
	);
};

const BlueCore = ({lang}: SceneProps) => {
	const {sec} = useScene();
	const cam = pullBack([
		{t: 0, pos: [-1.5, 3.2, 8], look: [-1.6, 2.2, 0.9]},
		{t: 0.5, pos: [-0.8, 3, 7], look: [-1.6, 2.2, 0.9]},
		{t: 0.55, pos: [6, 5, 21], look: [-0.6, 2, 0], cut: true},
		{t: 1, pos: [7, 5.4, 23], look: [-0.6, 2, 0]},
	]);
	return (
		<>
			<Stage cam={cam}>
				<Scooter rotation={[0, -0.5, 0]} xray>
					<Engine s={cycleState(sec * 1000, sec)} valves={false} focus={['head', 'piston']} />
				</Scooter>
			</Stage>
			<Callout cam={cam} at={[-1.75, 2.2, -0.95]} label="Blue Core 155" from={0.1} to={0.95} />
		</>
	);
};

const Finale = () => {
	const {p, sec} = useScene();
	const go = Math.max(0, p - 0.2) ** 2 * 14;
	return (
		<>
			<Stage cam={pullBack([{t: 0, pos: [6, 5, 21], look: [-0.6, 2, 0]}, {t: 1, pos: [8, 5.6, 25], look: [0.5, 2, 0]}])}>
				<Scooter position={[go * 0.88, 0, -go * 0.48]} rotation={[0, -0.5, 0]} wheel={go / 1.1} xray>
					<Engine s={cycleState(sec * 1000, sec)} valves={false} />
				</Scooter>
			</Stage>
			<PaperTag at={0.5} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 026'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 026']}} />
		</>
	);
};

export default [Hook, Sleeve, DiASil, Rings, Heat, BlueCore, Finale];
