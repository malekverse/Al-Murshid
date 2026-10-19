// The khatmah plan (SPEC 5.5): read the mushaf, or a stretch of it, by a chosen date or at a
// steady pace. Today's portion holds still while reading. When reading falls behind, the plan
// quietly recalculates; it never shows anything as owed.

import { addDays, daysBetween, isoDate, parseIsoDate, type CivilDate } from './time';

export const MUSHAF_PAGES = 604;

export type KhatmahGoal =
  { kind: 'date'; finishOn: string } | { kind: 'pace'; pagesPerDay: number };

export interface KhatmahPlan {
  startedOn: string;
  goal: KhatmahGoal;
  fromPage: number;
  toPage: number;
  /** The next page to read. */
  page: number;
  /** Where today's reading began, so today's portion holds still as pages are read. */
  today: { date: string; page: number };
  /** The pace the plan began with. Catching up never asks for more than twice this. */
  basePace: number;
}

export interface KhatmahDay {
  /** Today's portion, first to last page. */
  from: number;
  to: number;
  /** Pages of today's portion already read. */
  readToday: number;
  /** Pages a day the plan now asks for. */
  pace: number;
  /** When the plan finishes at this pace. */
  finishOn: CivilDate;
  /** Share of the plan read, from 0 to 1. */
  progress: number;
  done: boolean;
}

const pagesIn = (from: number, to: number) => to - from + 1;

export function startKhatmah(
  goal: KhatmahGoal,
  today: CivilDate,
  fromPage = 1,
  toPage = MUSHAF_PAGES,
): KhatmahPlan {
  if (fromPage < 1 || toPage > MUSHAF_PAGES || fromPage > toPage) {
    throw new RangeError(`Pages ${fromPage} to ${toPage} are not a stretch of the mushaf`);
  }
  const pages = pagesIn(fromPage, toPage);
  let basePace: number;
  if (goal.kind === 'pace') {
    if (!Number.isInteger(goal.pagesPerDay) || goal.pagesPerDay < 1) {
      throw new RangeError('A plan reads at least one page a day');
    }
    basePace = goal.pagesPerDay;
  } else {
    const days = daysBetween(today, parseIsoDate(goal.finishOn)) + 1;
    if (days < 1) throw new RangeError('A plan finishes today or later');
    basePace = Math.ceil(pages / days);
  }
  const date = isoDate(today);
  return {
    startedOn: date,
    goal,
    fromPage,
    toPage,
    page: fromPage,
    today: { date, page: fromPage },
    basePace,
  };
}

/** Today's portion and where the plan stands. */
export function khatmahDay(plan: KhatmahPlan, today: CivilDate): KhatmahDay {
  const total = pagesIn(plan.fromPage, plan.toPage);
  const progress = Math.min(1, Math.max(0, (plan.page - plan.fromPage) / total));
  const start = plan.today.date === isoDate(today) ? plan.today.page : plan.page;
  const remaining = plan.toPage - start + 1;
  if (plan.page > plan.toPage && remaining <= 0) {
    return {
      from: plan.toPage,
      to: plan.toPage,
      readToday: 0,
      pace: 0,
      finishOn: today,
      progress: 1,
      done: true,
    };
  }

  let pace = plan.basePace;
  if (plan.goal.kind === 'date') {
    const daysLeft = daysBetween(today, parseIsoDate(plan.goal.finishOn)) + 1;
    // Behind, or past the date: ask a little more each day, never more than twice the start,
    // and let the finish move instead.
    if (daysLeft >= 1) pace = Math.min(Math.ceil(remaining / daysLeft), plan.basePace * 2);
  }
  pace = Math.max(1, pace);
  const to = Math.min(plan.toPage, start + pace - 1);
  return {
    from: start,
    to,
    readToday: Math.min(pagesIn(start, to), Math.max(0, plan.page - start)),
    pace,
    finishOn: addDays(today, Math.ceil(remaining / pace) - 1),
    progress,
    done: plan.page > plan.toPage,
  };
}

/** Records reading through a page (inclusive). Reading never moves the plan backwards. */
export function readThrough(plan: KhatmahPlan, lastPage: number, today: CivilDate): KhatmahPlan {
  const date = isoDate(today);
  const dayStart = plan.today.date === date ? plan.today : { date, page: plan.page };
  const page = Math.max(plan.page, Math.min(plan.toPage + 1, lastPage + 1));
  return { ...plan, page, today: dayStart };
}
