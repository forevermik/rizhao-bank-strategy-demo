import taskData from '@/data/tasks.json';
import standardData from '@/data/standards.json';
import indicatorData from '@/data/indicators.json';
import accountData from '@/data/accounts.json';
export type Task = {
  id: string;
  code: string;
  businessArea: string;
  title: string;
  objective: string;
  leadDepartmentId: string;
  leadDepartmentName: string;
  supportingDepartmentIds: string[];
  supportingDepartmentNames: string[];
  priority: string;
  period: string;
  startDate: string;
  endDate: string;
  measures: { id: string; title: string; description: string }[];
  completionStandards: string[];
  yearlyPlans: { year: number; progress: number }[];
  overallProgress: number;
  linkedIndicatorIds: string[];
};
export type Standard = {
  id: string;
  taskId: string;
  order: number;
  sourceText: string;
  name: string;
  type: string;
  unit?: string | null;
  finalTargetValue?: number | null;
  finalTargetText: string;
  finalTargetYear?: number | null;
  finalTargetDate?: string | null;
  achievementMode: string;
  yearlyTargets: Record<string, number | string>;
};
export type Indicator = {
  id: string;
  businessLine: string;
  name: string;
  departmentId: string;
  departmentName: string;
  unit: string;
  base2025: number | null;
  yearlyValues: {
    year: number;
    target: number | null;
    actual: number | null;
    gap: number | null;
    completionRate: number | null;
  }[];
  updatedAt: string;
};
export type Account = (typeof accountData)[number];
export const tasks = taskData as Task[];
export const standards = standardData as Standard[];
export const indicators = indicatorData as Indicator[];
export const accounts = accountData;
export const years = [2026, 2027, 2028, 2029, 2030];
export const cutoff = '2026-07-20';
export const uniq = (values: string[]) => [...new Set(values)];
export const taskStandards = (id: string) =>
  standards.filter((s) => s.taskId === id).sort((a, b) => a.order - b.order);
const normalize = (s: string) =>
  s.replace(/[（(].*?[）)]/g, '').replace(/[^0-9A-Za-z\u4e00-\u9fff]+/g, '');
export function targetFor(s: Standard, year: number) {
  const aliases:Record<string,string>={公司有效客户:'公司有效客户（万户）',代发企业数量:'代发企业数量（户）',绿色金融贷款余额:'绿色金融贷款余额（亿元）',国际业务结算量:'结算量'};
  return (
    s.yearlyTargets[year] ??
    indicators
      .find((i) => normalize(i.name) === normalize(s.name) || normalize(i.name) === normalize(aliases[s.name] ?? s.name))
      ?.yearlyValues.find((y) => y.year === year)?.target ??
    null
  );
}
export const scheduled = (s: Standard, year: number) =>
  targetFor(s, year) !== null ||
  s.finalTargetYear === year ||
  /每年|每年底|2026[—-]2030|2026至2030/.test(s.sourceText);
export const overdue = (s: Standard) =>
  Boolean(s.finalTargetDate && s.finalTargetDate < cutoff);
export const taskOverdue = (t: Task) => taskStandards(t.id).some(overdue);
export const yearlyProgress = (t: Task, y: number) =>
  t.yearlyPlans.find((p) => p.year === y)?.progress || null;
export const average = (n: (number | null)[]) => {
  const values = n.filter((v): v is number => v !== null);
  return values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;
};
export const format = (n: number | string | null | undefined) =>
  n === null || n === undefined
    ? '—'
    : typeof n === 'number'
      ? n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
      : n;
export const visibleTasks = (user: Account) =>
  tasks.filter(
    (t) =>
      user.role === 'strategy' ||
      t.leadDepartmentId === user.departmentId ||
      t.supportingDepartmentIds.includes(user.departmentId),
  );
