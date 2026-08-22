/**
 * MultiCopy - Central Constants & Messaging Protocol
 * Define acciones de mensajería, claves de almacenamiento y comandos globales.
 */

const ACTIONS = Object.freeze({
  START_PICKER: 'START_PICKER',
  STOP_PICKER: 'STOP_PICKER',
  FILL_FORM: 'FILL_FORM',
  TRIGGER_FILL_WITH_PROFILE: 'TRIGGER_FILL_WITH_PROFILE',
  TRIGGER_SHORTCUT_FILL: 'TRIGGER_SHORTCUT_FILL',
  GET_PROFILE_FOR_AUTOFILL: 'GET_PROFILE_FOR_AUTOFILL',
  REOPEN_POPUP: 'REOPEN_POPUP',
  OPEN_POPUP: 'OPEN_POPUP',
  PING: 'PING'
});

const STORAGE_KEYS = Object.freeze({
  PROFILES: 'multicopy_profiles',
  ACTIVE_PROFILE_ID: 'multicopy_active_profile_id',
  PENDING_PICK: 'multicopy_pending_pick',
  LAST_VIEW_STATE: 'multicopy_last_view_state'
});

const COMMANDS = Object.freeze({
  FILL_FORM_SHORTCUT: 'fill-form-shortcut'
});

// Exportación universal (Service Worker / Content Script / Popup Window)
const MultiCopyConstants = {
  ACTIONS,
  STORAGE_KEYS,
  COMMANDS
};

if (typeof globalThis !== 'undefined') {
  globalThis.ACTIONS = ACTIONS;
  globalThis.STORAGE_KEYS = STORAGE_KEYS;
  globalThis.COMMANDS = COMMANDS;
  globalThis.MultiCopyConstants = MultiCopyConstants;
}

if (typeof window !== 'undefined') {
  window.ACTIONS = ACTIONS;
  window.STORAGE_KEYS = STORAGE_KEYS;
  window.COMMANDS = COMMANDS;
  window.MultiCopyConstants = MultiCopyConstants;
}
