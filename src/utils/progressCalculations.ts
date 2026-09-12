import { completionStandards } from '../data/completionStandards.generated';
import { indicators } from '../data/indicators';
import type {
  AnnualStandardReport,
  CompletionStandardItem,
  Indicator,
  StandardYearProgress,
  StrategicTask,
  TaskProgressSummary,
  Year,
} from '../types';
import { DEMO_DATA_AS_OF_DATE } from '../data/constants';
import { years } from './taskCalculations';

export const progressExplanation =
  '页面进度为静态Demo演示数据，不代表实际经营完成情况。Excel年度目标仅作为目标展示，不作为实际完成值。';

const explanationMap: Record<TaskProgressSummary['progressSource'], string> = {
  'annual-target-path': progressExplanation,
  'milestone-plan': progressExplanation,
  'schedule-time': progressExplanation,
  'manual-report': progressExplanation,
  none: progressExplanation,
};

export function getTaskStandards(taskId: string) {
  return completionStandards.filter((item) => item.taskId === taskId).sort((a, b) => a.order - b.order);
}

export function getStandardReport(reports: AnnualStandardReport[], standardId: string, year: Year, departmentId: string) {
  return cleanReports(reports).find((report) => report.standardId === standardId && report.year === year && report.departmentId === departmentId);
}

export function cleanReports(reports: AnnualStandardReport[]) {
  return reports.filter((report) => {
    if (!report || report.reportStatus === 'unreported') return false;
    return report.actualValue != null || !!report.actualText?.trim() || report.manualProgress != null || !!report.note?.trim();
  });
}

export function isStandardApplicableToYear(standard: CompletionStandardItem, year: Year) {
  if (getPlannedTarget(standard, year) != null) return true;
  if (standard.finalTargetYear === year) return true;
  if (/每年|每年底|2026[—-]2030|2026至2030/.test(standard.sourceText)) return true;
  return false;
}

export function calculateMetricProgress(standard: CompletionStandardItem, report?: AnnualStandardReport | null, year?: Year) {
  if (!report) return null;
  if (standard.type !== 'metric') return report.manualProgress;
  if (report.actualValue == null) return report.manualProgress;
  const target = year ? getPlannedTarget(standard, year) ?? standard.finalTargetValue : standard.finalTargetValue;
  if (target == null || target === 0) return report.manualProgress;
  if (standard.achievementMode === 'atMost') return Math.round((target / report.actualValue) * 100);
  return Math.round((report.actualValue / target) * 100);
}

export function normalizedProgress(progress: number | null) {
  if (progress == null) return null;
  return Math.max(0, Math.min(100, progress));
}

export function calculateMetricFinalGap(standard: CompletionStandardItem, report?: AnnualStandardReport | null) {
  if (!report || standard.finalTargetValue == null || report.actualValue == null) return '—';
  const diff = standard.achievementMode === 'atMost'
    ? report.actualValue - standard.finalTargetValue
    : standard.finalTargetValue - report.actualValue;
  if (diff <= 0) return `已达成${Math.abs(diff) > 0 ? `，超出目标${formatNumber(Math.abs(diff))}${standard.unit ?? ''}` : ''}`;
  return `${formatNumber(diff)}${standard.unit ?? ''}`;
}

export function calculatePlannedFinalGap(standard: CompletionStandardItem, year: Year) {
  const target = getPlannedTarget(standard, year);
  if (target == null || standard.finalTargetValue == null) return '—';
  const diff = standard.achievementMode === 'atMost'
    ? Number(target) - standard.finalTargetValue
    : standard.finalTargetValue - Number(target);
  if (!Number.isFinite(diff)) return '—';
  if (diff <= 0) return '规划已达最终目标';
  return `年度目标距最终目标：${formatNumber(diff)}${standard.unit ?? ''}`;
}

export function getPlannedTarget(standard: CompletionStandardItem, year: Year) {
  const direct = standard.yearlyTargets[year];
  if (direct != null) return direct;
  const indicator = findIndicatorForStandard(standard);
  return indicator?.yearlyValues.find((value) => value.year === year)?.target ?? null;
}

export function calculateTargetPathProgress(standard: CompletionStandardItem, year: Year) {
  if (standard.type !== 'metric') return null;
  const target = getPlannedTarget(standard, year);
  const indicator = findIndicatorForStandard(standard);
  const base = toNumber(indicator?.base2025);
  const finalTarget = toNumber(standard.finalTargetValue ?? indicator?.yearlyValues.find((value) => value.year === 2030)?.target);
  if (target == null || base == null || finalTarget == null || finalTarget === base) return null;
  if (standard.achievementMode === 'atMost') {
    const denominator = base - finalTarget;
    if (denominator === 0) return null;
    return Math.round(clamp(((base - target) / denominator) * 100, 0, 100));
  }
  return Math.round(clamp(((target - base) / (finalTarget - base)) * 100, 0, 100));
}

export function calculateMilestonePlanProgress(task: StrategicTask, year: Year) {
  const standards = getTaskStandards(task.id);
  const dated = standards.filter((standard) => standard.finalTargetYear != null);
  if (dated.length < 2) return null;
  const completedByPlan = dated.filter((standard) => standard.finalTargetYear! <= year).length;
  return Math.round((completedByPlan / dated.length) * 100);
}

export function calculateScheduleProgress(task: StrategicTask) {
  const start = parseDate(task.startDate);
  const end = parseDate(task.endDate);
  const asOf = parseDate(DEMO_DATA_AS_OF_DATE);
  if (!start || !end || !asOf || end <= start) return null;
  return Math.round(clamp(((asOf - start) / (end - start)) * 100, 0, 100));
}

