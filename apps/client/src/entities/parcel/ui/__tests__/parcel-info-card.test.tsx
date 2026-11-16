import { render, screen } from '@testing-library/react-native';

import { ParcelInfoCard } from '../parcel-info-card';

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

describe('ParcelInfoCard', () => {
  it('라벨·별칭과 택배사 · 4자리씩 띄운 운송장 번호를 보여준다', async () => {
    await render(
      <ParcelInfoCard
        label="신고 대상 택배"
        alias="겨울 패딩"
        deliveryCompany="CJ대한통운"
        invoiceNumber="604122378890"
      />,
    );

    expect(screen.getByText('신고 대상 택배')).toBeOnTheScreen();
    expect(screen.getByText('겨울 패딩')).toBeOnTheScreen();
    expect(screen.getByText('CJ대한통운 · 6041 2237 8890')).toBeOnTheScreen();
  });

  it('스크린 리더에는 카드 내용을 한 번에 읽어 준다', async () => {
    await render(
      <ParcelInfoCard
        label="신고 대상 택배"
        alias="겨울 패딩"
        deliveryCompany="CJ대한통운"
        invoiceNumber="604122378890"
      />,
    );

    expect(
      screen.getByLabelText('신고 대상 택배, 겨울 패딩, CJ대한통운 운송장 번호 6041 2237 8890'),
    ).toBeOnTheScreen();
  });
});
