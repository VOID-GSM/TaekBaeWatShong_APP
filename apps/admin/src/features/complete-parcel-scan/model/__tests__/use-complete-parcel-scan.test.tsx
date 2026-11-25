import type * as TaekbaeApi from '@taekbae/api';
import { ApiError } from '@taekbae/api';
import type { Parcel, ParcelCompleteRequest } from '@taekbae/types';
import type * as ReactQuery from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { RECENT_LIMIT } from '../arrival-scan';
import { useCompleteParcelScan } from '../use-complete-parcel-scan';

const mockCompleteParcel = jest.fn<Promise<Parcel>, [ParcelCompleteRequest]>();

// 요청 함수는 훅 안에서 모듈 내부 참조로 불려 export 를 바꿔도 안 바뀐다 — 훅째 바꾼다.
jest.mock('@taekbae/api', () => {
  const actual = jest.requireActual<typeof TaekbaeApi>('@taekbae/api');
  const query = jest.requireActual<typeof ReactQuery>('@tanstack/react-query');
  return {
    ...actual,
    useCompleteParcelMutation: () => query.useMutation({ mutationFn: mockCompleteParcel }),
  };
});

const parcelOf = (invoiceNumber: string, id = 1): Parcel => ({
  id,
  deliveryCompany: 'CJ대한통운',
  invoiceNumber,
  alias: '겨울 패딩',
  ownerName: '김학생',
  zone: 'A',
  status: 'ARRIVED',
  arrivedAt: '2026-11-24T09:00:00',
});

/** 결과를 원하는 때에 끝낼 수 있는 요청. */
function deferred() {
  let resolve: (parcel: Parcel) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<Parcel>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return await renderHook(() => useCompleteParcelScan(), { wrapper });
}

type Rendered = Awaited<ReturnType<typeof setup>>;

async function submit(rendered: Rendered, raw: string) {
  await act(async () => {
    rendered.result.current.submit(raw);
  });
}

