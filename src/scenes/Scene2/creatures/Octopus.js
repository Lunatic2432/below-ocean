import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Octopus {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];

    this.group.position.set(-18, -19.5, -10);
    this.scene.add(this.group);

    this.clickState = 0; // 0: Idle, 1: Flash/React, 2: Retreat
    this.reappearTimer = 0;

    this.buildProceduralOctopus();
  }

  buildProceduralOctopus() {
    this.octoGroup = new THREE.Group();
    this.octoGroup.userData = { isOctopus: true };

    const mantleGeo = new THREE.SphereGeometry(1.2, 14, 12);
    mantleGeo.scale(1.0, 1.3, 0.9);
    this.material = new THREE.MeshStandardMaterial({
      color: 0x9b5de5,
      emissive: 0x00f5d4,
      emissiveIntensity: 0.0,
      roughness: 0.4,
      metalness: 0.3
    });
    const mantleMesh = new THREE.Mesh(mantleGeo, this.material);
    mantleMesh.userData = { isOctopus: true };
    this.octoGroup.add(mantleMesh);
    this.raycastTargets.push(mantleMesh);

    this.tentacles = [];
    for (let t = 0; t < 8; t++) {
      const tentGeo = new THREE.CylinderGeometry(0.1, 0.28, 2.8, 8, 8);
      tentGeo.translate(0, 1.4, 0);

      const tentMesh = new THREE.Mesh(tentGeo, this.material);
      const angle = (t / 8) * Math.PI * 2;
      tentMesh.position.set(Math.cos(angle) * 0.7, -0.4, Math.sin(angle) * 0.7);
      tentMesh.rotation.x = Math.PI * 0.65;
      tentMesh.rotation.y = angle;
      tentMesh.userData = { isOctopus: true };
      this.octoGroup.add(tentMesh);
      this.raycastTargets.push(tentMesh);

      this.tentacles.push(tentMesh);
    }

    this.group.add(this.octoGroup);
  }

  /**
   * 1st Click: Flash color & tentacle reaction; 2nd Click: Retreat into cave
   */
  onClickOctopus() {
    console.log('[OCTOPUS CLICK] state changed');

    if (this.clickState === 0) {
      // 1st Click: Flash bioluminescent cyan/magenta
      this.clickState = 1;
    } else if (this.clickState === 1) {
      // 2nd Click: Retreat deeper into cave
      this.clickState = 2;
      this.reappearTimer = 5.0; // Reappears after 5s
    }
  }

  loadGLBModel(glbPath, position, scale = 1.0) {
    const loader = new GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        this.group.remove(this.octoGroup);
        this.octoGroup = gltf.scene;
        if (position) this.group.position.copy(position);
        this.octoGroup.scale.setScalar(scale);
        this.group.add(this.octoGroup);

        this.raycastTargets = [];
        this.octoGroup.traverse((child) => {
          if (child.isMesh) {
            child.userData = { isOctopus: true };
            this.raycastTargets.push(child);
          }
        });
      },
      undefined,
      (error) => {
        console.warn(`[Octopus] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime, deltaTime) {
    // Mantle breathing animation
    const breath = Math.sin(elapsedTime * 2.0) * 0.06 + 1.0;
    if (this.octoGroup) {
      this.octoGroup.scale.set(breath, breath * 1.05, breath);
    }

    // Undulating tentacles
    this.tentacles.forEach((tent, idx) => {
      const mult = this.clickState === 1 ? 3.0 : 1.0;
      const waveZ = Math.sin(elapsedTime * 2.5 * mult + idx * 0.8) * 0.35;
      const waveX = Math.cos(elapsedTime * 2.0 * mult + idx * 0.8) * 0.2;
      tent.rotation.z = waveZ;
      tent.rotation.x = Math.PI * 0.65 + waveX;
    });

    if (this.clickState === 2) {
      // Smooth retreat deeper into rock cave
      this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, -16.5, deltaTime * 3.5);

      this.reappearTimer -= deltaTime;
      if (this.reappearTimer <= 0) {
        this.clickState = 0;
      }
    } else {
      // Emerge back to cave opening
      this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, -10.0, deltaTime * 1.8);
    }

    // Smooth material color lerp back to base color when not flashing
    if (this.material) {
      const targetColor = this.clickState === 1 ? new THREE.Color(0x00f5d4) : new THREE.Color(0x9b5de5);
      this.material.color.lerp(targetColor, deltaTime * 4.0);
      const targetEmissive = this.clickState === 1 ? 0.85 : 0.0;
      this.material.emissiveIntensity = THREE.MathUtils.lerp(this.material.emissiveIntensity, targetEmissive, deltaTime * 4.0);
    }
  }
}
