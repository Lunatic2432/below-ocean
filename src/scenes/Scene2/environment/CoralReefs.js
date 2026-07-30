import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CoralReefs {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.swayObjects = [];
    this.raycastTargets = [];
    this.releasedFish = [];
    this.mixers = [];

    this.group.position.set(0, -22, -5);
    this.scene.add(this.group);

    this.loadCoralReefGLB();
  }

  loadCoralReefGLB() {
    const candidatePaths = [
      '/assests/models/coralreef1.glb',
      './assests/models/coralreef1.glb',
      '/assets/models/coralreef1.glb'
    ];

    const placeholderPositions = [
      { x: -12, z: -8, scale: 1.8 },
      { x: 14, z: -10, scale: 1.6 },
      { x: -6, z: -18, scale: 2.2 },
      { x: 8, z: -14, scale: 1.7 },
      { x: -16, z: -12, scale: 1.5 },
      { x: 18, z: -8, scale: 1.9 },
      { x: -2, z: -22, scale: 2.0 },
      { x: 12, z: -20, scale: 1.6 },
      { x: -8, z: -10, scale: 1.4 },
      { x: 6, z: -12, scale: 1.8 },
      { x: -18, z: -15, scale: 1.5 },
      { x: 16, z: -16, scale: 1.7 }
    ];

    const loader = new GLTFLoader();

    const loadSinglePath = (pathIdx) => {
      if (pathIdx >= candidatePaths.length) {
        console.warn('[CoralReefs] Failed to load coralreef1.glb from candidate paths.');
        return;
      }

      const glbPath = candidatePaths[pathIdx];
      loader.load(
        glbPath,
        (gltf) => {
          console.log(`[CoralReefs] Successfully loaded ${glbPath}`);

          placeholderPositions.forEach((p, idx) => {
            const model = gltf.scene.clone(true);
            model.position.set(p.x, 0, p.z);

            // Randomize Y rotation and subtle tilt so formations look natural
            model.rotation.y = Math.random() * Math.PI * 2;
            model.rotation.x = (Math.random() - 0.5) * 0.1;
            model.rotation.z = (Math.random() - 0.5) * 0.1;

            // Scale naturally around placeholder size
            const finalScale = p.scale * (0.85 + Math.random() * 0.35);
            model.scale.setScalar(finalScale);

            // Setup animations if present in GLB
            if (gltf.animations && gltf.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.play();
              });
              this.mixers.push(mixer);
            }

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData = { interactiveType: 'coral', coralIndex: idx, meshRef: child };
                this.raycastTargets.push(child);

                if (child.material) {
                  child.material = child.material.clone();
                }
              }
            });

            this.group.add(model);
            this.swayObjects.push({ group: model, speed: 0.6 + Math.random() * 0.4, factor: 0.02 });
          });
        },
        undefined,
        (error) => {
          console.warn(`[CoralReefs] Candidate path ${glbPath} failed:`, error);
          loadSinglePath(pathIdx + 1);
        }
      );
    };

    loadSinglePath(0);
  }

  /**
   * On Click: Coral releases a small group of hidden fish that swim out from behind the coral!
   */
  onClickCoral(coralMesh) {
    if (!coralMesh) return;

    console.log('[CORAL CLICK] hidden fish released');

    coralMesh.userData.clickPulseTimer = 1.2;
    if (coralMesh.material && coralMesh.material.emissive) {
      coralMesh.material.emissive = new THREE.Color(0x00f5d4);
      coralMesh.material.emissiveIntensity = 1.0;
    }

    const worldPos = new THREE.Vector3();
    coralMesh.getWorldPosition(worldPos);

    const fishGeo = new THREE.ConeGeometry(0.3, 0.9, 6);
    fishGeo.rotateX(Math.PI / 2);
    const fishMat = new THREE.MeshStandardMaterial({
      color: 0xff9e00,
      emissive: 0xff5500,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });

    for (let f = 0; f < 3; f++) {
      const fMesh = new THREE.Mesh(fishGeo, fishMat);
      fMesh.position.copy(worldPos).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.8, (Math.random() - 0.5) * 0.8));
      this.scene.add(fMesh);

      const velocity = new THREE.Vector3((Math.random() - 0.5) * 5.0, 1.5 + Math.random() * 2.5, 3.0 + Math.random() * 4.0);
      this.releasedFish.push({ mesh: fMesh, velocity: velocity, life: 4.0 });
    }
  }

  update(elapsedTime, deltaTime, cameraPos = null) {
    // Update animation mixers for GLB corals
    this.mixers.forEach((mixer) => mixer.update(deltaTime));

    // Subtle swaying for coral objects
    this.swayObjects.forEach((item, index) => {
      const sway = Math.sin(elapsedTime * item.speed + index) * item.factor;
      item.group.rotation.z = sway;
      item.group.rotation.x = Math.cos(elapsedTime * item.speed * 0.7 + index) * (item.factor * 0.5);
    });

    // Proximity atmospheric bioluminescent glow & click pulse handling
    if (this.raycastTargets) {
      const coralWorldPos = new THREE.Vector3();
      this.raycastTargets.forEach((mesh) => {
        if (!mesh || !mesh.material || !mesh.material.emissive) return;

        // Handle click pulse countdown
        if (mesh.userData.clickPulseTimer && mesh.userData.clickPulseTimer > 0) {
          mesh.userData.clickPulseTimer -= deltaTime;
          mesh.material.emissive.setHex(0x00f5d4);
          mesh.material.emissiveIntensity = 1.0;
          return;
        }

        if (cameraPos) {
          mesh.getWorldPosition(coralWorldPos);
          const dist = coralWorldPos.distanceTo(cameraPos);

          if (dist < 10.0) {
            const glowFactor = (1.0 - dist / 10.0) * 0.45;
            const pulse = Math.sin(elapsedTime * 3.0) * 0.1 + 0.9;
            mesh.material.emissive.setHex(0x00f5d4);
            mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
              mesh.material.emissiveIntensity || 0,
              glowFactor * pulse,
              deltaTime * 3.0
            );
          } else if (mesh.material.emissiveIntensity && mesh.material.emissiveIntensity > 0.01) {
            mesh.material.emissiveIntensity = THREE.MathUtils.lerp(mesh.material.emissiveIntensity, 0.0, deltaTime * 2.0);
          }
        }
      });
    }

    // Update released fish swimming away
    for (let i = this.releasedFish.length - 1; i >= 0; i--) {
      const rf = this.releasedFish[i];
      rf.mesh.position.addScaledVector(rf.velocity, deltaTime);
      rf.mesh.rotation.y = Math.atan2(rf.velocity.x, rf.velocity.z);
      rf.life -= deltaTime;

      if (rf.life <= 0) {
        this.scene.remove(rf.mesh);
        this.releasedFish.splice(i, 1);
      }
    }
  }
}

