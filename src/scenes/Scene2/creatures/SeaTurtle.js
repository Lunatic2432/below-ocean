import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SeaTurtle {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];
    this.mixer = null;

    this.group.position.set(12, -18, -10);
    this.scene.add(this.group);

    this.isTrackingCamera = false;
    this.trackTimer = 0;
    this.pathProgress = 0;

    // Smooth 3D path curve: background -> foreground in front of camera -> background
    const waypoints = [
      new THREE.Vector3(-25, -19.5, -32),  // Deep background left
      new THREE.Vector3(-12, -18.2, -18),  // Swimming forward toward screen
      new THREE.Vector3(2, -17.5, 2),      // Foreground pass in front of camera
      new THREE.Vector3(18, -18.2, -14),   // Swimming back toward midground right
      new THREE.Vector3(24, -19.0, -28),   // Deep background right
      new THREE.Vector3(0, -20.0, -36)     // Deep background center loop
    ];
    this.swimPath = new THREE.CatmullRomCurve3(waypoints, true, 'centripetal');

    this.loadTurtleGLB();
  }

  loadTurtleGLB() {
    const candidatePaths = [
      '/assests/models/sea turtle simple.glb',
      './assests/models/sea turtle simple.glb',
      '/assets/models/sea turtle simple.glb',
      './assets/models/sea turtle simple.glb'
    ];

    const loader = new GLTFLoader();

    const loadSinglePath = (pathIdx) => {
      if (pathIdx >= candidatePaths.length) {
        console.warn('[SeaTurtle] Failed to load sea turtle simple.glb from candidate paths.');
        return;
      }

      const glbPath = candidatePaths[pathIdx];
      loader.load(
        glbPath,
        (gltf) => {
          console.log(`[SeaTurtle] Successfully loaded ${glbPath}`);

          if (this.turtleGroup) {
            this.group.remove(this.turtleGroup);
          }

          this.turtleGroup = gltf.scene;

          // Rotate 180 deg around Y axis so model faces forward in direction of travel
          this.turtleGroup.rotation.y = Math.PI;

          // Auto-calculate size and scale naturally
          const box = new THREE.Box3().setFromObject(this.turtleGroup);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = maxDim > 0 ? (3.2 / maxDim) : 1.5;
          this.turtleGroup.scale.setScalar(targetScale);

          // Setup animations if present in GLB
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.turtleGroup);
            gltf.animations.forEach((clip) => {
              const action = this.mixer.clipAction(clip);
              action.play();
            });
          }

          this.raycastTargets = [];
          this.turtleGroup.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.userData = { isSeaTurtle: true };
              this.raycastTargets.push(child);
            }
          });

          this.turtleGroup.userData = { isSeaTurtle: true };
          this.group.add(this.turtleGroup);
        },
        undefined,
        (error) => {
          console.warn(`[SeaTurtle] Candidate path ${glbPath} failed:`, error);
          loadSinglePath(pathIdx + 1);
        }
      );
    };

    loadSinglePath(0);
  }

  /**
   * On Click: Triggers temporary camera sequence following turtle for 4.5s
   */
  onClickTurtle(onSequenceStart) {
    console.log('[TURTLE CLICK] follow triggered');
    this.isTrackingCamera = true;
    this.trackTimer = 4.5;
    if (typeof onSequenceStart === 'function') {
      onSequenceStart(this.group.position, 4.5, () => {
        // Dynamic follow camera position behind & slightly above turtle
        const turtlePos = this.group.position.clone();
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion).normalize();
        const camPos = turtlePos.clone().sub(forward.clone().multiplyScalar(6.0)).add(new THREE.Vector3(0, 2.5, 0));
        const lookPos = turtlePos.clone().add(forward.clone().multiplyScalar(5.0));
        return { camPos, lookPos };
      });
    }
  }

  update(elapsedTime, deltaTime) {
    // Update GLB animation mixer if present
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    let speedFactor = 0.025; // Slow, smooth swimming (~40s per full loop)
    if (this.isTrackingCamera) {
      speedFactor = 0.050;
      this.trackTimer -= deltaTime;
      if (this.trackTimer <= 0) {
        this.isTrackingCamera = false;
      }
    }

    this.pathProgress = (this.pathProgress + deltaTime * speedFactor) % 1.0;

    const currentPos = this.swimPath.getPointAt(this.pathProgress);
    const tangent = this.swimPath.getTangentAt(this.pathProgress).normalize();

    // Add subtle organic undulating bobbing on Y axis
    currentPos.y += Math.sin(elapsedTime * 0.8) * 0.4;

    this.group.position.copy(currentPos);

    // Orient model towards upcoming waypoint along tangent vector so turtle always faces direction of motion
    const lookTarget = currentPos.clone().add(tangent);
    this.group.lookAt(lookTarget);
  }
}

