import { completionStandards } from '../data/completionStandards.generated';
import { indicators } from '../data/indicators';
import type {
  AnnualStandardReport,
  CompletionStandardItem,
  Indicator,
  StandardYearProgress,
  StrategicTask,
  TaskProgressSummary,
  TaskReviewStatus,
  Year,
} from '../types';
import { DEMO_DATA_AS_OF_DATE } from '../data/constants';
import { getTaskImplementationYears, years } from './taskCalculations';

export const progressExplanation =
  '任务和完成标准来自日照银行2026—2030战略发展规划任务分解表。原表未提供完成进度，当前留空待填报；规划目标和实施时间不作为实际完成值。';

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

export function isStandardApplicableToYear(standard: CompletionStandardItem, year: Year, task?: StrategicTask) {
  if (task) {
    const implementationYears = getTaskImplementationYears(task);
    if (implementationYears.length) return implementationYears.includes(year);
  }
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
  if (standard.source) return null;
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
  const latestByStandard = new Map<string, AnnualStandardReport>();
  for (const report of taskLeadReports(task, reports)) {
    const key = `${report.standardId}:${report.departmentId}`;
    const current = latestByStandard.get(key);
    if (!current || report.year > current.year) latestByStandard.set(key, report);
  }
  const progressValues = [...latestByStandard.values()]
    .map((report) => normalizedProgress(report.manualProgress))
    .filter((value): value is number => value != null);
  const standardCount = getTaskStandards(task.id).length * taskLeadDepartmentIds(task).length;
  if (progressValues.length && standardCount) return Math.round(progressValues.reduce((sum, value) => sum + value, 0) / standardCount);
  return task.overallProgress || null;
}

export function calculateStandardYearProgress(task: StrategicTask, year: Year, reports: AnnualStandardReport[]) {
  const progressValues = taskLeadReports(task, reports)
    .filter((report) => report.year === year)
    .map((report) => normalizedProgress(report.manualProgress))
    .filter((value): value is number => value != null);
  const standardCount = getTaskStandards(task.id).length * taskLeadDepartmentIds(task).length;
  if (progressValues.length && standardCount) return Math.round(progressValues.reduce((sum, value) => sum + value, 0) / standardCount);
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
  if (!taskLeadDepartmentIds(task).includes(departmentId)) return '仅查看';
  const reviewStatus = getTaskReviewStatus(task, departmentId, reports, year);
  if (reviewStatus === 'rejected') return '待更新';
  if (reviewStatus === 'pending') return '待审核';
  if (reviewStatus === 'approved') return '审核通过';
  if (isTaskOverdueByStandards(task, reports)) return '逾期';
  return '待更新';
}

export function getTaskReviewStatus(task: StrategicTask, departmentId: string, reports: AnnualStandardReport[], year: Year): TaskReviewStatus {
  const submitted = cleanReports(reports).filter((report) => report.taskId === task.id && report.departmentId === departmentId && report.year === year);
  const requiredStandardIds = new Set(getTaskStandards(task.id).map((standard) => standard.id));
  const submittedStandardIds = new Set(submitted.map((report) => report.standardId));
  if (!requiredStandardIds.size || [...requiredStandardIds].some((standardId) => !submittedStandardIds.has(standardId))) return 'unsubmitted';
  if (submitted.some((report) => report.reviewStatus === 'rejected')) return 'rejected';
  if (submitted.every((report) => report.reviewStatus === 'approved')) return 'approved';
  return 'pending';
}

export function isTaskCompletedByStandards(task: StrategicTask, reports: AnnualStandardReport[]) {
  const standards = getTaskStandards(task.id);
  if (!standards.length) return false;
  const leadDepartmentIds = taskLeadDepartmentIds(task);
  return standards.every((standard) => leadDepartmentIds.every((departmentId) => {
    const latest = latestReportForStandard(cleanReports(reports), standard.id, [departmentId]);
    const progress = normalizedProgress(calculateMetricProgress(standard, latest, latest?.year));
    return progress != null && progress >= 100 && latest?.reviewStatus === 'approved';
  }));
}

export function isTaskOverdueByStandards(task: StrategicTask, reports: AnnualStandardReport[]) {
  return getTaskStandards(task.id).some((standard) => {
    if (!standard.finalTargetDate || standard.finalTargetDate >= DEMO_DATA_AS_OF_DATE) return false;
    const latest = latestReportForStandard(cleanReports(reports), standard.id, taskLeadDepartmentIds(task));
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

function latestReportForStandard(reports: AnnualStandardReport[], standardId: string, departmentIds: string[]) {
  return reports
    .filter((report) => report.standardId === standardId && departmentIds.includes(report.departmentId))
    .sort((a, b) => b.year - a.year)[0];
}

function taskLeadDepartmentIds(task: StrategicTask) {
  return task.leadDepartmentIds ?? [task.leadDepartmentId];
}

function taskLeadReports(task: StrategicTask, reports: AnnualStandardReport[]) {
  const leadDepartmentIds = taskLeadDepartmentIds(task);
  return cleanReports(reports).filter((report) => report.taskId === task.id && leadDepartmentIds.includes(report.departmentId));
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
