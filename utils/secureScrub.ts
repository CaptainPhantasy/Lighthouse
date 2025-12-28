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
 * The Complete Restoration Protocol
 *
 * Performs full PII destruction and returns memorial data to preserve
 */
export async function performCompleteRestoration(
  userState: UserState,
  lanternPDFUrl?: string
): Promise<MemorialData> {
  console.log('[SecureScrub] Initiating Complete Restoration Protocol...');

  // 1. Generate memorial data BEFORE scrubbing
  const memorialData = generateMemorialData(userState);
  if (lanternPDFUrl) {
    memorialData.lanternPDFUrl = lanternPDFUrl;
  }

  // 2. Save memorial data to a special key (this survives the scrub)
  localStorage.setItem(
    'lighthouse_memorial',
    JSON.stringify(memorialData)
  );

  // 3. Scrub all PII from localStorage
  scrubLocalStorage();

  // 4. Clear sessionStorage as well
  sessionStorage.clear();

  // 5. Trigger service worker cleanup (if present)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }

  // 6. Clear any IndexedDB data
  if (window.indexedDB) {
    const databases = await indexedDB.databases();
    databases.forEach(db => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    });
  }

  console.log('[SecureScrub] Complete Restoration Protocol finished.');

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
