import {interpolate} from 'remotion';
import {Engine, Gear, Rod, Stage, cycleState, mat, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const FZ = 1.6; // flywheel sits on a stub of crankshaft in front of the engine

// crank angle over `cycles` four-stroke cycles; `lurch` > 0 makes it rush on the power stroke and drag on the other three
const crank = (p: number, cycles: number, lurch: number) => {
	const c = p * cycles;
	const x = c % 1;
	return 720 * (Math.floor(c) + x - lurch * Math.sin(2 * Math.PI * (x - 0.125)));
};

const Setup = ({cam, cycles = 3, lurch = 0.03, fly = 1, starter}: {cam: CamKey[]; cycles?: number; lurch?: number; fly?: number; starter?: number}) => {
	const {p, sec} = useScene();
	const deg = crank(p, cycles, lurch);
	const a = (-deg * Math.PI) / 180;
	return (
		<Stage cam={cam}>
			<Engine s={cycleState(deg, sec)} />
			{fly > 0 && (
				<group scale={fly}>
					<Rod from={[0, 1.2, 0.3]} to={[0, 1.2, FZ]} r={0.16} />
					<Gear r={1.15} teeth={40} width={0.45} angle={a} position={[0, 1.2, FZ]} material={mat.steel} />
				</group>
			)}
			{starter !== undefined && (
				<group position={[1.27, 2.27, FZ + (1 - starter) * 0.8]}>
					<Gear r={0.3} teeth={10} width={0.4} angle={(-a * 1.15) / 0.3} material={mat.brass} />
					<mesh position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
						<cylinderGeometry args={[0.45, 0.45, 1.4, 24]} />
						<meshPhysicalMaterial {...mat.red} />
					</mesh>
				</group>
			)}
		</Stage>
	);
};

const Hook = () => <Setup fly={0} lurch={0.14} cycles={2} cam={[{t: 0, pos: [0, 4.4, 22], look: [0, 2.6, 0]}, {t: 1, pos: [2, 4.4, 13], look: [0, 2.8, 0]}]} />;
const OneInFour = () => <Setup fly={0} lurch={0.14} cycles={1.5} cam={[{t: 0, pos: [4, 6, 9], look: [0, 3.6, 0]}, {t: 1, pos: [3, 3.4, 10], look: [0, 2.4, 0]}]} />;
const Appear = () => {
	const {p} = useScene();
	return <Setup fly={interpolate(p, [0.2, 0.5], [0.01, 1], clamp)} cam={[{t: 0, pos: [5, 3.5, 10], look: [0, 2, 0.8]}, {t: 1, pos: [4, 3, 8], look: [0, 1.6, 1]}]} />;
};
const SpeedUp = () => <Setup lurch={0.04} cycles={2} cam={[{t: 0, pos: [-3, 2.8, 7.5], look: [0, 1.4, FZ]}, {t: 1, pos: [-1.5, 3.4, 6.2], look: [0, 1.4, FZ]}]} />;
const GiveBack = () => <Setup lurch={0.04} cycles={2} cam={[{t: 0, pos: [4, 6.5, 9], look: [0, 3, 0.6]}, {t: 1, pos: [3, 3.2, 9.5], look: [0, 2, 0.8]}]} />;
const Starter = () => {
	const {p} = useScene();
	return <Setup cycles={1} starter={interpolate(p, [0.1, 0.35], [0, 1], clamp)} cam={[{t: 0, pos: [4, 4.5, 7.5], look: [0.6, 1.8, FZ]}, {t: 1, pos: [2.6, 3.4, 6], look: [0.8, 1.8, FZ]}]} />;
};

const Finale = () => (
	<>
		<Setup cycles={3} cam={[{t: 0, pos: [0, 4, 21], look: [0, 1.4, 0]}, {t: 1, pos: [0, 4.6, 26], look: [0, 1.4, 0]}]} />
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 005'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 005']}} />
	</>
);

export default [Hook, OneInFour, Appear, SpeedUp, GiveBack, Starter, Finale];
