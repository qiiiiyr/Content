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

const Bike = ({cam, steer = 0, lean = 0, children, over}: {cam: CamKey[]; steer?: number; lean?: number; children?: ReactNode; over?: ReactNode}) => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<group rotation={[0, 0, -lean]}>
					<group position={[0, 2.1, 0]} rotation={[0, steer, 0]}>
						<Wheel angle={-sec * 6} rotation={[0, Math.PI / 2, 0]} />
						<mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 2.8, 12]} /><meshStandardMaterial {...mat.steel} /></mesh>
						<mesh position={[0, 2.8, 0]} castShadow><boxGeometry args={[3, 0.14, 0.14]} /><meshStandardMaterial {...mat.dark} /></mesh>
					</group>
				</group>
				{children}
			</Stage>
			{over}
		</>
	);
};
const BC1: CamKey[] = [{t: 0, pos: [0, 4.5, 20], look: [0, 2.0, 0]}, {t: 1, pos: [3, 4.5, 18], look: [0, 2.0, 0]}];
const BC2: CamKey[] = [{t: 0, pos: [0, 17, 10], look: [0, 1.5, 0]}, {t: 1, pos: [2, 17, 9], look: [0, 1.5, 0]}];
const BC3: CamKey[] = [{t: 0, pos: [-4, 4, 19], look: [0, 2.0, 0]}, {t: 1, pos: [4, 4, 19], look: [0, 2.0, 0]}];
const Hook = () => <Bike cam={BC1} steer={0.0} />;
const Push = () => {
	const {p} = useScene();
	return <Bike cam={BC1} steer={0.15 * Math.sin(p * Math.PI)}><Callout at={[1.4, 4.9, 0]} offset={[0.4, 1.3, 0]} text="PUSH RIGHT BAR" /></Bike>;
};
const Left = () => {
	const {p} = useScene();
	return <Bike cam={BC2} steer={0.45 * Math.sin(Math.min(1, p * 1.6) * Math.PI / 2)}><Callout at={[0, 2.1, -2]} offset={[2.2, 1, 0]} text="WHEEL GOES LEFT" /></Bike>;
};
const Fall = () => {
	const {p} = useScene();
	return <Bike cam={BC1} steer={0.3 * (1 - p)} lean={0.5 * p}><Callout at={[0, 0.2, 0]} offset={[2.2, 1, 0]} text="FALLS RIGHT" /></Bike>;
};
const Lean = () => <Bike cam={BC3} steer={0.05} lean={0.45} over={<Readout label="LEAN" from={0} to={45} unit="degrees (example)" at={[0, 0.7]} />} />;
const Hold = () => <Bike cam={BC3} steer={0.03} lean={0.45} />;
const Finale = () => <Bike cam={BC1} lean={0.3} over={<Tag n="024" />} />;
export default [Hook, Push, Left, Fall, Lean, Hold, Finale];
