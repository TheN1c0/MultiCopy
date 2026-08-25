/**
 * MultiCopy - Profiles View Controller
 * Gestiona el listado, creación y eliminación de perfiles.
 */

const ProfilesViewController = {
  app: null,
  dom: {},

  init(app) {
    this.app = app;
    this.cacheDom();
    this.bindEvents();
  },

  cacheDom() {
    this.dom = {
      btnBackFromProfiles: document.getElementById('btn-back-from-profiles'),
      inputNewProfileName: document.getElementById('input-new-profile-name'),
      btnCreateProfile: document.getElementById('btn-create-profile'),
      profilesList: document.getElementById('profiles-list')
    };
  },

  bindEvents() {
    this.dom.btnBackFromProfiles.addEventListener('click', async () => {
      await Storage.clearLastViewState();
      await this.app.reloadState();
      this.app.showView('main');
    });

    this.dom.btnCreateProfile.addEventListener('click', () => this.handleCreateProfile());

    this.dom.inputNewProfileName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleCreateProfile();
      }
    });
  },

  render(profiles, activeProfile) {
    this.dom.profilesList.innerHTML = '';
    if (!profiles || profiles.length === 0) {
      this.dom.profilesList.innerHTML = '<p class="hint-box">No hay perfiles creados</p>';
      return;
    }

    profiles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'list-item-card';

      const fieldCount = p.fields ? p.fields.length : 0;
      const isActive = activeProfile && p.id === activeProfile.id;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'list-item-info';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'list-item-title';
      titleSpan.textContent = p.name;
      if (isActive) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.style.marginLeft = '6px';
        badge.textContent = 'Activo';
        titleSpan.appendChild(badge);
      }

      const subSpan = document.createElement('span');
      subSpan.className = 'list-item-sub';
      subSpan.textContent = `${fieldCount} campos configurados ${p.domain ? `• ${p.domain}` : ''}`;

      infoDiv.appendChild(titleSpan);
      infoDiv.appendChild(subSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'list-item-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-secondary btn-sm btn-pill btn-edit-profile';
      editBtn.dataset.id = p.id;
      editBtn.title = 'Configurar campos';
      editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Campos';
      editBtn.addEventListener('click', () => {
        this.app.openFieldsView(p.id);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-danger-ghost btn-sm btn-delete-profile';
      deleteBtn.dataset.id = p.id;
      deleteBtn.title = 'Eliminar perfil';
      deleteBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`¿Eliminar el perfil "${p.name}"?`)) {
          await Storage.deleteProfile(p.id);
          await this.app.reloadState();
          this.render(this.app.getProfiles(), this.app.getActiveProfile());
        }
      });

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      card.appendChild(infoDiv);
      card.appendChild(actionsDiv);

      this.dom.profilesList.appendChild(card);
    });
  },

  async handleCreateProfile() {
    const name = this.dom.inputNewProfileName.value.trim();
    if (!name) return;

    const newProfileData = typeof ProfileModel !== 'undefined'
      ? ProfileModel.create({ name })
      : { name, domain: '', fields: [] };

    const newProfile = await Storage.saveProfile(newProfileData);

    this.dom.inputNewProfileName.value = '';
    await this.app.reloadState();
    this.app.openFieldsView(newProfile.id);
  }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ProfilesViewController = ProfilesViewController;
}
