import type { Quarter, QuarterlyTaskReport, StrategicTask, Year } from '../types';
import { getTaskImplementationYears } from './taskCalculations';

export const quarters: Quarter[] = [1, 2, 3, 4];

export function getQuarterReport(
  reports: QuarterlyTaskReport[],
  taskId: string,
  measureId: string,
  year: Year,
  quarter: Quarter,
  departmentId: string,
) {
  return reports.find((report) => (
    report.taskId === taskId
    && report.measureId === measureId
    && report.year === year
    && report.quarter === quarter
    && report.departmentId === departmentId
  ));
}

export function getMeasureFilledQuarters(
  task: StrategicTask,
  measureId: string,
  year: Year,
  reports: QuarterlyTaskReport[],
  departmentId?: string,
) {
  const departmentIds = departmentId ? [departmentId] : taskLeadDepartmentIds(task);
  return quarters.filter((quarter) => reports.some((report) => (
    report.taskId === task.id
    && report.measureId === measureId
    && report.year === year
    && report.quarter === quarter
    && departmentIds.includes(report.departmentId)
    && !!report.content.trim()
  )));
}

export function calculateMeasureYearProgress(
  task: StrategicTask,
  measureId: string,
  year: Year,
  reports: QuarterlyTaskReport[],
  departmentId?: string,
) {
  if (!getTaskImplementationYears(task).includes(year)) return null;
  return getMeasureFilledQuarters(task, measureId, year, reports, departmentId).length * 25;
}

export function getTaskQuarterStats(
  task: StrategicTask,
  year: Year,
  reports: QuarterlyTaskReport[],
  departmentId?: string,
) {
  const measureCount = task.measures.length;
  const quarterStats = quarters.map((quarter) => ({
    quarter,
    filled: task.measures.filter((measure) => (
      getMeasureFilledQuarters(task, measure.id, year, reports, departmentId).includes(quarter)
    )).length,
    total: measureCount,
  }));
  return {
    measureCount,
    filledSlots: quarterStats.reduce((sum, item) => sum + item.filled, 0),
    totalSlots: measureCount * quarters.length,
    completedMeasures: task.measures.filter((measure) => (
      calculateMeasureYearProgress(task, measure.id, year, reports, departmentId) === 100
    )).length,
    quarterStats,
  };
}

export function calculateTaskYearQuarterProgress(
  task: StrategicTask,
  year: Year,
  reports: QuarterlyTaskReport[],
  departmentId?: string,
) {
  if (!getTaskImplementationYears(task).includes(year) || !task.measures.length) return null;
  const stats = getTaskQuarterStats(task, year, reports, departmentId);
  return Math.round((stats.filledSlots / stats.totalSlots) * 100);
}

export function calculateTaskOverallQuarterProgress(task: StrategicTask, reports: QuarterlyTaskReport[]) {
  const implementationYears = getTaskImplementationYears(task);
  if (!implementationYears.length || !task.measures.length) return null;
  const filledSlots = implementationYears.reduce(
    (sum, year) => sum + getTaskQuarterStats(task, year, reports).filledSlots,
    0,
  );
  const totalSlots = implementationYears.length * task.measures.length * quarters.length;
  return Math.round((filledSlots / totalSlots) * 100);
}

export function calculateQuarterlyReportingStatus(
  task: StrategicTask,
  departmentId: string | undefined,
  reports: QuarterlyTaskReport[],
  year: Year,
) {
  if (!departmentId) return '待更新';
  if (!taskLeadDepartmentIds(task).includes(departmentId)) return '仅查看';
  return (calculateTaskYearQuarterProgress(task, year, reports, departmentId) ?? 0) > 0 ? '已填报' : '待更新';
}

export function isTaskQuarterlyCompleted(task: StrategicTask, reports: QuarterlyTaskReport[]) {
  return calculateTaskOverallQuarterProgress(task, reports) === 100;
}

function taskLeadDepartmentIds(task: StrategicTask) {
  return task.leadDepartmentIds ?? [task.leadDepartmentId];
}
