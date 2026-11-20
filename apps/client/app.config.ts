import type { ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';
/** 빌드 variant 별로 다른 앱을 한 기기에 같이 깔 수 있게 식별자를 분리한다. */
const bundleId = IS_DEV
  ? 'kr.hs.gsm.taekbaewatshong.dev'
  : IS_PREVIEW
    ? 'kr.hs.gsm.taekbaewatshong.preview'
    : 'kr.hs.gsm.taekbaewatshong';

/**
 * Android 푸시(FCM)용 Firebase 설정 파일 경로. Firebase 프로젝트 하나에 variant 세 패키지를 모두 등록하면 한 파일로 된다.
 * 공개 레포라 파일은 커밋하지 않고 경로만 환경 변수로 받는다.
 * - EAS 빌드: 파일 타입 EAS 환경 변수 `GOOGLE_SERVICES_JSON` 이 업로드한 파일의 경로를 준다.
 * - 로컬 빌드(`expo prebuild`·`expo run:android`): `.env` 에 `GOOGLE_SERVICES_JSON=./google-services.json` 을 넣는다
 *   (Expo CLI 가 설정을 읽기 전에 불러온다). `eas build --local` 은 `EXPO_NO_DOTENV=1` 이라 `.env` 를 읽지 않고,
 *   secret EAS 변수도 로컬로 받을 수 없으니 셸 환경 변수로 넘긴다.
 * 없으면 넣지 않는다. 빌드는 되지만 Android 에서 Expo 푸시 토큰이 발급되지 않는다.
 */
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || undefined;

const appName = IS_DEV ? '택배왔숑 (dev)' : IS_PREVIEW ? '택배왔숑 (preview)' : '택배왔숑';

const config: ExpoConfig = {
  name: appName,
  slug: 'taekbaewatshong',
  /** 동적 설정(app.config.ts)에서는 소유 계정을 명시해야 EAS 가 프로젝트를 찾는다. */
  owner: 'jyuuuuu0',
  version: '0.2.0',
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
    googleServicesFile,
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
        // Android 알림 아이콘은 알파 채널만 써서 흰 실루엣으로 그린다. 배경이 꽉 찬 앱 아이콘을 쓰면 흰 네모가 된다.
        // 로고 마크(shared/assets/logo-mark)의 글자만 흰색·투명 배경으로 뽑았다. 색은 로고 마크 배경색.
        icon: './assets/notification-icon.png',
        color: '#0066CC',
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
