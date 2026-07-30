import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Shark — apex predator patrolling the deeper water zones.
 * Uses the shark.glb model from the repository.
 */
export class Shark {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];
    this.mixer = null;

    // Position in deeper water, away from reef
    this.group.position.set(20, -20, -30);
    this.scene.add(this.group);

    this.pathProgress = 0;

    // Patrol loop through deeper water
    const waypoints = [
      new THREE.Vector3(20, -20, -30),
      new THREE.Vector3(10, -22, -35),
      new THREE.Vector3(-10, -21, -38),
      new THREE.Vector3(-25, -20, -32),
      new THREE.Vector3(-30, -22, -25),
      new THREE.Vector3(-15, -21, -28),
      new THREE.Vector3(5, -20, -30)
    ];
    this.swimPath = new THREE.CatmullRomCurve3(waypoints, true, 'centripetal');

    this.loadSharkGLB();
  }

  loadSharkGLB() {
    const candidatePaths = [
      '/assests/models/shark.glb',
      './assests/models/shark.glb',
      '/assets/models/shark.glb',
      './assets/models/shark.glb'
    ];

    const loader = new GLTFLoader();

    const loadSinglePath = (pathIdx) => {
      if (pathIdx >= candidatePaths.length) {
        console.warn('[Shark] Failed to load shark.glb from candidate paths.');
        return;
      }

      const glbPath = candidatePaths[pathIdx];
      loader.load(
        glbPath,
        (gltf) => {
          console.log(`[Shark] Successfully loaded ${glbPath}`);

          this.sharkGroup = gltf.scene;

          // Orient model to face forward along path
          this.sharkGroup.rotation.y = Math.PI;

          // Auto-scale to a realistic size
          const box = new THREE.Box3().setFromObject(this.sharkGroup);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = maxDim > 0 ? (5.0 / maxDim) : 2.0;
          this.sharkGroup.scale.setScalar(targetScale);

          // Setup animations if present
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.sharkGroup);
            gltf.animations.forEach((clip) => {
              const action = this.mixer.clipAction(clip);
              action.play();
            });
          }

          this.raycastTargets = [];
          this.sharkGroup.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.userData = { isShark: true };
              this.raycastTargets.push(child);
            }
          });

          this.sharkGroup.userData = { isShark: true };
          this.group.add(this.sharkGroup);
        },
        undefined,
        (error) => {
          console.warn(`[Shark] Candidate path ${glbPath} failed:`, error);
          loadSinglePath(pathIdx + 1);
        }
      );
    };

    loadSinglePath(0);
  }

  onClickShark() {
    console.log('[SHARK CLICK] interaction triggered');
  }

  update(elapsedTime, deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Slow patrol swimming (~50s per full circuit)
    const speedFactor = 0.020;
    this.pathProgress = (this.pathProgress + deltaTime * speedFactor) % 1.0;

    const currentPos = this.swimPath.getPointAt(this.pathProgress);
    const tangent = this.swimPath.getTangentAt(this.pathProgress).normalize();

    // Subtle vertical undulation
    currentPos.y += Math.sin(elapsedTime * 0.6) * 0.5;

    this.group.position.copy(currentPos);

    // Orient shark along path tangent
    const lookTarget = currentPos.clone().add(tangent);
    this.group.lookAt(lookTarget);
  }
}