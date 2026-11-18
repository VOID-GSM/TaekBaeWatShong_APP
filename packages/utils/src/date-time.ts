const pad = (value: number) => String(value).padStart(2, '0');

/** 기기 로컬 시각을 입력 칸 표시 형식(`2026. 07. 06 15:30`)으로 만든다. */
export function formatDateTimeInput(date: Date): string {
  return (
    `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** 기기 로컬 시각을 서버 `LocalDateTime` 문자열(`2026-07-06T15:30:00`)로 만든다. 초는 버린다. */
export function formatLocalDateTime(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

const DATE_TIME_INPUT_PATTERN = /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\s+(\d{1,2}):(\d{2})$/;

/** 입력받는 가장 이른 연도. `Date` 는 0–99 년을 1900+year 로 해석하므로 그보다 크게 잡는다. */
const MIN_YEAR = 2000;

/**
 * 입력 칸 형식(`2026. 07. 06 15:30`)을 서버 `LocalDateTime` 문자열(`2026-07-06T15:30:00`)로 바꾼다.
 * 형식이 다르거나, 실제로 없는 날짜·시각(2월 30일, 24시 등)이거나, 2000년 이전이면 `null`.
 */
export function parseDateTimeInput(text: string): string | null {
  const match = DATE_TIME_INPUT_PATTERN.exec(text.trim());
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  if (year < MIN_YEAR || month < 1 || month > 12 || hour > 23 || minute > 59) return null;

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;

  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
}

/**
 * 오프셋 없는 `LocalDateTime` 문자열(`2026-07-06T15:30:00[.SSS]`)을 기기 로컬 시각 `Date` 로 바꾼다.
 * 형식이 다르면 `null`.
 */
export function localDateTimeToDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part ?? 0));
  return new Date(year ?? 0, (month ?? 1) - 1, day, hour, minute, second);
}

/** 기기 로컬 시각을 목록용 짧은 형식(`07.07 10:10`)으로 만든다. */
export function formatMonthDayTime(date: Date): string {
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 경과 시간(ms)을 `HH:MM:SS` 로 만든다. 음수(기기 시계가 서버보다 느린 경우)는 0 으로 본다. 100시간 이상이면 시 자리가 늘어난다. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(total % 60)}`;
}
