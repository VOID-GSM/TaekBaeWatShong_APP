import { ApiError } from '@taekbae/api';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { useOverdueRanking, type UseOverdueRankingResult } from '@/entities/parcel';
import { useZoneShelves, type UseZoneShelvesResult } from '@/entities/zone';

import { ZonePage } from '../zone-page';

jest.mock('expo-router', () => {
  const router = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: jest.fn() };
  return { useRouter: () => router, router };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/entities/parcel', () => ({
  ...jest.requireActual('@/entities/parcel'),
  useOverdueRanking: jest.fn(),
}));

jest.mock('@/entities/zone', () => ({
  ...jest.requireActual('@/entities/zone'),
  useZoneShelves: jest.fn(),
}));

jest.setTimeout(10_000);

const zoneResult = (overrides: Partial<UseZoneShelvesResult>): UseZoneShelvesResult => ({
  shelves: undefined,
  isPending: false,
  error: null,
  refetch: jest.fn(),
  ...overrides,
});

const rankingResult = (overrides: Partial<UseOverdueRankingResult>): UseOverdueRankingResult => ({
  ranks: undefined,
  isPending: false,
  error: null,
  refetch: jest.fn(),
  ...overrides,
});

describe('ZonePage', () => {
  it('구역별 보관 수와 방치 TOP3를 서버 데이터로 보여준다', async () => {
    jest.mocked(useZoneShelves).mockReturnValue(
      zoneResult({
        shelves: {
          leftShelf: [
            { letter: 'A', count: 3 },
            { letter: 'B', count: 0 },
            { letter: 'C', count: 5 },
          ],
          rightShelf: [
            { letter: 'D', count: 0 },
            { letter: 'E', count: 2 },
            { letter: 'F', count: 0 },
          ],
        },
      }),
    );
    jest.mocked(useOverdueRanking).mockReturnValue(
      rankingResult({
        ranks: [
          {
            rank: 1,
            ownerName: '박서연',
            parcelName: '겨울 패딩',
            zone: 'C',
            overdueFor: '3일 07:12',
          },
        ],
      }),
    );

    await render(<ZonePage />);

    expect(screen.getByText('10개 보관 중')).toBeOnTheScreen();
    expect(screen.getByText('박서연')).toBeOnTheScreen();
    expect(screen.getByText('3일 07:12')).toBeOnTheScreen();
  });

  it('불러오는 중이면 섹션마다 로딩을 보여준다', async () => {
    jest.mocked(useZoneShelves).mockReturnValue(zoneResult({ isPending: true }));
    jest.mocked(useOverdueRanking).mockReturnValue(rankingResult({ isPending: true }));

    await render(<ZonePage />);

    expect(screen.getByLabelText('택배 보관 구역을 불러오는 중')).toBeOnTheScreen();
    expect(screen.getByLabelText('방치 택배 순위를 불러오는 중')).toBeOnTheScreen();
  });

  it('조회에 실패하면 에러 문구를 보여주고 다시 시도할 수 있다', async () => {
    const refetch = jest.fn();
    jest
      .mocked(useZoneShelves)
      .mockReturnValue(
        zoneResult({ error: new ApiError('네트워크 오류가 발생했습니다.'), refetch }),
      );
    jest.mocked(useOverdueRanking).mockReturnValue(rankingResult({ ranks: [] }));

    await render(<ZonePage />);

    expect(screen.getByText('택배 보관 구역을 불러오지 못했어요.')).toBeOnTheScreen();
    expect(screen.getByText('방치된 택배가 없어요.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));
    expect(refetch).toHaveBeenCalled();
  });
});
