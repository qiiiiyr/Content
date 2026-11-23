import type {ReactNode} from "react";
import {Engine, Readout, Stage, Stream, cycleState, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

const FUEL = [[-2.6, 7.4, 0.3], [-1.2, 6.2, 0.3], [-0.45, 4.6, 0.3], [-0.3, 3.0, 0.3]] as [number, number, number][];

// One cylinder; `spray` fuel beads fall from the injector into the intake while the intake valve is open.
const Run = ({cam, from, to, spray = true, children}: {cam: CamKey[]; from: number; to: number; spray?: boolean; children?: ReactNode}) => {
	const {p, sec} = useScene();
	const s = cycleState(from + (to - from) * p, sec);
	return (
		<>
			<Stage cam={cam}>
				<Engine s={s} />
				{spray && (s.intake ?? 0) > 0.05 && <Stream path={FUEL} t={sec} n={10} color="#ffb347" size={0.07} speed={1.4} />}
				<mesh position={[-2.7, 7.6, 0.3]} castShadow>
					<cylinderGeometry args={[0.2, 0.14, 1.1, 16]} />
					<meshStandardMaterial color="#4b525d" metalness={0.7} roughness={0.5} />
				</mesh>
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<Run from={0} to={180} cam={[{t: 0, pos: [-5, 8, 9], look: [-1.5, 6.4, 0]}, {t: 1, pos: [-2, 6.5, 8], look: [-1, 5.6, 0]}]}>
		<Readout label="INJECTOR OPEN" from={0} to={3} unit="milliseconds" at={[0.05, 0.5]} />
	</Run>
);

const Carb = () => {
	const {sec} = useScene();
	const path: [number, number, number][] = [[-6, 3, 0], [-2, 3, 0], [2, 3, 0], [6, 3, 0]];
	return (
		<Stage cam={[{t: 0, pos: [0, 4.5, 15], look: [0, 3, 0]}, {t: 1, pos: [2, 4, 11], look: [0.5, 3, 0]}]}>
			<mesh position={[0, 3, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
				<cylinderGeometry args={[1.3, 0.55, 3, 32, 1, true]} />
				<meshPhysicalMaterial color="#d6ecf0" transparent opacity={0.22} side={2} depthWrite={false} />
			</mesh>
			<mesh position={[0, 3, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
				<cylinderGeometry args={[0.55, 1.3, 3, 32, 1, true]} />
				<meshPhysicalMaterial color="#d6ecf0" transparent opacity={0.22} side={2} depthWrite={false} />
			</mesh>
			<Stream path={path} t={sec} n={18} speed={0.6} />
			<Stream path={[[0, 0.6, 0], [0, 2.2, 0], [0, 3, 0]]} t={sec} n={6} color="#ffb347" size={0.09} speed={0.5} />
			<mesh position={[0, 1.2, 0]} castShadow>
				<cylinderGeometry args={[0.9, 0.9, 1.2, 24]} />
				<meshStandardMaterial color="#d9ad4f" metalness={0.95} roughness={0.28} />
			</mesh>
		</Stage>
	);
};

const Sensors = () => <Run from={0} to={180} spray={false} cam={[{t: 0, pos: [4, 6, 12], look: [0, 4.5, 0]}, {t: 1, pos: [-4, 6, 11], look: [-1, 4.5, 0]}]} />;
const Timed = () => <Run from={0} to={180} cam={[{t: 0, pos: [-6, 8, 8], look: [-1.5, 6, 0]}, {t: 1, pos: [-3, 6, 7], look: [-0.5, 5, 0]}]} />;
const Direct = () => <Run from={0} to={360} cam={[{t: 0, pos: [0, 5, 14], look: [0, 4, 0]}, {t: 1, pos: [2, 6.5, 9], look: [0, 4.8, 0]}]} />;
const Mix = () => <Run from={0} to={180} cam={[{t: 0, pos: [3, 6, 9], look: [0, 4, 0]}, {t: 1, pos: [0, 5, 14], look: [0, 3.5, 0]}]}><Readout label="AIR : FUEL" from={0} to={14.7} unit="to 1" decimals={1} at={[0.05, 0.6]} /></Run>;
const Finale = () => (
	<Run from={0} to={720} cam={[{t: 0, pos: [0, 4, 26], look: [0, 3, 0]}, {t: 1, pos: [0, 4.5, 30], look: [0, 3, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 009'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 009']}} />
	</Run>
);

export default [Hook, Carb, Sensors, Timed, Direct, Mix, Finale];
