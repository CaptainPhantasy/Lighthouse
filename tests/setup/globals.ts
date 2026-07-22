import { afterEach } from 'vitest';

/**
 * Zero-dependency browser global shims for vitest node environment.
 * Provides localStorage, sessionStorage, navigator.onLine, window,
 * and minimal DOMException for storage/secureScrub/offlineQueue tests.
 *
 * The storage shims store data as own enumerable string properties on the
 * storage object (matching real browser localStorage) so that `for...in`,
 * `hasOwnProperty`, and bracket access all behave identically.
 */

const METHOD_NAMES = ['length', 'clear', 'getItem', 'key', 'removeItem', 'setItem'];

const memoryStore = (): Storage => {
  const storage: any = {};
  const dataKeys = (): string[] =>
    Object.getOwnPropertyNames(storage).filter(k => !METHOD_NAMES.includes(k));

  Object.defineProperty(storage, 'length', {
    get() {
      return dataKeys().length;
    },
    enumerable: false,
    configurable: true,
  });

  const methods = {
    clear: () => {
      dataKeys().forEach(k => {
        delete storage[k];
      });
    },
    getItem: (key: string) => (key in storage ? storage[key] : null),
    key: (index: number) => dataKeys()[index] ?? null,
    removeItem: (key: string) => {
      delete storage[key];
    },
    setItem: (key: string, value: string) => {
      storage[key] = String(value);
    },
  };

  for (const [name, fn] of Object.entries(methods)) {
    storage[name] = fn;
    Object.defineProperty(storage, name, { enumerable: false, configurable: true, writable: true });
  }

  return storage as Storage;
};

const local = memoryStore();
const session = memoryStore();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
}
if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
}
if (typeof globalThis.navigator === 'undefined' || typeof (globalThis as any).navigator?.onLine === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    configurable: true,
    writable: true,
  });
}
if (typeof globalThis.window === 'undefined') {
  const listeners: Record<string, EventListener[]> = {};
  const eventTarget = {
    addEventListener: (type: string, cb: EventListener) => {
      (listeners[type] ||= []).push(cb);
    },
    removeEventListener: (type: string, cb: EventListener) => {
      listeners[type] = (listeners[type] || []).filter(fn => fn !== cb);
    },
    dispatchEvent: (event: Event) => {
      (listeners[event.type] || []).forEach(cb => cb(event));
      return true;
    },
    indexedDB: undefined,
  };
  Object.defineProperty(globalThis, 'window', { value: eventTarget, configurable: true });
}
if (typeof globalThis.DOMException === 'undefined') {
  (globalThis as any).DOMException = class DOMException extends Error {
    name: string;
    code: number;
    constructor(message: string, name = 'Error') {
      super(message);
      this.name = name;
      this.code = 0;
    }
  };
}

afterEach(() => {
  local.clear();
  session.clear();
});
