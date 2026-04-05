const CT_TIMEZONE = "America/Chicago";
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 17;
const MINUTES_PER_BD = 480; // 8 hours * 60 minutes

/**
 * Extract hour and minute in CT (America/Chicago) from a UTC Date.
 */
function getCTComponents(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number;
} {
  // Use Intl to get CT components without external deps
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CT_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const weekdayStr = get("weekday");
  const dayOfWeekMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hour: parseInt(get("hour"), 10),
    minute: parseInt(get("minute"), 10),
    dayOfWeek: (() => {
      const dow = dayOfWeekMap[weekdayStr];
      if (dow === undefined)
        throw new Error(`Unexpected weekday: ${weekdayStr}`);
      return dow;
    })(),
  };
}

/**
 * Check if a given day-of-week is a business day (Mon-Fri).
 */
function isBusinessDay(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Convert a CT calendar date + time to a UTC Date object.
 * Uses Intl round-trip: format a known UTC instant in CT, compare, and adjust.
 * This correctly handles DST gaps and overlaps.
 */
function ctCalendarDateToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  // Start with a rough UTC guess (CT is UTC-5 or UTC-6)
  const guess = new Date(Date.UTC(year, month - 1, day, hour + 6, minute));
  const ct = getCTComponents(guess);
  // Adjust by the difference between desired CT time and actual CT time
  const diffMs =
    ((hour - ct.hour) * 60 + (minute - ct.minute)) * 60 * 1000 +
    (day - ct.day) * 24 * 60 * 60 * 1000;
  return new Date(guess.getTime() + diffMs);
}

/**
 * Calculate the number of business minutes in a single day between
 * two CT times (expressed as fractional hours from midnight).
 */
function businessMinutesInDay(
  startMinuteOfDay: number,
  endMinuteOfDay: number,
): number {
  const bizStart = BUSINESS_START_HOUR * 60;
  const bizEnd = BUSINESS_END_HOUR * 60;

  const clampedStart = Math.max(startMinuteOfDay, bizStart);
  const clampedEnd = Math.min(endMinuteOfDay, bizEnd);

  return Math.max(0, clampedEnd - clampedStart);
}

/**
 * Calculate fractional business days between two timestamps.
 *
 * Business hours: 9:00 AM - 5:00 PM CT (America/Chicago), Monday-Friday.
 * 1 business day = 8 business hours = 480 minutes.
 *
 * Times before 9 AM are clamped to 9 AM. Times after 5 PM are clamped to 5 PM.
 * Weekends contribute 0 business minutes.
 *
 * @param from - Start timestamp (UTC)
 * @param to - End timestamp (UTC)
 * @returns Fractional business days (never negative)
 */
export function businessDaysExact(from: Date, to: Date): number {
  if (to.getTime() <= from.getTime()) {
    return 0;
  }

  let totalMinutes = 0;

  // Get CT calendar date components for from and to
  const fromCT = getCTComponents(from);
  const toCT = getCTComponents(to);

  // Iterate by CT calendar date to avoid DST cursor drift.
  // Start at from's CT date and increment day-by-day until we pass to's CT date.
  let curYear = fromCT.year;
  let curMonth = fromCT.month;
  let curDay = fromCT.day;

  // Cap iterations to prevent infinite loops
  const maxDays =
    Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 2;

  for (let i = 0; i < maxDays; i++) {
    // Build a noon CT Date for this calendar day to reliably get weekday.
    // Noon avoids landing in the DST gap or ambiguous hour.
    const probeDate = ctCalendarDateToUTC(curYear, curMonth, curDay, 12, 0);
    const probeCT = getCTComponents(probeDate);

    if (isBusinessDay(probeCT.dayOfWeek)) {
      const isSameDayAsFrom =
        curYear === fromCT.year &&
        curMonth === fromCT.month &&
        curDay === fromCT.day;

      const isSameDayAsTo =
        curYear === toCT.year &&
        curMonth === toCT.month &&
        curDay === toCT.day;

      const dayStartMinute = isSameDayAsFrom
        ? fromCT.hour * 60 + fromCT.minute
        : 0;

      const dayEndMinute = isSameDayAsTo
        ? toCT.hour * 60 + toCT.minute
        : 24 * 60;

      totalMinutes += businessMinutesInDay(dayStartMinute, dayEndMinute);
    }

    // Stop if we've reached or passed to's CT calendar day
    if (
      curYear > toCT.year ||
      (curYear === toCT.year && curMonth > toCT.month) ||
      (curYear === toCT.year && curMonth === toCT.month && curDay >= toCT.day)
    ) {
      break;
    }

    // Advance to next calendar day
    const next = new Date(Date.UTC(curYear, curMonth - 1, curDay + 1));
    curYear = next.getUTCFullYear();
    curMonth = next.getUTCMonth() + 1;
    curDay = next.getUTCDate();
  }

  return totalMinutes / MINUTES_PER_BD;
}
