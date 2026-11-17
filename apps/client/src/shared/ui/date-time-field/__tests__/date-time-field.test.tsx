import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { DateTimeField, formatDateTimeLabel } from '../date-time-field';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  const Picker = (props: object) => <View testID="date-time-picker" {...props} />;
  return { __esModule: true, default: Picker, DateTimePickerAndroid: { open: jest.fn() } };
});

jest.setTimeout(10_000);

const VALUE = new Date(2026, 6, 6, 15, 30);

describe('formatDateTimeLabel', () => {
  it('요일과 오전/오후를 붙여 보여준다', () => {
    expect(formatDateTimeLabel(VALUE)).toBe('2026년 7월 6일 (월) 오후 3:30');
    expect(formatDateTimeLabel(new Date(2026, 6, 7, 0, 5))).toBe('2026년 7월 7일 (화) 오전 12:05');
  });
});

describe('DateTimeField (iOS)', () => {
  beforeAll(() => {
    Platform.OS = 'ios';
  });

  it('값이 없으면 안내 문구를 보여준다', async () => {
    await render(<DateTimeField label="분실 예상 시각" value={null} onChange={jest.fn()} />);

    expect(screen.getByText('날짜와 시각을 선택해 주세요')).toBeOnTheScreen();
  });

  it('휠에서 고른 값은 완료를 눌러야 반영된다', async () => {
    const onChange = jest.fn();
    const onClose = jest.fn();
    await render(
      <DateTimeField label="분실 예상 시각" value={VALUE} onChange={onChange} onClose={onClose} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: /^분실 예상 시각:/ }));
    const picked = new Date(2026, 6, 5, 9, 0);
    await fireEvent(screen.getByTestId('date-time-picker'), 'onChange', { type: 'set' }, picked);
    expect(onChange).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: '완료' }));

    expect(onChange).toHaveBeenCalledWith(picked);
    expect(onClose).toHaveBeenCalled();
  });

  it('취소하면 값을 바꾸지 않는다', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="분실 예상 시각" value={VALUE} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: /^분실 예상 시각:/ }));
    await fireEvent.press(screen.getByRole('button', { name: '취소' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
