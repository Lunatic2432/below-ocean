import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class UnderwaterRocks {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.glowLights = [];

    this.group.position.set(0, -22, -5);
    this.scene.add(this.group);

    this.buildProceduralRocks();
  }

  buildProceduralRocks() {
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b3a4a,
      roughness: 0.9,
      metalness: 0.2
    });

    const rockFormations = [
      // Left rock cave complex
      { x: -20, z: -12, scale: [6, 4, 7] },
      { x: -17, z: -15, scale: [5, 6, 5] },
      { x: -22, z: -8, scale: [4, 3, 5] },
      
      // Right rock arch complex
      { x: 22, z: -10, scale: [7, 5, 6] },
      { x: 19, z: -14, scale: [5, 7, 5] },
      
      // Center seabed crags
      { x: -5, z: -25, scale: [8, 3, 6] },
      { x: 10, z: -24, scale: [7, 4, 7] }
    ];

    rockFormations.forEach((r, idx) => {
      const geo = new THREE.DodecahedronGeometry(1, 2);
      // Deform rock geometry for natural rugged texture
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const noise = Math.sin(x * 2.0) * Math.cos(y * 2.0) * 0.25;
        pos.setXYZ(i, x + noise, y + noise, z + noise);
      }
      geo.computeVertexNormals();

      const rockMesh = new THREE.Mesh(geo, rockMaterial);
      rockMesh.position.set(r.x, r.scale[1] * 0.4, r.z);
      rockMesh.scale.set(r.scale[0], r.scale[1], r.scale[2]);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      this.group.add(rockMesh);

      // Add mysterious bioluminescent cave glow inside rock crevices
      if (idx === 0 || idx === 3) {
        const caveLight = new THREE.PointLight(0x00f5d4, 1.5, 8);
        caveLight.position.set(r.x, 1.2, r.z + 1);
        this.group.add(caveLight);

        // Small glowing particles inside cave
        const glowGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
        const glowSphere = new THREE.Mesh(glowGeo, glowMat);
        glowSphere.position.copy(caveLight.position);
        this.group.add(glowSphere);

        this.glowLights.push({ light: caveLight, baseIntensity: 1.5 });
      }
    });

    // Sandy seabed base mesh
    const seabedGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    // Add subtle sand dunes to seabed plane
    const sPos = seabedGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      const x = sPos.getX(i);
      const y = sPos.getY(i);
      const dune = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.6;
      sPos.setZ(i, dune);
    }
    seabedGeo.computeVertexNormals();

    const seabedMat = new THREE.MeshStandardMaterial({
      color: 0x0f2d4a,
      roughness: 0.95,
      metalness: 0.05
    });

    const seabed = new THREE.Mesh(seabedGeo, seabedMat);
    seabed.rotation.x = -Math.PI / 2;
    seabed.position.set(0, 0, 0);
    seabed.receiveShadow = true;
    this.group.add(seabed);
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
        console.warn(`[UnderwaterRocks] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime) {
    // Subtle bioluminescent cave glow pulse
    this.glowLights.forEach((item, i) => {
      const pulse = Math.sin(elapsedTime * 2.0 + i) * 0.4 + 1.0;
      item.light.intensity = item.baseIntensity * pulse;
    });
  }
}
