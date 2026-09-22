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
      // TODO: `cd apps/admin && pnpm exec eas init` 으로 발급받은 값을 리터럴로 적는다.
      // client 와 마찬가지로 환경 변수로 빼면 안 된다 —
      // eas.json 의 EXPO_NO_DOTENV=1 때문에 EAS 빌드 중에는 .env 를 읽지 않는다.
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
};

export default config;
