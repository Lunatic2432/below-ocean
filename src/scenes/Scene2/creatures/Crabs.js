import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Crabs {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.crabs = [];
    this.raycastTargets = [];

    this.group.position.set(0, -21.0, -5);
    this.scene.add(this.group);

    this.buildProceduralCrabs();
  }

  buildProceduralCrabs() {
    const crabMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      roughness: 0.5,
      metalness: 0.2
    });

    const crabPositions = [
      { x: -6, z: -10 },
      { x: 14, z: -12 },
      { x: 4, z: -18 }
    ];

    crabPositions.forEach((pos, cIdx) => {
      const crabGroup = new THREE.Group();
      crabGroup.position.set(pos.x, 0, pos.z);
      crabGroup.userData = { isCrab: true, crabIndex: cIdx };

      const bodyGeo = new THREE.SphereGeometry(0.55, 12, 10);
      bodyGeo.scale(1.3, 0.5, 1.0);
      const bodyMesh = new THREE.Mesh(bodyGeo, crabMat);
      bodyMesh.userData = { isCrab: true, crabIndex: cIdx };
      bodyMesh.castShadow = true;
      crabGroup.add(bodyMesh);
      this.raycastTargets.push(bodyMesh);

      const clawGeo = new THREE.BoxGeometry(0.4, 0.25, 0.55);
      const leftClaw = new THREE.Mesh(clawGeo, crabMat);
      leftClaw.position.set(0.7, 0.18, 0.45);
      leftClaw.userData = { isCrab: true, crabIndex: cIdx };
      crabGroup.add(leftClaw);
      this.raycastTargets.push(leftClaw);

      const rightClaw = new THREE.Mesh(clawGeo, crabMat);
      rightClaw.position.set(-0.7, 0.18, 0.45);
      rightClaw.userData = { isCrab: true, crabIndex: cIdx };
      crabGroup.add(rightClaw);
      this.raycastTargets.push(rightClaw);

      // Add 6 jointed legs (3 on left, 3 on right)
      const legs = [];
      const legGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.7, 6);
      legGeo.translate(0, -0.35, 0);

      for (let side = -1; side <= 1; side += 2) {
        for (let l = 0; l < 3; l++) {
          const legMesh = new THREE.Mesh(legGeo, crabMat);
          const zOffset = (l - 1) * 0.28;
          legMesh.position.set(side * 0.5, -0.05, zOffset);
          legMesh.rotation.z = side * 0.6;
          legMesh.userData = { isCrab: true, crabIndex: cIdx };
          crabGroup.add(legMesh);
          this.raycastTargets.push(legMesh);
          legs.push({ mesh: legMesh, side: side, idx: l });
        }
      }

      this.group.add(crabGroup);
      this.crabs.push({
        group: crabGroup,
        leftClaw: leftClaw,
        rightClaw: rightClaw,
        legs: legs,
        baseX: pos.x,
        baseZ: pos.z,
        isHiding: false,
        hideTimer: 0
      });
    });
  }

  /**
   * On Click: Crab hides underneath nearby rock, then re-emerges after 5s
   */
  onClickCrab(crabIndex) {
    const crab = this.crabs[crabIndex];
    if (!crab) return;

    console.log('[CRAB CLICK] hide triggered');

    crab.isHiding = true;
    crab.hideTimer = 5.0;
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
        console.warn(`[Crabs] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime, deltaTime) {
    this.crabs.forEach((crab, idx) => {
      if (crab.isHiding) {
        crab.leftClaw.rotation.x = THREE.MathUtils.lerp(crab.leftClaw.rotation.x, -0.6, deltaTime * 5.0);
        crab.rightClaw.rotation.x = THREE.MathUtils.lerp(crab.rightClaw.rotation.x, -0.6, deltaTime * 5.0);
        crab.group.position.z = THREE.MathUtils.lerp(crab.group.position.z, crab.baseZ - 3.2, deltaTime * 4.0);

        // Hide legs inside body
        crab.legs.forEach(l => {
          l.mesh.rotation.z = THREE.MathUtils.lerp(l.mesh.rotation.z, l.side * 0.1, deltaTime * 5.0);
        });

        crab.hideTimer -= deltaTime;
        if (crab.hideTimer <= 0) {
          crab.isHiding = false;
        }
      } else {
        const skitter = Math.sin(elapsedTime * 2.2 + idx) * 2.2;
        crab.group.position.x = crab.baseX + skitter;
        crab.group.position.z = THREE.MathUtils.lerp(crab.group.position.z, crab.baseZ, deltaTime * 2.0);

        // Claw snap & leg crawling animation
        const clawSnap = Math.sin(elapsedTime * 4.0 + idx) * 0.2;
        crab.leftClaw.rotation.y = clawSnap;
        crab.rightClaw.rotation.y = -clawSnap;

        crab.legs.forEach((l) => {
          const legWiggle = Math.sin(elapsedTime * 10.0 + l.idx * 1.5 + l.side) * 0.25;
          l.mesh.rotation.z = l.side * 0.6 + legWiggle;
        });
      }
    });
  }
}
