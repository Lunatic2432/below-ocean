import * as THREE from 'three';
import gsap from 'gsap';

export class DiveController {
  constructor(sceneManager, skyEnv, oceanSurface, underwaterEnv, bubbleSystem, uiManager) {
    this.sceneManager = sceneManager;
    this.skyEnv = skyEnv;
    this.oceanSurface = oceanSurface;
    this.underwaterEnv = underwaterEnv;
    this.bubbleSystem = bubbleSystem;
    this.uiManager = uiManager;

    // States: 'SURFACE', 'DIVING', 'SUBMERGED', 'RESURFACING'
    this.state = 'SURFACE';
    this.currentDepth = 0; // 0 to 18 meters

    // Camera Surface Base
    this.surfaceCamPos = new THREE.Vector3(0, 0.25, 12);
    this.surfaceLookAt = new THREE.Vector3(0, 0.2, 0);

    // Camera Deep Base
    this.deepCamPos = new THREE.Vector3(0, -18, 12);
    this.deepLookAt = new THREE.Vector3(0, -22, 6);

    this.currentLookAt = this.surfaceLookAt.clone();
  }

  dive() {
    if (this.state !== 'SURFACE') return;

    this.state = 'DIVING';
    this.bubbleSystem.setDivingMode(true);
    this.uiManager.onStartDive();

    const camera = this.sceneManager.camera;
    const duration = 5.5; // Cinematic 5.5 second dive

    // Disable floating camera wobble override during active tween
    this.sceneManager.floatEnabled = false;

    // 1. Camera Position Tween
    gsap.to(camera.position, {
      x: this.deepCamPos.x,
      y: this.deepCamPos.y,
      z: this.deepCamPos.z,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        // Calculate progress factor (0.0 to 1.0)
        const progress = clamp((this.surfaceCamPos.y - camera.position.y) / (this.surfaceCamPos.y - this.deepCamPos.y), 0, 1);
        this.currentDepth = Math.round(progress * 18);
        
        // Interpolate underwater depth visuals & lighting
        this.updateDiveProgress(progress);
        this.uiManager.updateDepthHUD(this.currentDepth, progress);
      },
      onComplete: () => {
        this.state = 'SUBMERGED';
        this.sceneManager.floatEnabled = true; // Re-enable gentle submerged swaying
        this.uiManager.onCompleteDive();
      }
    });

    // 2. Camera Tilt / LookAt Tween
    gsap.to(this.currentLookAt, {
      x: this.deepLookAt.x,
      y: this.deepLookAt.y,
      z: this.deepLookAt.z,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(this.currentLookAt);
      }
    });

    // 3. Sun & Atmosphere Lighting Transition
    gsap.to(this.skyEnv.sunLight, {
      intensity: 0.3,
      duration: duration,
      ease: 'power2.inOut'
    });

    gsap.to(this.skyEnv.hemiLight.color, {
      r: 0.05, g: 0.2, b: 0.45,
      duration: duration,
      ease: 'power2.inOut'
    });
  }

  resurface() {
    if (this.state !== 'SUBMERGED') return;

    this.state = 'RESURFACING';
    this.uiManager.onStartResurface();

    const camera = this.sceneManager.camera;
    const duration = 4.5;

    this.sceneManager.floatEnabled = false;

    // 1. Camera Position Tween Upward
    gsap.to(camera.position, {
      x: this.surfaceCamPos.x,
      y: this.surfaceCamPos.y,
      z: this.surfaceCamPos.z,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        const progress = clamp((this.surfaceCamPos.y - camera.position.y) / (this.surfaceCamPos.y - this.deepCamPos.y), 0, 1);
        this.currentDepth = Math.round(progress * 18);
        
        this.updateDiveProgress(progress);
        this.uiManager.updateDepthHUD(this.currentDepth, progress);
      },
      onComplete: () => {
        this.state = 'SURFACE';
        this.sceneManager.floatEnabled = true;
        this.bubbleSystem.setDivingMode(false);
        this.uiManager.onCompleteResurface();
      }
    });

    // 2. Camera LookAt Tween
    gsap.to(this.currentLookAt, {
      x: this.surfaceLookAt.x,
      y: this.surfaceLookAt.y,
      z: this.surfaceLookAt.z,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(this.currentLookAt);
      }
    });

    // 3. Restore Sun & Atmosphere Lighting
    gsap.to(this.skyEnv.sunLight, {
      intensity: 2.5,
      duration: duration,
      ease: 'power2.inOut'
    });

    gsap.to(this.skyEnv.hemiLight.color, {
      r: 1.0, g: 0.63, b: 0.4,
      duration: duration,
      ease: 'power2.inOut'
    });
  }

  updateDiveProgress(progress) {
    // Sync depth fog, god rays intensity, and ocean shaders
    this.underwaterEnv.setDepthProgress(progress);
  }

  update() {
    // Continuous lookAt lock if in motion
    if (this.state === 'DIVING' || this.state === 'RESURFACING') {
      this.sceneManager.camera.lookAt(this.currentLookAt);
    }
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
