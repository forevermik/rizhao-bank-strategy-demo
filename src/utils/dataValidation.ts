import { departments } from '../data/departments';
import { tasks } from '../data/tasks';
import { validateTaskDepartmentRelations } from './taskSelectors';

export function runDevelopmentDataValidation() {
  if (!import.meta.env.DEV) return;
  validateTaskDepartmentRelations(tasks, new Set(departments.map((department) => department.id)));
}
