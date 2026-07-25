import * as THREE from 'three';

export class UnderwaterEnvironment {
  constructor(scene, sunPosition) {
    this.scene = scene;
    this.sunPosition = sunPosition;

    // Underwater Scene Fog
    this.surfaceFogColor = new THREE.Color(0x063456);
    this.deepFogColor = new THREE.Color(0x020b18);
    this.scene.fog = new THREE.FogExp2(this.surfaceFogColor.getHex(), 0.022);

    // Build Systems
    this.createGodRays();
    this.createMarineSnow();
  }

  createGodRays() {
    this.godRayGroup = new THREE.Group();

    // Cone geometries representing light shafts entering from water surface
    const rayCount = 12;
    const rayGeo = new THREE.CylinderGeometry(0.8, 14, 45, 16, 1, true);
    rayGeo.translate(0, -22.5, 0); // Origin at surface top

    this.godRayMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.65 },
        uRayColor: { value: new THREE.Color(0xffd5a0) } // Warm sunset light beam
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform vec3 uRayColor;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          // Shimmer animation
          float shimmer = sin(vWorldPosition.x * 0.5 + uTime * 1.8) * cos(vWorldPosition.z * 0.5 + uTime * 1.5) * 0.5 + 0.5;
          
          // Vertical fade out from surface top to deep ocean bottom
          float verticalFade = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
          
          // Edge soften
          float edgeFade = sin(vUv.x * 3.14159265);

          float alpha = shimmer * verticalFade * edgeFade * uIntensity * 0.45;
          gl_FragColor = vec4(uRayColor, alpha);
        }
      `
    });

    for (let i = 0; i < rayCount; i++) {
      const rayMesh = new THREE.Mesh(rayGeo, this.godRayMaterial);
      
      // Random position across water surface near camera view
      const angle = (i / rayCount) * Math.PI * 2;
      const radius = 5 + Math.random() * 25;
      rayMesh.position.set(
        Math.cos(angle) * radius - 10,
        0.5, // Surface level start
        Math.sin(angle) * radius - 15
      );

      // Slant rays matching sunset sun direction
      rayMesh.rotation.z = Math.PI * 0.12 + (Math.random() - 0.5) * 0.1;
      rayMesh.rotation.x = Math.PI * 0.15 + (Math.random() - 0.5) * 0.1;
      rayMesh.scale.set(0.8 + Math.random() * 0.8, 1.0 + Math.random() * 0.5, 0.8 + Math.random() * 0.8);

      this.godRayGroup.add(rayMesh);
    }

    this.scene.add(this.godRayGroup);
  }

  createMarineSnow() {
    const particleCount = 1400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = -Math.random() * 40; // Underwater volume y: 0 to -40
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      scales[i] = Math.random() * 0.18 + 0.05;
      
      speeds[i * 3] = (Math.random() - 0.5) * 0.1;
      speeds[i * 3 + 1] = -Math.random() * 0.08 - 0.02; // Slow sinking drift
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    // Custom Particle Shader with glowing translucency
    this.snowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xaae5ff) }
      },
      vertexShader: `
        attribute float aScale;
        uniform float uTime;
        varying float vAlpha;

        void main() {
          vec3 p = position;
          // Drifting turbulence
          p.x += sin(uTime * 0.6 + p.y * 0.2) * 0.3;
          p.z += cos(uTime * 0.5 + p.x * 0.2) * 0.3;

          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aScale * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          vAlpha = smoothstep(-40.0, -2.0, p.y);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float opacity = (1.0 - dist * 2.0) * vAlpha * 0.65;
          gl_FragColor = vec4(uColor, opacity);
        }
      `
    });

    this.marineSnow = new THREE.Points(geometry, this.snowMaterial);
    this.scene.add(this.marineSnow);
    this.snowSpeeds = speeds;
  }

  update(elapsedTime, deltaTime) {
    if (this.godRayMaterial) {
      this.godRayMaterial.uniforms.uTime.value = elapsedTime;
    }
    if (this.snowMaterial) {
      this.snowMaterial.uniforms.uTime.value = elapsedTime;
    }

    // Sinking & wrap-around particle movement
    if (this.marineSnow) {
      const posAttr = this.marineSnow.geometry.attributes.position;
      const positions = posAttr.array;

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += this.snowSpeeds[i * 3 + 1] * deltaTime * 10;
        // Wrap back to top if sunk too deep
        if (positions[i * 3 + 1] < -42) {
          positions[i * 3 + 1] = -0.5;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  setDepthProgress(factor) {
    // factor: 0.0 (surface) to 1.0 (deep underwater)
    const fogColor = this.surfaceFogColor.clone().lerp(this.deepFogColor, factor);
    this.scene.fog.color.copy(fogColor);
    this.scene.fog.density = 0.022 + factor * 0.018;

    // Fade god rays intensity with depth
    if (this.godRayMaterial) {
      this.godRayMaterial.uniforms.uIntensity.value = Math.max(0.0, 0.65 - factor * 0.55);
    }
  }
}
