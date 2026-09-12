import type { Indicator, StrategicTask, TaskNode, Year } from '../types';

export const years: Year[] = [2026, 2027, 2028, 2029, 2030];

export function allNodes(tasks: StrategicTask[]) {
  return tasks.flatMap((task) => task.yearlyPlans.flatMap((plan) => plan.nodes.map((node) => ({ ...node, task }))));
}

export function taskNodes(task: StrategicTask) {
  return task.yearlyPlans.flatMap((plan) => plan.nodes);
}

export function avg(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function completionForTasks(tasks: StrategicTask[]) {
  return avg(tasks.map((task) => task.overallProgress));
}

export function nodesByStatus(nodes: TaskNode[]) {
  return nodes.reduce<Record<string, number>>((acc, node) => {
    acc[node.status] = (acc[node.status] ?? 0) + 1;
    return acc;
  }, {});
}

export function indicatorValue(indicator: Indicator, year: Year) {
  return indicator.yearlyValues.find((item) => item.year === year) ?? indicator.yearlyValues[0];
}

export function indicatorTone(rate: number) {
  if (rate >= 100) return 'good';
  if (rate >= 80) return 'blue';
  if (rate >= 60) return 'amber';
  return 'muted';
}

export function formatValue(value: number | string, unit?: string) {
  if (value === '') return '-';
  if (typeof value === 'string') return value;
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${value.toLocaleString('zh-CN', { maximumFractionDigits: digits })}${unit ? ` ${unit}` : ''}`;
}

export function daysUntil(date: string) {
  const target = new Date(date).getTime();
  const now = new Date('2026-07-20').getTime();
  return Math.max(0, Math.ceil((target - now) / 86400000));
}
