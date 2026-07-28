import * as THREE from 'three';

export class OceanSurface {
  constructor(scene, sunPosition) {
    this.scene = scene;
    this.sunPosition = sunPosition;

    this.createWaterMesh();
  }

  createWaterMesh() {
    const geometry = new THREE.PlaneGeometry(600, 600, 256, 256);
    geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSunPosition: { value: this.sunPosition.clone().normalize() },
        uSurfaceColor: { value: new THREE.Color(0x0e5a8a) }, // Warm surface blue-teal
        uDepthColor: { value: new THREE.Color(0x011326) },   // Deep ocean navy
        uSunsetReflectColor: { value: new THREE.Color(0xffaa55) }, // Golden sunset reflection
        uCameraPosition: { value: new THREE.Vector3() }
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vWaveHeight;

        // Gerstner Wave Helper Function
        vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) {
          float steepness = wave.z;
          float wavelength = wave.w;
          float k = 2.0 * 3.14159265 / wavelength;
          float c = sqrt(9.8 / k);
          vec2 d = normalize(wave.xy);
          float f = k * (dot(d, p.xz) - c * uTime * 0.8);
          float a = steepness / k;

          tangent += vec3(
            -d.x * d.x * (steepness * sin(f)),
            d.x * (steepness * cos(f)),
            -d.x * d.y * (steepness * sin(f))
          );
          binormal += vec3(
            -d.x * d.y * (steepness * sin(f)),
            d.y * (steepness * cos(f)),
            -d.y * d.y * (steepness * sin(f))
          );
          return vec3(
            d.x * (a * cos(f)),
            a * sin(f),
            d.y * (a * cos(f))
          );
        }

        void main() {
          vec3 gridPoint = position;
          vec3 tangent = vec3(1.0, 0.0, 0.0);
          vec3 binormal = vec3(0.0, 0.0, 1.0);
          vec3 p = gridPoint;

          // Combine 4 wave directions for ocean swell
          p += gerstnerWave(vec4(1.0, 0.4, 0.12, 28.0), gridPoint, tangent, binormal);
          p += gerstnerWave(vec4(0.5, 0.8, 0.08, 14.0), gridPoint, tangent, binormal);
          p += gerstnerWave(vec4(-0.7, 0.3, 0.05, 8.0), gridPoint, tangent, binormal);
          p += gerstnerWave(vec4(0.2, -0.9, 0.03, 4.0), gridPoint, tangent, binormal);

          vec3 normal = normalize(cross(binormal, tangent));
          vNormal = normal;
          vWaveHeight = p.y;

          vec4 worldPosition = modelMatrix * vec4(p, 1.0);
          vWorldPosition = worldPosition.xyz;

          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uSunPosition;
        uniform vec3 uSurfaceColor;
        uniform vec3 uDepthColor;
        uniform vec3 uSunsetReflectColor;
        uniform vec3 uCameraPosition;
        uniform float uTime;

        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vWaveHeight;

        void main() {
          vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
          vec3 normal = normalize(vNormal);

          // Check if rendered from below water (Camera Y < Surface Y)
          bool isUnderwaterView = gl_FrontFacing == false || uCameraPosition.y < vWorldPosition.y;
          if (isUnderwaterView) {
            normal = -normal;
          }

          // Fresnel Factor
          float NdotV = max(0.0, dot(normal, viewDir));
          float fresnel = pow(1.0 - NdotV, 3.5);

          // Specular Sunset Highlight
          vec3 sunDir = normalize(uSunPosition);
          vec3 halfVector = normalize(sunDir + viewDir);
          float NdotH = max(0.0, dot(normal, halfVector));
          float specular = pow(NdotH, 120.0) * 3.5;

          // Water Color Blend based on depth and waves
          vec3 waterColor = mix(uSurfaceColor, uDepthColor, clamp(-vWorldPosition.y * 0.1 + 0.3, 0.0, 1.0));
          waterColor += vec3(0.02, 0.08, 0.05) * (vWaveHeight + 0.2); // Crest highlights

          // Mix in sunset horizon reflections
          vec3 finalColor = mix(waterColor, uSunsetReflectColor, fresnel * 0.7);
          finalColor += uSunsetReflectColor * specular;

          // Under-surface caustics sheen when looking from below
          if (isUnderwaterView) {
            float undersidePattern = sin(vWorldPosition.x * 1.5 + uTime * 2.0) * cos(vWorldPosition.z * 1.5 + uTime * 2.0) * 0.5 + 0.5;
            finalColor = mix(uSurfaceColor * 1.2, uSunsetReflectColor * 0.6, fresnel) + vec3(undersidePattern * 0.15);
          }

          // Smooth transparency
          float alpha = isUnderwaterView ? 0.78 : mix(0.85, 0.96, fresnel);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = 0;
    this.scene.add(this.mesh);
  }

  update(elapsedTime, camera) {
    if (this.material) {
      this.material.uniforms.uTime.value = elapsedTime;
      if (camera) {
        this.material.uniforms.uCameraPosition.value.copy(camera.position);
      }
    }
  }
}
