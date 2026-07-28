import * as THREE from 'three';

export class ShipModel {
  constructor(scene) {
    this.scene = scene;

    // Ship Group Root
    this.group = new THREE.Group();
    this.initialPosition = new THREE.Vector3(22, 0, -45);
    this.group.position.copy(this.initialPosition);
    this.group.rotation.y = -Math.PI * 0.42; // Sailing across horizon angle

    this.scene.add(this.group);

    // Modular 3D Ship Mesh Assembly
    this.buildShip();
  }

  buildShip() {
    // Materials
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2314, // Dark mahogany wood
      roughness: 0.7,
      metalness: 0.1
    });

    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a381e,
      roughness: 0.8
    });

    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff2e0, // Warm off-white billowed sails
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    const goldAccent = new THREE.MeshStandardMaterial({
      color: 0xda9100,
      metalness: 0.8,
      roughness: 0.3
    });

    const lanternMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa33
    });

    // 1. Hull Base (Curved compound shape using Lathe or Extrude)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, 0);
    hullShape.bezierCurveTo(2, 0.5, 4, 1.5, 6, 2.5); // Stern to bow taper
    hullShape.lineTo(6, 4);
    hullShape.bezierCurveTo(3, 3.8, -1, 3.5, -4, 4);  // Upper gunwale
    hullShape.lineTo(-4, 1.5);
    hullShape.bezierCurveTo(-2, 0.5, 0, 0, 0, 0);

    const extrudeSettings = {
      steps: 1,
      depth: 3.2,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.4,
      bevelSegments: 3
    };

    const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    hullGeo.center();
    const hullMesh = new THREE.Mesh(hullGeo, woodMaterial);
    hullMesh.position.y = 1.2;
    hullMesh.scale.set(1.4, 0.9, 1);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    this.group.add(hullMesh);

    // Deck Surface
    const deckGeo = new THREE.BoxGeometry(12, 0.3, 3.6);
    const deckMesh = new THREE.Mesh(deckGeo, deckMaterial);
    deckMesh.position.set(0, 2.7, 0);
    this.group.add(deckMesh);

    // Stern Cabin Structure
    const cabinGeo = new THREE.BoxGeometry(3.5, 1.8, 3.4);
    const cabinMesh = new THREE.Mesh(cabinGeo, woodMaterial);
    cabinMesh.position.set(-4.2, 3.6, 0);
    this.group.add(cabinMesh);

    // Stern Gold Windows/Balcony
    const balconyGeo = new THREE.BoxGeometry(0.4, 0.8, 3.0);
    const balconyMesh = new THREE.Mesh(balconyGeo, goldAccent);
    balconyMesh.position.set(-6.0, 3.8, 0);
    this.group.add(balconyMesh);

    // Stern Glowing Lanterns
    const lantern1 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lanternMaterial);
    lantern1.position.set(-6.1, 4.5, 1.2);
    const lantern2 = lantern1.clone();
    lantern2.position.set(-6.1, 4.5, -1.2);
    this.group.add(lantern1, lantern2);

    // Bowsprit (Front Pole)
    const bowspritGeo = new THREE.CylinderGeometry(0.12, 0.2, 6, 8);
    const bowsprit = new THREE.Mesh(bowspritGeo, woodMaterial);
    bowsprit.rotation.z = -Math.PI * 0.42;
    bowsprit.position.set(7.5, 3.5, 0);
    this.group.add(bowsprit);

    // 2. Masts & Sails Assembly
    // Main Mast (Center), Fore Mast (Front), Mizzen Mast (Rear)
    const mastPositions = [
      { x: 1.5, height: 13, sailWidth: 5.5, sailHeight: 6 },  // Main Mast
      { x: 5.2, height: 11, sailWidth: 4.5, sailHeight: 5 },  // Fore Mast
      { x: -2.8, height: 9.5, sailWidth: 3.6, sailHeight: 4.2 } // Mizzen Mast
    ];

    mastPositions.forEach((m) => {
      // Mast Pole
      const mastGeo = new THREE.CylinderGeometry(0.12, 0.22, m.height, 8);
      const mastMesh = new THREE.Mesh(mastGeo, woodMaterial);
      mastMesh.position.set(m.x, 2.7 + m.height / 2, 0);
      mastMesh.castShadow = true;
      this.group.add(mastMesh);

      // Yard arm (horizontal pole)
      const yardGeo = new THREE.CylinderGeometry(0.08, 0.08, m.sailWidth + 1, 8);
      const yardMesh = new THREE.Mesh(yardGeo, woodMaterial);
      yardMesh.rotation.x = Math.PI / 2;
      yardMesh.position.set(m.x, 2.7 + m.height * 0.75, 0);
      this.group.add(yardMesh);

      // Curved Billowed Sail
      const sailGeo = new THREE.PlaneGeometry(m.sailWidth, m.sailHeight, 12, 12);
      // Curve vertices outward to look like wind-filled sail
      const posAttr = sailGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const z = posAttr.getZ(i);
        const y = posAttr.getY(i);
        // Billow bulge in middle of sail
        const bulge = Math.cos((y / (m.sailHeight / 2)) * Math.PI * 0.5) * 0.8;
        posAttr.setZ(i, z + bulge);
      }
      sailGeo.computeVertexNormals();

      const sailMesh = new THREE.Mesh(sailGeo, sailMaterial);
      sailMesh.position.set(m.x + 0.3, 2.7 + m.height * 0.55, 0);
      sailMesh.rotation.y = Math.PI / 2;
      sailMesh.castShadow = true;
      this.group.add(sailMesh);
    });

    // Flag on Main Mast Top
    const flagGeo = new THREE.PlaneGeometry(1.4, 0.8);
    const flagMat = new THREE.MeshBasicMaterial({
      color: 0xc82333, // Crimson flag
      side: THREE.DoubleSide
    });
    this.flagMesh = new THREE.Mesh(flagGeo, flagMat);
    this.flagMesh.position.set(1.5 + 0.7, 2.7 + 13 - 0.4, 0);
    this.group.add(this.flagMesh);

    // Scale overall ship appropriately for horizon perspective
    this.group.scale.set(0.65, 0.65, 0.65);
  }

  update(elapsedTime, deltaTime) {
    // Gentle ocean wave tracking physics (heave, pitch, roll)
    const heave = Math.sin(elapsedTime * 1.3) * 0.25 + Math.cos(elapsedTime * 0.8) * 0.1;
    const pitch = Math.sin(elapsedTime * 1.0) * 0.04;
    const roll = Math.cos(elapsedTime * 1.2) * 0.05;

    this.group.position.y = this.initialPosition.y + heave - 0.4;
    this.group.rotation.z = pitch;
    this.group.rotation.x = roll;

    // Slow peaceful sailing motion across horizon
    this.group.position.x -= deltaTime * 0.35;
    if (this.group.position.x < -60) {
      this.group.position.x = 60; // Loop seamlessly across horizon
    }

    // Flag flutter animation
    if (this.flagMesh) {
      this.flagMesh.rotation.y = Math.PI / 2 + Math.sin(elapsedTime * 5.0) * 0.15;
    }
  }
}
