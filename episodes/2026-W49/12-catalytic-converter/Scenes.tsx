import {Catalyst, Stage, Stream, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import type {ReactNode} from 'react';

type V3 = [number, number, number];
const IN: V3[] = [[-6, 3, 0.2], [-1.6, 3, 0.2]];
const OUT: V3[] = [[1.6, 3, 0.2], [6, 3, 0.2]];
const THROUGH: V3[] = [[-1.5, 3, 0.2], [1.5, 3, 0.2]];

// Dirty grey gas goes in the left, cleaner pale gas comes out the right.
const Cat = ({cam, heat = 0.6, flow = true, children}: {cam: CamKey[]; heat?: number; flow?: boolean; children?: ReactNode}) => {
	const {sec} = useScene();
	return (
		<>
			<Stage cam={cam}>
				<Catalyst heat={heat} />
				{flow && (
					<>
						<Stream path={IN} t={sec} n={10} color="#8a9099" size={0.16} speed={0.5} glow={0} opacity={0.7} />
						<Stream path={THROUGH} t={sec} n={6} color="#c9b56a" size={0.07} speed={0.5} glow={0.4} />
						<Stream path={OUT} t={sec} n={10} color="#bfe9ef" size={0.1} speed={0.5} glow={0.8} />
					</>
				)}
			</Stage>
			{children}
		</>
	);
};

const Hook = () => <Cat cam={[{t: 0, pos: [0, 4, 13], look: [0, 3, 0]}, {t: 1, pos: [2, 4.5, 8], look: [0, 3, 0]}]} />;
const Dirty = () => <Cat flow cam={[{t: 0, pos: [-8, 4, 8], look: [-2, 3, 0]}, {t: 1, pos: [-5, 4, 7], look: [-2, 3, 0]}]} />;
const Honey = () => <Cat cam={[{t: 0, pos: [0, 3, 10], look: [0, 3, 0]}, {t: 1, pos: [3, 3.2, 4.5], look: [0, 3, 0]}]} />;
const Surface = () => <Cat heat={0.9} cam={[{t: 0, pos: [3.5, 3.5, 5], look: [0, 3, 0]}, {t: 1, pos: [4, 3.4, 2.2], look: [0, 3, 0]}]} />;
const Split = () => <Cat heat={0.9} cam={[{t: 0, pos: [-2, 5, 9], look: [0, 3, 0]}, {t: 1, pos: [6, 4, 8], look: [1, 3, 0]}]} />;
const Hot = () => {
	const {p} = useScene();
	return <Cat heat={0.1 + 0.9 * p} cam={[{t: 0, pos: [0, 6, 11], look: [0, 3, 0]}, {t: 1, pos: [0, 3.2, 10], look: [0, 3, 0]}]} />;
};
const Finale = () => (
	<Cat cam={[{t: 0, pos: [0, 4, 20], look: [0, 2.6, 0]}, {t: 1, pos: [0, 4.5, 25], look: [0, 2.6, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 019'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 019']}} />
	</Cat>
);

export default [Hook, Dirty, Honey, Surface, Split, Hot, Finale];
