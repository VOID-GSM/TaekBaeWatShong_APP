import { ApiError, useCreateReportMutation } from '@taekbae/api';
import type { Report } from '@taekbae/types';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useController } from 'react-hook-form';

import type { ReportLostParcelFormValues } from '../report-lost-parcel-form-schema';
import { useReportLostParcelForm } from '../use-report-lost-parcel-form';

jest.mock('@taekbae/api', () => ({
  ...jest.requireActual('@taekbae/api'),
  useCreateReportMutation: jest.fn(),
}));

const report: Report = {
  id: 3,
  invoiceNumber: '604122378890',
  alias: '겨울 패딩',
  lostEstimatedAt: '2026-07-06T15:00:00',
  content: '현관 앞에 없어요',
  progress: 'RECEIVED',
  createdAt: '2026-07-06T15:30:00',
};

const mutateAsync = jest.fn();

function mockMutation(state: { isPending?: boolean; error?: ApiError | null } = {}) {
  jest.mocked(useCreateReportMutation).mockReturnValue({
    mutateAsync,
    isPending: state.isPending ?? false,
    error: state.error ?? null,
  } as unknown as ReturnType<typeof useCreateReportMutation>);
}

/** 폼 훅과 함께 필드 값을 바꿀 수 있게 useController 를 붙인다. */
async function setup(onSuccess?: (report: Report) => void) {
  return renderHook(() => {
    const form = useReportLostParcelForm({ invoiceNumber: '604122378890', onSuccess });
    const fields = {
      lostEstimatedAt: useController({ control: form.control, name: 'lostEstimatedAt' }),
      content: useController({ control: form.control, name: 'content' }),
    };
    // formState 는 Proxy 라 렌더 중에 읽은 값만 구독된다 (Controller 의 render 와 같은 조건).
    const contentError = fields.content.fieldState.error?.message;
    return { form, fields, contentError };
  });
}

type Rendered = Awaited<ReturnType<typeof setup>>;

async function fill(rendered: Rendered, values: Partial<ReportLostParcelFormValues>) {
  await act(async () => {
    for (const [name, value] of Object.entries(values)) {
      rendered.result.current.fields[name as keyof ReportLostParcelFormValues].field.onChange(
        value,
      );
    }
  });
}

describe('useReportLostParcelForm', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 6, 6, 15, 30), doNotFake: ['setTimeout'] });
    mutateAsync.mockReset();
    mockMutation();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('기본값은 현재 시각과 빈 내용이다', async () => {
    const rendered = await setup();

    expect(rendered.result.current.fields.lostEstimatedAt.field.value).toBe('2026. 07. 06 15:30');
    expect(rendered.result.current.fields.content.field.value).toBe('');
  });

  it('제출하면 LocalDateTime 으로 바꿔 신고하고 onSuccess 를 부른다', async () => {
    mutateAsync.mockResolvedValue(report);
    const onSuccess = jest.fn();
    const rendered = await setup(onSuccess);
    await fill(rendered, { lostEstimatedAt: '2026. 07. 06 15:00', content: ' 현관 앞에 없어요 ' });

    await act(async () => rendered.result.current.form.submit());

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(report));
    expect(mutateAsync).toHaveBeenCalledWith({
      invoiceNumber: '604122378890',
      lostEstimatedAt: '2026-07-06T15:00:00',
      content: '현관 앞에 없어요',
    });
  });

  it('검증에 실패하면 신고하지 않고 필드 에러를 남긴다', async () => {
    const rendered = await setup();
    await fill(rendered, { content: '' });

    await act(async () => rendered.result.current.form.submit());

    await waitFor(() =>
      expect(rendered.result.current.contentError).toBe('상세 내용을 입력해 주세요.'),
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('신고가 실패하면 onSuccess 없이 submitError 로 서버 문구를 보여준다', async () => {
    const error = new ApiError('이미 분실 신고된 택배입니다.', 409);
    mutateAsync.mockRejectedValue(error);
    const onSuccess = jest.fn();
    const rendered = await setup(onSuccess);
    await fill(rendered, { content: '내용' });

    await act(async () => rendered.result.current.form.submit());
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();

    mockMutation({ error });
    await rendered.rerender({});
    expect(rendered.result.current.form.submitError).toBe('이미 분실 신고된 택배입니다.');
  });

  it('신고 중에는 isSubmitting 이 true', async () => {
    mockMutation({ isPending: true });
    const rendered = await setup();

    expect(rendered.result.current.form.isSubmitting).toBe(true);
  });
});
