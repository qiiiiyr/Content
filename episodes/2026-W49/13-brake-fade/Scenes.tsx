import {BrakeDisc, Readout, Stage, Stream, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import {interpolate} from 'remotion';
import type {ReactNode} from 'react';

const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// A disc under constant braking; `heat` rises with p, `bubbles` shows boiling fluid beads in the caliper.
const Fade = ({cam, h0 = 0, h1 = 1, bubbles = false, squeeze = 1, children}: {cam: CamKey[]; h0?: number; h1?: number; bubbles?: boolean; squeeze?: number; children?: ReactNode}) => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<BrakeDisc squeeze={squeeze} heat={interpolate(p, [0, 1], [h0, h1], c)} angle={-sec * 4} />
				{bubbles && <Stream path={[[0, 2.3, 0.1], [0, 3.1, 0.2], [0, 3.8, 0.1]]} t={sec} n={9} color="#f2e6b8" size={0.1} speed={0.7} glow={0.6} opacity={0.8} />}
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<Fade h0={0.1} h1={1} cam={[{t: 0, pos: [4, 4.5, 9], look: [0, 3.4, 0]}, {t: 1, pos: [2, 5, 7], look: [0, 3.6, 0]}]}>
		<Readout label="BRAKE PEDAL" from={100} to={30} unit="% of the grip you had" at={[0.2, 0.9]} />
	</Fade>
);
const Soak = () => <Fade h0={0.05} h1={0.6} cam={[{t: 0, pos: [-6, 4, 10], look: [0, 3.4, 0]}, {t: 1, pos: [-2, 5, 8], look: [0, 3.5, 0]}]} />;
const Pads = () => <Fade h0={0.6} h1={1} squeeze={0.95} cam={[{t: 0, pos: [0, 7.5, 6], look: [0, 4, 0.2]}, {t: 1, pos: [-2.5, 6.5, 5], look: [0, 4, 0.2]}]} />;
const Fluid = () => <Fade h0={0.9} h1={1} bubbles cam={[{t: 0, pos: [6, 5, 6], look: [0, 3.6, 0.2]}, {t: 1, pos: [3, 5.5, 4], look: [0, 3.8, 0.2]}]} />;
const Mountain = () => <Fade h0={0.3} h1={1} cam={[{t: 0, pos: [0, 4, 16], look: [0, 3.2, 0]}, {t: 1, pos: [5, 5, 12], look: [0, 3.2, 0]}]} />;
const Gear = () => <Fade h0={1} h1={0.05} squeeze={0.2} cam={[{t: 0, pos: [-3, 4, 11], look: [0, 3.2, 0]}, {t: 1, pos: [3, 4.5, 9], look: [0, 3.4, 0]}]} />;
const Finale = () => (
	<Fade h0={0.2} h1={0} squeeze={0.1} cam={[{t: 0, pos: [0, 4.5, 20], look: [0, 3, 0]}, {t: 1, pos: [0, 5, 25], look: [0, 3, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'GRIP LAB', 'No. 020'], id: ['BONGKAR PASANG', 'LAB CENGKERAMAN', 'No. 020']}} />
	</Fade>
);

export default [Hook, Soak, Pads, Fluid, Mountain, Gear, Finale];
