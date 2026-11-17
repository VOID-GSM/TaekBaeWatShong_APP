import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
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
const NOW = new Date(2026, 6, 6, 16, 0);
const TRIGGER = { name: /^분실 예상 시각:/ };
const ORIGINAL_OS = Platform.OS;

function setOS(os: typeof Platform.OS) {
  Platform.OS = os;
}

type AndroidOpenParams = Parameters<typeof DateTimePickerAndroid.open>[0];
const androidOpen = jest.mocked(DateTimePickerAndroid.open);

/** n 번째로 열린 Android 대화상자에서 값을 고른다. */
function pickAndroid(call: number, picked: Date | undefined, type: 'set' | 'dismissed' = 'set') {
  const params = androidOpen.mock.calls[call]?.[0] as AndroidOpenParams;
  params.onChange?.(
    { type, nativeEvent: { timestamp: picked?.getTime() ?? 0, utcOffset: 0 } },
    picked,
  );
  return params;
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  androidOpen.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  setOS(ORIGINAL_OS);
});

describe('formatDateTimeLabel', () => {
  it('요일과 오전/오후를 붙여 보여준다', () => {
    expect(formatDateTimeLabel(VALUE)).toBe('2026년 7월 6일 (월) 오후 3:30');
    expect(formatDateTimeLabel(new Date(2026, 6, 7, 0, 5))).toBe('2026년 7월 7일 (화) 오전 12:05');
  });
});

describe('DateTimeField (iOS)', () => {
  beforeEach(() => setOS('ios'));

  it('값이 없으면 안내 문구를 보여준다', async () => {
    await render(<DateTimeField label="분실 예상 시각" value={null} onChange={jest.fn()} />);

    expect(screen.getByText('날짜와 시각을 선택해 주세요')).toBeOnTheScreen();
  });

  it('화면 라벨은 스크린 리더에서 빼고 버튼 이름으로만 읽는다', async () => {
    await render(<DateTimeField label="분실 예상 시각" value={VALUE} onChange={jest.fn()} />);

    expect(screen.queryByText('분실 예상 시각')).toBeNull();
    expect(
      screen.getByRole('button', { name: '분실 예상 시각: 2026년 7월 6일 (월) 오후 3:30' }),
    ).toBeOnTheScreen();
  });

  it('휠에서 고른 값은 완료를 눌러야 반영된다', async () => {
    const onChange = jest.fn();
    const onClose = jest.fn();
    await render(
      <DateTimeField label="분실 예상 시각" value={VALUE} onChange={onChange} onClose={onClose} />,
    );

    await fireEvent.press(screen.getByRole('button', TRIGGER));
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

    await fireEvent.press(screen.getByRole('button', TRIGGER));
    await fireEvent.press(screen.getByRole('button', { name: '취소' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('disallowFuture 면 상한을 렌더 시점이 아니라 여는 순간의 현재 시각으로 잡는다', async () => {
    await render(
      <DateTimeField label="분실 예상 시각" value={VALUE} onChange={jest.fn()} disallowFuture />,
    );

    // 렌더한 뒤 10분이 지나고 연다.
    const later = new Date(2026, 6, 6, 16, 10);
    jest.setSystemTime(later);
    await fireEvent.press(screen.getByRole('button', TRIGGER));

    expect(screen.getByTestId('date-time-picker')).toHaveProp('maximumDate', later);
  });
});

describe('DateTimeField (Android)', () => {
  beforeEach(() => setOS('android'));

  it('날짜 → 시각 대화상자 순서로 열고 고른 값을 넘긴다', async () => {
    const onChange = jest.fn();
    const onClose = jest.fn();
    await render(
      <DateTimeField label="분실 예상 시각" value={VALUE} onChange={onChange} onClose={onClose} />,
    );

    await fireEvent.press(screen.getByRole('button', TRIGGER));
    expect(androidOpen.mock.calls[0]?.[0]).toMatchObject({ mode: 'date', value: VALUE });

    pickAndroid(0, new Date(2026, 6, 5, 15, 30));
    expect(androidOpen.mock.calls[1]?.[0]).toMatchObject({ mode: 'time' });

    const picked = new Date(2026, 6, 5, 9, 0);
    pickAndroid(1, picked);

    expect(onChange).toHaveBeenCalledWith(picked);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('시각 대화상자는 상한을 지원하지 않아 미래 시각을 고르면 현재 시각으로 맞춘다', async () => {
    const onChange = jest.fn();
    await render(
      <DateTimeField label="분실 예상 시각" value={VALUE} onChange={onChange} disallowFuture />,
    );

    await fireEvent.press(screen.getByRole('button', TRIGGER));
    expect(androidOpen.mock.calls[0]?.[0]).toMatchObject({ maximumDate: NOW });

    pickAndroid(0, new Date(2026, 6, 6, 16, 0));
    pickAndroid(1, new Date(2026, 6, 6, 23, 0));

    expect(onChange).toHaveBeenCalledWith(NOW);
  });

  it('날짜 대화상자를 닫으면 값을 바꾸지 않고 닫힘만 알린다', async () => {
    const onChange = jest.fn();
    const onClose = jest.fn();
    await render(
      <DateTimeField label="분실 예상 시각" value={VALUE} onChange={onChange} onClose={onClose} />,
    );

    await fireEvent.press(screen.getByRole('button', TRIGGER));
    pickAndroid(0, undefined, 'dismissed');

    expect(androidOpen).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('대화상자가 열려 있는 동안 칸을 펼침 상태로 표시한다', async () => {
    await render(<DateTimeField label="분실 예상 시각" value={VALUE} onChange={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', TRIGGER));

    expect(screen.getByRole('button', { ...TRIGGER, expanded: true })).toBeOnTheScreen();
  });
});

describe('DateTimeField (web)', () => {
  beforeEach(() => setOS('web'));

  it('형식에 맞게 입력하면 그 시각을 넘긴다', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="분실 예상 시각" value={null} onChange={onChange} />);

    await fireEvent.changeText(screen.getByLabelText('분실 예상 시각'), '2026. 07. 05 09:00');

    expect(onChange).toHaveBeenCalledWith(new Date(2026, 6, 5, 9, 0));
  });

  it('형식이 틀리면 값을 넘기지 않고 칸을 벗어날 때 형식을 안내한다', async () => {
    const onChange = jest.fn();
    await render(<DateTimeField label="분실 예상 시각" value={null} onChange={onChange} />);

    const input = screen.getByLabelText('분실 예상 시각');
    await fireEvent.changeText(input, '7월 5일');
    await fireEvent(input, 'blur');

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText('날짜와 시각을 2026. 07. 06 15:30 형식으로 입력해 주세요.'),
    ).toBeOnTheScreen();
  });
});
