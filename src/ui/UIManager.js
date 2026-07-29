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
    this.topControls = document.getElementById('top-controls');
    this.envButtons = Array.from(document.querySelectorAll('[data-environment]'));
    this.tourBtn = document.getElementById('tour-btn');
    this.skipTourBtn = document.getElementById('skip-tour-btn');
    this.tourTitle = document.getElementById('tour-title');
    this.photoBtn = document.getElementById('photo-btn');
    this.muteBtn = document.getElementById('mute-btn');

    this.onDiveClickCallback = null;
    this.onResurfaceClickCallback = null;
    this.onEnvironmentChangeCallback = null;
    this.onTourClickCallback = null;
    this.onSkipTourClickCallback = null;
    this.onPhotoClickCallback = null;
    this.onMuteToggleCallback = null;

    this.initEvents();
    this.setActiveEnvironment('tropical-day');
    this.setSkipTourVisible(false);
  }

  initEvents() {
    if (this.diveBtn) {
      this.diveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onDiveClickCallback === 'function') {
          this.onDiveClickCallback();
        }
      });
    }

    if (this.resurfaceBtn) {
      this.resurfaceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onResurfaceClickCallback === 'function') {
          this.onResurfaceClickCallback();
        }
      });
    }

    if (this.envButtons.length) {
      this.envButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const mode = button.dataset.environment;
          this.setActiveEnvironment(mode);
          if (typeof this.onEnvironmentChangeCallback === 'function') {
            this.onEnvironmentChangeCallback(mode);
          }
        });
      });
    }

    if (this.tourBtn) {
      this.tourBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onTourClickCallback === 'function') {
          this.onTourClickCallback();
        }
      });
    }

    if (this.skipTourBtn) {
      this.skipTourBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onSkipTourClickCallback === 'function') {
          this.onSkipTourClickCallback();
        }
      });
    }

    if (this.photoBtn) {
      this.photoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onPhotoClickCallback === 'function') {
          this.onPhotoClickCallback();
        }
      });
    }

    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onMuteToggleCallback === 'function') {
          const muted = this.onMuteToggleCallback();
          this.setMuteButtonState(muted);
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

  setEnvironmentChangeCallback(cb) {
    this.onEnvironmentChangeCallback = cb;
  }

  setTourCallback(cb) {
    this.onTourClickCallback = cb;
  }

  setSkipTourCallback(cb) {
    this.onSkipTourClickCallback = cb;
  }

  setPhotoCallback(cb) {
    this.onPhotoClickCallback = cb;
  }

  setMuteToggleCallback(cb) {
    this.onMuteToggleCallback = cb;
  }

  setActiveEnvironment(mode) {
    if (!this.envButtons) return;
    this.envButtons.forEach((button) => {
      if (button.dataset.environment === mode) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  setTourTitle(title) {
    if (!this.tourTitle) return;
    this.tourTitle.textContent = title || '';
  }

  showTourTitle(visible) {
    if (!this.tourTitle) return;
    this.tourTitle.classList.toggle('hidden', !visible);
  }

  setSkipTourVisible(visible) {
    if (!this.skipTourBtn) return;
    this.skipTourBtn.classList.toggle('hidden', !visible);
  }

  setMuteButtonState(muted) {
    if (!this.muteBtn) return;
    this.muteBtn.textContent = muted ? 'UNMUTE' : 'MUTE';
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
