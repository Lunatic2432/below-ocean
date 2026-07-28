import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Pufferfish {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];

    this.group.position.set(-4, -18.5, -6);
    this.scene.add(this.group);

    this.isInflated = false;

    this.buildProceduralPufferfish();
  }

  buildProceduralPufferfish() {
    this.pufferGroup = new THREE.Group();
    this.pufferGroup.userData = { isPufferfish: true };

    const bodyGeo = new THREE.SphereGeometry(0.7, 16, 16);
    this.material = new THREE.MeshStandardMaterial({
      color: 0xf4a261,
      roughness: 0.5,
      metalness: 0.1
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.material);
    this.bodyMesh.userData = { isPufferfish: true };
    this.pufferGroup.add(this.bodyMesh);
    this.raycastTargets.push(this.bodyMesh);

    this.spikeGroup = new THREE.Group();
    this.spikeGroup.userData = { isPufferfish: true };
    const spikeGeo = new THREE.ConeGeometry(0.09, 0.35, 6);
    spikeGeo.rotateX(Math.PI / 2);

    for (let s = 0; s < 24; s++) {
      const spikeMesh = new THREE.Mesh(spikeGeo, this.material);
      const phi = Math.acos(-1 + (2 * s) / 24);
      const theta = Math.sqrt(24 * Math.PI) * phi;

      spikeMesh.position.setFromSphericalCoords(0.7, phi, theta);
      spikeMesh.lookAt(this.pufferGroup.position);
      spikeMesh.userData = { isPufferfish: true };
      this.spikeGroup.add(spikeMesh);
      this.raycastTargets.push(spikeMesh);
    }
    this.pufferGroup.add(this.spikeGroup);

    const tailGeo = new THREE.ConeGeometry(0.22, 0.45, 4);
    tailGeo.rotateZ(Math.PI / 2);
    this.tailMesh = new THREE.Mesh(tailGeo, this.material);
    this.tailMesh.position.set(0, 0, -0.8);
    this.tailMesh.userData = { isPufferfish: true };
    this.pufferGroup.add(this.tailMesh);
    this.raycastTargets.push(this.tailMesh);

    this.group.add(this.pufferGroup);
  }

  /**
   * 1st Click: Inflate smoothly; 2nd Click: Deflate smoothly
   */
  onClickPufferfish() {
    console.log('[PUFFER CLICK] inflate/deflate triggered');
    this.isInflated = !this.isInflated;
  }

  loadGLBModel(glbPath, position, scale = 1.0) {
    const loader = new GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        this.group.remove(this.pufferGroup);
        this.pufferGroup = gltf.scene;
        if (position) this.group.position.copy(position);
        this.pufferGroup.scale.setScalar(scale);
        this.group.add(this.pufferGroup);

        this.raycastTargets = [];
        this.pufferGroup.traverse((child) => {
          if (child.isMesh) {
            child.userData = { isPufferfish: true };
            this.raycastTargets.push(child);
          }
        });
      },
      undefined,
      (error) => {
        console.warn(`[Pufferfish] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime, deltaTime) {
    this.group.position.y = -19.5 + Math.sin(elapsedTime * 2.5) * 0.25;
    this.group.rotation.y = Math.sin(elapsedTime * 1.2) * 0.3;

    if (this.tailMesh) {
      this.tailMesh.rotation.y = Math.sin(elapsedTime * 6.0) * 0.3;
    }

    const targetScale = this.isInflated ? 1.75 : 1.0;
    this.pufferGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), deltaTime * 3.5);

    if (this.spikeGroup) {
      this.spikeGroup.visible = true;
      const targetSpikeScale = this.isInflated ? 1.0 : 0.001;
      this.spikeGroup.scale.lerp(new THREE.Vector3(targetSpikeScale, targetSpikeScale, targetSpikeScale), deltaTime * 4.0);
    }
  }
}
