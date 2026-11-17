import { sampleLostReports } from '../../model/sample-lost-reports';
import { formatLostAt, formatReporter, formatWaybill } from '../format';

const [studentReport, teacherReport] = sampleLostReports;

describe('lost report format', () => {
  it('학생은 학번, 선생님은 "선생님"을 이름 뒤에 붙인다', () => {
    expect(formatReporter(studentReport!.reporter)).toBe('김민준 · 20614');
    expect(formatReporter(teacherReport!.reporter)).toBe('이선생님 · 선생님');
  });

  it('운송장 번호를 4자리씩 띄운다', () => {
    expect(formatWaybill(studentReport!)).toBe('CJ대한통운 · 6041 2237 8890');
  });

  it('분실 예상 시각을 yyyy.MM.dd HH:mm 으로 보여준다', () => {
    expect(formatLostAt(new Date(2026, 6, 6, 15, 30).toISOString())).toBe('2026.07.06 15:30');
  });
});
