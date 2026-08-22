/**
 * MultiCopy - Popup Main Coordinator
 * Inicializa la aplicación, coordina los controladores de vistas y gestiona el estado global.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elementos de vistas
  const views = {
    main: document.getElementById('view-main'),
    profiles: document.getElementById('view-profiles'),
    fields: document.getElementById('view-fields')
  };

  // Estado global compartido
  let currentProfiles = [];
  let currentActiveProfile = null;

  // Interfaz de aplicación que se comparte con los controladores
  const app = {
    getProfiles() {
      return currentProfiles;
    },

    getActiveProfile() {
      return currentActiveProfile;
    },

    async reloadState() {
      currentProfiles = await Storage.getProfiles();
      currentActiveProfile = await Storage.getActiveProfile();
      MainViewController.renderProfileSelect(currentProfiles, currentActiveProfile);
    },

    showView(viewName) {
      Object.keys(views).forEach((key) => {
        if (views[key]) {
          views[key].classList.toggle('active', key === viewName);
        }
      });
    },

    async openProfilesView() {
      await this.reloadState();
      ProfilesViewController.render(currentProfiles, currentActiveProfile);
      this.showView('profiles');
    },

    async openFieldsView(profileId) {
      await this.reloadState();
      await FieldsViewController.render(profileId);
      this.showView('fields');
    },

    async getActiveTab() {
      if (typeof TabService !== 'undefined') {
        return TabService.getActiveTab();
      }
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0] || null;
    },

    async ensureContentScriptsInjected(tabId) {
      if (typeof TabService !== 'undefined') {
        return TabService.ensureContentScriptsInjected(tabId);
      }
      return true;
    }
  };

  // Inicialización de la aplicación
  await initialize();

  async function initialize() {
    // 1. Asegurar perfil predeterminado
    await ensureDefaultProfiles();

    // 2. Cargar estado inicial y detectar dominio
    await loadProfilesAndMatchDomain();

    // 3. Inicializar controladores
    MainViewController.init(app);
    ProfilesViewController.init(app);
    FieldsViewController.init(app);

    // 4. Renderizar vista inicial
    MainViewController.renderProfileSelect(currentProfiles, currentActiveProfile);
    await MainViewController.refreshClipboardState();

    // 5. Restaurar última vista si venimos de selección visual
    const lastView = await Storage.getLastViewState();
    if (lastView && lastView.view === 'fields' && lastView.profileId) {
      await app.openFieldsView(lastView.profileId);
    } else {
      app.showView('main');
    }
  }

  async function ensureDefaultProfiles() {
    const profiles = await Storage.getProfiles();
    if (profiles.length === 0) {
      const defaultProfile = typeof ProfileModel !== 'undefined'
        ? ProfileModel.getDefaultProfile()
        : {
          id: 'prof_default_1',
          name: 'Formulario de Prueba',
          domain: '',
          fields: []
        };
      await Storage.saveProfile(defaultProfile);
    }
  }

  async function loadProfilesAndMatchDomain() {
    currentProfiles = await Storage.getProfiles();

    const activeTab = await app.getActiveTab();
    if (activeTab && activeTab.url) {
      const matchedProfile = await Storage.getProfileForUrl(activeTab.url);
      if (matchedProfile) {
        await Storage.setActiveProfileId(matchedProfile.id);
      }
    }

    currentActiveProfile = await Storage.getActiveProfile();
  }
});
