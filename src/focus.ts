// X-ray focus, kept free of React so the tests can run it. Meshes inside a group tagged userData.part glow in the
// accent colour when their part is in focus, turn see-through when another part is, and are left alone otherwise.
import * as THREE from 'three';

type Mode = 'none' | 'ghost' | 'lit';

/** Applies focus under root. A material is only changed when its mode changes (and the glow while lit), so values
 * React animates (the spark's flash, a valve's glow) keep working. Parts that make their own light (a non-black emissive
 * colour, like the spark or a valve head) keep it when in focus; only plain parts get the accent glow. */
export const applyFocus = (root: THREE.Object3D, focus: string[] | undefined, accent: string, glow: number) => {
	root.traverse((o) => {
		const mesh = o as THREE.Mesh;
		if (!mesh.isMesh) return;
		let part: string | undefined;
		for (let a: THREE.Object3D | null = o; a && a !== root && !part; a = a.parent) part = a.userData.part;
		if (!part) return;
		const m = mesh.material as THREE.MeshStandardMaterial;
		const mode: Mode = !focus ? 'none' : focus.includes(part) ? 'lit' : 'ghost';
		const was: Mode = m.userData.mode ?? 'none';
		if (mode !== was) {
			if (was === 'none') m.userData.orig = {opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite, emissive: m.emissive?.getHex(), glow: m.emissiveIntensity};
			const orig = m.userData.orig;
			m.transparent = mode === 'ghost' || orig.transparent;
			m.opacity = mode === 'ghost' ? 0.13 : orig.opacity;
			m.depthWrite = mode === 'ghost' ? false : orig.depthWrite;
			if (was === 'lit' && m.emissive && !orig.emissive) {
				m.emissive.setHex(orig.emissive);
				m.emissiveIntensity = orig.glow;
			}
			m.needsUpdate = true;
			m.userData.mode = mode;
		}
		if (mode === 'lit' && m.emissive && !m.userData.orig.emissive) {
			m.emissive.set(accent);
			m.emissiveIntensity = glow;
		}
	});
};
