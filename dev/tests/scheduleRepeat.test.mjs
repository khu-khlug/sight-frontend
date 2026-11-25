import assert from "node:assert/strict";
import test from "node:test";
import { createSchedulesSequentially, getWeeklyDates } from "../../src/features/member/ScheduleContainer/scheduleRepeat.ts";

test("weekly dates include the first date and cross months, leap days and years", () => {
  assert.deepEqual(getWeeklyDates("2024-02-22", 3), ["2024-02-22", "2024-02-29", "2024-03-07"]);
  assert.deepEqual(getWeeklyDates("2026-12-25", 3), ["2026-12-25", "2027-01-01", "2027-01-08"]);
  assert.deepEqual(getWeeklyDates("2026-11-25", 1), ["2026-11-25"]);
  assert.equal(getWeeklyDates("2026-11-25", 52).length, 52);
});

test("invalid dates and counts produce no requests", () => {
  for (const date of ["", "invalid", "2026-02-29", "2026-02-30", "2026-13-01", "2026-1-01", "9999-12-31"]) {
    assert.deepEqual(getWeeklyDates(date, 2), []);
  }
  for (const count of [0, -1, 1.5, 53, NaN, Infinity]) {
    assert.deepEqual(getWeeklyDates("2026-11-25", count), []);
  }
});

test("weekly dates stay the same across time zones and daylight saving changes", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["Asia/Seoul", "America/New_York", "Pacific/Auckland"]) {
      process.env.TZ = zone;
      assert.deepEqual(getWeeklyDates("2026-03-01", 3), ["2026-03-01", "2026-03-08", "2026-03-15"]);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("requests run sequentially and report progress after completion", async () => {
  const dates = getWeeklyDates("2026-11-25", 3);
  const events = [];
  let active = 0;
  const result = await createSchedulesSequentially(dates, async (date) => {
    assert.equal(active++, 0);
    await Promise.resolve();
    events.push(date);
    active -= 1;
  }, (completed) => events.push(completed), () => true);
  assert.deepEqual(result, { completed: 3, remaining: [] });
  assert.deepEqual(events, [dates[0], 1, dates[1], 2, dates[2], 3]);
});

test("failure stops later requests and retry excludes completed dates", async () => {
  const dates = getWeeklyDates("2026-11-25", 4);
  const completed = [];
  const failure = new Error("Reservation conflict");
  const result = await createSchedulesSequentially(dates, async (date) => {
    if (date === dates[1]) throw failure;
    completed.push(date);
  }, () => {}, () => true);
  assert.equal(result.error, failure);
  assert.equal(result.completed, 1);
  assert.deepEqual(result.remaining, dates.slice(1));
  assert.deepEqual(completed, [dates[0]]);
  await createSchedulesSequentially(result.remaining, async (date) => { completed.push(date); }, () => {}, () => true);
  assert.deepEqual(completed, dates);
});

test("first request failure preserves all dates", async () => {
  const dates = getWeeklyDates("2026-11-25", 2);
  const result = await createSchedulesSequentially(dates, async () => { throw new Error("Network error"); }, () => assert.fail("No success expected"), () => true);
  assert.equal(result.completed, 0);
  assert.deepEqual(result.remaining, dates);
});

test("leaving the form stops after the in-flight request", async () => {
  const dates = getWeeklyDates("2026-11-25", 3);
  let mounted = true;
  const result = await createSchedulesSequentially(dates, async () => { mounted = false; }, () => {}, () => mounted);
  assert.deepEqual(result, { completed: 1, remaining: dates.slice(1) });
});
