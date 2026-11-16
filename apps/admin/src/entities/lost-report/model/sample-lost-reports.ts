import type { LostReport } from './lost-report';

// TODO: 분실 신고 API 가 생기면 쿼리 훅으로 바꾸고 지운다. 값은 Figma 시안(A7)과 같다.
export const sampleLostReports: LostReport[] = [
  {
    id: 1,
    status: 'new',
    reporter: { name: '김민준', role: 'STUDENT', studentNumber: '20614' },
    productName: '겨울 패딩',
    carrier: 'CJ대한통운',
    trackingNumber: '604122378890',
    lostAt: '2026-07-06T15:30:00+09:00',
    content: '어제 오후 C구역에 도착 알림을 받았는데, 오늘 찾으러 가니 택배가 보이지 않습니다.',
  },
  {
    id: 2,
    status: 'chatRequested',
    reporter: { name: '이선생님', role: 'TEACHER' },
    productName: '교재 세트',
    carrier: '롯데택배',
    trackingNumber: '772099450031',
    lostAt: '2026-07-07T10:10:00+09:00',
    content: '도착 알림은 왔는데 구역에서 확인이 되지 않아요. 확인 부탁드립니다.',
  },
];
