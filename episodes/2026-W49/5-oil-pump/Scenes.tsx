import {Gear, Readout, Stage, Stream, mat, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import type {ReactNode} from 'react';

type V3 = [number, number, number];
const arc = (cx: number, from: number, to: number, r = 1.65): V3[] => Array.from({length: 9}, (_, i) => {
	const a = ((from + ((to - from) * i) / 8) * Math.PI) / 180;
	return [cx + Math.cos(a) * r, 3 + Math.sin(a) * r, 0.1];
});

// Two meshing gears in a glass housing. Oil rides the outside of each gear from the inlet (bottom) to the outlet (top).
const Pump = ({cam, oil = true, speed = 1.6, children}: {cam: CamKey[]; oil?: boolean; speed?: number; children?: ReactNode}) => {
	const {sec} = useScene();
	const a = sec * speed;
	return (
		<>
			<Stage cam={cam}>
				<Gear r={1.3} teeth={14} width={0.7} angle={-a} position={[-1.35, 3, 0]} />
				<Gear r={1.3} teeth={14} width={0.7} angle={a + Math.PI / 14} position={[1.35, 3, 0]} />
				<mesh position={[0, 3, 0]} renderOrder={2}>
					<boxGeometry args={[5.6, 3.6, 1.1]} />
					<meshPhysicalMaterial color="#d6ecf0" transparent opacity={0.14} roughness={0.05} clearcoat={1} depthWrite={false} />
				</mesh>
				{[-1.6, 1.6].map((y) => (
					<mesh key={y} position={[0, 3 + y * 1.0, 0]} castShadow>
						<boxGeometry args={[5.8, 0.18, 1.2]} />
						<meshStandardMaterial {...mat.dark} />
					</mesh>
				))}
				{oil && (
					<>
						<Stream path={arc(-1.35, -90, -250)} t={sec} n={8} color="#e3a02b" size={0.1} speed={0.5} />
						<Stream path={arc(1.35, -90, 70)} t={sec} n={8} color="#e3a02b" size={0.1} speed={0.5} />
						<Stream path={[[0, 0.2, 0.1], [0, 1.4, 0.1]]} t={sec} n={4} color="#e3a02b" size={0.1} speed={0.5} />
						<Stream path={[[0, 4.6, 0.1], [0, 6.2, 0.1]]} t={sec} n={5} color="#e3a02b" size={0.12} speed={0.9} />
					</>
				)}
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<Pump oil={false} cam={[{t: 0, pos: [0, 5, 14], look: [0, 3, 0]}, {t: 1, pos: [1, 4, 9], look: [0, 3, 0]}]}>
		<Readout label="OIL FILM" from={70} to={0} unit="thinner than a hair (~70 µm)" at={[0.1, 0.9]} />
	</Pump>
);
const Why = () => <Pump oil={false} speed={0.8} cam={[{t: 0, pos: [-8, 5, 10], look: [0, 3, 0]}, {t: 1, pos: [-3, 4.5, 11], look: [0, 3, 0]}]} />;
const Two = () => <Pump oil={false} cam={[{t: 0, pos: [0, 3.5, 12], look: [0, 3, 0]}, {t: 1, pos: [3, 5.5, 9], look: [0, 3, 0]}]} />;
const Carry = () => <Pump cam={[{t: 0, pos: [-3, 4, 9], look: [-1.3, 2.4, 0]}, {t: 1, pos: [3, 4, 9], look: [1.3, 2.4, 0]}]} />;
const Forced = () => <Pump cam={[{t: 0, pos: [0, 6.5, 9], look: [0, 3.6, 0]}, {t: 1, pos: [2, 7, 7], look: [0, 4.6, 0]}]} />;
const Routes = () => <Pump speed={2.2} cam={[{t: 0, pos: [0, 5, 16], look: [0, 4, 0]}, {t: 1, pos: [-3, 5, 12], look: [0, 4, 0]}]} />;
const Finale = () => (
	<Pump cam={[{t: 0, pos: [0, 4, 20], look: [0, 2.6, 0]}, {t: 1, pos: [0, 4.5, 25], look: [0, 2.6, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 012'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 012']}} />
	</Pump>
);

export default [Hook, Why, Two, Carry, Forced, Routes, Finale];
