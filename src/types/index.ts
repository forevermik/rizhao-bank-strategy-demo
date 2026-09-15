export type Year = 2026 | 2027 | 2028 | 2029 | 2030;
export type Quarter = 1 | 2 | 3 | 4;
export type TaskStatus = '待启动' | '进行中' | '已完成' | '需协调' | '暂缓';
export type Priority = '高' | '中' | '低' | '';
export type UserRole = 'strategy' | 'department';

export type Department = {
  id: string;
  name: string;
  account?: string;
  aliases?: string[];
  parentDepartmentId?: string;
};

export type DemoAccount = {
  username: string;
  password: string;
  role: UserRole;
  departmentId?: string;
  departmentName: string;
};

export type TaskNode = {
  id: string;
  title: string;
  year: Year;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  startDate: string;
  dueDate: string;
  ownerDepartmentId?: string;
  ownerDepartment: string;
  status: TaskStatus;
  progress: number;
  achievement?: string;
  demoDerived?: boolean;
  measureTitle?: string;
};

export type Measure = {
  id: string;
  title: string;
  description: string;
  nodes: TaskNode[];
};

export type YearlyPlan = {
  year: Year;
  progress: number;
  nodes: TaskNode[];
};

export type TaskSource = { file: string; sheet: string; row: number; column?: string };

export type StrategicTask = {
  tag?: string;
  source?: TaskSource;
  leadDepartmentIds?: string[];
  leadDepartmentNames?: string[];
  id: string;
  code: string;
  businessArea: string;
  title: string;
  objective: string;
  leadDepartmentId: string;
  leadDepartmentName: string;
  supportingDepartmentIds: string[];
  supportingDepartmentNames: string[];
  leadDepartment: string;
  supportingDepartments: string[];
  priority: Priority;
  period: string;
  startDate: string;
  endDate: string;
  measures: Measure[];
  completionStandards: string[];
  yearlyPlans: YearlyPlan[];
  overallProgress: number;
  linkedIndicatorIds: string[];
};

export type CompletionStandardItem = {
  source?: TaskSource;
  id: string;
  taskId: string;
  order: number;
  sourceText: string;
  name: string;
  type: 'metric' | 'milestone' | 'mixed';
  unit: string | null;
  finalTargetValue: number | null;
  finalTargetText: string;
  finalTargetYear: Year | null;
  finalTargetDate: string | null;
  achievementMode: 'atLeast' | 'atMost' | 'exact' | 'manual';
  yearlyTargets: Partial<Record<Year, number>>;
};

export type QuarterlyTaskReport = {
  taskId: string;
  measureId: string;
  year: Year;
  quarter: Quarter;
  departmentId: string;
  content: string;
  expectedCompletionTime?: string;
  updatedAt: string;
};

export type IndicatorYearValue = {
  year: Year;
  target: number | null;
  actual: number | null;
  gap: number | null;
  completionRate: number | null;
};

export type Indicator = {
  id: string;
  businessLine: string;
  name: string;
  departmentId: string;
  departmentName: string;
  department: string;
  unit: string;
  base2025: number | string;
  yearlyValues: IndicatorYearValue[];
  updatedAt?: string;
};

export type SessionUser = DemoAccount;
