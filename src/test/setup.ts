import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Keep tests isolated: unmount React trees and clear the bearer-token store.
afterEach(() => {
  cleanup();
  try {
    sessionStorage.clear();
  } catch {
    // jsdom always provides sessionStorage; ignore if not.
  }
});
