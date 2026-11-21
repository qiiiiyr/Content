import type {ReactNode} from "react";
import {Engine, Readout, Stage, cycleState, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

const EVEN = [0, 360];
const UNEVEN = [0, 270];

// Two banks of four cylinders (a V8 seen from the front); the back bank fires 90 degrees later.
const V8 = ({cam, offs = EVEN, turns = 2, children}: {cam: CamKey[]; offs?: number[]; turns?: number; children?: ReactNode}) => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				{[0, 1].map((b) => (
					<group key={b} position={[b * 1.45, 0, -b * 3.4]}>
						{offs.slice(0, 2).map((o, i) => (
							<Engine key={i} x={(i - 0.5) * 2.9} scale={0.5} s={cycleState(p * 720 * turns + o + b * 90, sec)} />
						))}
					</group>
				))}
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<V8 turns={3} cam={[{t: 0, pos: [0, 6, 21], look: [0, 1.8, -1.5]}, {t: 1, pos: [3, 5.5, 18], look: [0, 1.8, -1.5]}]}>
		<Readout label="POWER STROKES" from={0} to={4} unit="per crank turn" at={[0.05, 0.5]} />
	</V8>
);

const One = () => {
	const {p, sec} = useScene();
	return (
		<Stage cam={[{t: 0, pos: [4, 6, 10], look: [0, 3.6, 0]}, {t: 1, pos: [-2, 4.5, 11], look: [0, 3.6, 0]}]}>
			<Engine s={cycleState(p * 720, sec)} />
		</Stage>
	);
};

const Eight = () => <V8 cam={[{t: 0, pos: [-8, 7, 26], look: [0.6, 1.8, -1.5]}, {t: 1, pos: [0, 5, 23], look: [0.6, 1.8, -1.5]}]} />;
const Overlap = () => <V8 turns={3} cam={[{t: 0, pos: [0, 3, 25], look: [0.6, 2.4, -1.5]}, {t: 1, pos: [6, 8, 24], look: [0.6, 1.8, -1.5]}]} />;
const Uneven = () => <V8 offs={UNEVEN} turns={3} cam={[{t: 0, pos: [6, 5, 24], look: [0.6, 3, -1.5]}, {t: 1, pos: [-3, 6, 24], look: [0.6, 3, -1.5]}]} />;
const Flat = () => <V8 turns={3} cam={[{t: 0, pos: [-4, 6, 25], look: [0.6, 1.8, -1.5]}, {t: 1, pos: [4, 4.5, 21], look: [0.6, 2.5, -1.5]}]} />;

const Finale = () => (
	<V8 cam={[{t: 0, pos: [0, 5, 30], look: [0.6, 1.2, -1.5]}, {t: 1, pos: [0, 5.5, 36], look: [0.6, 1.2, -1.5]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 008'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 008']}} />
	</V8>
);

export default [Hook, One, Eight, Overlap, Uneven, Flat, Finale];
