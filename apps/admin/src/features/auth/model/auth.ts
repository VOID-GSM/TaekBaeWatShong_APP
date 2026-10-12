import {
  type AdminSession,
  authenticateAdmin,
  clearStoredAdminSession,
  readStoredAdminSession,
} from '../api/admin-auth-api';
import { signInWithGoogle, signOutFromGoogle } from '../api/google-oauth';
import { useAdminAuthStore } from './auth-store';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 인증 오류가 발생했습니다.';
}

function setAuthenticated(session: AdminSession): void {
  useAdminAuthStore.getState().setUser(session.user);
}

export async function initializeAdminAuthSession(): Promise<void> {
  useAdminAuthStore.getState().setStatus('initializing');

  try {
    const session = await readStoredAdminSession();

    if (!session || session.expiresAt <= Date.now()) {
      if (session) {
        await clearStoredAdminSession();
      }
      useAdminAuthStore.getState().clear();
      return;
    }

    setAuthenticated(session);
  } catch (error) {
    useAdminAuthStore.getState().setStatus('unauthenticated');
    useAdminAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

export async function loginAdminWithGoogle(): Promise<boolean> {
  const previousState = useAdminAuthStore.getState();
  useAdminAuthStore.getState().setStatus('loading');
  useAdminAuthStore.getState().setError(null);

  try {
    const idToken = await signInWithGoogle();

    if (idToken === null) {
      useAdminAuthStore.setState({
        status: previousState.status,
        user: previousState.user,
      });
      return false;
    }

    const session = await authenticateAdmin(idToken);
    setAuthenticated(session);
    return true;
  } catch (error) {
    useAdminAuthStore.setState({
      status: previousState.status,
      user: previousState.user,
    });
    useAdminAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

export async function getAdminAccessToken(): Promise<string | null> {
  try {
    const session = await readStoredAdminSession();

    if (!session || session.expiresAt <= Date.now()) {
      if (session) {
        await clearStoredAdminSession();
      }
      useAdminAuthStore.getState().clear();
      return null;
    }

    setAuthenticated(session);
    return session.accessToken;
  } catch (error) {
    useAdminAuthStore.getState().setStatus('unauthenticated');
    useAdminAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await signOutFromGoogle();
    await clearStoredAdminSession();
    useAdminAuthStore.getState().clear();
  } catch (error) {
    useAdminAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}
