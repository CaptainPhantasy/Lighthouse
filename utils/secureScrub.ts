/**
 * Phase 2: The Secure Scrub - Complete PII Data Destruction
 *
 * When the user is ready to move forward, this protocol ensures all personal
 * information is completely removed from the application.
 *
 * What Gets Deleted:
 * - All user state (name, relationship, locations)
 * - Deceased information (name, location, pronouncement status)
 * - Document scans (both encrypted and decrypted versions)
 * - Tasks and milestones
 * - The initialStoryTranscript (the emotional narrative)
 * - Any localStorage data
 *
 * What Remains:
 * - ONLY the memorial page link (if created)
 * - ONLY the Lantern PDF download link
 *
 * The app returns to a clean "Restoration Complete" state.
 */

import { UserState } from '../types';

const KEYS_TO_SCRUB = [
  'lighthouse_user_state',
  'lighthouse_tasks',
  'lighthouse_documents',
  'lighthouse_narrative_checkpoint',
  'lighthouse_view',
  'lighthouse_serviceOutline',
  'lighthouse_volunteer_',
];

/**
 * Check if a user state contains PII
 */
export function containsPII(state: UserState): boolean {
  return !!(
    state.name ||
    state.deceasedName ||
    state.relationshipToDeceased ||
    state.userLocation ||
    state.initialStoryTranscript
  );
}

/**
 * Scrub all PII from localStorage
 */
export function scrubLocalStorage(): void {
  KEYS_TO_SCRUB.forEach(key => {
    // Use removeItem with startsWith for volunteer keys
    if (key.endsWith('_')) {
      // This is a prefix, remove all matching keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storedKey = localStorage.key(i);
        if (storedKey && storedKey.startsWith(key)) {
          keysToRemove.push(storedKey);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } else {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Generate memorial page data (saved before scrub)
 */
export interface MemorialData {
  deceasedName: string;
  memorialMessage?: string;
  lanternPDFUrl?: string;
  completionDate: string;
}

export function generateMemorialData(userState: UserState): MemorialData {
  return {
    deceasedName: userState.deceasedName || 'A Loved One',
    memorialMessage: userState.initialStoryTranscript
      ? 'Their story has been honored and preserved.'
      : undefined,
    lanternPDFUrl: undefined, // Would be populated if PDF was generated
    completionDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}

/**
 * Generate memorial data WITHOUT scrubbing (Phase 1 of safe restoration)
 * This allows the UI to transition to Memorial Mode before data destruction.
 */
export function generateMemorialDataOnly(
  userState: UserState,
  lanternPDFUrl?: string
): MemorialData {
  const memorialData = generateMemorialData(userState);
  if (lanternPDFUrl) {
    memorialData.lanternPDFUrl = lanternPDFUrl;
  }

  // Save memorial data to a special key BEFORE scrubbing
  // This is the ONLY data that survives the wipe
  localStorage.setItem(
    'lighthouse_memorial',
    JSON.stringify(memorialData)
  );

  return memorialData;
}

/**
 * The Hard Delete Phase (Phase 2 of safe restoration)
 * Call this ONLY after UI has successfully transitioned to Memorial Mode.
 * This is the "Nuke" phase - destroys all PII data.
 */
export async function performHardDelete(): Promise<void> {
  console.log('[SecureScrub] Performing Hard Delete phase...');

  try {
    // Scrub all PII from localStorage
    scrubLocalStorage();

    // Clear sessionStorage as well
    sessionStorage.clear();

    // Trigger service worker cleanup (if present)
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      registrations.forEach(registration => {
        registration.unregister();
      });
    }

    // Clear any IndexedDB data
    if (window.indexedDB) {
      const databases = await indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    }

    console.log('[SecureScrub] Hard Delete phase complete.');
  } catch (error) {
    console.error('[SecureScrub] Hard Delete encountered errors:', error);
    throw error;
  }
}

/**
 * @deprecated Use generateMemorialDataOnly + performHardDelete separately for safety.
 * This function exists for backward compatibility but performs both phases atomlessly.
 */
export async function performCompleteRestoration(
  userState: UserState,
  lanternPDFUrl?: string
): Promise<MemorialData> {
  console.warn('[SecureScrub] performCompleteRestoration is deprecated. Use two-phase approach for data safety.');

  const memorialData = generateMemorialDataOnly(userState, lanternPDFUrl);
  await performHardDelete();
  return memorialData;
}

/**
 * Check if a memorial exists (app has been restored)
 */
export function hasMemorial(): boolean {
  return !!localStorage.getItem('lighthouse_memorial');
}

/**
 * Get the memorial data
 */
export function getMemorial(): MemorialData | null {
  try {
    const data = localStorage.getItem('lighthouse_memorial');
    if (data) {
      return JSON.parse(data) as MemorialData;
    }
  } catch (e) {
    console.error('[SecureScrub] Failed to load memorial:', e);
  }
  return null;
}

/**
 * Clear the memorial (after user has saved their Lantern PDF)
 */
export function clearMemorial(): void {
  localStorage.removeItem('lighthouse_memorial');
}

export default {
  containsPII,
  scrubLocalStorage,
  generateMemorialData,
  performCompleteRestoration,
  hasMemorial,
  getMemorial,
  clearMemorial,
};
