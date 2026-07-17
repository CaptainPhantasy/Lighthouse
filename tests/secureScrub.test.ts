/**
 * Unit tests for utils/secureScrub.ts
 * Covers: PII detection, localStorage scrubbing (including volunteer prefix),
 * memorial data generation (with and without scrub), memorial lifecycle
 * (hasMemorial/getMemorial/clearMemorial), and two-phase hard-delete guards.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserState } from '../types';
import {
  containsPII,
  scrubLocalStorage,
  generateMemorialData,
  generateMemorialDataOnly,
  performHardDelete,
  performCompleteRestoration,
  hasMemorial,
  getMemorial,
  clearMemorial,
} from '../utils/secureScrub';

const cleanState: UserState = {
  name: '',
  deceasedName: '',
  relationshipToDeceased: '',
  userLocation: '',
  wishesKnowledgeLevel: 'VAGUE',
  initialStoryTranscript: '',
  isSafe: false,
  deceasedLocation: 'UNKNOWN',
  deathPronounced: false,
  isVeteran: false,
  brainFogLevel: 3,
  servicePreference: 'SECULAR',
};

const piiState: UserState = {
  ...cleanState,
  name: 'Jane Doe',
  deceasedName: 'John Doe',
  relationshipToDeceased: 'Spouse',
  userLocation: 'Indianapolis, IN',
  initialStoryTranscript: 'He loved the ocean.',
};

describe('Secure Scrub Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('containsPII', () => {
    it('returns false for an empty/clean state', () => {
      expect(containsPII(cleanState)).toBe(false);
    });

    it('returns true when name is present', () => {
      expect(containsPII({ ...cleanState, name: 'Jane' })).toBe(true);
    });

    it('returns true when only deceasedName is present', () => {
      expect(containsPII({ ...cleanState, deceasedName: 'John' })).toBe(true);
    });

    it('returns true when only the story transcript is present', () => {
      expect(containsPII({ ...cleanState, initialStoryTranscript: 'story' })).toBe(true);
    });
  });

  describe('scrubLocalStorage', () => {
    it('removes known PII keys', () => {
      localStorage.setItem('lighthouse_user_state', 'x');
      localStorage.setItem('lighthouse_tasks', 'x');
      localStorage.setItem('lighthouse_documents', 'x');
      localStorage.setItem('lighthouse_narrative_checkpoint', 'x');
      scrubLocalStorage();
      expect(localStorage.getItem('lighthouse_user_state')).toBe(null);
      expect(localStorage.getItem('lighthouse_tasks')).toBe(null);
      expect(localStorage.getItem('lighthouse_documents')).toBe(null);
      expect(localStorage.getItem('lighthouse_narrative_checkpoint')).toBe(null);
    });

    it('removes volunteer prefix keys', () => {
      localStorage.setItem('lighthouse_volunteer_1', 'x');
      localStorage.setItem('lighthouse_volunteer_2', 'x');
      localStorage.setItem('lighthouse_unrelated', 'keep');
      scrubLocalStorage();
      expect(localStorage.getItem('lighthouse_volunteer_1')).toBe(null);
      expect(localStorage.getItem('lighthouse_volunteer_2')).toBe(null);
      expect(localStorage.getItem('lighthouse_unrelated')).toBe('keep');
    });

    it('is safe to call on an empty store', () => {
      expect(() => scrubLocalStorage()).not.toThrow();
    });
  });

  describe('Memorial data', () => {
    it('generates memorial data defaulting deceased name when absent', () => {
      const data = generateMemorialData(cleanState);
      expect(data.deceasedName).toBe('A Loved One');
      expect(data.completionDate).toBeTruthy();
    });

    it('uses the real deceased name and message when a transcript exists', () => {
      const data = generateMemorialData(piiState);
      expect(data.deceasedName).toBe('John Doe');
      expect(data.memorialMessage).toBeTruthy();
    });

    it('generateMemorialDataOnly persists memorial key WITHOUT scrubbing PII', () => {
      localStorage.setItem('lighthouse_user_state', 'PII');
      const data = generateMemorialDataOnly(piiState, 'https://example.com/lantern.pdf');
      expect(localStorage.getItem('lighthouse_memorial')).toBeTruthy();
      expect(data.lanternPDFUrl).toBe('https://example.com/lantern.pdf');
      // PII must survive phase 1
      expect(localStorage.getItem('lighthouse_user_state')).toBe('PII');
    });
  });

  describe('Memorial lifecycle', () => {
    it('hasMemorial reflects memorial key presence', () => {
      expect(hasMemorial()).toBe(false);
      localStorage.setItem('lighthouse_memorial', '{}');
      expect(hasMemorial()).toBe(true);
    });

    it('getMemorial returns parsed data', () => {
      localStorage.setItem('lighthouse_memorial', JSON.stringify({ deceasedName: 'John', completionDate: 'today' }));
      const data = getMemorial();
      expect(data?.deceasedName).toBe('John');
    });

    it('getMemorial returns null for bad JSON', () => {
      localStorage.setItem('lighthouse_memorial', 'not-json');
      expect(getMemorial()).toBe(null);
    });

    it('clearMemorial removes the memorial key', () => {
      localStorage.setItem('lighthouse_memorial', '{}');
      clearMemorial();
      expect(hasMemorial()).toBe(false);
    });
  });

  describe('Hard delete', () => {
    it('performHardDelete scrubs PII and clears sessionStorage', async () => {
      localStorage.setItem('lighthouse_user_state', 'PII');
      sessionStorage.setItem('temp', 'session-pii');
      await expect(performHardDelete()).resolves.toBeUndefined();
      expect(localStorage.getItem('lighthouse_user_state')).toBe(null);
      expect(sessionStorage.getItem('temp')).toBe(null);
    });

    it('performCompleteRestoration produces memorial and wipes PII', async () => {
      localStorage.setItem('lighthouse_tasks', 'PII');
      const data = await performCompleteRestoration(piiState);
      expect(data.deceasedName).toBe('John Doe');
      expect(localStorage.getItem('lighthouse_tasks')).toBe(null);
      expect(localStorage.getItem('lighthouse_memorial')).toBeTruthy();
    });
  });
});
