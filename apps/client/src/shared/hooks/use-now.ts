import { useEffect, useState } from 'react';

/** 현재 시각을 `intervalMs` 마다 갱신한다. `enabled` 가 false 면 멈춘다(보여 줄 목록이 없을 때 등). */
export function useNow(intervalMs = 1000, enabled = true): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, enabled]);

  return now;
}
