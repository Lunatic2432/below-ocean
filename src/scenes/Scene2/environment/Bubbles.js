import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Bubbles {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.raycastTargets = [];

    this.group.position.set(0, -22, -5);
    this.scene.add(this.group);

    this.burstTimer = 0;
    this.buildBubbles();
  }

  buildBubbles() {
    this.particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const scales = new Float32Array(this.particleCount);
    this.bubbleData = [];

    const ventOrigins = [
      { x: -12, z: -8 },
      { x: 14, z: -10 },
      { x: -20, z: -12 },
      { x: 19, z: -14 },
      { x: 0, z: -18 }
    ];

    ventOrigins.forEach((v, vIdx) => {
      // Create clickable vent base mesh
      const ventGeo = new THREE.CylinderGeometry(0.6, 1.2, 0.5, 8);
      const ventMat = new THREE.MeshStandardMaterial({ color: 0x1b263b, roughness: 0.9 });
      const ventMesh = new THREE.Mesh(ventGeo, ventMat);
      ventMesh.position.set(v.x, 0.25, v.z);
      ventMesh.userData = { interactiveType: 'bubbleVent', ventIndex: vIdx };
      this.group.add(ventMesh);
      this.raycastTargets.push(ventMesh);
    });

    // Hidden Seafloor Artifact behind central vent (revealed during bubble burst)
    const relicGeo = new THREE.OctahedronGeometry(0.8);
    const relicMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 0.9,
      metalness: 0.8
    });
    this.hiddenRelic = new THREE.Mesh(relicGeo, relicMat);
    this.hiddenRelic.position.set(0, 1.2, -18);
    this.hiddenRelic.visible = false;
    this.group.add(this.hiddenRelic);

    for (let i = 0; i < this.particleCount; i++) {
      const vent = ventOrigins[i % ventOrigins.length];
      const startX = vent.x + (Math.random() - 0.5) * 3;
      const startY = Math.random() * 18;
      const startZ = vent.z + (Math.random() - 0.5) * 3;

      positions[i * 3] = startX;
      positions[i * 3 + 1] = startY;
      positions[i * 3 + 2] = startZ;

      const scale = 0.1 + Math.random() * 0.25;
      scales[i] = scale;

      this.bubbleData.push({
        baseX: startX,
        baseZ: startZ,
        speed: 1.2 + Math.random() * 1.5,
        wobbleFreq: 2.0 + Math.random() * 3.0,
        wobbleAmp: 0.1 + Math.random() * 0.2,
        offsetY: startY
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(0xd0f4de) }
      },
      vertexShader: `
        attribute float aScale;
        varying float vOpacity;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aScale * (250.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vOpacity = smoothstep(0.0, 4.0, position.y) * (1.0 - smoothstep(14.0, 18.0, position.y));
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vOpacity;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float rim = smoothstep(0.3, 0.48, dist) * smoothstep(0.5, 0.45, dist);
          float alpha = (rim * 0.8 + 0.2 * (1.0 - dist * 2.0)) * vOpacity;

          gl_FragColor = vec4(uColor, alpha * 0.7);
        }
      `
    });

    this.points = new THREE.Points(geometry, this.material);
    this.group.add(this.points);
  }

  /**
   * On Click Vent: Releases a rapid burst of bubbles and briefly reveals hidden ancient relic!
   */
  onClickVent(ventIndex = 0) {
    console.log('[BUBBLE CLICK] eruption triggered');
    this.burstTimer = 3.5;
    this.hiddenRelic.visible = true;

    // Speed up bubbles during burst
    this.bubbleData.forEach((b) => {
      b.speed = 4.5 + Math.random() * 3.0;
    });
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
        console.warn(`[Bubbles] Optional GLB ${glbPath} not loaded:`, error);
      }
    );
  }

  update(elapsedTime, deltaTime) {
    if (!this.points) return;
    const posAttr = this.points.geometry.attributes.position;
    const array = posAttr.array;

    for (let i = 0; i < this.particleCount; i++) {
      const b = this.bubbleData[i];
      b.offsetY += b.speed * deltaTime;

      if (b.offsetY > 18.0) {
        b.offsetY = 0.0;
        if (this.burstTimer <= 0) {
          b.speed = 1.2 + Math.random() * 1.5;
        }
      }

      const mult = this.burstTimer > 0 ? 2.0 : 1.0;
      array[i * 3] = b.baseX + Math.sin(elapsedTime * b.wobbleFreq * mult + i) * b.wobbleAmp * mult;
      array[i * 3 + 1] = b.offsetY;
      array[i * 3 + 2] = b.baseZ + Math.cos(elapsedTime * b.wobbleFreq * 0.8 * mult + i) * b.wobbleAmp * mult;
    }

    posAttr.needsUpdate = true;

    if (this.burstTimer > 0) {
      this.burstTimer -= deltaTime;
      this.hiddenRelic.rotation.y += deltaTime * 2.5;
      this.hiddenRelic.position.y = 1.2 + Math.sin(elapsedTime * 3.0) * 0.2;

      if (this.hiddenRelic.material) {
        this.hiddenRelic.material.emissiveIntensity = 0.9 + Math.sin(elapsedTime * 6.0) * 0.3;
      }

      if (this.burstTimer <= 0) {
        this.hiddenRelic.visible = false;
      }
    }
  }
}
