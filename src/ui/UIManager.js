export class UIManager {
  constructor() {
    // DOM Element References
    this.titleContainer = document.getElementById('title-container');
    this.actionContainer = document.getElementById('action-container');
    this.diveBtn = document.getElementById('dive-btn');
    this.depthHud = document.getElementById('depth-hud');
    this.depthValue = document.getElementById('depth-value');
    this.depthProgress = document.getElementById('depth-progress');
    this.resurfaceContainer = document.getElementById('resurface-container');
    this.resurfaceBtn = document.getElementById('resurface-btn');

    this.onDiveClickCallback = null;
    this.onResurfaceClickCallback = null;

    this.initEvents();
  }

  initEvents() {
    if (this.diveBtn) {
      this.diveBtn.addEventListener('click', () => {
        if (typeof this.onDiveClickCallback === 'function') {
          this.onDiveClickCallback();
        }
      });
    }

    if (this.resurfaceBtn) {
      this.resurfaceBtn.addEventListener('click', () => {
        if (typeof this.onResurfaceClickCallback === 'function') {
          this.onResurfaceClickCallback();
        }
      });
    }
  }

  setDiveCallback(cb) {
    this.onDiveClickCallback = cb;
  }

  setResurfaceCallback(cb) {
    this.onResurfaceClickCallback = cb;
  }

  onStartDive() {
    // Fade out main homepage title and DIVE IN button
    if (this.titleContainer) this.titleContainer.classList.add('hidden');
    if (this.actionContainer) this.actionContainer.classList.add('hidden');

    // Reveal Submerged Depth HUD
    if (this.depthHud) this.depthHud.classList.remove('hidden');
  }

  updateDepthHUD(depthMeters, progressFactor) {
    if (this.depthValue) {
      this.depthValue.textContent = depthMeters;
    }
    if (this.depthProgress) {
      this.depthProgress.style.width = `${Math.round(progressFactor * 100)}%`;
    }
  }

  onCompleteDive() {
    // Show Resurface button when fully submerged
    if (this.resurfaceContainer) this.resurfaceContainer.classList.remove('hidden');
  }

  onStartResurface() {
    if (this.resurfaceContainer) this.resurfaceContainer.classList.add('hidden');
  }

  onCompleteResurface() {
    // Hide Depth HUD
    if (this.depthHud) this.depthHud.classList.add('hidden');

    // Restore Title & DIVE IN button
    if (this.titleContainer) this.titleContainer.classList.remove('hidden');
    if (this.actionContainer) this.actionContainer.classList.remove('hidden');
  }
}
