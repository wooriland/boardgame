const ADMIN_TOKEN_STORAGE_KEY = "wooriland-admin-operations-token";
const BOARD_ADMIN_TOKEN_STORAGE_KEY = "wooriland-board-admin-token";

function getStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getTokenKeys() {
  return [ADMIN_TOKEN_STORAGE_KEY, BOARD_ADMIN_TOKEN_STORAGE_KEY];
}

function readFirstAvailableToken(storage) {
  for (const key of getTokenKeys()) {
    try {
      const value = String(storage.getItem(key) || "").trim();
      if (value) return value;
    } catch {
      //
    }
  }

  return "";
}

export function getAdminOperationsToken() {
  const storage = getStorage();
  if (!storage) return "";

  return readFirstAvailableToken(storage);
}

export function setAdminOperationsToken(token) {
  const storage = getStorage();
  if (!storage) return;

  const value = String(token || "").trim();

  try {
    if (!value) {
      getTokenKeys().forEach((key) => {
        storage.removeItem(key);
      });
      return;
    }

    getTokenKeys().forEach((key) => {
      storage.setItem(key, value);
    });
  } catch {
    // no-op
  }
}

export function clearAdminOperationsToken() {
  const storage = getStorage();
  if (!storage) return;

  try {
    getTokenKeys().forEach((key) => {
      storage.removeItem(key);
    });
  } catch {
    // no-op
  }
}

export function hasAdminOperationsToken() {
  return !!getAdminOperationsToken();
}

export function maskAdminOperationsToken(token = getAdminOperationsToken()) {
  const raw = String(token || "").trim();
  if (!raw) return "";

  if (raw.length <= 4) {
    return `${raw.slice(0, 1)}***`;
  }

  return `${raw.slice(0, 2)}***${raw.slice(-2)}`;
}

export {
  ADMIN_TOKEN_STORAGE_KEY,
  BOARD_ADMIN_TOKEN_STORAGE_KEY,
};