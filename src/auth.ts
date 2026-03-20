declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: GoogleIdConfig): void;
          prompt(momentListener?: (notification: PromptMoment) => void): void;
          cancel(): void;
        };
      };
    };
  }
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: string;
}

interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface PromptMoment {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
}

const LS_NAME_KEY = 'block-dropper:name';
const LS_EMAIL_KEY = 'block-dropper:email';

export function getStoredUser(): { name: string; email: string } | null {
  const name = localStorage.getItem(LS_NAME_KEY);
  const email = localStorage.getItem(LS_EMAIL_KEY);
  return name && email ? { name, email } : null;
}

export function storeUser(user: { name: string; email: string }): void {
  localStorage.setItem(LS_NAME_KEY, user.name);
  localStorage.setItem(LS_EMAIL_KEY, user.email);
}

export function clearStoredUser(): void {
  localStorage.removeItem(LS_NAME_KEY);
  localStorage.removeItem(LS_EMAIL_KEY);
}

// Single-shot Promise channel between initialize()'s callback and triggerSignIn()
let resolveSignIn: ((user: { name: string; email: string }) => void) | null = null;
let rejectSignIn: ((reason: Error) => void) | null = null;

export function initializeGSI(): void {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';
  if (!clientId) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not set; SAVE SCORE will be unavailable.');
    return;
  }

  window.google?.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredentialResponse,
    cancel_on_tap_outside: false,
    context: 'signin',
  });
}

function handleCredentialResponse(response: CredentialResponse): void {
  if (!resolveSignIn) return;
  try {
    const user = decodeJwtPayload(response.credential);
    storeUser(user);
    resolveSignIn(user);
  } catch (err) {
    rejectSignIn?.(err instanceof Error ? err : new Error(String(err)));
  } finally {
    resolveSignIn = null;
    rejectSignIn = null;
  }
}

function decodeJwtPayload(jwt: string): { name: string; email: string } {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = JSON.parse(atob(base64)) as Record<string, unknown>;
  const name = typeof json['name'] === 'string' ? json['name'] : '';
  const email = typeof json['email'] === 'string' ? json['email'] : '';
  return { name, email };
}

export function triggerSignIn(): Promise<{ name: string; email: string }> {
  const cached = getStoredUser();
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    resolveSignIn = resolve;
    rejectSignIn = reject;

    window.google?.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        rejectSignIn?.(new Error('Google sign-in was not displayed. Please allow third-party cookies or try a different browser.'));
        resolveSignIn = null;
        rejectSignIn = null;
      }
    });
  });
}
