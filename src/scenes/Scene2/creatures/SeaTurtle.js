import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SeaTurtle {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];
    this.mixer = null;

    this.group.position.set(0, -17.5, -5);
    this.scene.add(this.group);

    this.isTrackingCamera = false;
    this.trackTimer = 0;

    // Procedural turtle initial fallback
    this.buildProceduralTurtle();

    // Load animated GLB sea turtle model
    this.loadGLBModel();
  }

  buildProceduralTurtle() {
    this.turtleGroup = new THREE.Group();

    // Carapace
    const shellGeo = new THREE.SphereGeometry(1.6, 16, 12);
    shellGeo.scale(1.2, 0.5, 1.5);
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.6,
      metalness: 0.2
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.castShadow = true;
    shellMesh.userData = { isSeaTurtle: true };
    this.turtleGroup.add(shellMesh);
    this.raycastTargets.push(shellMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.55, 12, 10);
    headGeo.scale(1.0, 0.7, 1.2);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.7 });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0, 2.0);
    headMesh.userData = { isSeaTurtle: true };
    this.turtleGroup.add(headMesh);
    this.raycastTargets.push(headMesh);

    this.turtleGroup.userData = { isSeaTurtle: true };

    // Flippers
    const flipperGeo = new THREE.BoxGeometry(1.8, 0.1, 0.7);
    flipperGeo.translate(0.9, 0, 0);

    this.leftFlipper = new THREE.Mesh(flipperGeo, skinMat);
    this.leftFlipper.position.set(1.2, -0.1, 0.8);
    this.leftFlipper.userData = { isSeaTurtle: true };
    this.turtleGroup.add(this.leftFlipper);
    this.raycastTargets.push(this.leftFlipper);

    this.rightFlipper = new THREE.Mesh(flipperGeo, skinMat);
    this.rightFlipper.scale.set(-1, 1, 1);
    this.rightFlipper.position.set(-1.2, -0.1, 0.8);
    this.rightFlipper.userData = { isSeaTurtle: true };
    this.turtleGroup.add(this.rightFlipper);
    this.raycastTargets.push(this.rightFlipper);

    this.group.add(this.turtleGroup);
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

  loadGLBModel(glbPath = null, position = null, scale = 1.2) {
    const candidatePaths = glbPath
      ? [glbPath]
      : [
          '/assests/models/sea turtle simple.glb',
          './assests/models/sea turtle simple.glb',
          'assests/models/sea turtle simple.glb',
          '/assests/models/sea%20turtle%20simple.glb',
          '/assets/models/sea turtle simple.glb'
        ];

    const loader = new GLTFLoader();
    let loaded = false;

    const tryNext = (index) => {
      if (index >= candidatePaths.length || loaded) return;
      loader.load(
        candidatePaths[index],
        (gltf) => {
          loaded = true;
          console.log(`[SeaTurtle] Successfully loaded GLB model from ${candidatePaths[index]}`);

          if (this.turtleGroup) {
            this.group.remove(this.turtleGroup);
          }
          this.turtleGroup = gltf.scene;

          if (position) this.group.position.copy(position);
          this.turtleGroup.scale.setScalar(scale);
          this.turtleGroup.rotation.y = Math.PI; // Face direction of travel
          this.group.add(this.turtleGroup);

          // Setup AnimationMixer for continuous GLB flipper swimming animation
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.turtleGroup);
            gltf.animations.forEach((clip) => {
              const action = this.mixer.clipAction(clip);
              action.play();
              action.setEffectiveTimeScale(0.75); // Realistic gentle swimming stroke speed
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
        },
        undefined,
        (error) => {
          console.warn(`[SeaTurtle] GLB load attempt for path ${candidatePaths[index]} failed:`, error);
          tryNext(index + 1);
        }
      );
    };
    tryNext(0);
  }

  update(elapsedTime, deltaTime) {
    // 1. Update GLB swimming flippers animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // 2. Camera follow sequence tracking speed modifier
    let speedMult = 1.0;
    if (this.isTrackingCamera) {
      speedMult = 1.6;
      this.trackTimer -= deltaTime;
      if (this.trackTimer <= 0) {
        this.isTrackingCamera = false;
      }
    }

    // 3. Gentle circular swimming path around the seabed coral reef
    const angle = elapsedTime * 0.12 * speedMult;
    const radiusX = 16.0;
    const radiusZ = 13.0;
    const centerZ = -5.0;
    const centerY = -17.5;

    const posX = Math.cos(angle) * radiusX;
    const posZ = centerZ + Math.sin(angle) * radiusZ;
    const posY = centerY + Math.sin(elapsedTime * 0.5) * 0.7;

    this.group.position.set(posX, posY, posZ);

    // Compute lookAt target point slightly ahead along the circular path
    const futureAngle = angle + 0.04;
    const futureX = Math.cos(futureAngle) * radiusX;
    const futureZ = centerZ + Math.sin(futureAngle) * radiusZ;
    const futureY = centerY + Math.sin((elapsedTime + 0.04) * 0.5) * 0.7;

    const nextPos = new THREE.Vector3(futureX, futureY, futureZ);
    this.group.lookAt(nextPos);

    // Procedural flipper animation fallback if GLB mixer absent
    if (!this.mixer) {
      const paddle = Math.sin(elapsedTime * 3.5) * 0.35;
      if (this.leftFlipper) this.leftFlipper.rotation.z = paddle;
      if (this.rightFlipper) this.rightFlipper.rotation.z = -paddle;
    }
  }
}

