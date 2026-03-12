import { useCallback, useRef } from 'react';

export interface RetryOptions {
  /** Maximum number of retry attempts before giving up. Default: 3 */
  maxRetries?: number;
  /** Base delay in ms for the first retry. Default: 1000 */
  baseDelay?: number;
  /** Maximum delay cap in ms. Default: 30000 */
  maxDelay?: number;
  /** Called when all retries are exhausted. */
  onGiveUp?: (error: unknown) => void;
}

interface RetryState {
  abortController: AbortController | null;
}

/**
 * Hook providing an exponential-backoff retry wrapper.
 * Returns `execute` (run a fn with retries) and `cancel` (abort in-flight retries).
 */
export function useRetry(options: RetryOptions = {}) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, onGiveUp } = options;
  const stateRef = useRef<RetryState>({ abortController: null });

  const execute = useCallback(
    async <T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
      // Cancel any in-flight retry chain
      stateRef.current.abortController?.abort();
      const controller = new AbortController();
      stateRef.current.abortController = controller;

      let lastError: unknown;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (controller.signal.aborted) return null;

        try {
          const result = await fn(controller.signal);
          return result;
        } catch (err) {
          lastError = err;
          if (controller.signal.aborted) return null;
          if (attempt < maxRetries) {
            const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(resolve, delay);
              controller.signal.addEventListener(
                'abort',
                () => {
                  clearTimeout(timer);
                  reject(new DOMException('Aborted', 'AbortError'));
                },
                { once: true },
              );
            }).catch(() => {
              // Aborted during delay
              return null;
            });
          }
        }
      }

      onGiveUp?.(lastError);
      return null;
    },
    [maxRetries, baseDelay, maxDelay, onGiveUp],
  );

  const cancel = useCallback(() => {
    stateRef.current.abortController?.abort();
    stateRef.current.abortController = null;
  }, []);

  return { execute, cancel };
}
