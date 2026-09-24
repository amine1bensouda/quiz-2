export const ADMIN_SESSION_EXPIRED_MESSAGE =
  'Your admin session has expired or is no longer valid. Sign in in a new tab, then return here and retry. Your edits are still in this page.';

export class AdminSessionExpiredError extends Error {
  constructor() {
    super(ADMIN_SESSION_EXPIRED_MESSAGE);
    this.name = 'AdminSessionExpiredError';
  }
}

export function checkAdminResponse(response: Response): void {
  if (response.status === 401) throw new AdminSessionExpiredError();
}

export async function ensureAdminSession(): Promise<void> {
  const response = await fetch('/api/admin/auth/status', {
    credentials: 'include',
    cache: 'no-store',
  });
  checkAdminResponse(response);
  if (!response.ok) throw new Error('Unable to check your admin session. Please retry.');
  const data = await response.json();
  if (!data.authenticated) throw new AdminSessionExpiredError();
}
