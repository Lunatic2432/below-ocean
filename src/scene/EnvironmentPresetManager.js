import gsap from 'gsap';
import * as THREE from 'three';

const presetDefinitions = {
  'tropical-day': {
    background: 0x82d7ff,
    fogColor: 0x74c6ff,
    fogDensity: 0.009,
    sunLightColor: 0xfff2d4,
    sunLightIntensity: 2.3,
    hemiSkyColor: 0xe2f2ff,
    hemiGroundColor: 0x7ec9ff,
    hemiIntensity: 1.0,
    waterSurface: 0x1ca3d7,
    waterDepth: 0x05304d,
    waterReflect: 0xffd7ac,
    godRayColor: 0xffe2a6,
    godRayIntensity: 0.75,
    snowColor: 0xd5f3ff,
    bubbleColor: 0xe0ffff,
    coralEmissive: 0.15,
    sunHaloOpacity: 0.85
  },
  'golden-sunset': {
    background: 0x3f4e7f,
    fogColor: 0x1b3254,
    fogDensity: 0.015,
    sunLightColor: 0xffba78,
    sunLightIntensity: 1.4,
    hemiSkyColor: 0xffc38a,
    hemiGroundColor: 0x304d75,
    hemiIntensity: 0.8,
    waterSurface: 0x1d5d90,
    waterDepth: 0x031d33,
    waterReflect: 0xff955a,
    godRayColor: 0xffc690,
    godRayIntensity: 0.65,
    snowColor: 0xb7d9ff,
    bubbleColor: 0xccecff,
    coralEmissive: 0.28,
    sunHaloOpacity: 0.95
  },
  'bioluminescent-night': {
    background: 0x060a22,
    fogColor: 0x030a18,
    fogDensity: 0.021,
    sunLightColor: 0x5ce8ff,
    sunLightIntensity: 1.1,
    hemiSkyColor: 0x4f6cff,
    hemiGroundColor: 0x092145,
    hemiIntensity: 0.75,
    waterSurface: 0x082855,
    waterDepth: 0x010a1f,
    waterReflect: 0x53f4ff,
    godRayColor: 0x6af2ff,
    godRayIntensity: 0.5,
    snowColor: 0x7aebff,
    bubbleColor: 0x7ff1ff,
    coralEmissive: 0.45,
    sunHaloOpacity: 0.7
  }
};

export class EnvironmentPresetManager {
  constructor(scene, skyEnv, underwaterEnv, oceanSurface, layer1) {
    this.scene = scene;
    this.skyEnv = skyEnv;
    this.underwaterEnv = underwaterEnv;
    this.oceanSurface = oceanSurface;
    this.layer1 = layer1;
    this.activePreset = 'tropical-day';
    this.applyPreset(this.activePreset, true);
  }

  setPreset(presetName) {
    if (!presetDefinitions[presetName] || presetName === this.activePreset) return;
    this.activePreset = presetName;
    this.applyPreset(presetName, false);
  }

