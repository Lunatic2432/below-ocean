import * as THREE from 'three';

export class BubbleSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.maxBubbles = 400;
    this.activeBubbleCount = 120; // Starts subtle at surface, increases during dive

    // Data structures for individual bubble dynamics
    this.bubbles = [];
    this.dummy = new THREE.Object3D();

    this.initSystem();
  }

  initSystem() {
    // 3D Sphere Geometry for Realistic Glassy Underwater Bubbles
    const geometry = new THREE.SphereGeometry(1.0, 16, 16);

    // Custom Specular Glass/Refraction Shader Material for Bubbles
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uBubbleColor: { value: new THREE.Color(0xaae8ff) },
        uHighlightColor: { value: new THREE.Color(0xffffff) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uBubbleColor;
        uniform vec3 uHighlightColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel Rim Light for transparent bubble shell
          float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 2.5);

          // Specular Highlight Spot
          vec3 lightDir = normalize(vec3(0.5, 0.9, 0.3));
          vec3 halfVec = normalize(lightDir + viewDir);
          float specular = pow(max(0.0, dot(normal, halfVec)), 40.0) * 1.8;

          vec3 color = mix(uBubbleColor * 0.4, uHighlightColor, fresnel * 0.7);
          color += uHighlightColor * specular;

          float alpha = clamp(fresnel * 0.75 + specular * 0.6, 0.05, 0.9);

          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, this.material, this.maxBubbles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.instancedMesh);

    // Initialize Bubble Pool
    for (let i = 0; i < this.maxBubbles; i++) {
      const bubble = this.resetBubble({}, true);
      this.bubbles.push(bubble);
    }

    this.updateInstanceMatrices();
  }

  resetBubble(bubble = {}, initialRandomPos = false) {
    const camPos = this.camera.position;

    // Radius variance: micro bubbles (0.04) to large buoyant bubbles (0.35)
    const scale = Math.pow(Math.random(), 2.2) * 0.3 + 0.04;
    
    // Spawn volume around & slightly in front of camera
    const spreadX = (Math.random() - 0.5) * 14;
    const spreadZ = (Math.random() - 0.5) * 12 - 2; // slightly in front of camera
    
    let yPos;
    if (initialRandomPos) {
      yPos = camPos.y - Math.random() * 20 - 0.5;
    } else {
      // Spawn below camera view during descent
      yPos = camPos.y - 4 - Math.random() * 8;
    }

    bubble.position = new THREE.Vector3(
      camPos.x + spreadX,
      yPos,
      camPos.z + spreadZ
    );

    bubble.scale = scale;
    // Rise speed proportional to buoyancy (larger bubbles rise faster)
    bubble.speed = (0.8 + scale * 2.8) * (0.8 + Math.random() * 0.4);
    
    // Sinusoidal sway params
    bubble.swayFreqX = 1.5 + Math.random() * 2.0;
    bubble.swayAmpX = 0.08 + Math.random() * 0.15;
    bubble.swayFreqZ = 1.2 + Math.random() * 1.8;
    bubble.swayAmpZ = 0.05 + Math.random() * 0.12;
    bubble.phaseShift = Math.random() * Math.PI * 2;

    // Opacity / Lifetime
    bubble.opacity = Math.random() * 0.4 + 0.6;
    bubble.active = true;

    return bubble;
  }

  setDivingMode(isDiving) {
    // When diving, spawn lots of bubbles around camera!
    this.activeBubbleCount = isDiving ? this.maxBubbles : 150;
  }

  updateInstanceMatrices() {
    for (let i = 0; i < this.maxBubbles; i++) {
      const bubble = this.bubbles[i];
      
      if (i < this.activeBubbleCount && bubble.active) {
        this.dummy.position.copy(bubble.position);
        this.dummy.scale.setScalar(bubble.scale);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      } else {
        // Hide inactive bubbles far away
        this.dummy.position.set(0, -9999, 0);
        this.dummy.scale.setScalar(0.001);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  update(elapsedTime, deltaTime) {
    if (this.material) {
      this.material.uniforms.uTime.value = elapsedTime;
    }

    const waterSurfaceY = -0.15; // Water surface boundary

    for (let i = 0; i < this.activeBubbleCount; i++) {
      const bubble = this.bubbles[i];

      // Rise upward
      bubble.position.y += bubble.speed * deltaTime * 3.2;

      // Horizontal wobble / drift
      bubble.position.x += Math.sin(elapsedTime * bubble.swayFreqX + bubble.phaseShift) * bubble.swayAmpX * deltaTime * 5.0;
      bubble.position.z += Math.cos(elapsedTime * bubble.swayFreqZ + bubble.phaseShift) * bubble.swayAmpZ * deltaTime * 5.0;

      // Reset when reaching ocean surface
      if (bubble.position.y >= waterSurfaceY) {
        this.resetBubble(bubble, false);
      }
    }

    this.updateInstanceMatrices();
  }
}
