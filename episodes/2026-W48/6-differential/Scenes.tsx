import {interpolate} from 'remotion';
import {Differential, Stage, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const W = 2.6; // average wheel speed, radians per second

// `split` = how much faster the right (outer) wheel turns than the left, as a fraction of W
const Axle = ({cam, split = () => 0, left, right, ice = false}: {cam: CamKey[]; split?: (p: number) => number; left?: number; right?: number; ice?: boolean}) => {
	const {p, sec} = useScene();
	const d = W * sec * split(p) * 0.5;
	return (
		<Stage cam={cam}>
			<Differential left={left ?? W * sec - d} right={right ?? W * sec + d} />
			{ice && (
				<mesh position={[-3.5, 0.03, 0]}>
					<boxGeometry args={[2.4, 0.06, 2.6]} />
					<meshPhysicalMaterial color="#cfeefa" transparent opacity={0.7} roughness={0.05} clearcoat={1} />
				</mesh>
			)}
		</Stage>
	);
};

const turn = (p: number) => interpolate(p, [0.2, 0.55], [0, 0.6], clamp);

const Hook = () => <Axle split={() => 0.6} cam={[{t: 0, pos: [9, 6, 16], look: [0, 1.2, 0]}, {t: 1, pos: [12, 4, 9], look: [0, 1.2, 0]}]} />;
const Arc = () => <Axle split={() => 0.6} cam={[{t: 0, pos: [-10, 3, 8], look: [0, 1.2, 0]}, {t: 1, pos: [-12, 4.4, 4], look: [0, 1.2, 0]}]} />;
const Split = () => <Axle cam={[{t: 0, pos: [3, 6, 10], look: [0, 1.4, 0]}, {t: 1, pos: [1.5, 4.2, 7], look: [0, 1.4, 0]}]} />;
const Ring = () => <Axle cam={[{t: 0, pos: [-3, 3.6, 8.5], look: [-0.6, 1.2, 1]}, {t: 1, pos: [-1.5, 4.5, 6.5], look: [-0.4, 1.4, 0.6]}]} />;
const Straight = () => <Axle cam={[{t: 0, pos: [2, 7, 6], look: [0, 1.4, 0]}, {t: 1, pos: [-1, 6.4, 5], look: [0, 1.4, 0]}]} />;
const Turn = () => <Axle split={turn} cam={[{t: 0, pos: [-1, 6.4, 5], look: [0, 1.4, 0]}, {t: 1, pos: [6, 6, 12], look: [0, 1.2, 0]}]} />;
const Ice = () => {
	const {sec} = useScene();
	return <Axle ice left={W * 2 * sec} right={0} cam={[{t: 0, pos: [-9, 5, 10], look: [-1.5, 1, 0]}, {t: 1, pos: [-7, 3.6, 7], look: [-2, 1, 0]}]} />;
};

const Finale = () => (
	<>
		<Axle split={() => 0.4} cam={[{t: 0, pos: [0, 5, 24], look: [0, 0.4, 0]}, {t: 1, pos: [0, 5.6, 29], look: [0, 0.4, 0]}]} />
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'DRIVE LAB', 'No. 007'], id: ['BONGKAR PASANG', 'LAB PENGGERAK', 'No. 007']}} />
	</>
);

export default [Hook, Arc, Split, Ring, Straight, Turn, Ice, Finale];
