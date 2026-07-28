import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class FishSchools {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.schools = [];
    this.raycastTargets = [];

    this.group.position.set(0, -20, -5);
    this.scene.add(this.group);

    this.buildFishSchools();
  }

  buildFishSchools() {
    const fishGeo = new THREE.ConeGeometry(0.2, 0.6, 6);
    fishGeo.rotateX(Math.PI / 2);

    const schoolConfigs = [
      { color: 0xffb703, count: 18, center: new THREE.Vector3(-8, 3, -5), radius: 6 },  // Yellow Tang
      { color: 0x2a9d8f, count: 22, center: new THREE.Vector3(10, 4, -8), radius: 7 },  // Blue Chromis
      { color: 0xe76f51, count: 14, center: new THREE.Vector3(0, 1, -12), radius: 5 }   // Clownfish
    ];

    schoolConfigs.forEach((cfg, sIdx) => {
      const schoolGroup = new THREE.Group();
      const fishArray = [];
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.4,
        metalness: 0.3
      });

      const hitSphereGeo = new THREE.SphereGeometry(cfg.radius * 0.8, 12, 12);
      const hitSphereMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitSphereGeo, hitSphereMat);
      hitMesh.position.copy(cfg.center);
      hitMesh.userData = { isFishSchool: true, schoolIndex: sIdx };
      this.group.add(hitMesh);
      // Note: hitMesh is NOT added to raycastTargets so it does not occlude objects behind it

      for (let i = 0; i < cfg.count; i++) {
        const fishMesh = new THREE.Mesh(fishGeo, mat);
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * cfg.radius,
          (Math.random() - 0.5) * (cfg.radius * 0.5),
          (Math.random() - 0.5) * cfg.radius
        );

        fishMesh.position.copy(cfg.center).add(offset);
        fishMesh.scale.setScalar(0.8 + Math.random() * 0.4);
        fishMesh.userData = { isFishSchool: true, schoolIndex: sIdx, fishIndex: i };
        schoolGroup.add(fishMesh);
        this.raycastTargets.push(fishMesh);

        fishArray.push({
          mesh: fishMesh,
          offset: offset,
          scatterOffset: new THREE.Vector3(),
          isHovered: false
        });
      }

      this.group.add(schoolGroup);
      this.schools.push({
        group: schoolGroup,
        hitMesh: hitMesh,
        center: cfg.center.clone(),
        fish: fishArray,
        isScattered: false,
        scatterTimer: 0
      });
    });
  }

  /**
   * On Click: Fish scatter in panic away from click position, then regroup
   */
  onClickSchool(schoolIndex, hitPoint = null) {
    const school = this.schools[schoolIndex];
    if (!school) return;

    console.log('[FISH CLICK] scatter triggered');

    school.isScattered = true;
    school.scatterTimer = 3.5;

    const origin = hitPoint || school.hitMesh.position;

    school.fish.forEach((f) => {
      // Calculate radial vector away from click hit point
      const worldFishPos = f.mesh.position.clone();
      let dir = worldFishPos.sub(origin);
      if (dir.lengthSq() < 0.001) {
        dir.set((Math.random() - 0.5), Math.random(), (Math.random() - 0.5));
      }
      dir.normalize();

      // Scatter vector pointing away from click location with randomness
      f.scatterOffset.copy(dir).multiplyScalar(8.0 + Math.random() * 6.0);
      f.scatterOffset.y += (Math.random() - 0.3) * 4.0;
    });
  }

  /**
   * On Hover: One nearby fish turns subtly toward camera/user
   */
  onHoverFish(meshRef, cameraPos) {
    if (!meshRef || !cameraPos) return;
    const schoolIdx = meshRef.userData.schoolIndex;
    const fishIdx = meshRef.userData.fishIndex;
    if (schoolIdx !== undefined && fishIdx !== undefined && this.schools[schoolIdx]) {
      const f = this.schools[schoolIdx].fish[fishIdx];
      if (f && !this.schools[schoolIdx].isScattered) {
        f.isHovered = true;
        f.mesh.lookAt(cameraPos);
      }
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
        console.warn(`[FishSchools] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime, deltaTime) {
    this.schools.forEach((school) => {
      const angle = elapsedTime * 0.35;
      const orbitX = Math.cos(angle) * 3.5;
      const orbitZ = Math.sin(angle) * 2.5;
      const currentCenter = school.center.clone().add(new THREE.Vector3(orbitX, Math.sin(elapsedTime * 0.5) * 0.5, orbitZ));
      school.hitMesh.position.copy(currentCenter);

      if (school.isScattered) {
        school.scatterTimer -= deltaTime;
        if (school.scatterTimer <= 0) {
          school.isScattered = false;
        }
      }

      school.fish.forEach((f, i) => {
        let targetPos = currentCenter.clone().add(f.offset);

        if (school.isScattered) {
          targetPos.add(f.scatterOffset);
        }

        f.mesh.position.lerp(targetPos, deltaTime * (school.isScattered ? 4.5 : 2.0));

        if (!school.isScattered) {
          const lookTarget = f.mesh.position.clone().add(new THREE.Vector3(Math.cos(angle + 0.1), 0, Math.sin(angle + 0.1)));
          f.mesh.lookAt(lookTarget);
        }

        f.mesh.rotation.z = Math.sin(elapsedTime * 8.0 + i) * 0.15;
      });
    });
  }
}
