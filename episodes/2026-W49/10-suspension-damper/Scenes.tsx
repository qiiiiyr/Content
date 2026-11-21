import {Damper, Stage, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import type {ReactNode} from 'react';

// `comp(p, sec)` is how squashed the strut is, 0..1. Heat warms the oil as the damper works.
const Strut = ({cam, comp, heat = 0, children}: {cam: CamKey[]; comp: (p: number, sec: number) => number; heat?: number; children?: ReactNode}) => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<Damper comp={comp(p, sec)} heat={heat} position={[0, 0, 0]} />
			</Stage>
			{children}
		</>
	);
};

const bounce = (p: number, sec: number) => 0.5 + 0.5 * Math.sin(sec * 5.5);
const bump = (p: number) => Math.min(1, p * 3) * 0.85;
const settle = (p: number, sec: number) => 0.45 + 0.4 * Math.exp(-p * 7) * Math.cos(sec * 7);

const Hook = () => <Strut comp={bounce} cam={[{t: 0, pos: [6, 4, 13], look: [0, 3, 0]}, {t: 1, pos: [4, 5, 10], look: [0, 3, 0]}]} />;
const Hit = () => <Strut comp={bump} cam={[{t: 0, pos: [-6, 4, 11], look: [0, 3, 0]}, {t: 1, pos: [-3, 5, 9], look: [0, 3, 0]}]} />;
const Over = () => <Strut comp={(p, sec) => 0.5 + 0.45 * Math.sin(sec * 5.5) * Math.exp(-p * 0.3)} cam={[{t: 0, pos: [3, 3, 12], look: [0, 3, 0]}, {t: 1, pos: [-3, 4, 11], look: [0, 3, 0]}]} />;
const Job = () => <Strut comp={bounce} heat={0.3} cam={[{t: 0, pos: [0, 5, 13], look: [0, 3, 0]}, {t: 1, pos: [2, 4, 9], look: [0, 2.8, 0]}]} />;
const Oil = () => <Strut comp={bounce} heat={0.9} cam={[{t: 0, pos: [-2, 2.2, 8], look: [0, 3.2, 0]}, {t: 1, pos: [2, 3.4, 7], look: [0, 3.4, 0]}]} />;
const Calm = () => <Strut comp={settle} heat={0.6} cam={[{t: 0, pos: [5, 4, 12], look: [0, 3, 0]}, {t: 1, pos: [0, 5, 12], look: [0, 3, 0]}]} />;
const Finale = () => (
	<Strut comp={(p) => 0.45} cam={[{t: 0, pos: [0, 4.5, 20], look: [0, 2.8, 0]}, {t: 1, pos: [0, 5, 25], look: [0, 2.8, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'GRIP LAB', 'No. 017'], id: ['BONGKAR PASANG', 'LAB CENGKERAMAN', 'No. 017']}} />
	</Strut>
);

export default [Hook, Hit, Over, Job, Oil, Calm, Finale];
