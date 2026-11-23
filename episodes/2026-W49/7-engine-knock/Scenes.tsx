import {Engine, Readout, Stage, cycleState, useScene, type CamKey} from '../../../src/stage';
import {PaperTag} from '../../../src/Tag';
import type {ReactNode} from 'react';

// Power stroke (crank 360..540) with an optional second, early flash of the unburnt mix: the knock.
const Burn = ({cam, from = 340, to = 540, knock = false, children}: {cam: CamKey[]; from?: number; to?: number; knock?: boolean; children?: ReactNode}) => {
	const {p, sec} = useScene();
	const deg = from + (to - from) * p;
	const s = cycleState(deg, sec);
	if (knock && deg > 372 && deg < 420) {
		const k = Math.max(0, 1 - Math.abs(deg - 392) / 16);
		Object.assign(s, {gas: '#fff1c2', gasGlow: Math.max(s.gasGlow ?? 0, k * 1.6)});
	}
	return (
		<>
			<Stage cam={cam}>
				<Engine s={s} />
			</Stage>
			{children}
		</>
	);
};

const Hook = () => (
	<Burn knock from={350} to={460} cam={[{t: 0, pos: [3, 7, 9], look: [0, 4.6, 0]}, {t: 1, pos: [0, 6, 7], look: [0, 4.4, 0]}]}>
		<Readout label="EXPLOSIONS THIS STROKE" from={1} to={2} unit="should be just one" at={[0.3, 0.32]} tag="KNOCK" />
	</Burn>
);
const Flame = () => <Burn from={355} to={440} cam={[{t: 0, pos: [-3, 6.5, 8], look: [0, 4.6, 0]}, {t: 1, pos: [3, 6, 8], look: [0, 4.6, 0]}]} />;
const Squeeze = () => <Burn from={362} to={430} cam={[{t: 0, pos: [0, 5, 7], look: [0, 4.2, 0]}, {t: 1, pos: [-2, 6, 6], look: [0, 4.6, 0]}]} />;
const Ignite = () => <Burn knock from={370} to={415} cam={[{t: 0, pos: [-4, 6, 9], look: [0, 4.5, 0]}, {t: 1, pos: [3, 7, 7], look: [0, 4.6, 0]}]} />;
const Hammer = () => <Burn knock from={385} to={440} cam={[{t: 0, pos: [0, 2.5, 9], look: [0, 3.2, 0]}, {t: 1, pos: [0, 3, 6.5], look: [0, 3.4, 0]}]} />;
const Octane = () => <Burn from={355} to={540} cam={[{t: 0, pos: [4, 5, 11], look: [0, 4, 0]}, {t: 1, pos: [-3, 6, 10], look: [0, 4, 0]}]} />;
const Finale = () => (
	<Burn from={355} to={720} cam={[{t: 0, pos: [0, 4, 26], look: [0, 3, 0]}, {t: 1, pos: [0, 4.5, 30], look: [0, 3, 0]}]}>
		<PaperTag at={0.4} lines={{en: ['CUTAWAY', 'ENGINE LAB', 'No. 014'], id: ['BONGKAR PASANG', 'LAB MESIN', 'No. 014']}} />
	</Burn>
);

export default [Hook, Flame, Squeeze, Ignite, Hammer, Octane, Finale];
