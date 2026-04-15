import { describe, expect, it } from "vitest";
import {
  getLocationCode,
  getLocationCodeForDMA,
  resolveDataForSeoLocationHint,
  USA_LOCATION_CODE,
} from "./locations.js";

describe("dataforseo locations", () => {
  it("resolves minneapolis hint to metro code", () => {
    expect(resolveDataForSeoLocationHint("minneapolis")).toBe(1020819);
  });

  it("resolves city+state", () => {
    expect(getLocationCode("Phoenix", "AZ")).toBe(1012728);
  });

  it("resolves Nielsen DMA 527", () => {
    expect(getLocationCodeForDMA("527")).toBe(1020819);
  });

  it("falls back to USA", () => {
    expect(getLocationCode(undefined, undefined)).toBe(USA_LOCATION_CODE);
  });
});
