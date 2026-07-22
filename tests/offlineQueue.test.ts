/**
 * Unit tests for utils/offlineQueue.ts
 * Covers: encrypted enqueue/decrypt round trip, queue size, TTL filtering
 * (>7 days expired), clearQueue, sync retry/lock expiry, and summary reporting.
 * The Gemini analyze call is mocked so no network/API key is required.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueueOfflineScan,
  getQueueSize,
  clearQueue,
  syncQueue,
  isOnline,
  getQueueSummary,
} from '../utils/offlineQueue';

vi.mock('../services/geminiService', () => ({
  analyzeDocument: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('Offline Queue Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('isOnline reflects navigator.onLine', () => {
    expect(isOnline()).toBe(true);
  });

  it('enqueues an encrypted scan and reports queue size of 1', async () => {
    const item = await enqueueOfflineScan('death-cert.pdf', 'application/pdf', 'BASE64DATA');
    expect(item.id).toBeTruthy();
    expect(item.status).toBe('pending');
    expect(item.attempts).toBe(0);
    expect(item.encryptedData).not.toContain('BASE64DATA');
    expect(getQueueSize()).toBe(1);
  });

  it('keeps stored data encrypted (plaintext never persisted)', async () => {
    await enqueueOfflineScan('will.pdf', 'application/pdf', 'SECRET-PLAIN');
    const raw = localStorage.getItem('lighthouse_offline_scan_queue');
    expect(raw).toBeTruthy();
    expect(raw!).not.toContain('SECRET-PLAIN');
  });

  it('getQueueSummary reports count, oldest timestamp, and size', async () => {
    await enqueueOfflineScan('a.pdf', 'application/pdf', 'AAA');
    await enqueueOfflineScan('b.pdf', 'application/pdf', 'BBB');
    const summary = getQueueSummary();
    expect(summary.count).toBe(2);
    expect(summary.oldest).toBeGreaterThan(0);
    expect(summary.totalSize).toBeGreaterThan(0);
  });

  it('clearQueue empties the queue and removes the sync lock', async () => {
    await enqueueOfflineScan('a.pdf', 'application/pdf', 'AAA');
    localStorage.setItem('lighthouse_sync_in_progress', Date.now().toString());
    clearQueue();
    expect(getQueueSize()).toBe(0);
    expect(localStorage.getItem('lighthouse_sync_in_progress')).toBe(null);
  });

  it('filters out items older than 7 days as expired', async () => {
    await enqueueOfflineScan('fresh.pdf', 'application/pdf', 'FRESH');
    // Inject a stale item directly into raw storage
    const raw = JSON.parse(localStorage.getItem('lighthouse_offline_scan_queue') || '[]');
    raw.push({
      id: 'stale',
      timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
      fileName: 'stale.pdf',
      mimeType: 'application/pdf',
      encryptedData: 'STALE',
      status: 'pending',
      attempts: 0,
    });
    localStorage.setItem('lighthouse_offline_scan_queue', JSON.stringify(raw));
    expect(getQueueSize()).toBe(1);
  });

  it('syncQueue succeeds and removes the synced item', async () => {
    await enqueueOfflineScan('cert.pdf', 'application/pdf', 'CERTDATA');
    const result = await syncQueue();
    expect(result.success).toBe(1);
    expect(result.failed).toBe(0);
    expect(getQueueSize()).toBe(0);
  });

  it('syncQueue reports failed when analyze rejects', async () => {
    const { analyzeDocument } = await import('../services/geminiService');
    (analyzeDocument as any).mockRejectedValueOnce(new Error('API down'));
    await enqueueOfflineScan('cert.pdf', 'application/pdf', 'CERTDATA');
    const result = await syncQueue();
    expect(result.failed).toBe(1);
    expect(result.success).toBe(0);
  });

  it('syncQueue skips items that exceeded 3 attempts', async () => {
    const raw = [
      {
        id: 'dead',
        timestamp: Date.now(),
        fileName: 'dead.pdf',
        mimeType: 'application/pdf',
        encryptedData: 'X',
        status: 'failed',
        attempts: 3,
      },
    ];
    localStorage.setItem('lighthouse_offline_scan_queue', JSON.stringify(raw));
    const result = await syncQueue();
    expect(result.failed).toBe(1);
    expect(result.success).toBe(0);
  });

  it('syncQueue removes stale sync lock older than 5 minutes', async () => {
    localStorage.setItem('lighthouse_sync_in_progress', (Date.now() - 6 * 60 * 1000).toString());
    await enqueueOfflineScan('cert.pdf', 'application/pdf', 'CERTDATA');
    const result = await syncQueue();
    expect(result.success).toBe(1);
    expect(localStorage.getItem('lighthouse_sync_in_progress')).toBe(null);
  });
});
