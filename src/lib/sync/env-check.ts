export function getMissingSyncEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.FREE_SITE_URL?.trim()) {
    missing.push('FREE_SITE_URL');
  }
  if (!process.env.FREE_SYNC_API_KEY?.trim()) {
    missing.push('FREE_SYNC_API_KEY');
  }
  if (!process.env.FREE_SYNC_HMAC_SECRET?.trim()) {
    missing.push('FREE_SYNC_HMAC_SECRET');
  }
  return missing;
}

export function isSyncEnvConfigured(): boolean {
  return getMissingSyncEnvVars().length === 0;
}
