import * as THREE from 'three';
import gsap from 'gsap';

export class TourManager {
  constructor(sceneManager, scene2, uiManager) {
    this.sceneManager = sceneManager;
    this.scene2 = scene2;
    this.uiManager = uiManager;
    this.isActive = false;
    this.currentTarget = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
    this.timeline = null;
    this.wasExplorationActive = false;
    this.checkpoints = [
      {
        title: 'Surface Ship',
        position: new THREE.Vector3(20, 3.8, -38),
        lookAt: new THREE.Vector3(22, 0, -45),
        duration: 4.2
      },
      {
        title: 'Water Entry',
        position: new THREE.Vector3(0, 2.5, -22),
        lookAt: new THREE.Vector3(0, -6, -16),
        duration: 3.6
      },
      {
        title: 'Coral Reef',
        position: new THREE.Vector3(-10, -10, -15),
        lookAt: new THREE.Vector3(-12, -12, -10),
        duration: 3.8
      },
      {
        title: 'Sea Turtle',
        position: new THREE.Vector3(16, -14, -18),
        lookAt: new THREE.Vector3(12, -18, -10),
        duration: 3.8
      },
      {
        title: 'Fish School',
        position: new THREE.Vector3(0, -12, -8),
        lookAt: new THREE.Vector3(0, -20, -12),
        duration: 3.5
      },
      {
        title: 'Octopus',
        position: new THREE.Vector3(-16, -16, -8),
        lookAt: new THREE.Vector3(-18, -19, -10),
        duration: 3.8
      },
      {
        title: 'Deep Cave',
        position: new THREE.Vector3(-16, -22, -8),
        lookAt: new THREE.Vector3(-18, -21, -12),
        duration: 3.6
      },
      {
        title: 'Final Overview',
        position: new THREE.Vector3(0, -8, -8),
        lookAt: new THREE.Vector3(0, -16, -12),
        duration: 4.0
      }
    ];
    this.currentCheckpoint = 0;
  }

  startTour() {
    if (this.isActive) return;
    this.isActive = true;
    this.wasExplorationActive = this.scene2?.active;
    if (this.scene2 && typeof this.scene2.deactivate === 'function') {
      this.scene2.deactivate();
    }

    const cam = this.sceneManager.camera;
    this.currentLookAt.copy(cam.position).add(new THREE.Vector3(0, 0, -1));
    this.targetLookAt.copy(this.currentLookAt);

    this.uiManager.showTourTitle(true);
    this.uiManager.setSkipTourVisible(true);
    this.currentCheckpoint = 0;
    this.playCheckpoint(this.currentCheckpoint);
  }

  playCheckpoint(index) {
    if (!this.isActive) return;
    if (index >= this.checkpoints.length) {
      this.completeTour();
      return;
    }

    const checkpoint = this.checkpoints[index];
    const cam = this.sceneManager.camera;
    this.uiManager.setTourTitle(checkpoint.title);

    if (this.timeline) {
      this.timeline.kill();
    }

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.currentCheckpoint += 1;
        this.playCheckpoint(this.currentCheckpoint);
      }
    });

    this.timeline.to(cam.position, {
      x: checkpoint.position.x,
      y: checkpoint.position.y,
      z: checkpoint.position.z,
      duration: checkpoint.duration,
      ease: 'power2.inOut'
    });

    this.timeline.to(this.targetLookAt, {
      x: checkpoint.lookAt.x,
      y: checkpoint.lookAt.y,
      z: checkpoint.lookAt.z,
      duration: checkpoint.duration,
      ease: 'power2.inOut'
    }, 0);
  }

  skipTour() {
    if (!this.isActive) return;
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.completeTour();
  }

  completeTour() {
    this.isActive = false;
    this.uiManager.setTourTitle('');
    this.uiManager.showTourTitle(false);
    this.uiManager.setSkipTourVisible(false);
    if (this.scene2 && this.wasExplorationActive && typeof this.scene2.activate === 'function') {
      this.scene2.activate();
    }
  }

  update(elapsedTime, deltaTime) {
    if (!this.isActive) return;
    const cam = this.sceneManager.camera;
    this.currentLookAt.lerp(this.targetLookAt, deltaTime * 3.5);
    cam.lookAt(this.currentLookAt);
  }
}