export function calculateStandardOverallProgress(task: StrategicTask, reports: AnnualStandardReport[]) {
  return task.overallProgress || null;
}

export function calculateStandardYearProgress(task: StrategicTask, year: Year, reports: AnnualStandardReport[]) {
  return task.yearlyPlans.find((plan) => plan.year === year)?.progress || null;
}

export function calculatePlannedYearProgress(task: StrategicTask, year: Year) {
  return calculateStandardYearProgress(task, year, []);
}

export function getTaskProgressSummary(task: StrategicTask, reports: AnnualStandardReport[], year: Year): TaskProgressSummary {
  const overallProgress = calculateStandardOverallProgress(task, reports);
  if (overallProgress != null) return {
    plannedProgress: calculatePlannedYearProgress(task, year),
    actualProgress: overallProgress,
    displayProgress: overallProgress,
    displayLabel: '总体进度',
    progressSource: 'manual-report',
    explanation: progressExplanation,
  };

  return {
    plannedProgress: null,
    actualProgress: null,
    displayProgress: null,
    displayLabel: '总体进度',
    progressSource: 'none',
    explanation: progressExplanation,
  };
}

export function getStandardYearProgress(standard: CompletionStandardItem, year: Year, report?: AnnualStandardReport | null): StandardYearProgress {
  const plannedTarget = getPlannedTarget(standard, year);
  const plannedProgress = calculateTargetPathProgress(standard, year);
  const actualValue = standard.type === 'metric' ? report?.actualValue ?? null : report?.actualText || null;
  const actualProgress = calculateMetricProgress(standard, report, year);
  return {
    year,
    plannedTarget,
    plannedProgress,
    actualValue,
    actualProgress,
    finalTargetGap: calculatePlannedFinalGap(standard, year),
    reportStatus: report?.reportStatus ?? 'unreported',
  };
}

export function calculateTaskReportingStatus(task: StrategicTask, departmentId: string | undefined, reports: AnnualStandardReport[], year: Year) {
  if (!departmentId) return '待更新';
  const standards = getTaskStandards(task.id);
  if (!standards.length) return '暂无完成标准';
  const departmentReports = cleanReports(reports).filter((report) => report.taskId === task.id && report.departmentId === departmentId && report.year === year);
  if (isTaskOverdueByStandards(task, reports)) return '逾期';
  if (departmentReports.some((report) => report.reportStatus === 'completed')) return '已填报';
  return '待更新';
}

export function isTaskCompletedByStandards(task: StrategicTask, reports: AnnualStandardReport[]) {
  const standards = getTaskStandards(task.id);
  if (!standards.length) return false;
  return standards.every((standard) => {
    const latest = latestReportForStandard(cleanReports(reports), standard.id, task.leadDepartmentId);
    const progress = normalizedProgress(calculateMetricProgress(standard, latest, latest?.year));
    return progress != null && progress >= 100;
  });
}

export function isTaskOverdueByStandards(task: StrategicTask, reports: AnnualStandardReport[]) {
  return getTaskStandards(task.id).some((standard) => {
    if (!standard.finalTargetDate || standard.finalTargetDate >= DEMO_DATA_AS_OF_DATE) return false;
    const latest = latestReportForStandard(cleanReports(reports), standard.id, task.leadDepartmentId);
    const progress = normalizedProgress(calculateMetricProgress(standard, latest, latest?.year));
    return progress == null || progress < 100;
  });
}

export function hasPlanningConfiguration(task: StrategicTask) {
  const standards = getTaskStandards(task.id);
  return standards.some((standard) => years.some((year) => getPlannedTarget(standard, year) != null) || standard.finalTargetYear != null)
    || (!!parseDate(task.startDate) && !!parseDate(task.endDate));
}

export function standardTypeLabel(type: CompletionStandardItem['type']) {
  if (type === 'metric') return '指标类';
  if (type === 'milestone') return '里程碑类';
  return '混合类';
}

function latestReportForStandard(reports: AnnualStandardReport[], standardId: string, departmentId: string) {
  return reports
    .filter((report) => report.standardId === standardId && report.departmentId === departmentId)
    .sort((a, b) => b.year - a.year)[0];
}

function findIndicatorForStandard(standard: CompletionStandardItem): Indicator | undefined {
  const standardName = normalizeName(standard.name);
  const alias = indicatorAliasMap[standard.name] ?? [];
  const names = new Set([standardName, ...alias.map(normalizeName)]);
  return indicators.find((indicator) => {
    const indicatorName = normalizeName(indicator.name);
    return names.has(indicatorName);
  });
}

const indicatorAliasMap: Record<string, string[]> = {
  公司有效客户: ['公司有效客户（万户）'],
  代发企业数量: ['代发企业数量（户）'],
  绿色金融贷款余额: ['绿色金融贷款余额（亿元）'],
  机构存款规模: ['机构存款规模'],
  机构有效客户: ['机构有效客户'],
  机构代发工资户: ['机构代发工资户'],
  普惠贷款规模: ['普惠贷款规模'],
  储蓄存款规模: ['储蓄存款规模'],
  国际业务结算量: ['结算量'],
};

function normalizeName(text: string) {
  return text.replace(/[（(].*?[）)]/g, '').replace(/[^0-9A-Za-z\u4e00-\u9fff]+/g, '');
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function parseDate(value: string) {
  if (!value) return null;
  const normalized = value.replace(/\./g, '-');
  const time = new Date(normalized).getTime();
  return Number.isFinite(time) ? time : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}
