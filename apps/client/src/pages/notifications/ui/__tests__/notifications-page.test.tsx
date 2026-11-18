import { ApiError } from '@taekbae/api';
import type {
  NotificationListResponse,
  NotificationReadResponse,
  ParcelNotification,
} from '@taekbae/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { NotificationsPage } from '../notifications-page';

const mockFetchNotifications = jest.fn<Promise<NotificationListResponse>, [number | undefined]>();
const mockMarkRead = jest.fn<Promise<NotificationReadResponse>, [number]>();

// 목록은 실제 무한 쿼리 옵션에 요청 함수만 바꿔 끼우고, 읽음 처리는 요청이 나갔는지만 본다
// (캐시 갱신은 @taekbae/api 쪽 테스트 범위).
jest.mock('@taekbae/api', () => {
  const actual = jest.requireActual('@taekbae/api');
  const { useMutation } = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    notificationQueries: {
      list: () => ({
        ...actual.notificationQueries.list(),
        queryFn: ({ pageParam }: { pageParam: number | undefined }) =>
          mockFetchNotifications(pageParam),
      }),
    },
    useMarkNotificationReadMutation: () =>
      useMutation({ mutationFn: (id: number) => mockMarkRead(id) }),
  };
});

// expo-router 는 Jest 에서 ESM 의존성을 불러오지 못해 mock 한다. 화면이 처음 포커스될 때처럼 마운트 시 한 번 부른다.
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useFocusEffect: (effect: () => void) => {
      useEffect(effect, [effect]);
    },
  };
});

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const arrived: ParcelNotification = {
  id: 3,
  type: 'ARRIVED',
  title: '택배가 도착했어요',
  message: 'CJ대한통운 택배가 B구역에 도착했어요',
  parcelId: 30,
  unclaimedDays: null,
  isRead: false,
  createdAt: '2026-11-18T14:55:00',
};

const reminder: ParcelNotification = {
  id: 2,
  type: 'UNCLAIMED_REMINDER',
  title: '택배를 찾아가 주세요',
  message: 'B구역에 보관 중인 택배가 3일째 그대로예요',
  parcelId: 20,
  unclaimedDays: 3,
  isRead: false,
  createdAt: '2026-11-17T09:00:00',
};

const claimed: ParcelNotification = {
  id: 1,
  type: 'CLAIMED',
  title: '택배를 수령했어요',
  message: '수령이 완료됐어요',
  parcelId: 10,
  unclaimedDays: null,
  isRead: true,
  createdAt: '2026-11-10T12:00:00',
};

const page = (
  notifications: ParcelNotification[],
  { unreadCount = notifications.filter((n) => !n.isRead).length, nextCursor = null } = {} as {
    unreadCount?: number;
    nextCursor?: number | null;
  },
): NotificationListResponse => ({ unreadCount, notifications, nextCursor });

// gcTime 을 끄지 않으면 테스트가 끝난 뒤에도 쿼리·mutation 정리 타이머(기본 5분)가 남아 Jest 가 끝나지 않는다.
const queryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });

async function renderPage(onOpenParcel?: (parcelId: number) => void) {
  return render(
    <QueryClientProvider client={queryClient()}>
      <NotificationsPage onOpenParcel={onOpenParcel} />
    </QueryClientProvider>,
  );
}

function list() {
  return screen.getByTestId('notifications-list');
}

