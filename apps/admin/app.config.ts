import type { ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

/** 빌드 variant 별로 다른 앱을 한 기기에 같이 깔 수 있게 식별자를 분리한다. */
const bundleId = IS_DEV
  ? 'kr.hs.gsm.taekbaewatshong.admin.dev'
  : IS_PREVIEW
    ? 'kr.hs.gsm.taekbaewatshong.admin.preview'
    : 'kr.hs.gsm.taekbaewatshong.admin';

const appName = IS_DEV
  ? '택배왔슝 관리자 (dev)'
  : IS_PREVIEW
    ? '택배왔슝 관리자 (preview)'
    : '택배왔슝 관리자';

const config: ExpoConfig = {
  name: appName,
  slug: 'taekbaewatshong-admin',
  /** 동적 설정(app.config.ts)에서는 소유 계정을 명시해야 EAS 가 프로젝트를 찾는다. */
  owner: 'jyuuuuu0',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'taekbaewatshong-admin',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],

  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: bundleId,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#FFE7DD',
    },
    predictiveBackGestureEnabled: false,
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission: '택배 송장의 QR·바코드를 스캔하기 위해 카메라 접근이 필요합니다.',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    // Expo Router 는 루트 폴더의 모든 .tsx 를 라우트로 만든다.
    // src/app 은 FSD app 계층(providers·전역 초기화)이라 라우트만 담는 하위 폴더를 가리킨다.
    router: {
      root: './src/app/routes',
    },
    eas: {
      // 비밀값이 아니므로 리터럴로 박는다.
      // eas.json 의 base 프로필에 EXPO_NO_DOTENV=1 이 있어 빌드 중에는 .env 를 읽지 않는다.
      // 환경 변수로 빼면 로컬에서만 되고 EAS 빌드에서 undefined 가 된다.
      projectId: '73c8dedd-a41b-4016-bac5-fa32a4b9e294',
    },
  },
};

export default config;
