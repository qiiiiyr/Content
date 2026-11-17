import {Engine, Stage, cycleState, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

// One cylinder, one stroke per scene. Crank angle runs across the scene, so the stroke always matches the narration.
const Stroke = ({from, to, cam, turns = 1}: {from: number; to: number; cam: CamKey[]; turns?: number}) => {
	const {p, sec} = useScene();
	return (
		<Stage cam={cam}>
			<Engine s={cycleState(from + (to - from) * p * turns, sec)} />
		</Stage>
	);
};

const Hook = () => {
	const {p, sec} = useScene();
	return (
		<Stage cam={[{t: 0, pos: [0, 4, 24], look: [0, 3.4, 0]}, {t: 1, pos: [2, 4.4, 11], look: [0, 4, 0]}]}>
			<Engine s={cycleState(p * 2160 + 300, sec)} />
		</Stage>
	);
};

const Intake = () => <Stroke from={0} to={180} cam={[{t: 0, pos: [4, 6.5, 10], look: [0, 4.4, 0]}, {t: 1, pos: [2, 5, 9], look: [0, 3.6, 0]}]} />;
const Compression = () => <Stroke from={180} to={360} cam={[{t: 0, pos: [-4, 4.5, 9], look: [0, 3.6, 0]}, {t: 1, pos: [-3, 6, 8], look: [0, 4.6, 0]}]} />;
const Power = () => <Stroke from={360} to={540} cam={[{t: 0, pos: [3, 6, 8], look: [0, 4.8, 0]}, {t: 1, pos: [0, 3.2, 11], look: [0, 3, 0]}]} />;
const Exhaust = () => <Stroke from={540} to={720} cam={[{t: 0, pos: [-3, 3.5, 10], look: [0, 3.4, 0]}, {t: 1, pos: [-2, 7, 8], look: [0, 5, 0]}]} />;
const Crank = () => <Stroke from={0} to={720} turns={2} cam={[{t: 0, pos: [5, 2.5, 9], look: [0, 1.6, 0]}, {t: 1, pos: [0, 4, 15], look: [0, 3.2, 0]}]} />;

const Finale = () => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={[{t: 0, pos: [0, 4, 28], look: [0, 1.6, 0]}, {t: 1, pos: [0, 4.5, 34], look: [0, 1.6, 0]}]}>
				{[0, 180, 360, 540].map((o, i) => (
					<Engine key={o} x={(i - 1.5) * 2.5} scale={0.45} s={cycleState(p * 2880 + o, sec)} />
				))}
			</Stage>
			<PaperTag at={0.45} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 001'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 001']}} />
		</>
	);
};

export default [Hook, Intake, Compression, Power, Exhaust, Crank, Finale];
