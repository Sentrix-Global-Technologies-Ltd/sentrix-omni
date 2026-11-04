/**
 * ASC-1  Renders label, value, sub line and the accent bar.
 * ASC-2  Short values keep the base size; longer ones step down.
 * ASC-3  Very long values get the smallest size and the full text stays in the title.
 * ASC-4  Loading shows a skeleton instead of the value.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AccentStatCard from "./AccentStatCard";
import { valueSizeClass } from "./fitText";

describe("AccentStatCard", () => {
  it("ASC-1 renders label, value, sub and accent", () => {
    const { container } = render(<AccentStatCard label="Paying" value={12} sub="On a paid plan" accent="success" />);
    expect(screen.getByText("Paying")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("On a paid plan")).toBeInTheDocument();
    expect(container.querySelector(".ic-stat-accent--success")).not.toBeNull();
  });

  it("ASC-2 steps the size down as the text grows", () => {
    expect(valueSizeClass("1,234")).not.toMatch(/--(md|sm|xs)/);
    expect(valueSizeClass("NGN 5,000")).toMatch(/--md/);
    expect(valueSizeClass("NGN 537,500.00")).toMatch(/--sm/);
    expect(valueSizeClass("NGN 5,375,053.74")).toMatch(/--sm/);
  });

  it("ASC-3 very long values use the smallest size and keep the full text", () => {
    const long = "NGN 5,375,053.74 · USD 1,234,567.89 · KES 99,999,999.00";
    expect(valueSizeClass(long)).toMatch(/--xs/);
    render(<AccentStatCard label="Revenue" value={long} accent="success" />);
    const el = screen.getByTitle(long);
    expect(el.className).toMatch(/ic-stat-value--fit/);
  });

  it("ASC-4 loading shows a skeleton", () => {
    render(<AccentStatCard label="Paying" value={5} accent="success" loading />);
    expect(screen.queryByText("5")).toBeNull();
    expect(screen.getByLabelText("Loading…")).toBeInTheDocument();
  });
});
