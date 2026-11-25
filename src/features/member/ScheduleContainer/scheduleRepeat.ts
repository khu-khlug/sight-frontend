export const MAX_WEEKLY_OCCURRENCES = 52;

// 날짜만 UTC 달력으로 계산하고 시간대 변환 없이 API의 로컬 날짜에 붙인다.
export function getWeeklyDates(firstDate: string, count: number): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDate) || !Number.isInteger(count) || count < 1 || count > MAX_WEEKLY_OCCURRENCES) return [];
  const date = new Date(`${firstDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== firstDate) return [];
  const dates: string[] = [];
  for (let index = 0; index < count; index += 1) {
    if (date.getUTCFullYear() > 9999) return [];
    dates.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 7);
  }
  return dates;
}

export async function createSchedulesSequentially(
  dates: string[],
  create: (date: string) => Promise<void>,
  onProgress: (completed: number) => void,
  shouldContinue: () => boolean,
): Promise<{ completed: number; remaining: string[]; error?: unknown }> {
  let completed = 0;
  for (const date of dates) {
    if (!shouldContinue()) return { completed, remaining: dates.slice(completed) };
    try {
      await create(date);
    } catch (error) {
      return { completed, remaining: dates.slice(completed), error };
    }
    completed += 1;
    onProgress(completed);
  }
  return { completed, remaining: [] };
}
