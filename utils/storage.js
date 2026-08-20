/**
 * MultiCopy - Storage Module
 * Maneja la persistencia de perfiles y configuraciones mediante chrome.storage.local
 */

const Storage = {
  // Claves de almacenamiento
  KEYS: {
    PROFILES: 'multicopy_profiles',
    ACTIVE_PROFILE_ID: 'multicopy_active_profile_id',
    PENDING_PICK: 'multicopy_pending_pick'
  },

  /**
   * Obtiene todos los perfiles guardados
   * @returns {Promise<Array>} Lista de perfiles
   */
  async getProfiles() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.PROFILES], (result) => {
        const profiles = result[this.KEYS.PROFILES] || [];
        resolve(profiles);
      });
    });
  },

  /**
   * Guarda la lista completa de perfiles
   * @param {Array} profiles 
   * @returns {Promise<void>}
   */
  async saveProfiles(profiles) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.KEYS.PROFILES]: profiles }, () => {
        resolve();
      });
    });
  },

  /**
   * Obtiene el ID del perfil activo
   * @returns {Promise<string|null>}
   */
  async getActiveProfileId() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.ACTIVE_PROFILE_ID], (result) => {
        resolve(result[this.KEYS.ACTIVE_PROFILE_ID] || null);
      });
    });
  },

  /**
   * Establece el ID del perfil activo
   * @param {string} profileId 
   * @returns {Promise<void>}
   */
  async setActiveProfileId(profileId) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.KEYS.ACTIVE_PROFILE_ID]: profileId }, () => {
        resolve();
      });
    });
  },

  /**
   * Obtiene el perfil actualmente activo
   * @returns {Promise<Object|null>}
   */
  async getActiveProfile() {
    const profiles = await this.getProfiles();
    if (profiles.length === 0) return null;

    const activeId = await this.getActiveProfileId();
    if (!activeId) {
      await this.setActiveProfileId(profiles[0].id);
      return profiles[0];
    }

    const found = profiles.find(p => p.id === activeId);
    if (!found && profiles.length > 0) {
      await this.setActiveProfileId(profiles[0].id);
      return profiles[0];
    }
    return found || null;
  },

  /**
   * Guarda o actualiza un perfil específico
   * @param {Object} profile 
   * @returns {Promise<Object>} Perfil guardado
   */
  async saveProfile(profile) {
    const profiles = await this.getProfiles();
    if (!profile.id) {
      profile.id = 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      profile.fields = profile.fields || [];
      profile.createdAt = Date.now();
      profiles.push(profile);
    } else {
      const index = profiles.findIndex(p => p.id === profile.id);
      if (index !== -1) {
        profiles[index] = { ...profiles[index], ...profile, updatedAt: Date.now() };
      } else {
        profiles.push(profile);
      }
    }

    await this.saveProfiles(profiles);
    await this.setActiveProfileId(profile.id);
    return profile;
  },

  /**
   * Elimina un perfil por ID
   * @param {string} profileId 
   * @returns {Promise<void>}
   */
  async deleteProfile(profileId) {
    let profiles = await this.getProfiles();
    profiles = profiles.filter(p => p.id !== profileId);
    await this.saveProfiles(profiles);

    const activeId = await this.getActiveProfileId();
    if (activeId === profileId) {
      const nextActiveId = profiles.length > 0 ? profiles[0].id : null;
      await this.setActiveProfileId(nextActiveId);
    }
  },

  /**
   * Guarda el estado de selección visual pendiente (para cuando se interactúa con la pestaña)
   */
  async setPendingPick(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.KEYS.PENDING_PICK]: data }, resolve);
    });
  },

  async getPendingPick() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.PENDING_PICK], (result) => {
        resolve(result[this.KEYS.PENDING_PICK] || null);
      });
    });
  },

  async clearPendingPick() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.KEYS.PENDING_PICK], resolve);
    });
  }
};

// Exportar globalmente para extension scripts
if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
