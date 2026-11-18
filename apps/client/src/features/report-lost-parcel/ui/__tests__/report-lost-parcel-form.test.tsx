import { fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { ReportLostParcelFormValues } from '../../model/report-lost-parcel-form-schema';
import { ReportLostParcelForm } from '../report-lost-parcel-form';

jest.setTimeout(10_000);

const DEFAULT_VALUES: ReportLostParcelFormValues = {
  lostEstimatedAt: new Date(2026, 6, 6, 15, 30),
  content: '',
};

type FieldErrors = Partial<Record<keyof ReportLostParcelFormValues, string>>;

function Harness({
  errors = {},
  onValues,
}: {
  errors?: FieldErrors;
  onValues?: (values: Partial<ReportLostParcelFormValues>) => void;
}) {
  const { control, setError } = useForm<ReportLostParcelFormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    for (const [name, message] of Object.entries(errors)) {
      setError(name as keyof ReportLostParcelFormValues, { type: 'manual', message });
    }
    // 첫 렌더 뒤 한 번만 에러를 심는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const values = useWatch({ control });
  useEffect(() => {
    onValues?.(values);
  });

  return <ReportLostParcelForm control={control} />;
}

describe('ReportLostParcelForm', () => {
  it('두 입력을 라벨로 찾을 수 있고 기본값을 보여준다', async () => {
    await render(<Harness />);

    // 분실 예상 시각은 직접 입력하지 않고 눌러서 고르는 칸이다.
    expect(
      screen.getByRole('button', { name: '분실 예상 시각: 2026년 7월 6일 (월) 오후 3:30' }),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('상세 내용')).toHaveDisplayValue('');
  });

  it('필드 에러 문구를 각 입력 아래에 보여준다', async () => {
    await render(
      <Harness
        errors={{
          lostEstimatedAt: '분실 예상 시각을 선택해 주세요.',
          content: '상세 내용을 입력해 주세요.',
        }}
      />,
    );

    expect(await screen.findByText('분실 예상 시각을 선택해 주세요.')).toBeOnTheScreen();
    expect(screen.getByText('상세 내용을 입력해 주세요.')).toBeOnTheScreen();
  });

  it('에러가 없으면 에러 문구를 띄우지 않는다', async () => {
    await render(<Harness />);

    expect(screen.queryByText('상세 내용을 입력해 주세요.')).toBeNull();
  });

  it('입력한 내용을 폼 값으로 넘긴다', async () => {
    const onValues = jest.fn();
    await render(<Harness onValues={onValues} />);

    await fireEvent.changeText(screen.getByLabelText('상세 내용'), '택배가 보이지 않습니다.');

    expect(onValues).toHaveBeenLastCalledWith(
      expect.objectContaining({ content: '택배가 보이지 않습니다.' }),
    );
  });
});
