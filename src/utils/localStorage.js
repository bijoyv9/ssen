/**
 * Utility functions for localStorage operations
 */

export function getParsedLocalStorage(key, fallback = []) {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed)) return parsed;
      return parsed; // For non-array data
    }
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage:`, error);
  }
  return fallback;
}

export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Set version timestamp for change detection
    localStorage.setItem(`${key}Version`, Date.now().toString());
    return true;
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
    return false;
  }
}

export function getStorageVersion(key) {
  try {
    const version = localStorage.getItem(`${key}Version`);
    return version ? Number(version) : 0;
  } catch (error) {
    console.error(`Failed to get version for ${key}:`, error);
    return 0;
  }
}

export function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}Version`);
    return true;
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error);
    return false;
  }
}

export function clearUserSession() {
  removeFromLocalStorage('currentUser');
}