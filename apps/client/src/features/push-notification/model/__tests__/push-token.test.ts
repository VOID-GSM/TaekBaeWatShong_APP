import { deleteDeviceToken, registerDeviceToken } from '@taekbae/api';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { registerPushToken, UNREGISTER_TIMEOUT_MS, unregisterPushToken } from '../push-token';

jest.mock('@taekbae/api', () => ({
  ...jest.requireActual('@taekbae/api'),
  registerDeviceToken: jest.fn(),
  deleteDeviceToken: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

// 모듈 네임스페이스 객체는 테스트에서 바꿔도 코드 쪽에 반영되지 않아, getter 로 이 변수를 읽게 한다.
let mockIsDevice = true;
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice;
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-id' } } }, easConfig: null },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const TOKEN = 'ExponentPushToken[abc]';
const STORAGE_KEY = 'taekbaewatshong.push.deviceToken';

function setPlatform(os: typeof Platform.OS) {
  jest.replaceProperty(Platform, 'OS', os);
}

function setIsDevice(value: boolean) {
  mockIsDevice = value;
}

function permission(granted: boolean, canAskAgain = true) {
  return { granted, canAskAgain } as Notifications.NotificationPermissionsStatus;
}

describe('registerPushToken', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setPlatform('android');
    setIsDevice(true);
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission(true));
    jest
      .mocked(Notifications.getExpoPushTokenAsync)
      .mockResolvedValue({ type: 'expo', data: TOKEN });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('권한이 있으면 Expo 토큰을 받아 서버에 등록하고 저장한다', async () => {
    await expect(registerPushToken()).resolves.toEqual({ status: 'registered', token: TOKEN });

    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-id' });
    expect(registerDeviceToken).toHaveBeenCalledWith({ deviceToken: TOKEN, platform: 'ANDROID' });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(STORAGE_KEY, TOKEN);
  });

  it('Android 는 권한을 묻기 전에 알림 채널을 만든다', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission(false));
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue(permission(true));

    await registerPushToken();

    const [channelOrder] = jest.mocked(Notifications.setNotificationChannelAsync).mock
      .invocationCallOrder;
    const [requestOrder] = jest.mocked(Notifications.requestPermissionsAsync).mock
      .invocationCallOrder;
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({ importance: 4 }),
    );
    expect(channelOrder).toBeLessThan(requestOrder ?? 0);
  });

  it('iOS 는 채널을 만들지 않고 IOS 로 등록한다', async () => {
    setPlatform('ios');

    await registerPushToken();

    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(registerDeviceToken).toHaveBeenCalledWith({ deviceToken: TOKEN, platform: 'IOS' });
  });

  it('권한을 거절하면 등록하지 않는다', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission(false));
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue(permission(false));

    await expect(registerPushToken()).resolves.toEqual({ status: 'denied' });

    expect(registerDeviceToken).not.toHaveBeenCalled();
  });

  it('다시 물을 수 없게 거절된 상태면 권한 창을 띄우지 않는다', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission(false, false));

    await expect(registerPushToken()).resolves.toEqual({ status: 'denied' });

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['웹', () => setPlatform('web')],
    ['시뮬레이터', () => setIsDevice(false)],
  ])('%s 에서는 아무것도 하지 않는다', async (_label, arrange) => {
    arrange();

    await expect(registerPushToken()).resolves.toEqual({ status: 'unsupported' });

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(registerDeviceToken).not.toHaveBeenCalled();
  });

  it('서버 등록이 실패하면 저장하지 않고 에러를 던진다', async () => {
    jest.mocked(registerDeviceToken).mockRejectedValue(new Error('network'));

    await expect(registerPushToken()).rejects.toThrow('network');

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});

describe('unregisterPushToken', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.useRealTimers();
  });

  it('저장한 토큰을 넘겨받은 액세스 토큰으로 지우고 저장값도 지운다', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(TOKEN);

    await unregisterPushToken('expired-access-token');

    expect(deleteDeviceToken).toHaveBeenCalledWith(
      'https://api.example.test',
      'expired-access-token',
      TOKEN,
      expect.any(AbortSignal),
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('저장한 토큰이 없으면 요청하지 않는다', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    await unregisterPushToken('access-token');

    expect(deleteDeviceToken).not.toHaveBeenCalled();
  });

  it('삭제 요청이 실패해도 저장값은 지운다', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(TOKEN);
    jest.mocked(deleteDeviceToken).mockRejectedValue(new Error('500'));

    await expect(unregisterPushToken('access-token')).rejects.toThrow('500');

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('응답이 오래 걸리면 요청을 끊는다', async () => {
    jest.useFakeTimers();
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(TOKEN);
    let signal: AbortSignal | undefined;
    jest.mocked(deleteDeviceToken).mockImplementation(
      (_baseUrl, _accessToken, _token, received) =>
        new Promise((_resolve, reject) => {
          signal = received;
          received?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    const pending = unregisterPushToken('access-token');
    const settled = expect(pending).rejects.toThrow('aborted');
    await jest.advanceTimersByTimeAsync(UNREGISTER_TIMEOUT_MS);

    await settled;
    expect(signal?.aborted).toBe(true);
  });
});
