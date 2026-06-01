import { createHash } from 'crypto';
import type { SyncQuizPayload } from './types';

/** Hash stable du contenu sync (sans payloadHash / version). */
export function computeSyncContentHash(
  payload: Omit<SyncQuizPayload, 'payloadHash' | 'version'>
): string {
  const normalized = JSON.stringify(payload);
  return createHash('sha256').update(normalized).digest('hex');
}

export function buildPayloadHash(
  payload: Omit<SyncQuizPayload, 'payloadHash' | 'version'>
): string {
  return computeSyncContentHash(payload);
}
