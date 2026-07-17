/**
 * Safe localStorage wrapper with quota management and graceful degradation
 * Handles QuotaExceededError and provides fallback strategies
 */

import { createLogger } from './logger';

const logger = createLogger('Storage');

export type StorageFallback = 'memory' | 'none';

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    const testKey = '__lighthouse_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Estimate localStorage usage in bytes
 */
export const getLocalStorageUsage = (): { used: number; available: number } => {
  if (!isLocalStorageAvailable()) {
    return { used: 0, available: 0 };
  }

  let total = 0;
  for (let key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += key.length + localStorage[key].length;
    }
  }

  // Most browsers have 5-10MB limit; we use 5MB as conservative estimate
  const quota = 5 * 1024 * 1024; // 5MB
  return { used: total, available: quota - total };
};

/**
 * Safe localStorage wrapper with error handling
 */
class SafeStorage {
  private fallback: StorageFallback = 'none';
  private memoryCache: Map<string, string> = new Map();

  constructor() {
    if (!isLocalStorageAvailable()) {
      this.fallback = 'memory';
    }
  }

  /**
   * Get item from storage
   */
  getItem(key: string): string | null {
    if (this.fallback === 'memory') {
      return this.memoryCache.get(key) ?? null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /**
   * Set item with quota management
   * @returns true if successful, false if quota exceeded
   */
  setItem(key: string, value: string): boolean {
    if (this.fallback === 'memory') {
      this.memoryCache.set(key, value);
      return true;
    }

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (this.isQuotaError(error)) {
        // Try to make space by clearing old data
        const spaceMade = this.makeSpace(key.length + value.length);
        if (spaceMade) {
          try {
            localStorage.setItem(key, value);
            return true;
          } catch {
            // Still not enough space
          }
        }
        logger.warn(`Quota exceeded for key: ${key}. Using memory fallback.`);
        this.fallback = 'memory';
        this.memoryCache.set(key, value);
        return false;
      }
      logger.error('Error saving to localStorage:', error);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    if (this.fallback === 'memory') {
      this.memoryCache.delete(key);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Error removing from localStorage:', error);
    }
  }

  /**
   * Clear all items
   */
  clear(): void {
    if (this.fallback === 'memory') {
      this.memoryCache.clear();
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      logger.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Check if error is a quota error
   */
  private isQuotaError(error: unknown): boolean {
    if (error instanceof DOMException) {
      return (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error.code === 22 ||
        error.code === 1014
      );
    }
    return false;
  }

  /**
   * Try to make space by removing old/large items
   */
  private makeSpace(requiredBytes: number): boolean {
    try {
      // Get all items with their sizes
      const items: Array<{ key: string; size: number }> = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) ?? '';
          items.push({ key, size: key.length + value.length });
        }
      }

      // Sort by size (largest first) and remove until we have enough space
      const { available } = this.getLocalStorageUsageInternal();
      let spaceNeeded = requiredBytes - available;

      if (spaceNeeded <= 0) return true;

      for (const item of items.sort((a, b) => b.size - a.size)) {
        // Don't remove critical items
        if (this.isCriticalKey(item.key)) continue;

        localStorage.removeItem(item.key);
        spaceNeeded -= item.size;
        if (spaceNeeded <= 0) return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if a key is critical and shouldn't be auto-removed
   */
  private isCriticalKey(key: string): boolean {
    const criticalKeys = ['lighthouse_user_state', 'lighthouse_encryption_'];
    return criticalKeys.some(critical => key.startsWith(critical));
  }

  /**
   * Internal version of getLocalStorageUsage (bypasses SafeStorage)
   */
  private getLocalStorageUsageInternal(): { used: number; available: number } {
    let total = 0;
    for (let key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += key.length + localStorage[key].length;
      }
    }
    const quota = 5 * 1024 * 1024;
    return { used: total, available: quota - total };
  }

  /**
   * Get current fallback mode
   */
  getFallbackMode(): StorageFallback {
    return this.fallback;
  }
}

// Singleton instance
const safeStorage = new SafeStorage();

/**
 * Safe localStorage interface
 */
export const storage = {
  getItem: (key: string) => safeStorage.getItem(key),
  setItem: (key: string, value: string) => safeStorage.setItem(key, value),
  removeItem: (key: string) => safeStorage.removeItem(key),
  clear: () => safeStorage.clear(),
  getUsage: () => getLocalStorageUsage(),
  isAvailable: () => isLocalStorageAvailable(),
  getFallbackMode: () => safeStorage.getFallbackMode(),
};

/**
 * Store JSON data safely
 */
export const setJSON = <T>(key: string, value: T): boolean => {
  try {
    const serialized = JSON.stringify(value);
    return storage.setItem(key, serialized);
  } catch (error) {
    logger.error('Error serializing data:', error);
    return false;
  }
};

/**
 * Retrieve JSON data safely
 */
export const getJSON = <T>(key: string): T | null => {
  try {
    const item = storage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
};

/**
 * Check if storage is near quota limit
 */
export const isNearQuotaLimit = (threshold = 0.9): boolean => {
  const { used, available } = getLocalStorageUsage();
  const total = used + available;
  return used / total > threshold;
};
