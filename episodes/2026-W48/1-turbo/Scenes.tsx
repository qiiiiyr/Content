import {interpolate} from 'remotion';
import {Engine, Stage, Stream, Turbo, cycleState, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

type V3 = [number, number, number];
const HOT: V3[] = [[-5, 1.2, 1.4], [-2.7, 2.2, 1.3], [-1.5, 3, 0.9], [-1.6, 3, 0], [-4.6, 3.4, -1.2]];
const BYPASS: V3[] = [[-5, 1.2, 1.4], [-2.7, 1.9, 1.0], [-2.2, 2.9, 0.4], [-2.6, 5, 0]];
const AIR: V3[] = [[5, 3, 0.4], [2.3, 3, 0.2], [1.5, 3.9, 0.6], [1.2, 5.6, 0.6], [0, 6.6, 0.4]];

// The turbo on the bench; exhaust (orange) drives the turbine, fresh air (teal) leaves the compressor.
const Shot = ({cam, spin, flow, air = true, hot = true, gate = 0, heat = 0.6}: {cam: CamKey[]; spin?: number; flow?: number; air?: boolean; hot?: boolean; gate?: number; heat?: number}) => {
	const {sec} = useScene();
	const t = flow ?? sec;
	return (
		<Stage cam={cam}>
			<Turbo spin={spin ?? sec * 9} heat={heat} wastegate={gate} />
			{hot && <Stream path={HOT} t={t} color="#ff8a3c" size={0.13} />}
			{air && <Stream path={AIR} t={t} />}
			{gate > 0.3 && <Stream path={BYPASS} t={t} n={8} color="#ffb070" size={0.11} opacity={gate} />}
		</Stage>
	);
};

const Hook = () => <Shot cam={[{t: 0, pos: [0, 3.5, 24], look: [0, 1.4, 0]}, {t: 1, pos: [2, 3.2, 15], look: [0, 1.8, 0]}]} />;
const Turbine = () => <Shot air={false} heat={0.9} cam={[{t: 0, pos: [-6, 4, 8], look: [-1.5, 2.3, 0]}, {t: 1, pos: [-3, 3.4, 6], look: [-1.5, 2.3, 0]}]} />;
const Shaft = () => <Shot cam={[{t: 0, pos: [-2, 6.5, 9], look: [0, 2.4, 0]}, {t: 1, pos: [2, 3.6, 8], look: [0, 2.4, 0]}]} />;
const Compressor = () => <Shot hot={false} heat={0.3} cam={[{t: 0, pos: [6.5, 4, 7], look: [1.5, 2.6, 0]}, {t: 1, pos: [3.4, 4.6, 6], look: [1.2, 3.2, 0]}]} />;

// the turbo feeding one cylinder: squeezed air streams into the intake valve
const Power = () => {
	const {p, sec} = useScene();
	return (
		<Stage cam={[{t: 0, pos: [0, 5, 23], look: [0, 2.6, 0]}, {t: 1, pos: [-2, 5, 20], look: [0, 2.8, 0]}]}>
			<Engine s={cycleState(p * 2880, sec)} />
			<group position={[1.4, 8.6, 0]} scale={0.5}>
				<Turbo spin={sec * 9} heat={0.6} position={[0, 0, 0]} />
			</group>
			<Stream path={[[2.2, 8.6, 0.3], [2.6, 9.6, 0.3], [-0.45, 9.8, 0.3], [-0.45, 6.4, 0.3]]} t={sec} n={18} />
		</Stage>
	);
};

// lag: at low revs the exhaust is weak, so the wheels take a moment to spin up
const Lag = () => {
	const {p} = useScene();
	const k = p * p * p;
	return <Shot spin={k * 40} flow={k * 6} heat={p} cam={[{t: 0, pos: [-1, 4.2, 10], look: [0, 2.4, 0]}, {t: 1, pos: [1, 3.4, 8.5], look: [0, 2.4, 0]}]} />;
};

const Wastegate = () => {
	const {p} = useScene();
	return <Shot air={false} heat={0.9} gate={interpolate(p, [0.3, 0.55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} cam={[{t: 0, pos: [-6, 6.5, 8], look: [-2, 2.6, 0]}, {t: 1, pos: [-4, 5, 7], look: [-2, 2.6, 0]}]} />;
};

const Finale = () => (
	<>
		<Shot cam={[{t: 0, pos: [0, 4, 22], look: [0, 1.4, 0]}, {t: 1, pos: [0, 4.6, 27], look: [0, 1.4, 0]}]} />
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 002'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 002']}} />
	</>
);

export default [Hook, Turbine, Shaft, Compressor, Power, Lag, Wastegate, Finale];
