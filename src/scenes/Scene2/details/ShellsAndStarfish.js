import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ShellsAndStarfish {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.starfishList = [];

    this.group.position.set(0, -22, -5);
    this.scene.add(this.group);

    this.buildShellsAndStarfish();
  }

  buildShellsAndStarfish() {
    // 1. Starfish (5-pointed star geometry)
    const starMat1 = new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.6 });
    const starMat2 = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.6 });

    const starPositions = [
      { x: -5, z: -8, rot: 0.2, mat: starMat1, scale: 0.6 },
      { x: 12, z: -14, rot: -0.5, mat: starMat2, scale: 0.8 },
      { x: -14, z: -16, rot: 0.8, mat: starMat1, scale: 0.7 },
      { x: 7, z: -20, rot: -0.3, mat: starMat2, scale: 0.5 }
    ];

    starPositions.forEach((sp) => {
      const starGeo = this.createStarGeometry(5, 0.4, 0.9);
      const starMesh = new THREE.Mesh(starGeo, sp.mat);
      starMesh.position.set(sp.x, 0.1, sp.z);
      starMesh.rotation.x = -Math.PI / 2;
      starMesh.rotation.z = sp.rot;
      starMesh.scale.setScalar(sp.scale);
      starMesh.receiveShadow = true;
      this.group.add(starMesh);

      this.starfishList.push({ mesh: starMesh, baseScale: sp.scale });
    });

    // 2. Seashells (Conch & Clam shapes)
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xffedd8, roughness: 0.4 });
    const shellPositions = [
      { x: -7, z: -11, scale: 0.5 },
      { x: 15, z: -9, scale: 0.6 },
      { x: -18, z: -13, scale: 0.4 },
      { x: 2, z: -22, scale: 0.55 }
    ];

    shellPositions.forEach((shp) => {
      const shellGeo = new THREE.DodecahedronGeometry(shp.scale, 1);
      shellGeo.scale(1.2, 0.6, 0.8);
      const shellMesh = new THREE.Mesh(shellGeo, shellMat);
      shellMesh.position.set(shp.x, shp.scale * 0.3, shp.z);
      shellMesh.rotation.y = Math.random() * Math.PI;
      shellMesh.castShadow = true;
      this.group.add(shellMesh);
    });
  }

  createStarGeometry(points, innerRadius, outerRadius) {
    const shape = new THREE.Shape();
    const step = Math.PI / points;

    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = i * step;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
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
        console.warn(`[ShellsAndStarfish] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime) {
    // Subtle idle breathing/shimmer animation
    this.starfishList.forEach((s, idx) => {
      const pulse = 1.0 + Math.sin(elapsedTime * 1.5 + idx) * 0.04;
      s.mesh.scale.setScalar(s.baseScale * pulse);
    });
  }
}
