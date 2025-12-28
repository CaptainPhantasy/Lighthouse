/**
 * Phase 2: Offline Queue for Smart Vault
 *
 * When the user is offline or the API is unavailable,
 * document scans are encrypted and stored locally.
 * When connectivity returns, they auto-sync and analyze.
 *
 * Features:
 * - Detects online/offline status via navigator.onLine
 * - Encrypts queued documents before storing
 * - Auto-syncs when connection restored
 * - Notifies user of queued items
 */

import { encryptObject, decryptObject } from './encryption';
import { ENCRYPTION_PASSWORD } from '../constants';

const QUEUE_KEY = 'lighthouse_offline_scan_queue';
const SYNC_LOCK_KEY = 'lighthouse_sync_in_progress';

export interface QueuedScan {
  id: string;
  timestamp: number;
  fileName: string;
  mimeType: string;
  encryptedData: string; // AES-256 encrypted base64
  status: 'pending' | 'syncing' | 'failed';
  attempts: number;
}

export interface OfflineQueueOptions {
  onSyncStart?: () => void;
  onSyncComplete?: (results: { success: number; failed: number }) => void;
  onQueueChange?: (queueSize: number) => void;
}

/**
 * Initialize the offline queue with event listeners
 */
export function initOfflineQueue(options: OfflineQueueOptions = {}) {
  const { onSyncStart, onSyncComplete, onQueueChange } = options;

  // Listen for connection restoration
  window.addEventListener('online', handleConnectionRestored);

  // Initial queue size report
  reportQueueSize();

  async function handleConnectionRestored() {
    const queue = getQueue();
    if (queue.length === 0) return;

    // Check if sync is already in progress
    const syncLock = localStorage.getItem(SYNC_LOCK_KEY);
    if (syncLock) {
      const lockAge = Date.now() - parseInt(syncLock);
      // Lock is stale if older than 5 minutes
      if (lockAge < 5 * 60 * 1000) {
        console.log('[OfflineQueue] Sync already in progress');
        return;
      }
    }

    console.log(`[OfflineQueue] Connection restored. Syncing ${queue.length} queued scans...`);
    onSyncStart?.();

    const results = await syncQueue();

    onSyncComplete?.(results);

    // Report new queue size
    reportQueueSize();
  }

  function reportQueueSize() {
    const queue = getQueue();
    onQueueChange?.(queue.length);
  }

  return () => {
    window.removeEventListener('online', handleConnectionRestored);
  };
}

/**
 * Get all queued scans
 */
function getQueue(): QueuedScan[] {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    if (!data) return [];
    const queue = JSON.parse(data) as QueuedScan[];
    // Filter out items older than 7 days
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return queue.filter(item => item.timestamp > weekAgo);
  } catch (e) {
    console.error('[OfflineQueue] Failed to get queue:', e);
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedScan[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[OfflineQueue] Failed to save queue:', e);
  }
}

/**
 * Add a document scan to the offline queue
 */
export async function enqueueOfflineScan(
  fileName: string,
  mimeType: string,
  base64Data: string
): Promise<QueuedScan> {
  // Encrypt the data before storing
  const encrypted = await encryptObject(base64Data, ENCRYPTION_PASSWORD);

  const queuedScan: QueuedScan = {
    id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    fileName,
    mimeType,
    encryptedData: JSON.stringify(encrypted), // Store full encrypted object
    status: 'pending',
    attempts: 0,
  };

  const queue = getQueue();
  queue.push(queuedScan);
  saveQueue(queue);

  console.log(`[OfflineQueue] Enqueued scan: ${fileName}`);
  return queuedScan;
}

/**
 * Get the current queue size
 */
export function getQueueSize(): number {
  return getQueue().length;
}

/**
 * Clear the queue (call after successful sync)
 */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
  localStorage.removeItem(SYNC_LOCK_KEY);
}

/**
 * Sync all queued scans to the server
 */
export async function syncQueue(): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0 };
  }

  // Set sync lock
  localStorage.setItem(SYNC_LOCK_KEY, Date.now().toString());

  let successCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    if (item.status === 'failed' && item.attempts >= 3) {
      // Skip items that have failed too many times
      failedCount++;
      continue;
    }

    item.status = 'syncing';
    item.attempts++;
    saveQueue(queue);

    try {
      // Decrypt the data
      const encryptedResult = JSON.parse(item.encryptedData) as { encrypted: string; iv: string; salt: string };
      const decryptedData = await decryptObject(encryptedResult, ENCRYPTION_PASSWORD) as string;

      // Call the analyze API
      const { analyzeDocument } = await import('../services/geminiService');
      await analyzeDocument(decryptedData, item.mimeType);

      // Success - remove from queue
      const index = queue.indexOf(item);
      if (index > -1) {
        queue.splice(index, 1);
      }
      successCount++;
    } catch (e) {
      console.error(`[OfflineQueue] Failed to sync ${item.id}:`, e);
      item.status = 'failed';
      failedCount++;
    }

    saveQueue(queue);
  }

  // Clear sync lock and update queue
  if (queue.length === 0) {
    clearQueue();
  } else {
    localStorage.removeItem(SYNC_LOCK_KEY);
  }

  console.log(`[OfflineQueue] Sync complete: ${successCount} succeeded, ${failedCount} failed`);
  return { success: successCount, failed: failedCount };
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get a summary of queued items for display
 */
export function getQueueSummary(): { count: number; oldest: number | null; totalSize: number } {
  const queue = getQueue();
  if (queue.length === 0) {
    return { count: 0, oldest: null, totalSize: 0 };
  }

  const oldest = Math.min(...queue.map(item => item.timestamp));
  const totalSize = queue.reduce((sum, item) => sum + item.encryptedData.length, 0);

  return { count: queue.length, oldest, totalSize };
}

export default {
  initOfflineQueue,
  enqueueOfflineScan,
  getQueueSize,
  syncQueue,
  clearQueue,
  isOnline,
  getQueueSummary,
};
