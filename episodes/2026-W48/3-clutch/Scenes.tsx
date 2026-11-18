import {interpolate, useVideoConfig} from 'remotion';
import {Clutch, Stage, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

const W = 5; // engine speed, radians per second
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// disc angle as the integral of its speed: speed = W * (1 - release); release is piecewise linear in p, so integrate numerically
const discAngle = (p: number, dur: number, release: (p: number) => number) => {
	let a = 0;
	const n = 60;
	for (let i = 0; i < n; i++) a += W * (1 - release((p * (i + 0.5)) / n)) * ((p * dur) / n);
	return a;
};

const Shot = ({cam, release = () => 0, heat = () => 0}: {cam: CamKey[]; release?: (p: number) => number; heat?: (p: number) => number}) => {
	const {p, sec} = useScene();
	const {durationInFrames, fps} = useVideoConfig();
	return (
		<Stage cam={cam}>
			<Clutch release={release(p)} engine={sec * W} disc={discAngle(p, durationInFrames / fps, release)} heat={heat(p)} />
		</Stage>
	);
};

const press = (p: number) => interpolate(p, [0.25, 0.55], [0, 1], clamp);
const lift = (p: number) => interpolate(p, [0.1, 0.8], [1, 0], clamp);

const Hook = () => <Shot release={press} cam={[{t: 0, pos: [3, 4, 20], look: [0, 2.2, 0]}, {t: 1, pos: [-4, 4.6, 13], look: [0, 2.2, 0]}]} />;
const Flywheel = () => <Shot cam={[{t: 0, pos: [8, 4.5, 7], look: [1, 2.4, 0]}, {t: 1, pos: [6, 3.6, 9], look: [0.6, 2.4, 0]}]} />;
const Disc = () => <Shot cam={[{t: 0, pos: [-2, 6, 7], look: [0, 2.6, 0]}, {t: 1, pos: [1, 3.8, 6.5], look: [0, 2.4, 0]}]} />;
const Spring = () => <Shot cam={[{t: 0, pos: [-7, 4, 6], look: [0, 2.4, 0]}, {t: 1, pos: [-5, 3.4, 4.5], look: [0, 2.6, 0]}]} />;
const Release = () => <Shot release={press} cam={[{t: 0, pos: [-1, 3.6, 9], look: [0, 2.4, 0]}, {t: 1, pos: [-3, 4.6, 7.5], look: [0, 2.4, 0]}]} />;
const Slip = () => <Shot release={lift} heat={(p) => interpolate(p, [0.15, 0.5, 0.85], [0, 0.9, 0], clamp)} cam={[{t: 0, pos: [2, 3.2, 7], look: [0, 2.4, 0]}, {t: 1, pos: [0, 3.8, 6], look: [0, 2.5, 0]}]} />;

const Finale = () => (
	<>
		<Shot cam={[{t: 0, pos: [0, 4, 21], look: [0, 1.2, 0]}, {t: 1, pos: [0, 4.6, 26], look: [0, 1.2, 0]}]} />
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'DRIVE LAB', 'No. 004'], id: ['BONGKAR PASANG', 'LAB PENGGERAK', 'No. 004']}} />
	</>
);

export default [Hook, Flywheel, Disc, Spring, Release, Slip, Finale];
