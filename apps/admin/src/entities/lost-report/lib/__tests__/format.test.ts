import { getLostReportState } from '../../model/lost-report';
import { formatLostAt, formatReporter, formatWaybill } from '../format';

describe('formatReporter', () => {
  it('학생은 학번, 선생님은 "선생님"을 이름 뒤에 붙인다', () => {
    expect(formatReporter({ reporterName: '김민준', studentNumber: '20614' })).toBe(
      '김민준 · 20614',
    );
    expect(formatReporter({ reporterName: '이선생님', reporterRole: 'TEACHER' })).toBe(
      '이선생님 · 선생님',
    );
  });

  it('학번·역할이 없으면 이름만 보여준다', () => {
    expect(formatReporter({ reporterName: '김민준', studentNumber: null })).toBe('김민준');
  });
});

describe('formatWaybill', () => {
  it('택배사와 4자리씩 띄운 운송장 번호를 보여준다', () => {
    expect(formatWaybill({ deliveryCompany: 'CJ대한통운', invoiceNumber: '604122378890' })).toBe(
      'CJ대한통운 · 6041 2237 8890',
    );
  });

  it('택배사가 없으면 운송장 번호만 보여준다', () => {
    expect(formatWaybill({ invoiceNumber: '604122378890' })).toBe('6041 2237 8890');
  });
});

describe('formatLostAt', () => {
  it('서버 시각을 yyyy.MM.dd HH:mm 으로 보여준다', () => {
    expect(formatLostAt('2026-07-06T15:30:00')).toBe('2026.07.06 15:30');
  });
});

describe('getLostReportState', () => {
  it.each([
    [{ progress: 'RECEIVED', chatRoomId: null }, 'new'],
    [{ progress: 'IN_PROGRESS', chatRoomId: undefined }, 'new'],
    [{ progress: 'IN_PROGRESS', chatRoomId: 7 }, 'chatRequested'],
    [{ progress: 'DONE', chatRoomId: 7 }, 'done'],
  ] as const)('%o → %s', (report, state) => {
    expect(getLostReportState(report)).toBe(state);
  });
});
