import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Jellyfish — bioluminescent drifters floating through mid-water.
 * Uses the liriope_jellyfish_trachymedusae.glb model from the repository.
 * Multiple jellyfish are placed at varying mid-water depths for an organic feel.
 */
export class Jellyfish {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];
    this.jellyfish = [];
    this.mixers = [];

    this.scene.add(this.group);

    this.loadJellyfishGLB();
  }

  loadJellyfishGLB() {
    const candidatePaths = [
      '/assests/models/liriope_jellyfish_trachymedusae.glb',
      './assests/models/liriope_jellyfish_trachymedusae.glb',
      '/assets/models/liriope_jellyfish_trachymedusae.glb',
      './assets/models/liriope_jellyfish_trachymedusae.glb'
    ];

    // Multiple jellyfish drifting at different mid-water positions
    const jellyConfigs = [
      { pos: new THREE.Vector3(-8, -10, -15), scale: 1.2, driftRange: 3.0, speed: 0.4, phase: 0 },
      { pos: new THREE.Vector3(12, -8, -20), scale: 0.9, driftRange: 4.0, speed: 0.3, phase: 1.5 },
      { pos: new THREE.Vector3(-15, -12, -25), scale: 1.5, driftRange: 2.5, speed: 0.35, phase: 3.0 },
      { pos: new THREE.Vector3(20, -9, -18), scale: 1.0, driftRange: 3.5, speed: 0.45, phase: 4.5 },
      { pos: new THREE.Vector3(0, -11, -30), scale: 1.3, driftRange: 3.0, speed: 0.38, phase: 2.0 }
    ];

    const loader = new GLTFLoader();

    const loadSinglePath = (pathIdx) => {
      if (pathIdx >= candidatePaths.length) {
        console.warn('[Jellyfish] Failed to load liriope_jellyfish_trachymedusae.glb from candidate paths.');
        return;
      }

      const glbPath = candidatePaths[pathIdx];
      loader.load(
        glbPath,
        (gltf) => {
          console.log(`[Jellyfish] Successfully loaded ${glbPath}`);

          jellyConfigs.forEach((cfg, idx) => {
            const model = gltf.scene.clone(true);

            // Position at mid-water depth
            model.position.copy(cfg.pos);

            // Scale with slight variation
            const finalScale = cfg.scale * (0.9 + Math.random() * 0.2);
            model.scale.setScalar(finalScale);

            // Random Y rotation for organic variation
            model.rotation.y = Math.random() * Math.PI * 2;

            // Setup animations if present
            let mixer = null;
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                // Offset animation start for organic variation
                action.startAt(idx * 0.5);
                action.play();
              });
              this.mixers.push(mixer);
            }

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData = { isJellyfish: true, jellyIndex: idx };
                this.raycastTargets.push(child);

                // Clone materials for independent variation
                if (child.material) {
                  child.material = child.material.clone();
                }
              }
            });

            model.userData = { isJellyfish: true, jellyIndex: idx };
            this.group.add(model);

            this.jellyfish.push({
              group: model,
              basePos: cfg.pos.clone(),
              driftRange: cfg.driftRange,
              speed: cfg.speed,
              phase: cfg.phase,
              mixer: mixer
            });
          });
        },
        undefined,
        (error) => {
          console.warn(`[Jellyfish] Candidate path ${glbPath} failed:`, error);
          loadSinglePath(pathIdx + 1);
        }
      );
    };

    loadSinglePath(0);
  }

  onClickJellyfish(jellyIndex) {
    console.log('[JELLYFISH CLICK] interaction triggered on jelly', jellyIndex);
  }

  update(elapsedTime, deltaTime) {
    // Update animation mixers
    this.mixers.forEach((mixer) => mixer.update(deltaTime));

    // Gentle drifting motion through mid-water
    this.jellyfish.forEach((j, idx) => {
      const driftX = Math.sin(elapsedTime * j.speed + j.phase) * j.driftRange;
      const driftY = Math.sin(elapsedTime * j.speed * 0.7 + j.phase) * 1.5;
      const driftZ = Math.cos(elapsedTime * j.speed * 0.5 + j.phase) * j.driftRange * 0.6;

      j.group.position.x = j.basePos.x + driftX;
      j.group.position.y = j.basePos.y + driftY;
      j.group.position.z = j.basePos.z + driftZ;

      // Gentle pulsing rotation
      j.group.rotation.y += deltaTime * 0.15;
      j.group.rotation.z = Math.sin(elapsedTime * 0.5 + j.phase) * 0.1;
    });
  }
}