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
  /** 동적 설정(app.config.ts)에서는 소유 계정을 명시해야 EAS 가 프로젝트를 찾는다. */
  owner: 'jyuuuuu0',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'taekbaewatshong',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],

  /**
   * EAS Update(OTA). eas.json 의 빌드 프로필이 channel 을 쓰므로 필요하다.
   * 스토어 재심사 없이 JS 변경분만 기기에 내려보낼 수 있다.
   *
   * runtimeVersion 이 같은 빌드끼리만 업데이트가 적용된다.
   * appVersion 정책이면 위의 `version` 값이 기준이 되므로,
   * 네이티브 의존성을 추가했다면 version 을 올리고 새로 빌드해야 한다.
   */
  updates: {
    url: 'https://u.expo.dev/1935b1a2-e674-4591-97ae-11edac02f0bf',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },

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
      // 비밀값이 아니므로 리터럴로 박는다.
      // eas.json 의 base 프로필에 EXPO_NO_DOTENV=1 이 있어 빌드 중에는 .env 를 읽지 않는다.
      // 환경 변수로 빼면 로컬에서만 되고 EAS 빌드에서 undefined 가 된다.
      projectId: '1935b1a2-e674-4591-97ae-11edac02f0bf',
    },
  },
};

export default config;
