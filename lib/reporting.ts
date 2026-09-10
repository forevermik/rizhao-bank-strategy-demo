import { Standard, targetFor } from './data';
export type Report = {
  value: number | null;
  text: string;
  progress: number | null;
  note: string;
  updatedAt: string;
  departmentId: string;
};
export type Reports = Record<string, Report>;
export const reportKey = (id: string, year: number, departmentId: string) =>
  `${id}:${year}:${departmentId}`;
export function reportProgress(
  s: Standard,
  r: Report | undefined,
  year: number,
): number | null {
  if (!r) return null;
  const target = targetFor(s, year) ?? s.finalTargetValue;
  if (
    s.type === 'metric' &&
    r.value !== null &&
    typeof target === 'number' &&
    target > 0
  ) {
    return s.achievementMode === 'atMost'
      ? r.value <= target
        ? 100
        : Math.round((target / r.value) * 100)
      : Math.round((r.value / target) * 100);
  }
  return r.progress;
}
export function parseReport(
  input: { value: string; text: string; progress: string; note: string },
  metric: boolean,
  departmentId: string,
): Report {
  const value = input.value.trim() === '' ? null : Number(input.value),
    progress = input.progress.trim() === '' ? null : Number(input.progress);
  if (value !== null && (!Number.isFinite(value) || value < 0))
    throw Error('完成值必须是大于或等于 0 的数字。');
  if (
    progress !== null &&
    (!Number.isFinite(progress) || progress < 0 || progress > 100)
  )
    throw Error('进度应在 0—100 之间。');
  if (metric && value === null) throw Error('请填写当前完成值。');
  if (!metric && !input.text.trim()) throw Error('请填写完成情况。');
  if (!metric && progress === null) throw Error('请填写完成进度。');
  return {
    value,
    text: input.text.trim(),
    progress,
    note: input.note.trim(),
    updatedAt: new Date().toISOString(),
    departmentId,
  };
}
