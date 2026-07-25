import * as THREE from 'three';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Init Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a192f);

    // Init Camera (Floating around surface level y ~ 0.25)
    this.camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.baseCameraPos = new THREE.Vector3(0, 0.25, 12);
    this.cameraTarget = new THREE.Vector3(0, 0.2, 0);
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.cameraTarget);

    // Init Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Updatables array
    this.updatables = [];

    // Floating Camera Motion State
    this.floatEnabled = true;

    // Window Resize Binding
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  addUpdatable(object) {
    this.updatables.push(object);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  updateFloatingCamera(elapsedTime) {
    if (!this.floatEnabled) return;

    // Gentle ocean floating motion: subtle heave & tilt
    const waveHeave = Math.sin(elapsedTime * 1.2) * 0.08 + Math.cos(elapsedTime * 0.7) * 0.04;
    const wavePitch = Math.sin(elapsedTime * 0.9) * 0.015;
    const waveRoll = Math.cos(elapsedTime * 1.1) * 0.01;

    // Apply offset relative to current camera base (handled during dive too)
    this.camera.position.y += waveHeave * 0.02;
    this.camera.rotation.z = waveRoll;
    this.camera.rotation.x += wavePitch * 0.1;
  }

  render(onTick) {
    const animate = () => {
      requestAnimationFrame(animate);

      const elapsedTime = this.clock.getElapsedTime();
      const deltaTime = this.clock.getDelta();

      // Floating surface sway
      this.updateFloatingCamera(elapsedTime);

      // Call registered updatables
      for (const item of this.updatables) {
        if (typeof item.update === 'function') {
          item.update(elapsedTime, deltaTime);
        }
      }

      if (typeof onTick === 'function') {
        onTick(elapsedTime, deltaTime);
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }
}
