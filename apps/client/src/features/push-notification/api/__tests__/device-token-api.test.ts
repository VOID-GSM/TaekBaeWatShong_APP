// packages/api 에는 테스트 러너가 없어, 디바이스 토큰 요청 함수를 쓰는 이 앱에서 검증한다.
import { api, ApiError, configureApi, deleteDeviceToken, registerDeviceToken } from '@taekbae/api';

const fetchMock = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
  Promise.resolve(new Response(null, { status: 204 })),
);

beforeAll(() => {
  configureApi({ baseURL: 'http://test', getAccessToken: async () => null });
});

beforeEach(() => {
  fetchMock.mockClear();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('registerDeviceToken', () => {
  it('POST /notification/token 으로 보내고 응답을 검증한다', async () => {
    const post = jest.spyOn(api(), 'post').mockResolvedValue({
      data: { id: 1, platform: 'ANDROID', createdAt: '2026-11-18T10:00:00' },
    });

    await expect(
      registerDeviceToken({ deviceToken: 'ExponentPushToken[abc]', platform: 'ANDROID' }),
    ).resolves.toMatchObject({ id: 1 });
    expect(post).toHaveBeenCalledWith('/notification/token', {
      deviceToken: 'ExponentPushToken[abc]',
      platform: 'ANDROID',
    });
  });

  it('응답 형식이 다르면 ApiError', async () => {
    jest.spyOn(api(), 'post').mockResolvedValue({ data: { platform: 'ANDROID' } });

    await expect(
      registerDeviceToken({ deviceToken: 'ExponentPushToken[abc]', platform: 'ANDROID' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe('deleteDeviceToken', () => {
  it('axios 인스턴스를 거치지 않고, 넘겨받은 토큰으로 DELETE 본문에 기기 토큰을 담아 보낸다', async () => {
    const del = jest.spyOn(api(), 'delete');

    await deleteDeviceToken('https://api.example.test', 'expired', 'ExponentPushToken[abc]');

    expect(del).not.toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.test/notification/token');
    expect(init).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer expired', 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceToken: 'ExponentPushToken[abc]' }),
    });
  });

  it('실패 응답이면 상태 코드를 담은 ApiError', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(
      deleteDeviceToken('https://api.example.test', 'bad', 'ExponentPushToken[abc]'),
    ).rejects.toMatchObject({ status: 401 });
  });
});
