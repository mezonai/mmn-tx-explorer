'use client';
import { useCallback, useRef, useState, useEffect } from 'react';

interface UseDebounceFunction<T extends (...args: any[]) => any> {
  fn: T;
  delay?: number;
  startDelay?: number;
  onDebounceStart?: () => void;
  onDebounceEnd?: () => void;
}

export const DEFAULT_DEBOUNCE_TIME = 1000;
export function useDebounceFunction<T extends (...args: any[]) => any>({
  fn,
  delay = DEFAULT_DEBOUNCE_TIME,
  startDelay = 0,
  onDebounceStart,
  onDebounceEnd,
}: UseDebounceFunction<T>) {
  const [isDebouncing, setIsDebouncing] = useState(!!startDelay);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (isDebouncing) {
        return;
      }

      const result = fn(...args);

      setIsDebouncing(true);
      onDebounceStart?.();

      clearTimer();

      debounceTimerRef.current = setTimeout(() => {
        setIsDebouncing(false);
        onDebounceEnd?.();
        debounceTimerRef.current = null;
      }, delay);

      return result;
    },
    [fn, delay, isDebouncing, onDebounceStart, onDebounceEnd, clearTimer]
  );

  useEffect(() => {
    if (startDelay) {
      onDebounceStart?.();
      debounceTimerRef.current = setTimeout(() => {
        setIsDebouncing(false);
        onDebounceEnd?.();
        debounceTimerRef.current = null;
      }, startDelay);
    }
  }, [startDelay, delay, onDebounceStart, onDebounceEnd]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    debouncedFunction,
    isDebouncing,
  };
}
