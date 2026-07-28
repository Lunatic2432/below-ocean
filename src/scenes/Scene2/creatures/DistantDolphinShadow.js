import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class DistantDolphinShadow {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];

    this.group.position.set(-25, -12, -25);
    this.scene.add(this.group);

    this.isRevealed = false;
    this.revealTimer = 0;

    this.buildDolphinShadow();
  }

  buildDolphinShadow() {
    this.dolphinMeshGroup = new THREE.Group();

    const bodyGeo = new THREE.ConeGeometry(1.8, 8.0, 12);
    bodyGeo.rotateX(Math.PI / 2);

    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x051d38,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });

    const bodyMesh = new THREE.Mesh(bodyGeo, this.shadowMat);
    bodyMesh.userData = { isDolphin: true };
    this.dolphinMeshGroup.add(bodyMesh);
    this.raycastTargets.push(bodyMesh);

    const finGeo = new THREE.ConeGeometry(0.6, 2.0, 4);
    finGeo.rotateZ(-Math.PI / 3);
    const finMesh = new THREE.Mesh(finGeo, this.shadowMat);
    finMesh.position.set(0, 1.2, 0.5);
    finMesh.userData = { isDolphin: true };
    this.dolphinMeshGroup.add(finMesh);
    this.raycastTargets.push(finMesh);

    const flukeGeo = new THREE.BoxGeometry(2.8, 0.2, 1.2);
    const flukeMesh = new THREE.Mesh(flukeGeo, this.shadowMat);
    flukeMesh.position.set(0, 0, -4.0);
    flukeMesh.userData = { isDolphin: true };
    this.dolphinMeshGroup.add(flukeMesh);
    this.raycastTargets.push(flukeMesh);

    this.group.add(this.dolphinMeshGroup);
  }

  /**
   * On Click / Approach: Briefly reveals dolphin model clearly through light rays, then swims away into distance
   */
  onClickDolphin() {
    console.log('[DOLPHIN CLICK] reveal triggered');
    this.isRevealed = true;
    this.revealTimer = 3.5;
    if (this.shadowMat) {
      this.shadowMat.color.setHex(0x48cae4);
      this.shadowMat.opacity = 0.85;
    }
  }

  loadGLBModel(glbPath, position, scale = 1.0) {
    const loader = new GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        this.group.remove(this.dolphinMeshGroup);
        this.dolphinMeshGroup = gltf.scene;
        if (position) this.group.position.copy(position);
        this.dolphinMeshGroup.scale.setScalar(scale);

        this.raycastTargets = [];
        this.dolphinMeshGroup.traverse((child) => {
          if (child.isMesh) {
            child.userData = { isDolphin: true };
            this.raycastTargets.push(child);
          }
        });

        this.group.add(this.dolphinMeshGroup);
      },
      undefined,
      (error) => {
        console.warn(`[DistantDolphinShadow] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime, deltaTime, cameraPos = null) {
    // Distance check: reveal & swim away if user approaches dolphin shadow
    if (cameraPos && !this.isRevealed) {
      const dist = this.group.position.distanceTo(cameraPos);
      if (dist < 35.0) {
        this.onClickDolphin();
      }
    }

    let speed = 8.0;
    if (this.isRevealed) {
      speed = 18.0; // Fast swim away when revealed
      this.revealTimer -= deltaTime;
      if (this.revealTimer <= 0) {
        this.isRevealed = false;
        if (this.shadowMat) {
          this.shadowMat.color.setHex(0x051d38);
          this.shadowMat.opacity = 0.35;
        }
      }
    }

    this.group.position.x += deltaTime * speed;
    this.group.position.y = -12 + Math.sin(elapsedTime * 0.8) * 1.5;

    if (this.group.position.x > 45) {
      this.group.position.x = -45;
    }

    this.group.rotation.y = Math.PI / 2;
    this.group.rotation.z = Math.sin(elapsedTime * 1.5) * 0.08;
  }
}
