import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Blue Whale — majestic giant swimming far from the camera in deeper water.
 * Uses the animated GLB model from the repository and plays its animations.
 */
export class Whale {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];
    this.mixer = null;

    // Position far from camera in deeper open water
    this.group.position.set(-30, -14, -38);
    this.scene.add(this.group);

    this.pathProgress = 0;

    // Wide, slow patrol loop through the deeper background
    const waypoints = [
      new THREE.Vector3(-30, -14, -38),
      new THREE.Vector3(-10, -12, -42),
      new THREE.Vector3(15, -13, -40),
      new THREE.Vector3(30, -15, -35),
      new THREE.Vector3(25, -16, -28),
      new THREE.Vector3(0, -14, -32),
      new THREE.Vector3(-20, -13, -36)
    ];
    this.swimPath = new THREE.CatmullRomCurve3(waypoints, true, 'centripetal');

    this.loadWhaleGLB();
  }

  loadWhaleGLB() {
    const candidatePaths = [
      '/assests/models/blue_whale_animated_downloadable.glb',
      './assests/models/blue_whale_animated_downloadable.glb',
      '/assets/models/blue_whale_animated_downloadable.glb',
      './assets/models/blue_whale_animated_downloadable.glb'
    ];

    const loader = new GLTFLoader();

    const loadSinglePath = (pathIdx) => {
      if (pathIdx >= candidatePaths.length) {
        console.warn('[Whale] Failed to load blue_whale_animated_downloadable.glb from candidate paths.');
        return;
      }

      const glbPath = candidatePaths[pathIdx];
      loader.load(
        glbPath,
        (gltf) => {
          console.log(`[Whale] Successfully loaded ${glbPath}`);

          this.whaleGroup = gltf.scene;

          // Orient model to face forward along path
          this.whaleGroup.rotation.y = Math.PI;

          // Auto-scale to a realistic large size
          const box = new THREE.Box3().setFromObject(this.whaleGroup);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = maxDim > 0 ? (12.0 / maxDim) : 5.0;
          this.whaleGroup.scale.setScalar(targetScale);

          // Setup animations if present
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.whaleGroup);
            gltf.animations.forEach((clip) => {
              const action = this.mixer.clipAction(clip);
              action.play();
            });
          }

          this.raycastTargets = [];
          this.whaleGroup.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.userData = { isWhale: true };
              this.raycastTargets.push(child);
            }
          });

          this.whaleGroup.userData = { isWhale: true };
          this.group.add(this.whaleGroup);
        },
        undefined,
        (error) => {
          console.warn(`[Whale] Candidate path ${glbPath} failed:`, error);
          loadSinglePath(pathIdx + 1);
        }
      );
    };

    loadSinglePath(0);
  }

  onClickWhale() {
    console.log('[WHALE CLICK] interaction triggered');
  }

  update(elapsedTime, deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Very slow majestic swimming loop (~80s per full circuit)
    const speedFactor = 0.012;
    this.pathProgress = (this.pathProgress + deltaTime * speedFactor) % 1.0;

    const currentPos = this.swimPath.getPointAt(this.pathProgress);
    const tangent = this.swimPath.getTangentAt(this.pathProgress).normalize();

    // Subtle vertical undulation
    currentPos.y += Math.sin(elapsedTime * 0.4) * 0.8;

    this.group.position.copy(currentPos);

    // Orient whale along path tangent
    const lookTarget = currentPos.clone().add(tangent);
    this.group.lookAt(lookTarget);
  }
}