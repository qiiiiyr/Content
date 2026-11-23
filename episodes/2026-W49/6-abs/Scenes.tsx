import {BrakeDisc, Readout, Stage, Wheel, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import type {ReactNode} from 'react';

const pulse = (sec: number) => (Math.sin(sec * 2 * Math.PI * 3) > 0 ? 1 : 0.15); // square wave: clamp, release, clamp...

// A road wheel (scaled up) on the bench. `locked` freezes it and leaves a skid mark behind.
const Roll = ({cam, locked = 0, children}: {cam: CamKey[]; locked?: number; children?: ReactNode}) => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<group scale={2} position={[0, 2.7, 0]}>
					<Wheel angle={locked > 0.5 ? -4 : -sec * 7} />
				</group>
				{locked > 0.5 && (
					<mesh position={[-3.5 - 0, 0.02, 0]}>
						<boxGeometry args={[7, 0.02, 1.2]} />
						<meshStandardMaterial color="#1b1b1b" roughness={1} />
					</mesh>
				)}
			</Stage>
			{children}
		</>
	);
};

const Valve = ({cam, children}: {cam: CamKey[]; children?: ReactNode}) => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<BrakeDisc squeeze={pulse(sec)} angle={-sec * 5} />
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<Valve cam={[{t: 0, pos: [5, 4.5, 9], look: [0, 3.4, 0]}, {t: 1, pos: [3, 5, 7], look: [0, 3.6, 0]}]}>
		<Readout label="ABS PULSES" from={0} to={15} unit="per second, at most" at={[0.05, 0.6]} />
	</Valve>
);
const Lock = () => <Roll locked={1} cam={[{t: 0, pos: [-6, 3, 14], look: [0, 2.6, 0]}, {t: 1, pos: [-3, 3.5, 11], look: [0, 2.6, 0]}]} />;
const Slide = () => <Roll locked={1} cam={[{t: 0, pos: [4, 2, 12], look: [-1, 1.8, 0]}, {t: 1, pos: [8, 3.5, 12], look: [-1, 1.8, 0]}]} />;
const Sensor = () => <Roll cam={[{t: 0, pos: [0, 4, 15], look: [0, 2.7, 0]}, {t: 1, pos: [-4, 3, 11], look: [0, 2.7, 0]}]} />;
const Release = () => <Valve cam={[{t: 0, pos: [0, 7, 7], look: [0, 3.6, 0.2]}, {t: 1, pos: [-3, 6, 6], look: [0, 3.8, 0.2]}]} />;
const Buzz = () => <Roll cam={[{t: 0, pos: [3, 3.5, 12], look: [0, 2.7, 0]}, {t: 1, pos: [-3, 3, 10], look: [0, 2.7, 0]}]} />;
const Finale = () => (
	<Roll cam={[{t: 0, pos: [0, 4.5, 22], look: [0, 2.2, 0]}, {t: 1, pos: [0, 5, 27], look: [0, 2.2, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'GRIP LAB', 'No. 013'], id: ['BONGKAR PASANG', 'LAB CENGKERAMAN', 'No. 013']}} />
	</Roll>
);

export default [Hook, Lock, Slide, Sensor, Release, Buzz, Finale];
