import { describe, it, expect } from "vitest";
import { businessDaysExact } from "./business-days-exact.js";

/**
 * All test dates use May 2026 (CDT = UTC-5).
 * 9 AM CT = 14:00 UTC, 5 PM CT = 22:00 UTC.
 * May 4, 2026 = Monday.
 */

function utc(year: number, month: number, day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

describe("businessDaysExact", () => {
  it("Monday 9 AM to Tuesday 9 AM = 1.0 BD", () => {
    const from = utc(2026, 5, 4, 14, 0); // Mon 9 AM CT
    const to = utc(2026, 5, 5, 14, 0);   // Tue 9 AM CT
    expect(businessDaysExact(from, to)).toBeCloseTo(1.0, 4);
  });

  it("Monday 9 AM to Friday 5 PM = 5.0 BD", () => {
    const from = utc(2026, 5, 4, 14, 0);  // Mon 9 AM CT
    const to = utc(2026, 5, 8, 22, 0);    // Fri 5 PM CT
    expect(businessDaysExact(from, to)).toBeCloseTo(5.0, 4);
  });

  it("Monday 4:59 PM to Monday 5:00 PM = 1/480 BD (~0.0021)", () => {
    const from = utc(2026, 5, 4, 21, 59); // Mon 4:59 PM CT
    const to = utc(2026, 5, 4, 22, 0);    // Mon 5:00 PM CT
    expect(businessDaysExact(from, to)).toBeCloseTo(1 / 480, 4);
  });

  it("Monday 9 AM to Monday 1 PM = 0.5 BD", () => {
    const from = utc(2026, 5, 4, 14, 0);  // Mon 9 AM CT
    const to = utc(2026, 5, 4, 18, 0);    // Mon 1 PM CT
    expect(businessDaysExact(from, to)).toBeCloseTo(0.5, 4);
  });

  it("Friday 5 PM to Monday 9 AM = 0.0 BD (weekend)", () => {
    const from = utc(2026, 5, 8, 22, 0);  // Fri 5 PM CT
    const to = utc(2026, 5, 11, 14, 0);   // Mon 9 AM CT
    expect(businessDaysExact(from, to)).toBeCloseTo(0.0, 4);
  });

  it("Friday 3 PM to Monday 11 AM = 0.5 BD (2h Fri + 2h Mon)", () => {
    const from = utc(2026, 5, 8, 20, 0);  // Fri 3 PM CT
    const to = utc(2026, 5, 11, 16, 0);   // Mon 11 AM CT
    expect(businessDaysExact(from, to)).toBeCloseTo(0.5, 4);
  });

  it("Monday 7 AM to Monday 5 PM = 1.0 BD (clamps to 9 AM)", () => {
    const from = utc(2026, 5, 4, 12, 0);  // Mon 7 AM CT
    const to = utc(2026, 5, 4, 22, 0);    // Mon 5 PM CT
    expect(businessDaysExact(from, to)).toBeCloseTo(1.0, 4);
  });

  it("Monday 6 PM to Tuesday 9 AM = 0.0 BD (after hours)", () => {
    const from = utc(2026, 5, 4, 23, 0);  // Mon 6 PM CT
    const to = utc(2026, 5, 5, 14, 0);    // Tue 9 AM CT
    expect(businessDaysExact(from, to)).toBeCloseTo(0.0, 4);
  });

  it("same timestamp = 0.0 BD", () => {
    const ts = utc(2026, 5, 4, 16, 0);
    expect(businessDaysExact(ts, ts)).toBeCloseTo(0.0, 4);
  });

  it("to before from = 0.0 BD (no negative)", () => {
    const from = utc(2026, 5, 5, 14, 0);
    const to = utc(2026, 5, 4, 14, 0);
    expect(businessDaysExact(from, to)).toBeCloseTo(0.0, 4);
  });

  it("countdown: Mon noon to Fri 5 PM = 4.625 BD", () => {
    const from = utc(2026, 5, 4, 17, 0);  // Mon 12 PM CT (noon)
    const to = utc(2026, 5, 8, 22, 0);    // Fri 5 PM CT
    // Mon: 5h, Tue-Fri: 4 * 8h = 32h => total 37h = 37/8 = 4.625
    expect(businessDaysExact(from, to)).toBeCloseTo(4.625, 4);
  });
});
