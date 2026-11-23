import type * as TaekbaeApi from '@taekbae/api';
import { ApiError } from '@taekbae/api';
import type {
  DriverQr,
  DriverQrCreateRequest,
  DriverQrScanRequest,
  DriverQrScanResult,
} from '@taekbae/types';
import type * as ReactQuery from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { useEffect as ReactUseEffect } from 'react';
import type * as ReactNative from 'react-native';

import { DriverQrPage } from '../driver-qr-page';

const mockCreateDriverQr = jest.fn<Promise<DriverQr>, [DriverQrCreateRequest]>();
const mockScanDriverQr = jest.fn<Promise<DriverQrScanResult>, [DriverQrScanRequest]>();

// 요청 함수는 훅 안에서 모듈 내부 참조로 불려 export 를 바꿔도 안 바뀐다 — 훅째 바꾼다.
jest.mock('@taekbae/api', () => {
  const actual = jest.requireActual<typeof TaekbaeApi>('@taekbae/api');
  const query = jest.requireActual<typeof ReactQuery>('@tanstack/react-query');
  return {
    ...actual,
    useCreateDriverQrMutation: () => query.useMutation({ mutationFn: mockCreateDriverQr }),
    useScanDriverQrMutation: () => query.useMutation({ mutationFn: mockScanDriverQr }),
  };
});

// 화면 포커스는 내비게이터 없이 렌더하므로 마운트 시 한 번 들어온 것으로 본다.
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<{ useEffect: typeof ReactUseEffect }>('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});

// 스캔 선의 무한 반복 애니메이션이 테스트 프레임 루프를 붙잡지 않게 '동작 줄이기'로 둔다.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<{ default: unknown }>('react-native-reanimated');
  return { __esModule: true, ...actual, default: actual.default, useReducedMotion: () => true };
});

type MockPermission = { granted: boolean; canAskAgain: boolean } | null;
let mockPermission: MockPermission = { granted: true, canAskAgain: true };
const mockRequestPermission = jest.fn();

jest.mock('expo-camera', () => {
  const { View } = jest.requireActual<typeof ReactNative>('react-native');
  return {
    CameraView: (props: object) => <View {...props} />,
    useCameraPermissions: () => [mockPermission, mockRequestPermission],
  };
});

jest.setTimeout(10_000);

const driverQr: DriverQr = {
  id: 1,
  driverName: '김택배',
  deliveryCompany: 'CJ대한통운',
  qrToken: '8d3c2f4e-1b6a-4c7d-9e0f-2a3b4c5d6e7f',
  qrImageUrl: 'data:image/png;base64,iVBORw0KGgo=',
  createdAt: '2026-11-18T14:30:00',
};

async function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return await render(
    <QueryClientProvider client={queryClient}>
      <DriverQrPage />
    </QueryClientProvider>,
  );
}

/** 카메라가 QR 을 읽은 것처럼 이벤트를 보낸다. */
async function scanQr(data: string) {
  const camera = screen.getByTestId('qr-camera');
  await act(async () => {
    (camera.props as { onBarcodeScanned: (e: { data: string }) => void }).onBarcodeScanned({
      data,
    });
  });
}

