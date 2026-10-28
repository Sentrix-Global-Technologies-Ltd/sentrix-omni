/**
 * Detection classifier unit tests.
 * Pure function — no mocks, no providers.
 */
import { describe, it, expect } from "vitest";
import {
  classifyDetection,
  CATEGORY_MAP,
  UNKNOWN_CATEGORY_FALLBACK,
} from "./detectionClassifier";
import type { DetectionCategory } from "./detectionClassifier";

describe("classifyDetection", () => {
  // ── Known types ────────────────────────────────────────────────────────

  it("DC1: classifies 'loitering' as activity", () => {
    expect(classifyDetection("loitering")).toBe("activity");
  });

  it("DC2: classifies 'weapon_detected' as security", () => {
    expect(classifyDetection("weapon_detected")).toBe("security");
  });

  it("DC3: classifies 'intrusion' as security", () => {
    expect(classifyDetection("intrusion")).toBe("security");
  });

  it("DC4: classifies 'perimeter_breach' as security", () => {
    expect(classifyDetection("perimeter_breach")).toBe("security");
  });

  it("DC5: classifies 'vehicle_detected' as vehicle", () => {
    expect(classifyDetection("vehicle_detected")).toBe("vehicle");
  });

  it("DC6: classifies 'person_detected' as person", () => {
    expect(classifyDetection("person_detected")).toBe("person");
  });

  it("DC7: classifies 'face_detected' as person", () => {
    expect(classifyDetection("face_detected")).toBe("person");
  });

  // ── Case insensitivity ─────────────────────────────────────────────────

  it("DC8: is case-insensitive ('LOITERING' → activity)", () => {
    expect(classifyDetection("LOITERING")).toBe("activity");
  });

  it("DC9: trims whitespace ('  intrusion  ' → security)", () => {
    expect(classifyDetection("  intrusion  ")).toBe("security");
  });

  // ── Unknown / fallback ─────────────────────────────────────────────────

  it("DC10: unknown type returns UNKNOWN_CATEGORY_FALLBACK (activity)", () => {
    expect(classifyDetection("something_entirely_new")).toBe(UNKNOWN_CATEGORY_FALLBACK);
    expect(UNKNOWN_CATEGORY_FALLBACK).toBe("activity");
  });

  it("DC11: null returns fallback (activity)", () => {
    expect(classifyDetection(null)).toBe("activity");
  });

  it("DC12: undefined returns fallback", () => {
    expect(classifyDetection(undefined)).toBe("activity");
  });

  it("DC13: empty string returns fallback", () => {
    expect(classifyDetection("")).toBe("activity");
  });

  // ── Mapping completeness ───────────────────────────────────────────────

  it("DC14: every value in CATEGORY_MAP is a valid DetectionCategory", () => {
    const valid: DetectionCategory[] = ["vehicle", "person", "activity", "security"];
    for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
      expect(valid, `${key} → ${cat}`).toContain(cat);
    }
  });

  it("DC15: all four categories are represented in CATEGORY_MAP", () => {
    const cats = new Set(Object.values(CATEGORY_MAP));
    expect(cats.has("vehicle")).toBe(true);
    expect(cats.has("person")).toBe(true);
    expect(cats.has("activity")).toBe(true);
    expect(cats.has("security")).toBe(true);
  });
});
