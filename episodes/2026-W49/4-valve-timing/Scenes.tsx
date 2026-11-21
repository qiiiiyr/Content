import {Engine, Readout, Rod, Stage, cycleState, useScene, mat, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import type {ReactNode} from 'react';

// Intake valve opening scaled by `k` (bigger lift) and stretched by `wide` (open longer than the standard 180 degrees).
const breath = (deg: number, sec: number, k: number) => {
	const s = cycleState(deg, sec);
	return {...s, intake: Math.min(1, (s.intake ?? 0) * k)};
};

const Cyl = ({cam, k, x = 0, scale = 1, from = 0, turns = 2}: {cam: CamKey[]; k: number; x?: number; scale?: number; from?: number; turns?: number}) => {
	const {p, sec} = useScene();
	return (
		<Stage cam={cam}>
			<Engine x={x} scale={scale} s={breath(from + p * 720 * turns, sec, k)} />
		</Stage>
	);
};

const Pair = ({cam, left, right, children}: {cam: CamKey[]; left: number; right: number; children?: ReactNode}) => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<Engine x={-2.4} scale={0.55} s={breath(p * 1440, sec, left)} />
				<Engine x={2.4} scale={0.55} s={breath(p * 1440, sec, right)} />
			</Stage>
			{children}
		</>
	);
};

// A cam lobe (egg shape) lifting a follower; lobe size in `lift`.
const Lobe = ({lift, cam}: {lift: number; cam: CamKey[]}) => {
	const {p, sec} = useScene();
	const a = sec * 2.5;
	const h = Math.max(0, Math.cos(a)) * lift;
	return (
		<Stage cam={cam}>
			<group position={[0, 3.2, 0]}>
				<group rotation={[0, 0, a]}>
					<mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
						<cylinderGeometry args={[1, 1, 0.8, 40]} />
						<meshStandardMaterial {...mat.dark} />
					</mesh>
					<mesh position={[0, 0.7 * lift / 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.7, 1, 1.1]} castShadow>
						<cylinderGeometry args={[0.9, 0.9, 0.8, 40]} />
						<meshStandardMaterial {...mat.brass} />
					</mesh>
				</group>
				<Rod from={[0, 1.35 + h, 0]} to={[0, 3.4 + h, 0]} r={0.12} />
				<mesh position={[0, 1.35 + h, 0]} castShadow>
					<cylinderGeometry args={[0.45, 0.45, 0.14, 24]} />
					<meshStandardMaterial {...mat.steel} />
				</mesh>
			</group>
		</Stage>
	);
};

const Hook = () => (
	<Pair left={0.35} right={1} cam={[{t: 0, pos: [0, 5, 20], look: [0, 3, 0]}, {t: 1, pos: [0, 5.5, 14], look: [0, 3.6, 0]}]}>
		<Readout label="ENGINE SPEED" from={1000} to={7000} unit="rpm" at={[0.1, 0.9]} />
	</Pair>
);
const LobeScene = () => <Lobe lift={0.6} cam={[{t: 0, pos: [5, 5, 10], look: [0, 3.6, 0]}, {t: 1, pos: [-3, 5, 9], look: [0, 3.6, 0]}]} />;
const Low = () => <Cyl k={0.4} cam={[{t: 0, pos: [3, 6, 10], look: [0, 4.4, 0]}, {t: 1, pos: [0, 5.2, 9], look: [0, 4.2, 0]}]} />;
const High = () => <Cyl k={1} turns={4} cam={[{t: 0, pos: [-3, 6, 10], look: [0, 4.4, 0]}, {t: 1, pos: [0, 5.5, 8], look: [0, 4.4, 0]}]} />;
const Switch = () => <Lobe lift={1.0} cam={[{t: 0, pos: [-4, 5, 10], look: [0, 3.6, 0]}, {t: 1, pos: [4, 5, 9], look: [0, 3.8, 0]}]} />;
const Shift = () => <Pair left={0.7} right={0.7} cam={[{t: 0, pos: [-5, 5.5, 16], look: [0, 3.8, 0]}, {t: 1, pos: [4, 6, 14], look: [0, 3.8, 0]}]} />;
const Finale = () => (
	<>
		<Cyl k={0.8} x={0} scale={0.9} turns={3} cam={[{t: 0, pos: [0, 4, 26], look: [0, 2, 0]}, {t: 1, pos: [0, 4.5, 30], look: [0, 2, 0]}]} />
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 011'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 011']}} />
	</>
);

export default [Hook, LobeScene, Low, High, Switch, Shift, Finale];
