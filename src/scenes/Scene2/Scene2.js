import * as THREE from 'three';
import { Layer1 } from './Layer1.js';

export class Scene2 {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.scene = sceneManager.scene;
    this.camera = sceneManager.camera;

    this.active = false;
    this.layer1 = new Layer1(this.scene);

    // Camera Control State Priority Machine:
    // 'EXPLORATION': User 3D control
    // 'TEMPORARY_SEQUENCE': Camera following creature (Turtle, Dolphin, etc.)
    this.cameraState = 'EXPLORATION';
    this.sequenceTimer = 0;
    this.sequenceTargetPos = new THREE.Vector3();
    this.sequenceGetDynamicPos = null;

    // 3D Physics Movement & Orientation State
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 35.0;
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.targetLookAt = new THREE.Vector3(0, -22, 0);
    this.currentLookAt = this.targetLookAt.clone();

    // Keyboard Movement Flags
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false
    };

    // Mouse & Pointer Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isMouseDown = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.hoveredObject = null;

    this.initEvents();
    this.logRegistrations();
  }

  logRegistrations() {
    console.log('[REGISTERED] Fish School - FishSchools');
    console.log('[REGISTERED] Sea Turtle - SeaTurtle');
    console.log('[REGISTERED] Octopus - Octopus');
    console.log('[REGISTERED] Crab - Crabs');
    console.log('[REGISTERED] Pufferfish - Pufferfish');
    console.log('[REGISTERED] Coral - CoralReefs');
    console.log('[REGISTERED] Bubble Cluster - Bubbles');
    console.log('[REGISTERED] Distant Dolphin Shadow - DistantDolphinShadow');
  }

  initEvents() {
    const canvas = this.sceneManager.canvas;

    // Keyboard Key Listeners
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      this.updateKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      if (!this.active) return;
      this.updateKey(e.code, false);
    });

    // Pointer Events for Mouse Look & Interaction
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      this.isMouseDown = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.handleRaycastClick(e);
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.active) return;

      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.cameraState === 'EXPLORATION') {
        const deltaX = e.clientX - this.lastMousePos.x;
        const deltaY = e.clientY - this.lastMousePos.y;
        this.lastMousePos = { x: e.clientX, y: e.clientY };

        if (this.isMouseDown) {
          // Drag camera look
          this.targetYaw -= deltaX * 0.0035;
          this.targetPitch -= deltaY * 0.0035;
          this.targetPitch = Math.max(-1.3, Math.min(1.3, this.targetPitch));
        } else {
          // Subtle mouse movement orientation nudge
          this.targetYaw -= this.mouse.x * 0.0006;
          this.targetPitch += this.mouse.y * 0.0006;
          this.targetPitch = Math.max(-1.3, Math.min(1.3, this.targetPitch));
        }
      }

      this.checkHoverInteraction();
    });

    window.addEventListener('pointerup', () => {
      this.isMouseDown = false;
    });

    // Mouse Wheel Depth / Forward Impulse
    window.addEventListener('wheel', (e) => {
      if (!this.active || this.cameraState !== 'EXPLORATION') return;
      const scrollImpulse = e.deltaY * -0.01;
      const forwardDir = new THREE.Vector3();
      this.camera.getWorldDirection(forwardDir);
      this.velocity.addScaledVector(forwardDir, scrollImpulse * 5.0);
    });
  }

  updateKey(code, isPressed) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.setMoveState('forward', isPressed);
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.setMoveState('backward', isPressed);
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.setMoveState('left', isPressed);
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.setMoveState('right', isPressed);
        break;
      case 'Space':
      case 'KeyR':
        this.setMoveState('up', isPressed);
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyC':
      case 'KeyE':
      case 'KeyF':
        this.setMoveState('down', isPressed);
        break;
    }
  }

  setMoveState(dir, isPressed) {
    if (!this.active) return;
    if (this.keys[dir] !== undefined) {
      const wasPressed = this.keys[dir];
      this.keys[dir] = isPressed;

      if (isPressed && !wasPressed) {
        // Compute direction vectors from current camera orientation
        const forward = new THREE.Vector3(
          Math.sin(this.yaw) * Math.cos(this.pitch),
          Math.sin(this.pitch),
          -Math.cos(this.yaw) * Math.cos(this.pitch)
        ).normalize();
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw)).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        const impulseSpeed = 12.0;
        if (dir === 'forward') this.velocity.addScaledVector(forward, impulseSpeed);
        else if (dir === 'backward') this.velocity.addScaledVector(forward, -impulseSpeed);
        else if (dir === 'left') this.velocity.addScaledVector(right, -impulseSpeed);
        else if (dir === 'right') this.velocity.addScaledVector(right, impulseSpeed);
        else if (dir === 'up') this.velocity.addScaledVector(up, impulseSpeed);
        else if (dir === 'down') this.velocity.addScaledVector(up, -impulseSpeed);
      }
    }
  }

  /**
   * Recursive Interaction Detection: Walk up parent hierarchy
   */
  findInteractiveParent(object) {
    let current = object;
    while (current) {
      if (
        current.userData &&
        (current.userData.isFishSchool ||
          current.userData.isSeaTurtle ||
          current.userData.isOctopus ||
          current.userData.isPufferfish ||
          current.userData.isCrab ||
          current.userData.isDolphin ||
          current.userData.interactiveType === 'coral' ||
          current.userData.interactiveType === 'bubbleVent')
      ) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  checkHoverInteraction() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const targets = this.layer1.getRaycastTargets();
    const intersects = this.raycaster.intersectObjects(targets, true);

    const canvas = this.sceneManager.canvas;

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const interactiveObj = this.findInteractiveParent(hitObj);

      if (interactiveObj) {
        canvas.style.cursor = 'pointer';
        this.hoveredObject = interactiveObj;

        // Fish school hover reaction
        if (interactiveObj.userData.isFishSchool && this.layer1.fishSchools) {
          this.layer1.fishSchools.onHoverFish(hitObj, this.camera.position);
        }
        return;
      }
    }

    this.hoveredObject = null;
    canvas.style.cursor = 'default';
  }

  handleRaycastClick(event) {
    const rect = this.sceneManager.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log(`[CLICK PIPELINE] Pointer down at screen (${event.clientX}, ${event.clientY}) -> NDC (${this.mouse.x.toFixed(3)}, ${this.mouse.y.toFixed(3)})`);
    console.log(`[CLICK PIPELINE] Scene2 active: ${this.active} | Camera state: ${this.cameraState} | Interaction manager enabled: true`);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const targets = this.layer1.getRaycastTargets();
    const intersects = this.raycaster.intersectObjects(targets, true);

    console.log(`[CLICK PIPELINE] Raycast targets count: ${targets.length} | Intersects count: ${intersects.length}`);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      console.log(`[CLICK PIPELINE] First intersected mesh: type='${hitObj.type}', name='${hitObj.name || "unnamed"}'`);

      // Trace hierarchy
      const path = [];
      let curr = hitObj;
      while (curr) {
        let label = curr.type || 'Object3D';
        if (curr.name) label += `(${curr.name})`;
        if (curr.userData && Object.keys(curr.userData).length > 0) {
          label += `[userData: ${JSON.stringify(curr.userData)}]`;
        }
        path.push(label);
        curr = curr.parent;
      }
      console.log(`[CLICK PIPELINE] Hierarchy traversal: ${path.join(' -> ')}`);

      const interactiveObj = this.findInteractiveParent(hitObj);
      if (interactiveObj) {
        const data = interactiveObj.userData;
        let registeredType = 'unknown';
        if (data.isFishSchool) registeredType = 'Fish School';
        else if (data.isSeaTurtle) registeredType = 'Sea Turtle';
        else if (data.isOctopus) registeredType = 'Octopus';
        else if (data.isPufferfish) registeredType = 'Pufferfish';
        else if (data.isCrab) registeredType = 'Crab';
        else if (data.isDolphin) registeredType = 'Dolphin Shadow';
        else if (data.interactiveType === 'coral') registeredType = 'Coral';
        else if (data.interactiveType === 'bubbleVent') registeredType = 'Bubble Vent';

        console.log(`[CLICK PIPELINE] Interactive root found: ${registeredType}. Executing callback...`);

        if (data.isFishSchool && this.layer1.fishSchools) {
          this.layer1.fishSchools.onClickSchool(data.schoolIndex, intersects[0].point);
        } else if (data.isSeaTurtle && this.layer1.seaTurtle) {
          this.layer1.seaTurtle.onClickTurtle((targetPos, duration, dynamicFn) => {
            this.triggerTemporarySequence(targetPos, duration, dynamicFn);
          });
        } else if (data.isOctopus && this.layer1.octopus) {
          this.layer1.octopus.onClickOctopus();
        } else if (data.isPufferfish && this.layer1.pufferfish) {
          this.layer1.pufferfish.onClickPufferfish();
        } else if (data.isCrab && this.layer1.crabs) {
          this.layer1.crabs.onClickCrab(data.crabIndex);
        } else if (data.isDolphin && this.layer1.dolphinShadow) {
          this.layer1.dolphinShadow.onClickDolphin();
        } else if (data.interactiveType === 'coral' && this.layer1.coralReefs) {
          this.layer1.coralReefs.onClickCoral(data.meshRef || hitObj);
        } else if (data.interactiveType === 'bubbleVent' && this.layer1.bubbles) {
          this.layer1.bubbles.onClickVent(data.ventIndex);
        }
      } else {
        console.log(`[CLICK PIPELINE] No interactive parent found for mesh '${hitObj.name || hitObj.type}'`);
      }
    } else {
      console.log(`[CLICK PIPELINE] Raycast did not intersect any registered interactive object.`);
    }
  }

  /**
   * Trigger temporary sequence mode (e.g. Turtle follow sequence)
   */
  triggerTemporarySequence(targetPos, duration = 4.0, getDynamicFn = null) {
    this.cameraState = 'TEMPORARY_SEQUENCE';
    this.sequenceTimer = duration;
    this.sequenceTargetPos.copy(targetPos);
    this.sequenceGetDynamicPos = getDynamicFn;
  }

  activate() {
    this.active = true;
    this.cameraState = 'EXPLORATION';
    this.sceneManager.floatEnabled = false;

    // Reset physics state and key flags
    this.velocity.set(0, 0, 0);
    Object.keys(this.keys).forEach((k) => (this.keys[k] = false));

    // Initialize pitch/yaw from current camera direction
    const forwardDir = new THREE.Vector3();
    this.camera.getWorldDirection(forwardDir);
    this.targetPitch = Math.asin(THREE.MathUtils.clamp(forwardDir.y, -0.99, 0.99));
    this.targetYaw = Math.atan2(-forwardDir.x, -forwardDir.z);
    this.pitch = this.targetPitch;
    this.yaw = this.targetYaw;
    this.currentLookAt.copy(this.camera.position).add(forwardDir);

    // Ensure camera is positioned at submerged depth
    if (this.camera.position.y > -10) {
      this.camera.position.set(0, -18, 12);
    }
  }

  deactivate() {
    this.active = false;
    this.cameraState = 'EXPLORATION';
    this.sceneManager.canvas.style.cursor = 'default';
  }

  update(elapsedTime, deltaTime) {
    // 1. Update Layer 1 Animations
    if (this.layer1) {
      this.layer1.update(elapsedTime, deltaTime, this.camera.position);
    }

    if (!this.active) return;

    // 2. Camera State Priority Machine Handling
    if (this.cameraState === 'TEMPORARY_SEQUENCE') {
      if (typeof this.sequenceGetDynamicPos === 'function') {
        const dynamicState = this.sequenceGetDynamicPos();
        if (dynamicState) {
          if (dynamicState.camPos) {
            this.camera.position.lerp(dynamicState.camPos, deltaTime * 2.0);
          }
          if (dynamicState.lookPos) {
            this.currentLookAt.lerp(dynamicState.lookPos, deltaTime * 3.0);
          }
        }
      } else {
        this.currentLookAt.lerp(this.sequenceTargetPos, deltaTime * 2.5);
      }

      this.camera.lookAt(this.currentLookAt);

      this.sequenceTimer -= deltaTime;
      if (this.sequenceTimer <= 0) {
        // Return control back to user exploration seamlessly
        this.cameraState = 'EXPLORATION';
        this.sequenceGetDynamicPos = null;

        // Restore pitch/yaw smoothly from ending sequence camera direction
        const endingDir = new THREE.Vector3();
        this.camera.getWorldDirection(endingDir);
        this.targetPitch = Math.asin(THREE.MathUtils.clamp(endingDir.y, -0.99, 0.99));
        this.targetYaw = Math.atan2(-endingDir.x, -endingDir.z);
        this.pitch = this.targetPitch;
        this.yaw = this.targetYaw;
      }
      return;
    }

    // 3. User Exploration State ('EXPLORATION')
    // Smooth Euler Yaw/Pitch Interpolation
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, deltaTime * 8.0);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, deltaTime * 8.0);

    // Compute Camera Direction Vectors
    const forward = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    const right = new THREE.Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw)).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Apply Keyboard Input Acceleration
    const accel = new THREE.Vector3();
    if (this.keys.forward) accel.add(forward);
    if (this.keys.backward) accel.addScaledVector(forward, -1);
    if (this.keys.right) accel.add(right);
    if (this.keys.left) accel.addScaledVector(right, -1);
    if (this.keys.up) accel.add(up);
    if (this.keys.down) accel.addScaledVector(up, -1);

    if (accel.lengthSq() > 0) {
      accel.normalize();
      this.velocity.addScaledVector(accel, this.moveSpeed * deltaTime);
    }

    // Underwater Damping / Inertia
    this.velocity.multiplyScalar(0.92);

    // Integrate Velocity into Position
    this.camera.position.addScaledVector(this.velocity, deltaTime);

    // Enforce Seamless Infinite World Exploration Wrapping (Sequence repeats endlessly as user moves)
    const zMin = -45.0, zMax = 25.0, zSpan = zMax - zMin;
    if (this.camera.position.z < zMin) {
      this.camera.position.z += zSpan;
    } else if (this.camera.position.z > zMax) {
      this.camera.position.z -= zSpan;
    }

    const xMin = -45.0, xMax = 45.0, xSpan = xMax - xMin;
    if (this.camera.position.x < xMin) {
      this.camera.position.x += xSpan;
    } else if (this.camera.position.x > xMax) {
      this.camera.position.x -= xSpan;
    }

    const yMin = -26.0, yMax = -4.0, ySpan = yMax - yMin;
    if (this.camera.position.y < yMin) {
      this.camera.position.y += ySpan;
    } else if (this.camera.position.y > yMax) {
      this.camera.position.y -= ySpan;
    }

    // Update LookAt Target
    this.targetLookAt.copy(this.camera.position).add(forward);
    this.camera.lookAt(this.targetLookAt);
  }
}

