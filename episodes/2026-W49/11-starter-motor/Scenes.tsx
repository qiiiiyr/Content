import {Gear, Readout, Stage, mat, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import {interpolate} from 'remotion';
import type {ReactNode} from 'react';

const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const MESH = 3.9; // distance between ring gear and pinion axes when engaged

// Ring gear (flywheel) with a starter pinion on its right. `reach` 0..1 slides the pinion in; `ring` is the flywheel angle.
const Start = ({cam, reach, ring, children}: {cam: CamKey[]; reach: number; ring: number; children?: ReactNode}) => (
	<>
		<Stage cam={cam}>
			<Gear r={3.2} teeth={60} width={0.5} angle={ring} position={[-1, 3.6, 0]} material={mat.steel} />
			<mesh position={[-1, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[1.0, 1.0, 0.7, 32]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
			<Gear r={0.65} teeth={12} width={0.5} angle={-ring * 5} position={[-1 + MESH + (1 - reach) * 2.5, 3.6, 0]} />
			<mesh position={[-1 + MESH + 2.4 + (1 - reach) * 2.5, 3.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
				<cylinderGeometry args={[0.9, 0.9, 2.4, 24]} />
				<meshStandardMaterial {...mat.dark} />
			</mesh>
		</Stage>
		{children}
	</>
);

const Hook = () => {
	const {p, sec} = useScene();
	return (
		<Start reach={interpolate(p, [0, 0.2], [0, 1], c)} ring={sec * 2.2 * interpolate(p, [0.2, 0.3], [0, 1], c)} cam={[{t: 0, pos: [3, 5, 14], look: [1.5, 3.6, 0]}, {t: 1, pos: [2, 4.5, 11], look: [1.5, 3.6, 0]}]}>
			<Readout label="CRANKING" from={0} to={250} unit="rpm, roughly" at={[0.2, 0.5]} />
		</Start>
	);
};
const Turn = () => {
	const {sec} = useScene();
	return <Start reach={1} ring={sec * 0.8} cam={[{t: 0, pos: [-6, 5, 13], look: [-1, 3.6, 0]}, {t: 1, pos: [-2, 5, 14], look: [-1, 3.6, 0]}]} />;
};
const Slide = () => {
	const {p, sec} = useScene();
	return <Start reach={interpolate(p, [0.1, 0.6], [0, 1], c)} ring={sec * 0.8 * interpolate(p, [0.55, 0.7], [0, 1], c)} cam={[{t: 0, pos: [8, 5, 12], look: [2.5, 3.6, 0]}, {t: 1, pos: [4, 5.5, 9], look: [2.5, 3.6, 0]}]} />;
};
const Lever = () => {
	const {sec} = useScene();
	return <Start reach={1} ring={sec * 0.5} cam={[{t: 0, pos: [0, 4, 16], look: [0.5, 3.6, 0]}, {t: 1, pos: [3, 5, 9], look: [2, 3.6, 0]}]} />;
};
const Fast = () => {
	const {p, sec} = useScene();
	return <Start reach={1} ring={sec * (0.8 + 7 * interpolate(p, [0.3, 0.6], [0, 1], c))} cam={[{t: 0, pos: [-3, 5, 12], look: [0, 3.6, 0]}, {t: 1, pos: [4, 5, 11], look: [1.5, 3.6, 0]}]} />;
};
const Free = () => {
	const {p, sec} = useScene();
	return <Start reach={interpolate(p, [0.3, 0.8], [1, 0], c)} ring={sec * 5} cam={[{t: 0, pos: [5, 5, 10], look: [2.5, 3.6, 0]}, {t: 1, pos: [8, 5, 10], look: [3.5, 3.6, 0]}]} />;
};
const Finale = () => {
	const {sec} = useScene();
	return (
		<Start reach={0} ring={sec * 3} cam={[{t: 0, pos: [3, 4.5, 22], look: [2, 3, 0]}, {t: 1, pos: [3, 5, 27], look: [2, 3, 0]}]}>
			<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 018'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 018']}} />
		</Start>
	);
};

export default [Hook, Turn, Slide, Lever, Fast, Free, Finale];
