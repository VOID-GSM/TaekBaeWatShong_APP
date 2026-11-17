import { render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { opacity } from '../../theme';
import { Button } from '../button';

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  useReducedMotion: jest.fn(),
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

describe('Button', () => {
  it.each([false, true])(
    '동작 줄이기(%s)와 관계없이 로딩 중인 버튼은 흐려진다',
    async (reduceMotion) => {
      jest.mocked(useReducedMotion).mockReturnValue(reduceMotion);
      await render(<Button label="저장" loading />);

      expect(screen.getByRole('button', { name: '저장' })).toHaveStyle({
        opacity: opacity.disabled,
      });
    },
  );
});
