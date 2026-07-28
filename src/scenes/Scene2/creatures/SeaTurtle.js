import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SeaTurtle {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];

    this.group.position.set(12, -18, -10);
    this.scene.add(this.group);

    this.isTrackingCamera = false;
    this.trackTimer = 0;

    this.buildProceduralTurtle();
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

  loadGLBModel(glbPath, position, scale = 1.0) {
    const loader = new GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        this.group.remove(this.turtleGroup);
        this.turtleGroup = gltf.scene;
        if (position) this.group.position.copy(position);
        this.turtleGroup.scale.setScalar(scale);
        this.group.add(this.turtleGroup);

        this.raycastTargets = [];
        this.turtleGroup.traverse((child) => {
          if (child.isMesh) {
            child.userData = { isSeaTurtle: true };
            this.raycastTargets.push(child);
          }
        });
      },
      undefined,
      (error) => {
        console.warn(`[SeaTurtle] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime, deltaTime) {
    let swimSpeed = 1.5;
    if (this.isTrackingCamera) {
      swimSpeed = 3.0;
      this.trackTimer -= deltaTime;
      if (this.trackTimer <= 0) {
        this.isTrackingCamera = false;
      }
    }

    const angle = elapsedTime * 0.25;
    this.group.position.x = 12 + Math.cos(angle) * 8;
    this.group.position.z = -10 + Math.sin(angle) * 6;
    this.group.position.y = -18 + Math.sin(elapsedTime * 0.8) * 0.6;

    const nextPos = new THREE.Vector3(
      12 + Math.cos(angle + 0.05) * 8,
      -18 + Math.sin((elapsedTime + 0.05) * 0.8) * 0.6,
      -10 + Math.sin(angle + 0.05) * 6
    );
    this.group.lookAt(nextPos);

    const paddle = Math.sin(elapsedTime * 3.5) * 0.35;
    if (this.leftFlipper) this.leftFlipper.rotation.z = paddle;
    if (this.rightFlipper) this.rightFlipper.rotation.z = -paddle;
  }
}
