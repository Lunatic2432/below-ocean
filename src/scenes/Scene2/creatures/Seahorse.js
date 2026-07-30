import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Seahorse — small delicate creatures hovering near seaweed and coral.
 * Uses the seahorse sf.glb model from the repository.
 * Multiple seahorses are placed near seagrass/coral areas with gentle bobbing motion.
 */
export class Seahorse {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];
    this.seahorses = [];
    this.mixers = [];

    this.scene.add(this.group);

    this.loadSeahorseGLB();
  }

  loadSeahorseGLB() {
    const candidatePaths = [
      '/assests/models/seahorse sf.glb',
      './assests/models/seahorse sf.glb',
      '/assets/models/seahorse sf.glb',
      './assets/models/seahorse sf.glb'
    ];

    // Seahorses positioned near seaweed/coral areas on the seabed
    const seahorseConfigs = [
      { pos: new THREE.Vector3(-10, -19, -12), scale: 0.8, bobRange: 0.3, speed: 0.8, phase: 0 },
      { pos: new THREE.Vector3(8, -19.5, -16), scale: 0.6, bobRange: 0.25, speed: 0.9, phase: 1.2 },
      { pos: new THREE.Vector3(-16, -19, -14), scale: 0.7, bobRange: 0.35, speed: 0.7, phase: 2.4 },
      { pos: new THREE.Vector3(16, -19.5, -10), scale: 0.65, bobRange: 0.3, speed: 0.85, phase: 3.6 }
    ];

    const loader = new GLTFLoader();

    const loadSinglePath = (pathIdx) => {
      if (pathIdx >= candidatePaths.length) {
        console.warn('[Seahorse] Failed to load seahorse sf.glb from candidate paths.');
        return;
      }

      const glbPath = candidatePaths[pathIdx];
      loader.load(
        glbPath,
        (gltf) => {
          console.log(`[Seahorse] Successfully loaded ${glbPath}`);

          seahorseConfigs.forEach((cfg, idx) => {
            const model = gltf.scene.clone(true);

            // Position near seabed by seaweed/coral
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
                action.startAt(idx * 0.3);
                action.play();
              });
              this.mixers.push(mixer);
            }

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData = { isSeahorse: true, seahorseIndex: idx };
                this.raycastTargets.push(child);

                if (child.material) {
                  child.material = child.material.clone();
                }
              }
            });

            model.userData = { isSeahorse: true, seahorseIndex: idx };
            this.group.add(model);

            this.seahorses.push({
              group: model,
              basePos: cfg.pos.clone(),
              bobRange: cfg.bobRange,
              speed: cfg.speed,
              phase: cfg.phase,
              mixer: mixer
            });
          });
        },
        undefined,
        (error) => {
          console.warn(`[Seahorse] Candidate path ${glbPath} failed:`, error);
          loadSinglePath(pathIdx + 1);
        }
      );
    };

    loadSinglePath(0);
  }

  onClickSeahorse(seahorseIndex) {
    console.log('[SEAHORSE CLICK] interaction triggered on seahorse', seahorseIndex);
  }

  update(elapsedTime, deltaTime) {
    // Update animation mixers
    this.mixers.forEach((mixer) => mixer.update(deltaTime));

    // Gentle bobbing and swaying near seaweed
    this.seahorses.forEach((s, idx) => {
      const bobY = Math.sin(elapsedTime * s.speed + s.phase) * s.bobRange;
      const swayX = Math.sin(elapsedTime * s.speed * 0.5 + s.phase) * 0.15;

      s.group.position.y = s.basePos.y + bobY;
      s.group.position.x = s.basePos.x + swayX;

      // Gentle orientation sway
      s.group.rotation.z = Math.sin(elapsedTime * s.speed * 0.8 + s.phase) * 0.08;
    });
  }
}