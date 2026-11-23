// Plain timing helpers, kept free of React so the tests can import them.

/** Slow motion in the middle of a scene: progress q runs at `speed` between from and to (0..1 of the scene) and faster
 * elsewhere, so the mechanism still finishes its move by the end. slow is true inside the window, for <TimeTag>. */
export const ramp = (p: number, from: number, to: number, speed = 0.25) => {
	const w = to - from;
	const fast = (1 - w * speed) / (1 - w); // speed outside the window so the total stays 1
	const q = p < from ? p * fast : p < to ? from * fast + (p - from) * speed : from * fast + w * speed + (p - to) * fast;
	return {q: Math.min(1, q), slow: p >= from && p < to};
};
