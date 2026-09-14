import type { Quarter, QuarterlyTaskReport, StrategicTask, Year } from '../types';
import { getTaskImplementationYears } from './taskCalculations';

export const quarters: Quarter[] = [1, 2, 3, 4];

export function getQuarterReport(reports: QuarterlyTaskReport[], taskId: string, year: Year, quarter: Quarter, departmentId: string) {
  return reports.find((report) => report.taskId === taskId && report.year === year && report.quarter === quarter && report.departmentId === departmentId);
}

export function getFilledQuarters(task: StrategicTask, year: Year, reports: QuarterlyTaskReport[], departmentId?: string) {
  const departmentIds = departmentId ? [departmentId] : taskLeadDepartmentIds(task);
  return quarters.filter((quarter) => reports.some((report) => (
    report.taskId === task.id
    && report.year === year
    && report.quarter === quarter
    && departmentIds.includes(report.departmentId)
    && !!report.content.trim()
  )));
}

export function calculateTaskYearQuarterProgress(task: StrategicTask, year: Year, reports: QuarterlyTaskReport[], departmentId?: string) {
  if (!getTaskImplementationYears(task).includes(year)) return null;
  return getFilledQuarters(task, year, reports, departmentId).length * 25;
}

export function calculateTaskOverallQuarterProgress(task: StrategicTask, reports: QuarterlyTaskReport[]) {
  const implementationYears = getTaskImplementationYears(task);
  if (!implementationYears.length) return null;
  const completedQuarterCount = implementationYears.reduce((sum, year) => sum + getFilledQuarters(task, year, reports).length, 0);
  return Math.round((completedQuarterCount / (implementationYears.length * quarters.length)) * 100);
}

export function calculateQuarterlyReportingStatus(task: StrategicTask, departmentId: string | undefined, reports: QuarterlyTaskReport[], year: Year) {
  if (!departmentId) return '待更新';
  if (!taskLeadDepartmentIds(task).includes(departmentId)) return '仅查看';
  return getFilledQuarters(task, year, reports, departmentId).length ? '已填报' : '待更新';
}

export function isTaskQuarterlyCompleted(task: StrategicTask, reports: QuarterlyTaskReport[]) {
  return calculateTaskOverallQuarterProgress(task, reports) === 100;
}

function taskLeadDepartmentIds(task: StrategicTask) {
  return task.leadDepartmentIds ?? [task.leadDepartmentId];
}
