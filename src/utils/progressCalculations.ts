import { completionStandards } from '../data/completionStandards.generated';
import type { StrategicTask } from '../types';

export function getTaskStandards(taskId: string) {
  return completionStandards.filter((item) => item.taskId === taskId).sort((a, b) => a.order - b.order);
}

export function hasPlanningConfiguration(task: StrategicTask) {
  const standards = getTaskStandards(task.id);
  return standards.some((standard) => Object.keys(standard.yearlyTargets).length > 0 || standard.finalTargetYear != null)
    || (!!task.startDate && !!task.endDate);
}
