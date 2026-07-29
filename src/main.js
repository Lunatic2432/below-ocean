import { SceneManager } from './scene/SceneManager.js';
import { SkyEnvironment } from './scene/SkyEnvironment.js';
import { OceanSurface } from './scene/OceanSurface.js';
import { ShipModel } from './scene/ShipModel.js';
import { UnderwaterEnvironment } from './scene/UnderwaterEnvironment.js';
import { BubbleSystem } from './scene/BubbleSystem.js';
import { DiveController } from './scene/DiveController.js';
import { UIManager } from './ui/UIManager.js';
import { Scene2 } from './scenes/Scene2/Scene2.js';
import { MarineInfoPanel } from './ui/MarineInfoPanel.js';
import { EnvironmentPresetManager } from './scene/EnvironmentPresetManager.js';
import { TourManager } from './scene/TourManager.js';
import { AudioManager } from './ui/AudioManager.js';
import { PhotoMode } from './ui/PhotoMode.js';

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

  // 8.5 Build Encyclopedia Panel and Audio
  const marineInfoPanel = new MarineInfoPanel();
  const audioManager = new AudioManager();
  const photoMode = new PhotoMode(sceneManager.renderer, uiManager);
  uiManager.setMuteButtonState(audioManager.isMuted);

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

  // 10. Build Environment Presets
  const presetManager = new EnvironmentPresetManager(
    sceneManager.scene,
    skyEnv,
    underwaterEnv,
    oceanSurface,
    scene2.layer1
  );
  sceneManager.addUpdatable(presetManager);

  // 11. Build Tour Manager
  const tourManager = new TourManager(sceneManager, scene2, uiManager);
  sceneManager.addUpdatable(tourManager);

  // 12. Register Creature click panel and audio interactions
  scene2.setCreatureClickCallback((creatureId) => {
    marineInfoPanel.open(creatureId);
    audioManager.playBubbleSound();
  });

  uiManager.setEnvironmentChangeCallback((mode) => {
    presetManager.setPreset(mode);
  });
  uiManager.setTourCallback(() => tourManager.startTour());
  uiManager.setSkipTourCallback(() => tourManager.skipTour());
  uiManager.setPhotoCallback(() => photoMode.capture());
  uiManager.setMuteToggleCallback(() => audioManager.toggleMute());

  // Bind UI buttons to Dive Controller actions
  uiManager.setDiveCallback(() => diveController.dive());
  uiManager.setResurfaceCallback(() => diveController.resurface());

  // 13. Start Main Render Loop
  sceneManager.render();
});

