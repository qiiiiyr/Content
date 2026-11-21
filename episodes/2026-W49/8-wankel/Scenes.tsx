import {Readout, Stage, Wankel, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import type {ReactNode} from 'react';

const TAU = Math.PI * 2;
// Output shaft angle runs across the scene; the flame fires once per shaft turn at the top.
const Rot = ({cam, turns = 1, start = 0, children}: {cam: CamKey[]; turns?: number; start?: number; children?: ReactNode}) => {
	const {p} = useScene();
	const theta = start + p * turns * TAU;
	const flame = Math.max(0, 1 - Math.abs(((theta / TAU) % 1) - 0.5) * 7);
	return (
		<>
			<Stage cam={cam}>
				<Wankel theta={theta} flame={flame} />
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<Rot turns={2} cam={[{t: 0, pos: [0, 4.5, 21], look: [0, 4, 0]}, {t: 1, pos: [0, 4.5, 16], look: [0, 4, 0]}]}>
		<Readout label="PISTONS" from={0} to={0} unit="just a spinning triangle" />
	</Rot>
);
const Housing = () => <Rot turns={1} cam={[{t: 0, pos: [-6, 6, 19], look: [0, 4, 0]}, {t: 1, pos: [3, 5, 18], look: [0, 4, 0]}]} />;
const Tips = () => <Rot turns={1} cam={[{t: 0, pos: [3, 5, 14], look: [2, 4, 0]}, {t: 1, pos: [-2, 6, 14], look: [-1, 5, 0]}]} />;
const Chambers = () => <Rot turns={2} cam={[{t: 0, pos: [0, 4, 20], look: [0, 4, 0]}, {t: 1, pos: [0, 5, 17], look: [0, 4, 0]}]} />;
const Smooth = () => <Rot turns={3} cam={[{t: 0, pos: [-3, 3, 22], look: [0, 3.6, 0]}, {t: 1, pos: [4, 5, 19], look: [0, 4, 0]}]} />;
const Seals = () => <Rot turns={1} cam={[{t: 0, pos: [3, 7, 13], look: [2.4, 4.2, 0]}, {t: 1, pos: [4, 4, 11], look: [2.6, 4, 0]}]} />;
const Finale = () => (
	<Rot turns={2} cam={[{t: 0, pos: [0, 4, 28], look: [0, 3, 0]}, {t: 1, pos: [0, 4.5, 33], look: [0, 3, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 015'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 015']}} />
	</Rot>
);

export default [Hook, Housing, Tips, Chambers, Smooth, Seals, Finale];
