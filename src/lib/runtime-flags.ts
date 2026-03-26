export function isSafeModeEnabled(): boolean {
  const v = process.env.SAFE_MODE;
  return v === '1' || v === 'true';
}

