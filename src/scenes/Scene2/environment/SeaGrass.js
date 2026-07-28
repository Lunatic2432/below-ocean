import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SeaGrass {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.grassBlades = [];

    this.group.position.set(0, -22, -5);
    this.scene.add(this.group);

    this.buildSeaGrass();
  }

  buildSeaGrass() {
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a9d8f,
      roughness: 0.7,
      side: THREE.DoubleSide
    });

    const kelpMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b4332,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    // 1. Sea Grass Tufts
    const tuftCount = 35;
    for (let i = 0; i < tuftCount; i++) {
      const tuftGroup = new THREE.Group();
      const x = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 40 - 5;
      tuftGroup.position.set(x, 0, z);

      const bladeCount = 5 + Math.floor(Math.random() * 5);
      for (let b = 0; b < bladeCount; b++) {
        const height = 1.8 + Math.random() * 2.2;
        const geo = new THREE.PlaneGeometry(0.18, height, 6, 6);
        geo.translate(0, height / 2, 0);

        const mesh = new THREE.Mesh(geo, grassMaterial);
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.z = (Math.random() - 0.5) * 0.2;
        tuftGroup.add(mesh);
      }

      this.group.add(tuftGroup);
      this.grassBlades.push({ group: tuftGroup, speed: 1.2 + Math.random() * 0.8, offset: Math.random() * Math.PI * 2 });
    }

    // 2. Tall Kelp Forest Fronds
    const kelpCount = 18;
    for (let k = 0; k < kelpCount; k++) {
      const kelpGroup = new THREE.Group();
      const kX = (Math.random() - 0.5) * 60;
      const kZ = -15 - Math.random() * 20;
      kelpGroup.position.set(kX, 0, kZ);

      const kHeight = 8.0 + Math.random() * 6.0;
      const kelpGeo = new THREE.PlaneGeometry(0.5, kHeight, 10, 10);
      
      // Wave vertices along kelp height
      const pos = kelpGeo.attributes.position;
      for (let p = 0; p < pos.count; p++) {
        const y = pos.getY(p);
        pos.setX(p, pos.getX(p) + Math.sin(y * 0.8) * 0.25);
      }
      kelpGeo.computeVertexNormals();
      kelpGeo.translate(0, kHeight / 2, 0);

      const kelpMesh = new THREE.Mesh(kelpGeo, kelpMaterial);
      kelpMesh.rotation.y = Math.random() * Math.PI;
      kelpGroup.add(kelpMesh);

      this.group.add(kelpGroup);
      this.grassBlades.push({ group: kelpGroup, speed: 0.7 + Math.random() * 0.4, offset: Math.random() * Math.PI * 2 });
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
        console.warn(`[SeaGrass] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime) {
    // Current-driven swaying motion
    this.grassBlades.forEach((item) => {
      const sway = Math.sin(elapsedTime * item.speed + item.offset) * 0.15;
      item.group.rotation.z = sway;
      item.group.rotation.x = Math.cos(elapsedTime * item.speed * 0.8 + item.offset) * 0.08;
    });
  }
}
