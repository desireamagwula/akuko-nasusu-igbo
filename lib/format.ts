/**
 * Publish dates are editorial dates picked in the admin. They are stored as
 * noon UTC on the chosen day and always displayed in UTC, so a reader in
 * Lagos and an editor in London see the same calendar day.
 */
const long = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const short = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const formatDate = (ms: number) => long.format(ms);
export const formatDateShort = (ms: number) => short.format(ms);
export const isoDate = (ms: number) => new Date(ms).toISOString();

/** "2026-09-18" for <input type="date"> */
export const toDateInput = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const fromDateInput = (value: string) => Date.parse(`${value}T12:00:00Z`);

/** Today's calendar date (local) as noon UTC. */
export function todayAsEditorialDate() {
  const now = new Date();
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return fromDateInput(local);
}

/** True when the article was edited on a later day than it was published. */
export function wasUpdated(publishedAt: number, updatedAt: number) {
  return toDateInput(updatedAt) > toDateInput(publishedAt);
}
