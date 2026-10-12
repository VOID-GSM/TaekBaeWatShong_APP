import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { AdminAuthenticationError } from './admin-auth-api';

let configured = false;

function configureGoogleSignIn(): void {
  if (configured) {
    return;
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

  if (!webClientId) {
    throw new AdminAuthenticationError(
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 환경 변수를 설정해야 합니다.',
    );
  }

  if (Platform.OS === 'ios' && !iosClientId) {
    throw new AdminAuthenticationError(
      'iOS Google 로그인을 위해 EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID를 설정해야 합니다.',
    );
  }

  GoogleSignin.configure({ webClientId, iosClientId });
  configured = true;
}

export async function signInWithGoogle(): Promise<string | null> {
  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return null;
  }

  if (!response.data.idToken) {
    throw new AdminAuthenticationError('Google 로그인 응답에서 ID Token을 받지 못했습니다.');
  }

  return response.data.idToken;
}

export async function signOutFromGoogle(): Promise<void> {
  if (configured) {
    await GoogleSignin.signOut();
  }
}
