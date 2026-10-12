import {
  type AppSession,
  authenticateDataGsmUser,
  clearStoredAppSession,
  readStoredAppSession,
} from '../api/app-auth-api';
import { signInWithDataGsm } from '../api/data-gsm-oauth';
import { useAuthStore } from './auth-store';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 인증 오류가 발생했습니다.';
}

function setAuthenticated(session: AppSession): void {
  useAuthStore.getState().setUser(session.user);
}

async function runLogin(authenticate: () => Promise<AppSession | null>): Promise<boolean> {
  const previousState = useAuthStore.getState();
  useAuthStore.getState().setStatus('loading');
  useAuthStore.getState().setError(null);

  try {
    const session = await authenticate();

    if (session === null) {
      useAuthStore.setState({
        status: previousState.status,
        user: previousState.user,
      });
      return false;
    }

    setAuthenticated(session);
    return true;
  } catch (error) {
    useAuthStore.setState({
      status: previousState.status,
      user: previousState.user,
    });
    useAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

export function loginWithDataGsm(): Promise<boolean> {
  return runLogin(async () => {
    const identity = await signInWithDataGsm();

    if (identity === null) {
      return null;
    }

    return authenticateDataGsmUser(identity.accessToken, identity.role);
  });
}

export async function initializeAuthSession(): Promise<void> {
  useAuthStore.getState().setStatus('initializing');

  try {
    const session = await readStoredAppSession();

    if (!session || session.expiresAt <= Date.now()) {
      if (session) {
        await clearStoredAppSession();
      }
      useAuthStore.getState().clear();
      return;
    }

    setAuthenticated(session);
  } catch (error) {
    useAuthStore.getState().setStatus('unauthenticated');
    useAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

export async function getAppAccessToken(): Promise<string | null> {
  try {
    const session = await readStoredAppSession();

    if (!session || session.expiresAt <= Date.now()) {
      if (session) {
        await clearStoredAppSession();
      }
      useAuthStore.getState().clear();
      return null;
    }

    setAuthenticated(session);
    return session.accessToken;
  } catch (error) {
    useAuthStore.getState().setStatus('unauthenticated');
    useAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await clearStoredAppSession();
    useAuthStore.getState().clear();
  } catch (error) {
    useAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}
