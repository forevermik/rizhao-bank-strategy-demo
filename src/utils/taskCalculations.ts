import { DEMO_DATA_AS_OF_DATE } from '../data/constants';
import type { StrategicTask, TaskNode, Year } from '../types';

export const years: Year[] = [2026, 2027, 2028, 2029, 2030];

export function taskNodes(task: StrategicTask) {
  return task.yearlyPlans.flatMap((plan) => plan.nodes);
}

export function getYearNodes(task: StrategicTask, year: Year) {
  return task.yearlyPlans.find((plan) => plan.year === year)?.nodes ?? [];
}

export function getCompletedNodeCount(nodes: TaskNode[]) {
  return nodes.filter((node) => node.status === '已完成').length;
}

export function isOverdueNode(node: TaskNode) {
  return node.dueDate < DEMO_DATA_AS_OF_DATE && node.status !== '已完成';
}

export function getOverdueNodeCount(nodes: TaskNode[]) {
  return nodes.filter(isOverdueNode).length;
}

export function calculateYearProgress(nodes: TaskNode[]) {
  if (!nodes.length) return null;
  return Math.round(nodes.reduce((sum, node) => sum + node.progress, 0) / nodes.length);
}

export function calculateOverallProgress(task: StrategicTask) {
  return calculateYearProgress(taskNodes(task));
}

export function getRecentNode(task: StrategicTask, year?: Year) {
  const nodes = year ? getYearNodes(task, year) : taskNodes(task);
  return [...nodes].sort((a, b) => b.dueDate.localeCompare(a.dueDate))[0];
}

export function isDueSoon(node: TaskNode) {
  if (node.status === '已完成') return false;
  const base = new Date(DEMO_DATA_AS_OF_DATE).getTime();
  const due = new Date(node.dueDate).getTime();
  const days = Math.ceil((due - base) / 86400000);
  return days >= 0 && days <= 30;
}

export function taskSortScore(task: StrategicTask, year: Year) {
  const nodes = getYearNodes(task, year);
  if (nodes.some(isOverdueNode)) return 0;
  if (nodes.some(isDueSoon)) return 1;
  if (nodes.some((node) => node.status === '进行中')) return 2;
  if (nodes.some((node) => node.status === '待启动')) return 3;
  return 4;
}