  applyPreset(presetName, instant = false) {
    const configuration = presetDefinitions[presetName];
    if (!configuration) return;
    const duration = instant ? 0 : 1.8;
    const ease = 'power2.inOut';

    if (this.scene.background instanceof THREE.Color) {
      gsap.to(this.scene.background, {
        r: new THREE.Color(configuration.background).r,
        g: new THREE.Color(configuration.background).g,
        b: new THREE.Color(configuration.background).b,
        duration,
        ease
      });
    }

    if (this.scene.fog) {
      if (this.scene.fog.color) {
        gsap.to(this.scene.fog.color, {
          r: new THREE.Color(configuration.fogColor).r,
          g: new THREE.Color(configuration.fogColor).g,
          b: new THREE.Color(configuration.fogColor).b,
          duration,
          ease
        });
      }
      gsap.to(this.scene.fog, {
        density: configuration.fogDensity,
        duration,
        ease
      });
    }

    if (this.skyEnv.sunLight) {
      gsap.to(this.skyEnv.sunLight.color, {
        r: new THREE.Color(configuration.sunLightColor).r,
        g: new THREE.Color(configuration.sunLightColor).g,
        b: new THREE.Color(configuration.sunLightColor).b,
        duration,
        ease
      });
      gsap.to(this.skyEnv.sunLight, {
        intensity: configuration.sunLightIntensity,
        duration,
        ease
      });
    }

    if (this.skyEnv.hemiLight) {
      gsap.to(this.skyEnv.hemiLight.color, {
        r: new THREE.Color(configuration.hemiSkyColor).r,
        g: new THREE.Color(configuration.hemiSkyColor).g,
        b: new THREE.Color(configuration.hemiSkyColor).b,
        duration,
        ease
      });
      gsap.to(this.skyEnv.hemiLight.groundColor, {
        r: new THREE.Color(configuration.hemiGroundColor).r,
        g: new THREE.Color(configuration.hemiGroundColor).g,
        b: new THREE.Color(configuration.hemiGroundColor).b,
        duration,
        ease
      });
      gsap.to(this.skyEnv.hemiLight, {
        intensity: configuration.hemiIntensity,
        duration,
        ease
      });
    }

    if (this.oceanSurface && this.oceanSurface.material && this.oceanSurface.material.uniforms) {
      gsap.to(this.oceanSurface.material.uniforms.uSurfaceColor.value, {
        r: new THREE.Color(configuration.waterSurface).r,
        g: new THREE.Color(configuration.waterSurface).g,
        b: new THREE.Color(configuration.waterSurface).b,
        duration,
        ease
      });
      gsap.to(this.oceanSurface.material.uniforms.uDepthColor.value, {
        r: new THREE.Color(configuration.waterDepth).r,
        g: new THREE.Color(configuration.waterDepth).g,
        b: new THREE.Color(configuration.waterDepth).b,
        duration,
        ease
      });
      gsap.to(this.oceanSurface.material.uniforms.uSunsetReflectColor.value, {
        r: new THREE.Color(configuration.waterReflect).r,
        g: new THREE.Color(configuration.waterReflect).g,
        b: new THREE.Color(configuration.waterReflect).b,
        duration,
        ease
      });
    }

    if (this.underwaterEnv && this.underwaterEnv.godRayMaterial) {
      gsap.to(this.underwaterEnv.godRayMaterial.uniforms.uRayColor.value, {
        r: new THREE.Color(configuration.godRayColor).r,
        g: new THREE.Color(configuration.godRayColor).g,
        b: new THREE.Color(configuration.godRayColor).b,
        duration,
        ease
      });
      gsap.to(this.underwaterEnv.godRayMaterial.uniforms.uIntensity, {
        value: configuration.godRayIntensity,
        duration,
        ease
      });
    }

    if (this.underwaterEnv && this.underwaterEnv.snowMaterial) {
      gsap.to(this.underwaterEnv.snowMaterial.uniforms.uColor.value, {
        r: new THREE.Color(configuration.snowColor).r,
        g: new THREE.Color(configuration.snowColor).g,
        b: new THREE.Color(configuration.snowColor).b,
        duration,
        ease
      });
    }

    if (this.layer1?.bubbles?.material) {
      gsap.to(this.layer1.bubbles.material.uniforms.uColor.value, {
        r: new THREE.Color(configuration.bubbleColor).r,
        g: new THREE.Color(configuration.bubbleColor).g,
        b: new THREE.Color(configuration.bubbleColor).b,
        duration,
        ease
      });
    }

    if (this.layer1?.coralReefs) {
      this.updateCoralEmissive(configuration.coralEmissive, duration, ease);
    }

    if (this.skyEnv.sunSprite && this.skyEnv.sunSprite.material) {
      gsap.to(this.skyEnv.sunSprite.material, {
        opacity: configuration.sunHaloOpacity,
        duration,
        ease
      });
    }

    if (this.skyEnv.skyDome && this.skyEnv.skyDome.material && this.skyEnv.skyDome.material.uniforms) {
      const mat = this.skyEnv.skyDome.material;
      const zen = new THREE.Color(0x080828);
      const mid = new THREE.Color(0x682f41);
      const hor = new THREE.Color(0xf08b37);
      const glow = new THREE.Color(1.0, 0.85, 0.45);
      // Use different tint per preset to keep gradient subtle and consistent
      const targetZen = new THREE.Color(configuration.background).lerp(new THREE.Color(0x070f2f), 0.55);
      const targetMid = new THREE.Color(configuration.hemiSkyColor).lerp(new THREE.Color(0x332e5b), 0.4);
      const targetHor = new THREE.Color(configuration.waterReflect).lerp(new THREE.Color(0x0e2c5b), 0.25);
      const targetGlow = new THREE.Color(configuration.sunLightColor).lerp(new THREE.Color(0xffffff), 0.15);
      gsap.to(mat.uniforms.uZenithColor.value, {
        r: targetZen.r,
        g: targetZen.g,
        b: targetZen.b,
        duration,
        ease
      });
      gsap.to(mat.uniforms.uMidColor.value, {
        r: targetMid.r,
        g: targetMid.g,
        b: targetMid.b,
        duration,
        ease
      });
      gsap.to(mat.uniforms.uHorizonColor.value, {
        r: targetHor.r,
        g: targetHor.g,
        b: targetHor.b,
        duration,
        ease
      });
      gsap.to(mat.uniforms.uSunGlowColor.value, {
        r: targetGlow.r,
        g: targetGlow.g,
        b: targetGlow.b,
        duration,
        ease
      });
    }
  }

  updateCoralEmissive(intensity, duration, ease) {
    if (!this.layer1?.coralReefs?.raycastTargets) return;
    this.layer1.coralReefs.raycastTargets.forEach((mesh) => {
      if (mesh.material && mesh.material.emissive) {
        gsap.to(mesh.material, {
          emissiveIntensity: intensity,
          duration,
          ease
        });
      }
    });
  }

  update() {
    if (this.oceanSurface?.material?.uniforms?.uSunPosition) {
      if (this.skyEnv?.sunPosition) {
        this.oceanSurface.material.uniforms.uSunPosition.value.copy(this.skyEnv.sunPosition).normalize();
      }
    }
  }
}
