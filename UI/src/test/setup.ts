import '@testing-library/jest-dom/vitest';

// EventSource is not available in jsdom — provide a no-op stub so components
// that transitively use useSseSync don't crash during tests.
if (typeof globalThis.EventSource === 'undefined') {
  class EventSourceStub {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
    addEventListener() {}
    removeEventListener() {}
    close() {}
    set onerror(_fn: unknown) {}
  }
  globalThis.EventSource = EventSourceStub as unknown as typeof EventSource;
}
