import "@testing-library/jest-dom/vitest";

// This setup file runs for every test, including node-environment tests (e.g.
// scripts/migrations.test.ts) that have no DOM. Guard DOM-only globals so those
// tests are not broken by `window` being undefined.
const hasDom = typeof window !== "undefined";

if (hasDom) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    }),
  });
}

class TestResizeObserver {
  disconnect() {
    return undefined;
  }

  observe() {
    return undefined;
  }

  unobserve() {
    return undefined;
  }
}

if (hasDom) {
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: TestResizeObserver,
  });
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: TestResizeObserver,
});
