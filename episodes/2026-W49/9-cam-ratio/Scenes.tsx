import {Gear, Readout, Rod, Stage, mat, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import type {ReactNode} from 'react';

// Crank gear (18 teeth) drives a cam gear with twice the teeth: the cam turns at half speed. A lobe on the cam lifts a valve.
const Train = ({cam, speed = 1.4, slip = 0, children}: {cam: CamKey[]; speed?: number; slip?: number; children?: ReactNode}) => {
	const {sec} = useScene();
	const a = sec * speed;
	const camA = -a / 2 + slip;
	const lift = Math.max(0, Math.cos(camA - Math.PI / 2)) * 0.6;
	return (
		<>
			<Stage cam={cam}>
				<Gear r={1.1} teeth={18} width={0.6} angle={a} position={[-1.9, 2.5, 0]} material={mat.steel} />
				<Gear r={2.2} teeth={36} width={0.6} angle={camA} position={[1.55, 2.5, 0]} />
				<mesh position={[1.55 + 0.0, 2.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
					<cylinderGeometry args={[0.15, 0.15, 0.9, 12]} />
					<meshStandardMaterial {...mat.steel} />
				</mesh>
				<group position={[1.55, 2.5, 0.55]} rotation={[0, 0, camA]}>
					<mesh position={[0, 0.5, 0]} scale={[0.7, 1, 1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
						<cylinderGeometry args={[0.9, 0.9, 0.3, 32]} />
						<meshPhysicalMaterial {...mat.red} />
					</mesh>
				</group>
				<Rod from={[1.55, 5.4 + lift, 0.55]} to={[1.55, 7.2 + lift, 0.55]} r={0.1} />
				<mesh position={[1.55, 5.4 + lift, 0.55]}>
					<cylinderGeometry args={[0.35, 0.35, 0.12, 20]} />
					<meshStandardMaterial {...mat.brass} />
				</mesh>
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<Train cam={[{t: 0, pos: [0, 5, 16], look: [0, 3.6, 0]}, {t: 1, pos: [1, 5, 12], look: [0, 3.6, 0]}]}>
		<Readout label="CRANK : CAM" from={0} to={2} unit="to 1" at={[0.05, 0.5]} />
	</Train>
);
const Cycle = () => <Train speed={2.2} cam={[{t: 0, pos: [-6, 4, 12], look: [-1.5, 2.8, 0]}, {t: 1, pos: [-2, 5.5, 10], look: [-1.5, 2.8, 0]}]} />;
const Once = () => <Train cam={[{t: 0, pos: [5, 7, 11], look: [1.5, 5.5, 0]}, {t: 1, pos: [3, 6.5, 8], look: [1.5, 5.8, 0]}]} />;
const Half = () => <Train speed={1.2} cam={[{t: 0, pos: [0, 3.5, 15], look: [0, 3.4, 0]}, {t: 1, pos: [0, 5, 13], look: [0, 3.4, 0]}]} />;
const Teeth = () => <Train speed={0.8} cam={[{t: 0, pos: [-1, 3.5, 8], look: [-0.2, 2.5, 0.2]}, {t: 1, pos: [1, 4, 8], look: [0.2, 2.7, 0.2]}]} />;
const Skip = () => {
	const {p} = useScene();
	return <Train slip={p > 0.55 ? 0.5 : 0} cam={[{t: 0, pos: [3, 5, 12], look: [1, 4, 0]}, {t: 1, pos: [-2, 6, 12], look: [0.5, 4.4, 0]}]} />;
};
const Finale = () => (
	<Train cam={[{t: 0, pos: [0, 4.5, 25], look: [0, 2.6, 0]}, {t: 1, pos: [0, 5, 30], look: [0, 2.6, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 016'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 016']}} />
	</Train>
);

export default [Hook, Cycle, Once, Half, Teeth, Skip, Finale];
