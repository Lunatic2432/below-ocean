import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CoralReefs {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.swayObjects = [];
    this.raycastTargets = [];
    this.releasedFish = [];

    this.group.position.set(0, -22, -5);
    this.scene.add(this.group);

    this.buildProceduralReefs();
  }

  buildProceduralReefs() {
    // 1. Brain Coral
    const brainMat = new THREE.MeshStandardMaterial({
      color: 0xe85d75,
      roughness: 0.7,
      metalness: 0.1
    });

    const brainPositions = [
      { x: -12, z: -8, scale: 2.2 },
      { x: 14, z: -10, scale: 1.8 },
      { x: -6, z: -18, scale: 2.8 },
      { x: 8, z: -14, scale: 2.0 }
    ];

    brainPositions.forEach((p, idx) => {
      const geo = new THREE.IcosahedronGeometry(p.scale, 3);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const ridge = Math.sin(vx * 3.5) * Math.cos(vy * 3.5) * Math.sin(vz * 3.5) * 0.25;
        pos.setXYZ(i, vx + ridge, vy + ridge, vz + ridge);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, brainMat.clone());
      mesh.position.set(p.x, p.scale * 0.7, p.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { interactiveType: 'coral', coralIndex: idx, meshRef: mesh };
      this.group.add(mesh);
      this.raycastTargets.push(mesh);
    });

    // 2. Branching Staghorn Corals
    const stagMat1 = new THREE.MeshStandardMaterial({ color: 0xff8c42, roughness: 0.6 });
    const stagMat2 = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.6 });

    const clusterPositions = [
      { x: -16, z: -12, mat: stagMat1 },
      { x: 18, z: -8, mat: stagMat2 },
      { x: -2, z: -22, mat: stagMat1 },
      { x: 12, z: -20, mat: stagMat2 }
    ];

    clusterPositions.forEach(c => {
      const coralCluster = new THREE.Group();
      coralCluster.position.set(c.x, 0, c.z);

      for (let i = 0; i < 7; i++) {
        const height = 3.0 + Math.random() * 2.5;
        const branchGeo = new THREE.CylinderGeometry(0.12, 0.4, height, 8);
        branchGeo.translate(0, height / 2, 0);

        const branchMesh = new THREE.Mesh(branchGeo, c.mat.clone());
        branchMesh.position.set((Math.random() - 0.5) * 2.5, 0, (Math.random() - 0.5) * 2.5);
        branchMesh.rotation.z = (Math.random() - 0.5) * 0.4;
        branchMesh.rotation.x = (Math.random() - 0.5) * 0.4;
        branchMesh.castShadow = true;
        branchMesh.userData = { interactiveType: 'coral', meshRef: branchMesh };
        coralCluster.add(branchMesh);
        this.raycastTargets.push(branchMesh);
      }

      this.group.add(coralCluster);
      this.swayObjects.push({ group: coralCluster, speed: 0.8, factor: 0.05 });
    });

    // 3. Sea Fans & Anemones
    const fanMat = new THREE.MeshStandardMaterial({
      color: 0x9b5de5,
      side: THREE.DoubleSide,
      roughness: 0.5,
      transparent: true,
      opacity: 0.95
    });

    const fanPositions = [
      { x: -8, z: -10, rotY: 0.3, scale: 2.8 },
      { x: 6, z: -12, rotY: -0.5, scale: 3.2 },
      { x: -18, z: -15, rotY: 0.8, scale: 2.5 },
      { x: 16, z: -16, rotY: -0.2, scale: 3.0 }
    ];

    fanPositions.forEach(f => {
      const fanGeo = new THREE.PlaneGeometry(f.scale, f.scale * 1.3, 8, 8);
      const pos = fanGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        pos.setZ(i, Math.sin(x * 1.5) * 0.3);
      }
      fanGeo.computeVertexNormals();
      fanGeo.translate(0, (f.scale * 1.3) / 2, 0);

      const fanMesh = new THREE.Mesh(fanGeo, fanMat.clone());
      fanMesh.position.set(f.x, 0, f.z);
      fanMesh.rotation.y = f.rotY;
      fanMesh.castShadow = true;
      fanMesh.userData = { interactiveType: 'coral', meshRef: fanMesh };
      this.group.add(fanMesh);
      this.raycastTargets.push(fanMesh);

      this.swayObjects.push({ group: fanMesh, speed: 1.2, factor: 0.08 });
    });
  }

  /**
   * On Click: Coral releases a small group of hidden fish that swim out from behind the coral!
   */
  onClickCoral(coralMesh) {
    if (!coralMesh || !coralMesh.material) return;

    console.log('[CORAL CLICK] hidden fish released');

    // Set active click pulse timer on mesh userData
    coralMesh.userData.clickPulseTimer = 1.2;
    coralMesh.material.emissive = new THREE.Color(0x00f5d4);
    coralMesh.material.emissiveIntensity = 1.0;

    // Spawn 3 hidden fish swimming away from coral
    const worldPos = new THREE.Vector3();
    coralMesh.getWorldPosition(worldPos);

    const fishGeo = new THREE.ConeGeometry(0.3, 0.9, 6);
    fishGeo.rotateX(Math.PI / 2);
    const fishMat = new THREE.MeshStandardMaterial({
      color: 0xff9e00,
      emissive: 0xff5500,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });

    for (let f = 0; f < 3; f++) {
      const fMesh = new THREE.Mesh(fishGeo, fishMat);
      fMesh.position.copy(worldPos).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.8, (Math.random() - 0.5) * 0.8));
      this.scene.add(fMesh);

      const velocity = new THREE.Vector3((Math.random() - 0.5) * 5.0, 1.5 + Math.random() * 2.5, 3.0 + Math.random() * 4.0);
      this.releasedFish.push({ mesh: fMesh, velocity: velocity, life: 4.0 });
    }
  }

  loadGLBModel(glbPath, position, scale = 1.0) {
    const loader = new GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        const model = gltf.scene;
        if (position) model.position.copy(position);
        model.scale.setScalar(scale);
        this.group.add(model);
      },
      undefined,
      (error) => {
        console.warn(`[CoralReefs] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime, deltaTime, cameraPos = null) {
    // Current-based swaying for branching corals, sea fans, and anemones
    this.swayObjects.forEach((item, index) => {
      const sway = Math.sin(elapsedTime * item.speed + index) * item.factor;
      item.group.rotation.z = sway;
      item.group.rotation.x = Math.cos(elapsedTime * item.speed * 0.7 + index) * (item.factor * 0.5);
    });

    // Proximity atmospheric bioluminescent glow & click pulse handling
    if (this.raycastTargets) {
      const coralWorldPos = new THREE.Vector3();
      this.raycastTargets.forEach((mesh) => {
        if (!mesh || !mesh.material) return;

        // Handle click pulse countdown
        if (mesh.userData.clickPulseTimer && mesh.userData.clickPulseTimer > 0) {
          mesh.userData.clickPulseTimer -= deltaTime;
          mesh.material.emissive = mesh.material.emissive || new THREE.Color(0x00f5d4);
          mesh.material.emissiveIntensity = 1.0;
          return;
        }

        if (cameraPos) {
          mesh.getWorldPosition(coralWorldPos);
          const dist = coralWorldPos.distanceTo(cameraPos);

          if (dist < 10.0) {
            const glowFactor = (1.0 - dist / 10.0) * 0.45;
            const pulse = Math.sin(elapsedTime * 3.0) * 0.1 + 0.9;
            mesh.material.emissive = mesh.material.emissive || new THREE.Color(0x00f5d4);
            mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
              mesh.material.emissiveIntensity || 0,
              glowFactor * pulse,
              deltaTime * 3.0
            );
          } else if (mesh.material.emissiveIntensity && mesh.material.emissiveIntensity > 0.01) {
            mesh.material.emissiveIntensity = THREE.MathUtils.lerp(mesh.material.emissiveIntensity, 0.0, deltaTime * 2.0);
          }
        }
      });
    }

    // Update released fish swimming away
    for (let i = this.releasedFish.length - 1; i >= 0; i--) {
      const rf = this.releasedFish[i];
      rf.mesh.position.addScaledVector(rf.velocity, deltaTime);
      rf.mesh.rotation.y = Math.atan2(rf.velocity.x, rf.velocity.z);
      rf.life -= deltaTime;

      if (rf.life <= 0) {
        this.scene.remove(rf.mesh);
        this.releasedFish.splice(i, 1);
      }
    }
  }
}
