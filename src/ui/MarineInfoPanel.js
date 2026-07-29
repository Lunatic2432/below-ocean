import creatureData from '../data/marineCreatures.json';

export class MarineInfoPanel {
  constructor() {
    this.panel = document.getElementById('marine-info-panel');
    this.backdrop = document.getElementById('marine-panel-backdrop');
    this.closeButton = document.getElementById('marine-panel-close');
    this.titleElement = document.getElementById('marine-panel-title');
    this.scientificName = document.getElementById('marine-panel-scientific');
    this.statusElement = document.getElementById('marine-panel-status');
    this.roleElement = document.getElementById('marine-panel-role');
    this.habitatElement = document.getElementById('marine-panel-habitat');
    this.depthElement = document.getElementById('marine-panel-depth');
    this.factsList = document.getElementById('marine-panel-facts');
    this.listContainer = document.getElementById('marine-panel-list');
    this.currentCreature = null;
    this.creatureMap = creatureData.reduce((map, creature) => {
      map[creature.id] = creature;
      return map;
    }, {});

    this.buildList();
    this.attachEvents();
  }

  attachEvents() {
    if (this.closeButton) {
      this.closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  buildList() {
    if (!this.listContainer) return;
    this.listContainer.innerHTML = creatureData
      .map((creature) => {
        return `<button class="marine-panel-list-item" data-creature-id="${creature.id}" type="button">${creature.name}</button>`;
      })
      .join('');

    this.listContainer.querySelectorAll('.marine-panel-list-item').forEach((button) => {
      button.addEventListener('click', () => {
        const creatureId = button.dataset.creatureId;
        this.open(creatureId);
      });
    });
  }

  isOpen() {
    return this.panel && this.panel.classList.contains('open');
  }

  open(creatureId) {
    const creature = this.creatureMap[creatureId];
    if (!creature || !this.panel) return;

    this.currentCreature = creature;
    this.renderCreature(creature);

    this.panel.classList.remove('hidden');
    this.panel.classList.add('open');
    if (this.backdrop) {
      this.backdrop.classList.remove('hidden');
      this.backdrop.classList.add('visible');
    }
    this.highlightActiveListItem(creatureId);
  }

  close() {
    if (!this.panel) return;
    this.panel.classList.remove('open');
    this.panel.classList.add('hidden');
    if (this.backdrop) {
      this.backdrop.classList.remove('visible');
      this.backdrop.classList.add('hidden');
    }
    this.clearHighlight();
  }

  renderCreature(creature) {
    if (this.titleElement) this.titleElement.textContent = creature.name;
    if (this.scientificName) this.scientificName.textContent = creature.scientificName;
    if (this.statusElement) this.statusElement.textContent = creature.conservationStatus;
    if (this.roleElement) this.roleElement.textContent = creature.ecologicalRole;
    if (this.habitatElement) this.habitatElement.textContent = creature.habitat;
    if (this.depthElement) this.depthElement.textContent = creature.depthRange;
    if (this.factsList) {
      this.factsList.innerHTML = creature.funFacts
        .map((fact) => `<li>${fact}</li>`)
        .join('');
    }
  }

  highlightActiveListItem(creatureId) {
    if (!this.listContainer) return;
    this.clearHighlight();
    const activeButton = this.listContainer.querySelector(`[data-creature-id="${creatureId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      activeButton.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  clearHighlight() {
    if (!this.listContainer) return;
    this.listContainer.querySelectorAll('.marine-panel-list-item.active').forEach((button) => {
      button.classList.remove('active');
    });
  }
}
