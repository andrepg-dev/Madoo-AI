import assert from "node:assert/strict";
import { test } from "node:test";
import { PLAN_LIMITS } from "@madoo/shared";
import {
  addUtcDays,
  addUtcMonths,
  buildCreditUsage,
  currentPeriodStart,
  startOfUtcDay,
} from "./credit-window";

test("startOfUtcDay truncates to 00:00 UTC", () => {
  const d = new Date("2026-06-17T15:42:09.123Z");
  assert.equal(startOfUtcDay(d).toISOString(), "2026-06-17T00:00:00.000Z");
});

test("addUtcDays rolls across month boundary", () => {
  const d = new Date("2026-06-30T00:00:00.000Z");
  assert.equal(addUtcDays(d, 1).toISOString(), "2026-07-01T00:00:00.000Z");
});

test("addUtcMonths rolls across year boundary", () => {
  const d = new Date("2026-12-15T00:00:00.000Z");
  assert.equal(addUtcMonths(d, 1).toISOString(), "2027-01-15T00:00:00.000Z");
});

test("currentPeriodStart returns anchor inside the first month", () => {
  const anchor = new Date("2026-06-01T00:00:00.000Z");
  const now = new Date("2026-06-20T12:00:00.000Z");
  assert.equal(currentPeriodStart(anchor, now).toISOString(), anchor.toISOString());
});

test("currentPeriodStart rolls forward whole months from the anchor", () => {
  const anchor = new Date("2026-01-10T00:00:00.000Z");
  // ~5 months and change later -> window started 2026-06-10.
  const now = new Date("2026-06-25T00:00:00.000Z");
  assert.equal(
    currentPeriodStart(anchor, now).toISOString(),
    "2026-06-10T00:00:00.000Z",
  );
});

test("currentPeriodStart resets to the anchor day each month (upgrade anchor)", () => {
  const anchor = new Date("2026-06-17T09:30:00.000Z");
  // Exactly one month + 1s later -> new window begins at the anchor instant.
  const now = new Date("2026-07-17T09:30:01.000Z");
  assert.equal(
    currentPeriodStart(anchor, now).toISOString(),
    "2026-07-17T09:30:00.000Z",
  );
});

test("currentPeriodStart returns future anchor unchanged (clock skew)", () => {
  const anchor = new Date("2026-08-01T00:00:00.000Z");
  const now = new Date("2026-06-01T00:00:00.000Z");
  assert.equal(currentPeriodStart(anchor, now).toISOString(), anchor.toISOString());
});

test("buildCreditUsage computes remaining for a capped plan", () => {
  const resets = new Date("2026-07-01T00:00:00.000Z");
  assert.deepEqual(buildCreditUsage(3, 5, resets), {
    used: 3,
    limit: 5,
    remaining: 2,
    resetsAt: "2026-07-01T00:00:00.000Z",
  });
});

test("buildCreditUsage clamps remaining at 0 when over the cap", () => {
  const resets = new Date("2026-07-01T00:00:00.000Z");
  assert.equal(buildCreditUsage(7, 5, resets).remaining, 0);
});

test("buildCreditUsage reports -1 remaining for unlimited", () => {
  const resets = new Date("2026-07-01T00:00:00.000Z");
  assert.equal(buildCreditUsage(120, -1, resets).remaining, -1);
});

test("PLAN_LIMITS match the agreed daily/monthly caps", () => {
  assert.deepEqual(PLAN_LIMITS.FREE, {
    aiGenerations: 30,
    dailyAiGenerations: 5,
    workspaces: 1,
  });
  assert.deepEqual(PLAN_LIMITS.STARTER, {
    aiGenerations: 100,
    dailyAiGenerations: 15,
    workspaces: 5,
  });
  assert.deepEqual(PLAN_LIMITS.GROWTH, {
    aiGenerations: 250,
    dailyAiGenerations: 25,
    workspaces: 15,
  });
  assert.deepEqual(PLAN_LIMITS.PRO, {
    aiGenerations: 550,
    dailyAiGenerations: 50,
    workspaces: -1,
  });
});
