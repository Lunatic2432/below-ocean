import * as THREE from 'three';
import { CoralReefs } from './environment/CoralReefs.js';
import { UnderwaterRocks } from './environment/UnderwaterRocks.js';
import { SeaGrass } from './environment/SeaGrass.js';
import { Bubbles } from './environment/Bubbles.js';
import { FishSchools } from './creatures/FishSchools.js';
import { SeaTurtle } from './creatures/SeaTurtle.js';
import { Octopus } from './creatures/Octopus.js';
import { Pufferfish } from './creatures/Pufferfish.js';
import { Crabs } from './creatures/Crabs.js';
import { DistantDolphinShadow } from './creatures/DistantDolphinShadow.js';
import { ShellsAndStarfish } from './details/ShellsAndStarfish.js';

export class Layer1 {
  constructor(scene) {
    this.scene = scene;
    this.lightGroup = new THREE.Group();
    this.scene.add(this.lightGroup);

    this.buildUnderwaterLighting();

    this.coralReefs = new CoralReefs(this.scene);
    this.rocks = new UnderwaterRocks(this.scene);
    this.seaGrass = new SeaGrass(this.scene);
    this.bubbles = new Bubbles(this.scene);

    this.fishSchools = new FishSchools(this.scene);
    this.seaTurtle = new SeaTurtle(this.scene);
    this.octopus = new Octopus(this.scene);
    this.pufferfish = new Pufferfish(this.scene);
    this.crabs = new Crabs(this.scene);
    this.dolphinShadow = new DistantDolphinShadow(this.scene);

    this.shellsAndStarfish = new ShellsAndStarfish(this.scene);
  }

  buildUnderwaterLighting() {
    const sunFill = new THREE.DirectionalLight(0x48cae4, 1.8);
    sunFill.position.set(0, 5, 10);
    this.lightGroup.add(sunFill);

    const zoneALight = new THREE.PointLight(0xffd166, 1.5, 20);
    zoneALight.position.set(0, -16, 5);
    this.lightGroup.add(zoneALight);

    const zoneBLight = new THREE.PointLight(0x00f5d4, 1.8, 25);
    zoneBLight.position.set(5, -17, -5);
    this.lightGroup.add(zoneBLight);

    const zoneCLight = new THREE.PointLight(0x9b5de5, 2.0, 18);
    zoneCLight.position.set(-18, -19, -10);
    this.lightGroup.add(zoneCLight);

    const zoneDLight = new THREE.PointLight(0xff9e00, 1.6, 22);
    zoneDLight.position.set(15, -19, -12);
    this.lightGroup.add(zoneDLight);
  }

  getRaycastTargets() {
    const targets = [];
    if (this.coralReefs) targets.push(...this.coralReefs.raycastTargets);
    if (this.bubbles) targets.push(...this.bubbles.raycastTargets);
    if (this.fishSchools) targets.push(...this.fishSchools.raycastTargets);
    if (this.seaTurtle) targets.push(...this.seaTurtle.raycastTargets);
    if (this.octopus) targets.push(...this.octopus.raycastTargets);
    if (this.pufferfish) targets.push(...this.pufferfish.raycastTargets);
    if (this.crabs) targets.push(...this.crabs.raycastTargets);
    if (this.dolphinShadow) targets.push(...this.dolphinShadow.raycastTargets);
    return targets;
  }

  update(elapsedTime, deltaTime, cameraPos = null) {
    if (this.coralReefs) this.coralReefs.update(elapsedTime, deltaTime, cameraPos);
    if (this.rocks) this.rocks.update(elapsedTime, deltaTime);
    if (this.seaGrass) this.seaGrass.update(elapsedTime, deltaTime);
    if (this.bubbles) this.bubbles.update(elapsedTime, deltaTime);
    if (this.fishSchools) this.fishSchools.update(elapsedTime, deltaTime);
    if (this.seaTurtle) this.seaTurtle.update(elapsedTime, deltaTime);
    if (this.octopus) this.octopus.update(elapsedTime, deltaTime);
    if (this.pufferfish) this.pufferfish.update(elapsedTime, deltaTime);
    if (this.crabs) this.crabs.update(elapsedTime, deltaTime);
    if (this.dolphinShadow) this.dolphinShadow.update(elapsedTime, deltaTime, cameraPos);
    if (this.shellsAndStarfish) this.shellsAndStarfish.update(elapsedTime, deltaTime);
  }
}
