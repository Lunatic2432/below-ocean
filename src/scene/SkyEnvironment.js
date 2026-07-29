import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SkyEnvironment {
  constructor(scene) {
    this.scene = scene;

    // 1. Define sun position first before using it
    this.sunPosition = new THREE.Vector3(-10, 4, -90);

    // 2. Group to hold sun GLB object and halo sprite
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.copy(this.sunPosition);
    this.scene.add(this.sunGroup);

    // 3. Sunset directional light
    this.sunLight = new THREE.DirectionalLight(0xffb366, 2.5);
    this.sunLight.position.copy(this.sunPosition);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 300;
    this.scene.add(this.sunLight);

    // 4. Ambient Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0xffa266, 0x051d38, 1.2);
    this.scene.add(this.hemiLight);

    this.mixer = null;
    this.glbSunMesh = null;

    // 5. Create Sky Dome, Sun Halo, and Load GLB
    this.createSkyDome();
    this.createSunHalo();
    this.loadSunGLB();
  }

  createSkyDome() {
    const skyGeo = new THREE.SphereGeometry(450, 32, 32);

    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uSunPosition: { value: this.sunPosition.clone().normalize() },
        uZenithColor: { value: new THREE.Color(0x080828) },
        uMidColor: { value: new THREE.Color(0x682f41) },
        uHorizonColor: { value: new THREE.Color(0xf08b37) },
        uSunGlowColor: { value: new THREE.Color(0xffd380) }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 uSunPosition;
        uniform vec3 uZenithColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunGlowColor;

        void main() {
          vec3 viewDir = normalize(vWorldPosition);
          float height = viewDir.y;

          vec3 skyColor = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.35, height));
          skyColor = mix(skyColor, uZenithColor, smoothstep(0.35, 1.0, height));

          float sunDot = max(0.0, dot(viewDir, uSunPosition));
          float sunGlow = pow(sunDot, 12.0) * 0.9 + pow(sunDot, 96.0) * 1.8;
          skyColor += uSunGlowColor * sunGlow;

          if (height < 0.0) {
            skyColor = mix(uHorizonColor * 0.4, vec3(0.01, 0.05, 0.12), clamp(-height * 5.0, 0.0, 1.0));
          }

          gl_FragColor = vec4(skyColor, 1.0);
        }
      `
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  createSunHalo() {
    // Glowing radial halo sprite around sun
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 235, 180, 1)');
    grad.addColorStop(0.35, 'rgba(255, 160, 60, 0.6)');
    grad.addColorStop(1, 'rgba(255, 90, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    this.sunSprite = new THREE.Sprite(spriteMat);
    this.sunSprite.scale.set(34, 34, 1);
    this.sunGroup.add(this.sunSprite);
  }

  loadSunGLB() {
    const loader = new GLTFLoader();
    const modelPaths = [
      '/models/sun.glb',
      '/assests/models/sun_animated_test.glb',
      '/assets/models/sun_animated_test.glb'
    ];

    const loadFromPath = (index) => {
      if (index >= modelPaths.length) {
        console.warn('Could not load sun GLB model from any candidate path.');
        return;
      }

      const path = modelPaths[index];
      loader.load(
        path,
        (gltf) => {
          this.glbSunMesh = gltf.scene;

          // Scale model appropriately to fit sun position
          const box = new THREE.Box3().setFromObject(this.glbSunMesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);

          if (maxDim > 0) {
            const scaleFactor = 10.0 / maxDim;
            this.glbSunMesh.scale.setScalar(scaleFactor);
          }

          // Ensure GLB materials emit bright warm golden light
          this.glbSunMesh.traverse((child) => {
            if (child.isMesh && child.material) {
              if (child.material.isMeshStandardMaterial || child.material.isMeshPhongMaterial) {
                child.material.emissive = new THREE.Color(0xffaa44);
                child.material.emissiveIntensity = 0.8;
              }
            }
          });

          // Add gltf.scene directly to this.sunGroup
          this.sunGroup.add(this.glbSunMesh);

          // Play embedded animations automatically and continuously
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.glbSunMesh);
            gltf.animations.forEach((clip) => {
              const action = this.mixer.clipAction(clip);
              action.play();
            });
          }
        },
        undefined,
        (error) => {
          console.warn(`Failed loading GLB from ${path}, trying next...`, error);
          loadFromPath(index + 1);
        }
      );
    };

    loadFromPath(0);
  }

  update(elapsedTime, deltaTime) {
    if (this.mixer && typeof deltaTime === 'number') {
      this.mixer.update(deltaTime);
    }
  }
}