// 테스트 환경의 RefreshControl 은 props 를 그리지 않아, 목록에 넘긴 refreshControl 로 확인한다.
function refreshControl() {
  return list().props.refreshControl.props as { refreshing: boolean; onRefresh: () => void };
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    mockFetchNotifications.mockReset();
    mockMarkRead.mockReset();
  });

  it('처음 불러오는 동안 로딩 표시를 보여준다', async () => {
    mockFetchNotifications.mockReturnValue(new Promise(() => {}));
    await renderPage();

    expect(screen.getByLabelText('알림을 불러오는 중')).toBeOnTheScreen();
  });

  it('알림 목록과 안 읽은 알림 개수를 보여준다', async () => {
    mockFetchNotifications.mockResolvedValue(page([arrived, reminder, claimed]));
    await renderPage();

    expect(await screen.findByText('안 읽은 알림 2개')).toBeOnTheScreen();
    expect(screen.getByText('택배가 도착했어요')).toBeOnTheScreen();
    expect(screen.getByText('택배를 찾아가 주세요')).toBeOnTheScreen();
    expect(screen.getByText('택배를 수령했어요')).toBeOnTheScreen();
  });

  it('안 읽은 알림이 없으면 개수 요약을 숨긴다', async () => {
    mockFetchNotifications.mockResolvedValue(page([claimed]));
    await renderPage();

    expect(await screen.findByText('택배를 수령했어요')).toBeOnTheScreen();
    expect(screen.queryByText(/안 읽은 알림/)).toBeNull();
  });

  it('방치 알림은 미수령 일수를 보여준다', async () => {
    mockFetchNotifications.mockResolvedValue(page([reminder]));
    await renderPage();

    expect(await screen.findByText('미수령 3일')).toBeOnTheScreen();
  });

  it('안 읽은 알림을 누르면 읽음 요청을 보내고 해당 택배를 연다', async () => {
    mockFetchNotifications.mockResolvedValue(page([arrived, claimed]));
    mockMarkRead.mockResolvedValue({ id: arrived.id, isRead: true, unreadCount: 0 });
    const onOpenParcel = jest.fn();
    await renderPage(onOpenParcel);

    await fireEvent.press(
      await screen.findByRole('button', { name: /^안 읽음, 택배가 도착했어요/ }),
    );

    expect(mockMarkRead).toHaveBeenCalledWith(arrived.id);
    expect(onOpenParcel).toHaveBeenCalledWith(arrived.parcelId);
  });

  it('이미 읽은 알림을 누르면 읽음 요청 없이 해당 택배만 연다', async () => {
    mockFetchNotifications.mockResolvedValue(page([claimed]));
    const onOpenParcel = jest.fn();
    await renderPage(onOpenParcel);

    await fireEvent.press(await screen.findByRole('button', { name: /^택배를 수령했어요/ }));

    expect(mockMarkRead).not.toHaveBeenCalled();
    expect(onOpenParcel).toHaveBeenCalledWith(claimed.parcelId);
  });

  it('알림이 없으면 빈 목록 문구를 보여준다', async () => {
    mockFetchNotifications.mockResolvedValue(page([]));
    await renderPage();

    expect(await screen.findByText('아직 받은 알림이 없어요.')).toBeOnTheScreen();
  });

  it('불러오지 못하면 에러와 다시 시도를 보여주고, 다시 시도하면 목록을 보여준다', async () => {
    let resolveRetry: (response: NotificationListResponse) => void = () => {};
    mockFetchNotifications.mockRejectedValueOnce(new ApiError('네트워크 오류가 발생했습니다.'));
    mockFetchNotifications.mockImplementationOnce(
      () =>
        new Promise<NotificationListResponse>((resolve) => {
          resolveRetry = resolve;
        }),
    );
    await renderPage();

    expect(await screen.findByText('알림을 불러오지 못했어요.')).toBeOnTheScreen();
    expect(screen.getByText('네트워크 오류가 발생했습니다.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByLabelText('알림을 불러오는 중')).toBeOnTheScreen();
    expect(screen.queryByText('알림을 불러오지 못했어요.')).toBeNull();
    await act(async () => resolveRetry(page([arrived])));

    expect(await screen.findByText('택배가 도착했어요')).toBeOnTheScreen();
  });

  it('목록 끝에 닿으면 다음 페이지를 불러와 이어 붙인다', async () => {
    mockFetchNotifications.mockImplementation((cursor) =>
      Promise.resolve(
        cursor === undefined
          ? page([arrived, reminder], { nextCursor: 2 })
          : page([claimed], { unreadCount: 2 }),
      ),
    );
    await renderPage();
    await screen.findByText('택배가 도착했어요');

    await act(async () => {
      list().props.onEndReached();
    });

    expect(await screen.findByText('택배를 수령했어요')).toBeOnTheScreen();
    expect(mockFetchNotifications).toHaveBeenLastCalledWith(2);
  });

  it('다음 페이지를 불러오지 못하면 목록은 두고 다시 시도 버튼을 보여준다', async () => {
    mockFetchNotifications.mockResolvedValueOnce(page([arrived], { nextCursor: 2 }));
    mockFetchNotifications.mockRejectedValueOnce(new ApiError('네트워크 오류가 발생했습니다.'));
    await renderPage();
    await screen.findByText('택배가 도착했어요');

    await act(async () => {
      list().props.onEndReached();
    });

    expect(await screen.findByText('더 불러오지 못했어요')).toBeOnTheScreen();
    expect(screen.getByText('택배가 도착했어요')).toBeOnTheScreen();

    mockFetchNotifications.mockResolvedValueOnce(page([claimed], { unreadCount: 1 }));
    await fireEvent.press(screen.getByRole('button', { name: '알림 더 불러오기 다시 시도' }));

    expect(await screen.findByText('택배를 수령했어요')).toBeOnTheScreen();
    expect(screen.queryByText('더 불러오지 못했어요')).toBeNull();
  });

  it('당겨서 새로고침하는 동안 스피너를 보여 준다', async () => {
    let resolveFetch: (response: NotificationListResponse) => void = () => {};
    mockFetchNotifications.mockResolvedValueOnce(page([claimed]));
    await renderPage();
    await screen.findByText('택배를 수령했어요');

    mockFetchNotifications.mockImplementationOnce(
      () =>
        new Promise<NotificationListResponse>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    await act(async () => {
      refreshControl().onRefresh();
    });
    expect(refreshControl().refreshing).toBe(true);
    await act(async () => resolveFetch(page([arrived, claimed])));

    expect(await screen.findByText('택배가 도착했어요')).toBeOnTheScreen();
    expect(refreshControl().refreshing).toBe(false);
  });

  it('당겨서 새로고침이 실패하면 목록은 두고 실패 안내를 보여 준다', async () => {
    mockFetchNotifications.mockResolvedValueOnce(page([claimed]));
    await renderPage();
    await screen.findByText('택배를 수령했어요');

    mockFetchNotifications.mockRejectedValueOnce(new ApiError('네트워크 오류가 발생했습니다.'));
    await act(async () => {
      refreshControl().onRefresh();
    });

    expect(await screen.findByText('새로고침하지 못했어요.')).toBeOnTheScreen();
    expect(screen.getByText('네트워크 오류가 발생했습니다.')).toBeOnTheScreen();
    expect(screen.getByText('택배를 수령했어요')).toBeOnTheScreen();
  });

  it('택배 화면이 연결되지 않았으면 읽은 알림은 누를 수 없고, 안 읽은 알림만 누를 수 있다', async () => {
    mockFetchNotifications.mockResolvedValueOnce(page([arrived, claimed]));
    await renderPage();
    await screen.findByText('택배를 수령했어요');

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /택배가 도착했어요/ })).toBeOnTheScreen();
  });
});
