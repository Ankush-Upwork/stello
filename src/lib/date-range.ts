/**
 * Date-range helpers for reports & dashboard. All "days" are computed in IST
 * (UTC+5:30, no DST) so "today" matches the shopkeeper's day, then converted to
 * UTC instants for querying `sale_date` (which is stored as timestamptz).
 */

const IST_OFFSET_MIN = 330; // +5:30

function shift(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60000);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

/** UTC instant of IST-midnight for the IST day containing `d`. */
export function istDayStart(d: Date = new Date()): Date {
  const ist = shift(d, IST_OFFSET_MIN);
  const ms = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  return new Date(ms - IST_OFFSET_MIN * 60000);
}

/** Parse a "YYYY-MM-DD" (interpreted as IST) into the UTC instant of its midnight. */
function istDayFromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1) - IST_OFFSET_MIN * 60000);
}

export type RangeKey = "today" | "yesterday" | "week" | "month" | "custom";

export type ResolvedRange = {
  from: Date;
  to: Date; // exclusive upper bound
  key: RangeKey;
  label: string;
};

export const RANGE_PRESETS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

export function resolveRange(params: {
  range?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  const now = new Date();
  const todayStart = istDayStart(now);
  const tomorrow = addDays(todayStart, 1);
  const key = (params.range as RangeKey) || "month";

  switch (key) {
    case "today":
      return { from: todayStart, to: tomorrow, key, label: "Today" };
    case "yesterday":
      return {
        from: addDays(todayStart, -1),
        to: todayStart,
        key,
        label: "Yesterday",
      };
    case "week": {
      const ist = shift(now, IST_OFFSET_MIN);
      const dow = (ist.getUTCDay() + 6) % 7; // Monday = 0
      return {
        from: addDays(todayStart, -dow),
        to: tomorrow,
        key,
        label: "This week",
      };
    }
    case "custom": {
      const from = params.from ? istDayFromYMD(params.from) : todayStart;
      const to = params.to ? addDays(istDayFromYMD(params.to), 1) : tomorrow;
      return { from, to, key, label: "Custom range" };
    }
    case "month":
    default: {
      const ist = shift(now, IST_OFFSET_MIN);
      const ms = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1);
      return {
        from: new Date(ms - IST_OFFSET_MIN * 60000),
        to: tomorrow,
        key: "month",
        label: "This month",
      };
    }
  }
}
