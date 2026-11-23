import {BrakeDisc, Readout, Stage, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import {interpolate} from 'remotion';
import type {ReactNode} from 'react';

// `squeeze`, `heat` and `speed` are functions of scene progress p; the disc angle integrates the speed so it slows smoothly.
const Brake = ({cam, squeeze = () => 0, heat = () => 0, speed = () => 8, children}: {cam: CamKey[]; squeeze?: (p: number) => number; heat?: (p: number) => number; speed?: (p: number) => number; children?: ReactNode}) => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<BrakeDisc squeeze={squeeze(p)} heat={heat(p)} angle={-sec * speed(p)} />
			</Stage>
			{children}
		</>
	);
};

const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const slow = (p: number) => interpolate(p, [0.2, 0.9], [14, 0.5], c);
const clamp = (p: number) => interpolate(p, [0.15, 0.4], [0, 1], c);

const Hook = () => (
	<Brake squeeze={clamp} heat={(p) => interpolate(p, [0.3, 1], [0, 0.9], c)} speed={slow} cam={[{t: 0, pos: [5, 4.5, 9], look: [0, 3.4, 0]}, {t: 1, pos: [3, 5, 7], look: [0, 3.6, 0]}]}>
		<Readout label="SPEED" from={100} to={0} unit="km/h" at={[0.2, 0.9]} />
	</Brake>
);
const Parts = () => <Brake cam={[{t: 0, pos: [-8, 4, 9], look: [0, 3.4, 0]}, {t: 1, pos: [-3, 6.5, 8], look: [0, 3.6, 0]}]} />;
const Clamp = () => <Brake squeeze={(p) => interpolate(p, [0.2, 0.6], [0, 1], c)} speed={(p) => interpolate(p, [0.3, 1], [10, 4], c)} cam={[{t: 0, pos: [0, 7, 7], look: [0, 3.6, 0.2]}, {t: 1, pos: [-2.5, 6.5, 5], look: [0, 3.9, 0.2]}]} />;
const Hydraulic = () => <Brake squeeze={(p) => interpolate(p, [0.15, 0.5], [0, 1], c)} cam={[{t: 0, pos: [9, 5, 5], look: [0, 3.8, 0]}, {t: 1, pos: [6, 6, 3], look: [0, 4.2, 0.4]}]} />;
const Heat = () => <Brake squeeze={() => 1} speed={(p) => interpolate(p, [0, 1], [6, 1.5], c)} heat={(p) => interpolate(p, [0, 0.8], [0.1, 1], c)} cam={[{t: 0, pos: [-2, 4, 10], look: [0, 3.2, 0]}, {t: 1, pos: [4, 4.5, 8], look: [0, 3.2, 0]}]} />;
const Air = () => <Brake speed={() => 6} heat={(p) => interpolate(p, [0, 1], [0.9, 0.2], c)} cam={[{t: 0, pos: [3, 3, 9], look: [0, 3.4, 0]}, {t: 1, pos: [0, 4, 6], look: [0, 3.4, 0]}]} />;
const Finale = () => (
	<Brake speed={() => 3} heat={() => 0.3} cam={[{t: 0, pos: [0, 4.5, 20], look: [0, 3, 0]}, {t: 1, pos: [0, 5, 25], look: [0, 3, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'GRIP LAB', 'No. 010'], id: ['BONGKAR PASANG', 'LAB CENGKERAMAN', 'No. 010']}} />
	</Brake>
);

export default [Hook, Parts, Clamp, Hydraulic, Heat, Air, Finale];
