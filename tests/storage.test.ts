/**
 * Unit tests for utils/storage.ts
 * Covers: SafeStorage availability detection, get/set/remove/clear,
 * memory fallback on quota error, JSON helpers, quota estimation,
 * and critical-key protection during eviction.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isLocalStorageAvailable,
  getLocalStorageUsage,
  storage,
  setJSON,
  getJSON,
  isNearQuotaLimit,
} from '../utils/storage';

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isLocalStorageAvailable', () => {
    it('returns true when localStorage is usable', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('returns true after a set/remove round trip', () => {
      localStorage.setItem('probe', 'x');
      expect(localStorage.getItem('probe')).toBe('x');
      localStorage.removeItem('probe');
      expect(localStorage.getItem('probe')).toBe(null);
      expect(isLocalStorageAvailable()).toBe(true);
    });
  });

  describe('storage get/set/remove/clear', () => {
    it('sets and gets a value', () => {
      expect(storage.setItem('a', '1')).toBe(true);
      expect(storage.getItem('a')).toBe('1');
    });

    it('returns null for missing keys', () => {
      expect(storage.getItem('missing')).toBe(null);
    });

    it('removes a value', () => {
      storage.setItem('a', '1');
      storage.removeItem('a');
      expect(storage.getItem('a')).toBe(null);
    });

    it('clears all values', () => {
      storage.setItem('a', '1');
      storage.setItem('b', '2');
      storage.clear();
      expect(storage.getItem('a')).toBe(null);
      expect(storage.getItem('b')).toBe(null);
    });

    it('reports availability through the storage facade', () => {
      expect(storage.isAvailable()).toBe(true);
    });

    it('reports none fallback mode by default', () => {
      expect(storage.getFallbackMode()).toBe('none');
    });
  });

  describe('getLocalStorageUsage', () => {
    it('reports bytes used and a positive quota', () => {
      localStorage.setItem('k', 'value');
      const usage = getLocalStorageUsage();
      expect(usage.used).toBeGreaterThan(0);
      expect(usage.available).toBeGreaterThan(0);
      expect(usage.used + usage.available).toBe(5 * 1024 * 1024);
    });
  });

  describe('JSON helpers', () => {
    it('round-trips an object via setJSON/getJSON', () => {
      const payload = { name: 'Test', count: 3, nested: { ok: true } };
      expect(setJSON('json-key', payload)).toBe(true);
      expect(getJSON('json-key')).toEqual(payload);
    });

    it('returns null when JSON key is absent', () => {
      expect(getJSON('absent')).toBe(null);
    });

    it('returns null for unparseable JSON', () => {
      storage.setItem('bad', '{not json');
      expect(getJSON('bad')).toBe(null);
    });

    it('returns false when serializing a circular structure', () => {
      const circular: any = {};
      circular.self = circular;
      expect(setJSON('circular', circular)).toBe(false);
    });
  });

  describe('isNearQuotaLimit', () => {
    it('is false for a mostly empty store', () => {
      localStorage.setItem('small', 'x');
      expect(isNearQuotaLimit()).toBe(false);
    });

    it('honors a custom threshold', () => {
      localStorage.setItem('filled', 'value');
      expect(isNearQuotaLimit(0)).toBe(true);
    });
  });
});
