import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {applyFocus} from '../src/focus.ts';

test('focus: lit part glows, others ghost, focus can move and end, React-animated glow is left alone', () => {
	const root = new THREE.Group();
	const part = (name: string) => {
		const g = new THREE.Group();
		g.userData.part = name;
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({color: '#888', emissive: '#000000', emissiveIntensity: 0}));
		g.add(mesh);
		root.add(g);
		return mesh.material as THREE.MeshStandardMaterial;
	};
	const intake = part('intake');
	const piston = part('piston');
	const glass = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({opacity: 0.16, transparent: true}));
	root.add(glass); // no part: never touched

	applyFocus(root, ['intake'], '#5ee1ff', 0.3);
	assert.equal(intake.emissive.getHexString(), '5ee1ff');
	assert.equal(intake.emissiveIntensity, 0.3);
	assert.equal(intake.opacity, 1);
	assert.ok(piston.transparent);
	assert.equal(piston.opacity, 0.13);

	applyFocus(root, ['piston'], '#5ee1ff', 0.3); // focus moves
	assert.equal(intake.emissive.getHexString(), '000000');
	assert.equal(intake.emissiveIntensity, 0);
	assert.ok(intake.transparent);
	assert.equal(intake.opacity, 0.13);
	assert.equal(piston.opacity, 1);
	assert.ok(!piston.transparent && piston.depthWrite);
	assert.equal(piston.emissive.getHexString(), '5ee1ff');

	applyFocus(root, undefined, '#5ee1ff', 0.3); // focus ends: everything as built
	for (const m of [intake, piston]) assert.deepEqual([m.opacity, m.transparent, m.emissiveIntensity], [1, false, 0]);

	intake.emissiveIntensity = 0.6; // React animates a glow (a valve opening) while nothing is in focus
	applyFocus(root, undefined, '#5ee1ff', 0.3);
	assert.equal(intake.emissiveIntensity, 0.6);
	assert.equal((glass.material as THREE.MeshStandardMaterial).opacity, 0.16);

	// a part that makes its own light (the spark) keeps its flash when in focus
	const spark = part('spark');
	spark.emissive.set('#ffe27a');
	spark.emissiveIntensity = 7;
	applyFocus(root, ['spark'], '#5ee1ff', 0.3);
	assert.equal(spark.emissive.getHexString(), 'ffe27a');
	assert.equal(spark.emissiveIntensity, 7);
	assert.equal(intake.opacity, 0.13); // the rest still turns see-through
});