describe('useCompleteParcelScan', () => {
  beforeEach(() => {
    mockCompleteParcel.mockReset();
  });

  it('앞뒤 공백만 떼고, 구역을 고르지 않으면 zone 없이 요청한다', async () => {
    mockCompleteParcel.mockResolvedValue(parcelOf('6041-2237'));
    const rendered = await setup();

    await submit(rendered, ' 6041-2237\n');

    expect(mockCompleteParcel.mock.calls[0]?.[0]).toEqual({ invoiceNumber: '6041-2237' });
  });

  it('구역을 고르면 zone 을 함께 보낸다', async () => {
    mockCompleteParcel.mockResolvedValue(parcelOf('604122378890'));
    const rendered = await setup();

    await act(async () => {
      rendered.result.current.setZone('C');
    });
    await submit(rendered, '604122378890');

    expect(rendered.result.current.zone).toBe('C');
    expect(mockCompleteParcel.mock.calls[0]?.[0]).toEqual({
      invoiceNumber: '604122378890',
      zone: 'C',
    });
  });

  it('빈 값(공백뿐)은 요청하지 않는다', async () => {
    const rendered = await setup();

    await submit(rendered, '   ');
    await submit(rendered, '');

    expect(mockCompleteParcel).not.toHaveBeenCalled();
    expect(rendered.result.current.isPending).toBe(false);
  });

  it('요청 중인 같은 운송장은 무시하고, 다른 운송장은 동시에 보낸다', async () => {
    const first = deferred();
    const second = deferred();
    mockCompleteParcel
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockResolvedValue(parcelOf('111', 3));
    const rendered = await setup();

    await submit(rendered, '111');
    await submit(rendered, '111 ');
    await submit(rendered, '222');

    expect(mockCompleteParcel.mock.calls.map(([request]) => request.invoiceNumber)).toEqual([
      '111',
      '222',
    ]);
    expect(rendered.result.current.isPending).toBe(true);

    await act(async () => {
      first.resolve(parcelOf('111', 1));
    });
    // 하나가 남아 있으면 계속 진행 중이다.
    expect(rendered.result.current.isPending).toBe(true);

    await act(async () => {
      second.resolve(parcelOf('222', 2));
    });
    expect(rendered.result.current.isPending).toBe(false);

    // 끝난 운송장은 다시 스캔하면 다시 보낸다.
    await submit(rendered, '111');
    expect(mockCompleteParcel).toHaveBeenCalledTimes(3);
  });

  it('성공하면 결과를 보여 주고 처리 기록 맨 앞에 쌓는다', async () => {
    const now = jest.spyOn(Date, 'now');
    mockCompleteParcel
      .mockResolvedValueOnce(parcelOf('111', 1))
      .mockResolvedValueOnce(parcelOf('222', 2));
    const rendered = await setup();

    now.mockReturnValue(1_000);
    await submit(rendered, '111');
    await waitFor(() => expect(rendered.result.current.processed).toHaveLength(1));
    now.mockReturnValue(2_000);
    await submit(rendered, '222');
    await waitFor(() => expect(rendered.result.current.processed).toHaveLength(2));

    const { result, processed } = rendered.result.current;
    expect(result).toMatchObject({ type: 'success', parcel: { invoiceNumber: '222' } });
    expect(processed.map((item) => [item.parcel.invoiceNumber, item.processedAt])).toEqual([
      ['222', 2_000],
      ['111', 1_000],
    ]);
    expect(processed[0]?.id).toBe(result?.id);
    now.mockRestore();
  });

  it(`처리 기록은 최신 ${RECENT_LIMIT}건만 남긴다`, async () => {
    mockCompleteParcel.mockImplementation(async ({ invoiceNumber }) =>
      parcelOf(invoiceNumber, Number(invoiceNumber)),
    );
    const rendered = await setup();

    for (let i = 1; i <= RECENT_LIMIT + 1; i += 1) {
      await submit(rendered, String(i));
    }
    await waitFor(() => expect(rendered.result.current.isPending).toBe(false));

    const { processed } = rendered.result.current;
    expect(processed).toHaveLength(RECENT_LIMIT);
    expect(processed[0]?.parcel.invoiceNumber).toBe(String(RECENT_LIMIT + 1));
    expect(processed.at(-1)?.parcel.invoiceNumber).toBe('2');
  });

  it('404 는 등록되지 않은 택배로 알린다', async () => {
    mockCompleteParcel.mockRejectedValue(new ApiError('존재하지 않는 택배입니다.', 404));
    const rendered = await setup();

    await submit(rendered, '999');

    await waitFor(() =>
      expect(rendered.result.current.result).toMatchObject({
        type: 'notFound',
        invoiceNumber: '999',
      }),
    );
    expect(rendered.result.current.processed).toHaveLength(0);
  });

  it('409 는 이미 처리된 택배로 알린다', async () => {
    mockCompleteParcel.mockRejectedValue(new ApiError('이미 처리된 택배입니다.', 409));
    const rendered = await setup();

    await submit(rendered, '111');

    await waitFor(() =>
      expect(rendered.result.current.result).toMatchObject({
        type: 'alreadyDone',
        invoiceNumber: '111',
      }),
    );
  });

  it('그 밖의 오류는 서버 메시지를, 메시지가 없으면 기본 문구를 보여 준다', async () => {
    mockCompleteParcel
      .mockRejectedValueOnce(new ApiError('관리자만 처리할 수 있어요.', 403))
      .mockRejectedValueOnce(new ApiError('', 500))
      .mockRejectedValueOnce('boom');
    const rendered = await setup();

    await submit(rendered, '111');
    await waitFor(() =>
      expect(rendered.result.current.result).toMatchObject({
        type: 'error',
        invoiceNumber: '111',
        message: '관리자만 처리할 수 있어요.',
      }),
    );

    await submit(rendered, '222');
    await waitFor(() =>
      expect(rendered.result.current.result).toMatchObject({
        invoiceNumber: '222',
        message: '도착 처리에 실패했어요.',
      }),
    );

    await submit(rendered, '333');
    await waitFor(() =>
      expect(rendered.result.current.result).toMatchObject({
        invoiceNumber: '333',
        message: '도착 처리에 실패했어요.',
      }),
    );
  });

  it('결과는 마지막으로 끝난 요청의 것을 보여 준다', async () => {
    const slow = deferred();
    mockCompleteParcel
      .mockReturnValueOnce(slow.promise)
      .mockRejectedValueOnce(new ApiError('이미 처리된 택배입니다.', 409));
    const rendered = await setup();

    await submit(rendered, '111');
    await submit(rendered, '222');
    await waitFor(() => expect(rendered.result.current.result?.type).toBe('alreadyDone'));

    await act(async () => {
      slow.resolve(parcelOf('111'));
    });

    expect(rendered.result.current.result).toMatchObject({
      type: 'success',
      parcel: { invoiceNumber: '111' },
    });
  });

  it('언마운트 뒤에 끝난 요청은 상태를 바꾸지 않는다', async () => {
    const slow = deferred();
    mockCompleteParcel.mockReturnValueOnce(slow.promise);
    const errorSpy = jest.spyOn(console, 'error');
    const rendered = await setup();

    await submit(rendered, '111');
    const before = rendered.result.current;
    await rendered.unmount();
    await act(async () => {
      slow.resolve(parcelOf('111'));
    });

    expect(rendered.result.current).toBe(before);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
