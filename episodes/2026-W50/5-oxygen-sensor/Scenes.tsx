import type {ReactNode} from 'react';
import {Callout, Engine, Readout, Stage, Wheel, cycleState, mat, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';

// One engine on the bench; `turns` sets how many 720-degree cycles run during the scene, `inject` shows a diesel-style injector.
const Eng = ({cam, turns = 1, children, over}: {cam: CamKey[]; turns?: number; children?: ReactNode; over?: ReactNode}) => {
	const {p, sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<Engine s={cycleState(p * 720 * turns, sec)} />
				{children}
			</Stage>
			{over}
		</>
	);
};
const C1: CamKey[] = [{t: 0, pos: [4, 6, 15], look: [0, 3.4, 0]}, {t: 1, pos: [-2, 4.5, 15], look: [0, 3.6, 0]}];
const C2: CamKey[] = [{t: 0, pos: [-5, 7, 14], look: [0, 4.2, 0]}, {t: 1, pos: [2, 6, 11], look: [0, 4.4, 0]}];
const C3: CamKey[] = [{t: 0, pos: [0, 4, 17], look: [0, 3.2, 0]}, {t: 1, pos: [4, 5.5, 13], look: [0, 3.6, 0]}];
const C4: CamKey[] = [{t: 0, pos: [3, 8, 12], look: [0, 5, 0]}, {t: 1, pos: [-3, 6.5, 12], look: [0, 4.6, 0]}];
const C5: CamKey[] = [{t: 0, pos: [-3, 3.5, 10], look: [0, 2.2, 0]}, {t: 1, pos: [3, 3.5, 12], look: [0, 2.6, 0]}];
const CEND: CamKey[] = [{t: 0, pos: [0, 5, 22], look: [0, 2.6, 0]}, {t: 1, pos: [0, 5.5, 28], look: [0, 2.6, 0]}];
const IN: [number, number, number] = [-0.45, 5.5, 0.3];
const EX: [number, number, number] = [0.45, 5.5, 0.3];
const Tag = ({n}: {n: string}) => <PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', `No. ${n}`], id: ['BONGKAR PASANG', 'LAB MESIN', `No. ${n}`]}} />;

const Hook = () => (
	<Eng cam={C1} turns={2} over={<Readout label="TARGET MIX" from={0} to={14.7} unit="air : 1 fuel" decimals={1} at={[0.05, 0.7]} />}>
		<Callout at={EX} offset={[2.4, 1.8, 0]} text="O2 SENSOR" />
	</Eng>
);
const Measure = () => <Eng cam={C2} turns={2}><Callout at={EX} offset={[2.4, 1.8, 0]} text="LEFTOVER OXYGEN" size={1.1} /></Eng>;
const Rich = () => <Eng cam={C4} turns={2}><Callout at={EX} offset={[2.4, 1.8, 0]} text="LOW O2 = RICH" /></Eng>;
const Lean = () => <Eng cam={C4} turns={2}><Callout at={EX} offset={[2.4, 1.8, 0]} text="HIGH O2 = LEAN" /></Eng>;
const Volt = () => <Eng cam={C3} turns={3}><Callout at={EX} offset={[2.4, 1.8, 0]} text="VOLTAGE SIGNAL" size={1.1} /></Eng>;
const Trim = () => <Eng cam={C1} turns={3} over={<Readout label="AIR : FUEL" from={13.5} to={14.7} unit="to 1" decimals={1} at={[0, 0.8]} />} />;
const Finale = () => <Eng cam={CEND} turns={2} over={<Tag n="026" />} />;
export default [Hook, Measure, Rich, Lean, Volt, Trim, Finale];
