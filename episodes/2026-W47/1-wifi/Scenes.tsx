import {Arrow, Box, Callout, Counter, Packet, T, Title, Waves, colors} from '../../../src/kit';
import {useCurrentFrame} from 'remotion';

const ROUTER: [number, number] = [540, 760];

const Hook = () => (
	<>
		<Title>
			<T en="Invisible waves are going through you" id="Gelombang tak terlihat menembus tubuhmu" />
		</Title>
		<Waves x={540} y={820} max={430} />
		<Box x={540} y={820} w={260} h={420} color={colors.pink} at={0.3}>
			<T en="You" id="Kamu" />
		</Box>
	</>
);

const RadioStation = () => (
	<>
		<Title>
			<T en="Your router is a radio station" id="Router = stasiun radio" />
		</Title>
		<Box x={540} y={470} w={420} at={0}>
			<T en="Internet cable" id="Kabel internet" />
		</Box>
		<Arrow from={[540, 560]} to={[540, 670]} at={0.4} />
		<Packet from={[540, 560]} to={[540, 680]} at={0.8} dur={0.6} repeat={6} />
		<Box x={ROUTER[0]} y={ROUTER[1]} w={360} color={colors.amber} at={0.6}>
			Router
		</Box>
		<Waves x={ROUTER[0]} y={ROUTER[1]} at={1.6} max={460} />
	</>
);

const Wave = () => (
	<>
		<Title>
			<T en="2.4 GHz =" id="2,4 GHz =" />
		</Title>
		<Counter to={2_400_000_000} at={0.2} dur={2.5} size={110} y={480} />
		<Callout y={580} at={0.8} color={colors.dim} size={48}>
			<T en="vibrations every second" id="getaran setiap detik" />
		</Callout>
		<Sine y={900} at={1} />
	</>
);

const Encoding = () => (
	<>
		<Title>
			<T en="Data = changes in the wave" id="Data = perubahan gelombang" />
		</Title>
		<Sine y={700} at={0} modulated />
		<Callout y={950} at={1.2} color={colors.amber} size={90}>
			1011 0010 0111
		</Callout>
	</>
);

const Turns = () => {
	const devices: [string, string, number][] = [
		['Phone', 'HP', 250],
		['Laptop', 'Laptop', 540],
		['TV', 'TV', 830],
	];
	return (
		<>
			<Title>
				<T en="Devices take turns" id="Perangkat bergiliran" />
			</Title>
			<Box x={ROUTER[0]} y={480} w={360} color={colors.amber}>
				Router
			</Box>
			{devices.map(([en, id, x], i) => (
				<Box key={en} x={x} y={1000} w={250} at={0.2 + i * 0.2}>
					<T en={en} id={id} />
				</Box>
			))}
			{devices.map(([en, , x], i) => (
				<Packet key={en} from={[x, 900]} to={[540, 580]} at={1.2 + i * 1.1} dur={1} color={[colors.cyan, colors.green, colors.pink][i]} />
			))}
		</>
	);
};

const Bands = () => (
	<>
		<Title>
			<T en="2.4 GHz vs 5 GHz" id="2,4 GHz vs 5 GHz" />
		</Title>
		<Callout y={420} at={0.2} color={colors.dim} size={44}>
			<T en="wall" id="tembok" />
		</Callout>
		<div style={{position: 'absolute', left: 520, top: 500, width: 40, height: 640, background: colors.dim, borderRadius: 8}} />
		<Packet from={[150, 650]} to={[510, 650]} at={0.4} dur={1} repeat={6} color={colors.cyan} label="5 GHz" />
		<Packet from={[150, 980]} to={[930, 980]} at={0.4} dur={1.8} repeat={4} color={colors.green} label={<T en="2.4 GHz" id="2,4 GHz" />} />
	</>
);

const Password = () => (
	<>
		<Title>
			<T en="Your password scrambles it" id="Kata sandi mengacaknya" />
		</Title>
		<Box x={540} y={560} w={600} at={0} color={colors.green}>
			"hello"
		</Box>
		<Arrow from={[540, 660]} to={[540, 820]} at={0.5} />
		<Box x={540} y={930} w={600} at={1} color={colors.pink}>
			x9#Qa!7%
		</Box>
		<Callout y={1130} at={3} color={colors.amber}>
			<T en="Follow for more" id="Follow untuk lainnya" />
		</Callout>
	</>
);

export default [Hook, RadioStation, Wave, Encoding, Turns, Bands, Password];


/** A travelling sine wave; `modulated` varies its height so changes are visible. */
function Sine({y, at = 0, modulated = false}: {y: number; at?: number; modulated?: boolean}) {
	const t = useCurrentFrame() / 30 - at;
	if (t < 0) return null;
	const pts = Array.from({length: 181}, (_, i) => {
		const x = 80 + i * 5.1;
		const amp = modulated ? [60, 160, 100, 180][Math.min(3, Math.floor(i / 45))] : 140;
		return `${x},${y + Math.sin(i / 6 - t * 6) * amp}`;
	}).join(' ');
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<polyline points={pts} fill="none" stroke={colors.cyan} strokeWidth={8} />
		</svg>
	);
}
