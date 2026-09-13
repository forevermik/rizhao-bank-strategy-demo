import type { SessionUser, StrategicTask } from '../types';

export function getTaskLeads(task: StrategicTask) {
  return (task.leadDepartmentIds ?? [task.leadDepartmentId]).map((id, index) => ({ id, name: task.leadDepartmentNames?.[index] ?? task.leadDepartmentName }));
}

export function getTaskRelation(task: StrategicTask, departmentId?: string) {
  if (!departmentId) return 'none';
  if (getTaskLeads(task).some((lead) => lead.id === departmentId)) return 'lead';
  if (task.supportingDepartmentIds.includes(departmentId)) return 'support';
  return 'none';
}

export function getVisibleTasks(tasks: StrategicTask[], user: SessionUser | null) {
  if (!user) return [];
  if (user.role === 'strategy') return tasks;
  return tasks.filter((task) => getTaskRelation(task, user.departmentId) !== 'none');
}

export function getLeadTasks(tasks: StrategicTask[], departmentId?: string) {
  return tasks.filter((task) => getTaskLeads(task).some((lead) => lead.id === departmentId));
}

export function getSupportTasks(tasks: StrategicTask[], departmentId?: string) {
  return tasks.filter((task) => !!departmentId && task.supportingDepartmentIds.includes(departmentId));
}

export function canViewTask(task: StrategicTask, user: SessionUser | null) {
  if (!user) return false;
  if (user.role === 'strategy') return true;
  return getTaskRelation(task, user.departmentId) !== 'none';
}

export function canEditTask(task: StrategicTask, user: SessionUser | null) {
  if (!user) return false;
  if (user.role === 'strategy') return true;
  return getTaskRelation(task, user.departmentId) !== 'none';
}

export function validateTaskDepartmentRelations(tasks: StrategicTask[], departmentIds: Set<string>) {
  const issues: string[] = [];
  for (const task of tasks) {
    if (!task.leadDepartmentId) issues.push(`${task.code}: missing leadDepartmentId`);
    if (getTaskLeads(task).some((lead) => !departmentIds.has(lead.id))) issues.push(`${task.code}: leadDepartmentId not in department dictionary`);
    for (const id of task.supportingDepartmentIds) {
      if (!departmentIds.has(id)) issues.push(`${task.code}: supportingDepartmentId ${id} not in department dictionary`);
    }
    if (!task.source && task.supportingDepartmentIds.includes(task.leadDepartmentId)) issues.push(`${task.code}: lead department duplicated in supporting departments`);
    if (task.leadDepartmentId === task.businessArea) issues.push(`${task.code}: business area used as department id`);
  }
  if (import.meta.env.DEV && issues.length) {
    console.warn('validateTaskDepartmentRelations', issues);
  }
  return issues;
}
