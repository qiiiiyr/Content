import {interpolate} from 'remotion';
import {Engine, SparkPlug, Stage, cycleState, mat, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

// one oversized plug held in a bench clamp, tip 1.1 above the bench
const Plug = ({cam, spark, gap}: {cam: CamKey[]; spark: number; gap?: number}) => (
	<Stage cam={cam}>
		<SparkPlug spark={spark} gap={gap} position={[0, 1.4, 0]} />
		<mesh position={[0, 1.6, -0.9]} castShadow>
			<boxGeometry args={[0.5, 3.2, 0.5]} />
			<meshStandardMaterial {...mat.dark} />
		</mesh>
		<mesh position={[0, 3.25, -0.45]} castShadow>
			<boxGeometry args={[0.35, 0.3, 0.9]} />
			<meshStandardMaterial {...mat.brass} />
		</mesh>
	</Stage>
);

// a spark every so often, as a short sharp flash
const flashes = (sec: number, perSec: number) => {
	const u = (sec * perSec) % 1;
	return u < 0.25 ? 1 - u / 0.25 : 0;
};

const Hook = () => {
	const {sec} = useScene();
	return <Plug spark={flashes(sec, 3)} cam={[{t: 0, pos: [0, 2.6, 13], look: [0, 2.2, 0]}, {t: 1, pos: [0.6, 1.4, 4.2], look: [0, 0.9, 0]}]} />;
};
const Anatomy = () => <Plug spark={0} cam={[{t: 0, pos: [2.5, 6.2, 6], look: [0, 3.6, 0]}, {t: 1, pos: [2.2, 2.0, 6], look: [0, 1.4, 0]}]} />;
const Gap = () => <Plug spark={0} cam={[{t: 0, pos: [-1.6, 1.6, 4], look: [0, 0.8, 0]}, {t: 1, pos: [0.4, 1.2, 2.6], look: [0, 0.7, 0]}]} />;

// the coil climbs: faint flickers that grow until the gap breaks down
const Voltage = () => {
	const {p, sec} = useScene();
	const k = interpolate(p, [0, 0.9], [0, 0.6], {extrapolateRight: 'clamp'});
	return <Plug spark={k * (0.5 + 0.5 * Math.sin(sec * 40))} cam={[{t: 0, pos: [2.4, 4.2, 5], look: [0, 2.2, 0]}, {t: 1, pos: [1.2, 1.8, 3.4], look: [0, 0.9, 0]}]} />;
};

// the spark inside a cylinder, lighting the squeezed mix
const Fire = () => {
	const {p, sec} = useScene();
	return (
		<Stage cam={[{t: 0, pos: [3, 6.2, 8], look: [0, 4.4, 0]}, {t: 1, pos: [0, 4.4, 10], look: [0, 3.6, 0]}]}>
			<Engine s={cycleState(300 + p * 180, sec)} />
		</Stage>
	);
};

// the gap widens with wear; sparks come less and less, then stop
const Wear = () => {
	const {p, sec} = useScene();
	const gap = interpolate(p, [0, 0.8], [0.28, 0.6], {extrapolateRight: 'clamp'});
	return <Plug gap={gap} spark={p < 0.75 ? flashes(sec, 3) * (1 - p) : 0} cam={[{t: 0, pos: [-2.4, 1.8, 4.2], look: [0, 0.8, 0]}, {t: 1, pos: [-0.8, 1.4, 3.2], look: [0, 0.7, 0]}]} />;
};

const Finale = () => {
	const {sec} = useScene();
	return (
		<>
			<Plug spark={flashes(sec, 2)} cam={[{t: 0, pos: [0, 3.5, 14], look: [0, 1.2, 0]}, {t: 1, pos: [0, 4, 18], look: [0, 1.2, 0]}]} />
			<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 003'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 003']}} />
		</>
	);
};

export default [Hook, Anatomy, Gap, Voltage, Fire, Wear, Finale];
