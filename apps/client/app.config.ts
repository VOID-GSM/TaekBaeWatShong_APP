import type { ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

/** 빌드 variant 별로 다른 앱을 한 기기에 같이 깔 수 있게 식별자를 분리한다. */
const bundleId = IS_DEV
  ? 'kr.hs.gsm.taekbaewatshong.dev'
  : IS_PREVIEW
    ? 'kr.hs.gsm.taekbaewatshong.preview'
    : 'kr.hs.gsm.taekbaewatshong';

const appName = IS_DEV ? '택배왔슝 (dev)' : IS_PREVIEW ? '택배왔슝 (preview)' : '택배왔슝';

const config: ExpoConfig = {
  name: appName,
  slug: 'taekbaewatshong',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'taekbaewatshong',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],

  ios: {
    supportsTablet: false,
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

  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'static',
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
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#FF6B35',
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
      // `eas init` 실행 후 발급되는 값으로 교체한다.
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
};

export default config;
