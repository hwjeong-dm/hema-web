import { useRef, useCallback } from 'react';

export function useResponseTimer() {
  const startRef = useRef<number | null>(null);

  const start = useCallback(() => {
    startRef.current = performance.now();
  }, []);

  const stop = useCallback((): number => {
    if (startRef.current === null) return 0;
    const elapsed = (performance.now() - startRef.current) / 1000;
    startRef.current = null;
    return parseFloat(elapsed.toFixed(3));
  }, []);

  return { start, stop };
}

export function useCountdown(durationMs: number, tickMs = 10) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((
    onTick: (remaining: number) => void,
    onFinish: () => void
  ) => {
    let remaining = durationMs;
    timerRef.current = setInterval(() => {
      remaining -= tickMs;
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        onTick(0);
        onFinish();
      } else {
        onTick(remaining);
      }
    }, tickMs);
  }, [durationMs, tickMs]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { start, cancel };
}