describe('DriverQrPage', () => {
  beforeEach(() => {
    mockCreateDriverQr.mockReset();
    mockScanDriverQr.mockReset();
    mockRequestPermission.mockReset();
    mockPermission = { granted: true, canAskAgain: true };
  });

  describe('QR 생성', () => {
    it('이름 끝의 "기사님"을 떼고 발급을 요청한 뒤 QR 카드를 보여준다', async () => {
      mockCreateDriverQr.mockResolvedValue(driverQr);
      await renderPage();

      await fireEvent.changeText(screen.getByLabelText('기사님 이름'), '김택배 기사님');
      await fireEvent.changeText(screen.getByLabelText('택배사'), ' CJ대한통운 ');
      await fireEvent.press(screen.getByRole('button', { name: '기사님 QR 생성' }));

      expect(mockCreateDriverQr.mock.calls[0]?.[0]).toEqual({
        driverName: '김택배',
        deliveryCompany: 'CJ대한통운',
      });
      expect(await screen.findByLabelText('김택배 기사님 식별 QR 코드')).toBeOnTheScreen();
      expect(screen.getByText('CJ대한통운 · 이 QR로 기사님을 식별해요')).toBeOnTheScreen();
    });

    it('빈 값이면 요청하지 않고 안내를 보여준다', async () => {
      await renderPage();

      await fireEvent.press(screen.getByRole('button', { name: '기사님 QR 생성' }));

      expect(mockCreateDriverQr).not.toHaveBeenCalled();
      expect(screen.getByText('기사님 이름을 입력해 주세요.')).toBeOnTheScreen();
      expect(screen.getByText('택배사를 입력해 주세요.')).toBeOnTheScreen();
    });

    it('발급 실패 메시지를 보여준다', async () => {
      mockCreateDriverQr.mockRejectedValue(new ApiError('관리자만 발급할 수 있어요.', 403));
      await renderPage();

      await fireEvent.changeText(screen.getByLabelText('기사님 이름'), '김택배');
      await fireEvent.changeText(screen.getByLabelText('택배사'), 'CJ대한통운');
      await fireEvent.press(screen.getByRole('button', { name: '기사님 QR 생성' }));

      expect(await screen.findByText('관리자만 발급할 수 있어요.')).toBeOnTheScreen();
    });
  });

  describe('QR 인식', () => {
    const openScanTab = () => fireEvent.press(screen.getByRole('tab', { name: 'QR 인식' }));

    it('탭을 열면 카메라가 바로 뜨고, 인식한 QR 로 방문을 기록한다', async () => {
      mockScanDriverQr.mockResolvedValue({
        driverId: 1,
        driverName: '김택배',
        deliveryCompany: 'CJ대한통운',
        scannedAt: '2026-11-18T14:30:00',
      });
      await renderPage();
      await openScanTab();

      await scanQr(` ${driverQr.qrToken}\n`);

      expect(mockScanDriverQr.mock.calls[0]?.[0]).toEqual({ qrToken: driverQr.qrToken });
      expect(await screen.findByText('방문 기록 완료')).toBeOnTheScreen();
      expect(screen.getByText('김택배 기사님')).toBeOnTheScreen();
      expect(screen.getByText('CJ대한통운 · 11.18 14:30 인식')).toBeOnTheScreen();
    });

    it('같은 QR 을 계속 비추면 한 번만 기록한다', async () => {
      mockScanDriverQr.mockResolvedValue({
        driverId: 1,
        driverName: '김택배',
        deliveryCompany: 'CJ대한통운',
        scannedAt: '2026-11-18T14:30:00',
      });
      await renderPage();
      await openScanTab();

      await scanQr(driverQr.qrToken);
      await screen.findByText('방문 기록 완료');
      await scanQr(driverQr.qrToken);
      await scanQr(driverQr.qrToken);

      expect(mockScanDriverQr).toHaveBeenCalledTimes(1);
    });

    it('요청이 쿨다운보다 오래 걸려도 계속 비추는 같은 QR 은 한 번만 기록한다', async () => {
      let resolveScan: (result: DriverQrScanResult) => void = () => {};
      mockScanDriverQr.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveScan = resolve;
          }),
      );
      const now = jest.spyOn(Date, 'now');
      await renderPage();
      await openScanTab();

      now.mockReturnValue(0);
      await scanQr(driverQr.qrToken);
      for (const at of [1_000, 2_000, 3_000, 3_500]) {
        now.mockReturnValue(at);
        await scanQr(driverQr.qrToken);
      }
      await act(async () => {
        resolveScan({
          driverId: 1,
          driverName: '김택배',
          deliveryCompany: 'CJ대한통운',
          scannedAt: '2026-11-18T14:30:00',
        });
      });
      await screen.findByText('방문 기록 완료');
      now.mockReturnValue(3_600);
      await scanQr(driverQr.qrToken);

      expect(mockScanDriverQr).toHaveBeenCalledTimes(1);
      now.mockRestore();
    });

    it('없는 QR 이면 서버 메시지를 보여준다', async () => {
      mockScanDriverQr.mockRejectedValue(new ApiError('유효하지 않은 QR 토큰입니다.', 404));
      await renderPage();
      await openScanTab();

      await scanQr('unknown');

      expect(await screen.findByText('유효하지 않은 QR 토큰입니다.')).toBeOnTheScreen();
      expect(screen.getByText('인식 실패')).toBeOnTheScreen();
    });

    it('권한이 없으면 탭을 열 때 바로 권한을 요청한다', async () => {
      mockPermission = { granted: false, canAskAgain: true };
      await renderPage();
      await openScanTab();

      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('qr-camera')).toBeNull();
      expect(screen.getByRole('button', { name: '카메라 허용' })).toBeOnTheScreen();
    });

    it('다시 물을 수 없으면 설정으로 안내한다', async () => {
      mockPermission = { granted: false, canAskAgain: false };
      await renderPage();
      await openScanTab();

      expect(mockRequestPermission).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: '설정 열기' })).toBeOnTheScreen();
    });
  });
});
