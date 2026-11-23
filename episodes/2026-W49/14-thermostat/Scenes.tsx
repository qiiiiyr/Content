import {Engine, Readout, Stage, Stream, cycleState, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import {interpolate} from 'remotion';
import type {ReactNode} from 'react';

type V3 = [number, number, number];
const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
// coolant loop: up the engine side, over the top, down a radiator on the right, back along the bottom
const LOOP: V3[] = [[-1.7, 2, 1.2], [-1.7, 6.5, 1.2], [5.5, 6.5, 1.2], [5.5, 1.5, 1.2], [-1.7, 1.5, 1.2], [-1.7, 2, 1.2]];
const SHORT: V3[] = [[-1.7, 2, 1.2], [-1.7, 6.5, 1.2], [-1.7, 2, 1.2]];

// `open` 0..1 is the thermostat; `heat` colours the coolant from blue to orange.
const Cool = ({cam, open, heat, children}: {cam: CamKey[]; open: number; heat: number; children?: ReactNode}) => {
	const {p, sec} = useScene();
	const col = heat > 0.55 ? '#ff9a3c' : heat > 0.25 ? '#e8d27a' : '#7fd6e0';
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(p * 720 * 2, sec)} x={-0.5} />
				<Stream path={open > 0.3 ? LOOP : SHORT} t={sec} n={14} color={col} size={0.12} speed={0.35} />
				<mesh position={[5.5, 3.9, 0.8]} castShadow>
					<boxGeometry args={[1.8, 5.2, 0.7]} />
					<meshStandardMaterial color="#6b7480" metalness={0.8} roughness={0.5} />
				</mesh>
				<group position={[-1.7, 6.5, 1.2]} rotation={[0, 0, open * 1.3]}>
					<mesh position={[0.4, 0, 0]}>
						<boxGeometry args={[0.8, 0.12, 0.8]} />
						<meshStandardMaterial color="#d9ad4f" metalness={0.95} roughness={0.28} />
					</mesh>
				</group>
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<Cool open={0} heat={0.2} cam={[{t: 0, pos: [3, 6, 16], look: [2, 4, 0]}, {t: 1, pos: [2, 6, 12], look: [1.5, 4.5, 0]}]}>
		<Readout label="COOLANT" from={20} to={90} unit="°C, and not hotter" at={[0.1, 0.9]} />
	</Cool>
);
const Heat = () => <Cool open={0} heat={0.9} cam={[{t: 0, pos: [-5, 6, 12], look: [0, 4.5, 0]}, {t: 1, pos: [-2, 7, 10], look: [0, 4.5, 0]}]} />;
const Loop = () => <Cool open={1} heat={0.5} cam={[{t: 0, pos: [3, 6, 17], look: [2, 4, 0]}, {t: 1, pos: [7, 5, 12], look: [3.5, 4, 0]}]} />;
const Cold = () => <Cool open={0} heat={0.1} cam={[{t: 0, pos: [0, 5, 14], look: [0, 4, 0]}, {t: 1, pos: [3, 5.5, 11], look: [1, 4.5, 0]}]} />;
const Hold = () => {
	const {p} = useScene();
	return <Cool open={interpolate(p, [0.6, 0.9], [0, 1], c)} heat={0.1 + 0.7 * p} cam={[{t: 0, pos: [-2, 8, 8], look: [-1.7, 6.5, 1.2]}, {t: 1, pos: [0, 8, 7], look: [-1.7, 6.5, 1.2]}]} />;
};
const Wax = () => <Cool open={1} heat={0.6} cam={[{t: 0, pos: [-3, 8.5, 6], look: [-1.7, 6.5, 1.2]}, {t: 1, pos: [-1, 7.5, 5], look: [-1.7, 6.5, 1.2]}]} />;
const Finale = () => (
	<Cool open={1} heat={0.5} cam={[{t: 0, pos: [2, 5, 26], look: [1.5, 3, 0]}, {t: 1, pos: [2, 5.5, 31], look: [1.5, 3, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 021'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 021']}} />
	</Cool>
);

export default [Hook, Heat, Loop, Cold, Hold, Wax, Finale];
