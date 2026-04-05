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
    dayOfWeek: dayOfWeekMap[weekdayStr] ?? 0,
  };
}

/**
 * Check if a given day-of-week is a business day (Mon-Fri).
 */
function isBusinessDay(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
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

  // Iterate day by day from `from` to `to` in CT
  // We need to walk through each calendar day in CT that the range spans
  const fromCT = getCTComponents(from);
  const toCT = getCTComponents(to);

  // Create a cursor that starts at the beginning of `from`'s CT day
  // We'll iterate through each calendar day
  // Use a millisecond cursor starting at midnight CT of `from`'s day

  // Get midnight CT of the from-date by constructing a date string
  // and using the timezone offset approach
  let cursor = new Date(from.getTime());

  // Walk day by day
  // To avoid infinite loops, cap at a reasonable number of iterations
  const maxDays = Math.ceil(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  ) + 2;

  for (let i = 0; i < maxDays; i++) {
    const cursorCT = getCTComponents(cursor);

    if (isBusinessDay(cursorCT.dayOfWeek)) {
      // Determine the start minute-of-day for this calendar day
      let dayStartMinute: number;
      let dayEndMinute: number;

      // Check if this is the same CT calendar day as `from`
      const isSameDayAsFrom =
        cursorCT.year === fromCT.year &&
        cursorCT.month === fromCT.month &&
        cursorCT.day === fromCT.day;

      // Check if this is the same CT calendar day as `to`
      const isSameDayAsTo =
        cursorCT.year === toCT.year &&
        cursorCT.month === toCT.month &&
        cursorCT.day === toCT.day;

      if (isSameDayAsFrom) {
        dayStartMinute = cursorCT.hour * 60 + cursorCT.minute;
      } else {
        dayStartMinute = 0; // Full day from start of business
      }

      if (isSameDayAsTo) {
        dayEndMinute = toCT.hour * 60 + toCT.minute;
      } else {
        dayEndMinute = 24 * 60; // Full day to end of business
      }

      totalMinutes += businessMinutesInDay(dayStartMinute, dayEndMinute);
    }

    // Advance cursor to next CT calendar day
    // Move forward ~24h, but we need to land on the next calendar day in CT
    // Add 24 hours and then check if we've passed `to`
    const nextCursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    const nextCT = getCTComponents(nextCursor);

    // If adding 24h didn't change the day (DST edge), add another hour
    if (nextCT.day === cursorCT.day && nextCT.month === cursorCT.month) {
      cursor = new Date(nextCursor.getTime() + 60 * 60 * 1000);
    } else {
      cursor = nextCursor;
    }

    // Check if cursor's CT day is past `to`'s CT day
    const updatedCT = getCTComponents(cursor);
    if (
      updatedCT.year > toCT.year ||
      (updatedCT.year === toCT.year && updatedCT.month > toCT.month) ||
      (updatedCT.year === toCT.year &&
        updatedCT.month === toCT.month &&
        updatedCT.day > toCT.day)
    ) {
      break;
    }
  }

  return totalMinutes / MINUTES_PER_BD;
}
