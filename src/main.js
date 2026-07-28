import { SceneManager } from './scene/SceneManager.js';
import { SkyEnvironment } from './scene/SkyEnvironment.js';
import { OceanSurface } from './scene/OceanSurface.js';
import { ShipModel } from './scene/ShipModel.js';
import { UnderwaterEnvironment } from './scene/UnderwaterEnvironment.js';
import { BubbleSystem } from './scene/BubbleSystem.js';
import { DiveController } from './scene/DiveController.js';
import { UIManager } from './ui/UIManager.js';
import { Scene2 } from './scenes/Scene2/Scene2.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  // 1. Initialize SceneManager
  const sceneManager = new SceneManager(canvas);

  // 2. Build Sunset Sky Environment
  const skyEnv = new SkyEnvironment(sceneManager.scene);
  sceneManager.addUpdatable(skyEnv);

  // 3. Build Animated 3D Ocean Water Surface
  const oceanSurface = new OceanSurface(sceneManager.scene, skyEnv.sunPosition);
  sceneManager.addUpdatable({
    update: (elapsedTime) => oceanSurface.update(elapsedTime, sceneManager.camera)
  });

  // 4. Build Sailing Ship on distant horizon
  const ship = new ShipModel(sceneManager.scene);
  sceneManager.addUpdatable(ship);

  // 5. Build Underwater Environment (God rays, Marine Snow, Depth Fog)
  const underwaterEnv = new UnderwaterEnvironment(sceneManager.scene, skyEnv.sunPosition);
  sceneManager.addUpdatable(underwaterEnv);

  // 6. Build Dynamic 3D Bubble Particle System
  const bubbleSystem = new BubbleSystem(sceneManager.scene, sceneManager.camera);
  sceneManager.addUpdatable(bubbleSystem);

  // 7. Build Scene 2 Underwater Exploration Layer
  const scene2 = new Scene2(sceneManager);
  sceneManager.addUpdatable(scene2);

  // 8. Initialize UI Manager
  const uiManager = new UIManager();

  // 9. Build Cinematic Dive Controller
  const diveController = new DiveController(
    sceneManager,
    skyEnv,
    oceanSurface,
    underwaterEnv,
    bubbleSystem,
    uiManager,
    scene2
  );
  sceneManager.addUpdatable(diveController);

  // Bind UI buttons to Dive Controller actions
  uiManager.setDiveCallback(() => diveController.dive());
  uiManager.setResurfaceCallback(() => diveController.resurface());

  // 10. Start Main Render Loop
  sceneManager.render();
});

