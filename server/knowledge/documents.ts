import { dashboardSeed } from '../../src/data/dashboard';
import { departments } from '../../src/data/departments';
import { indicators } from '../../src/data/indicators';
import { tasks } from '../../src/data/tasks';

export type KnowledgeDocument = { id: string; title: string; route: string; section: string; content: string; keywords: string[] };

export const knowledgeDocuments: KnowledgeDocument[] = [
  { id: 'platform-overview', title: '日照银行十五五战略规划执行管理平台', route: '/cockpit', section: '平台功能', keywords: ['平台', '功能', '驾驶舱', '工作台', '任务', '指标'], content: '平台提供战略驾驶舱、部门工作台、战略任务、年度推进、指标任务和小程序展示。登录后会按账号角色展示战略管理部门视角或部门视角；节点状态、进度和成果摘要保存在浏览器本地存储。' },
  { id: 'mini-program', title: '日照银行十五五战略执行小程序', route: '/mini-program', section: '小程序展示', keywords: ['小程序', '移动端', '手机', '登录'], content: '小程序展示版与 PC 端使用同源数据，按账号进入战略驾驶舱或部门工作台；可查看任务、年度推进和指标任务。' },
  ...tasks.map((task) => ({ id: `task-${task.id}`, title: task.title, route: `/tasks/${task.id}`, section: `${task.code} · ${task.businessArea}`, keywords: [task.code, task.title, task.businessArea, task.leadDepartmentName, ...task.supportingDepartmentNames], content: `${task.title}。目标：${task.objective}。牵头部门：${task.leadDepartmentName}；协同部门：${task.supportingDepartmentNames.join('、') || '无'}。周期：${task.period}。完成标准：${task.completionStandards.join('；')}。当前整体进度：${task.overallProgress}%。` })),
  ...indicators.map((indicator) => ({ id: `indicator-${indicator.id}`, title: indicator.name, route: `/indicators/${indicator.id}`, section: `${indicator.businessLine}指标`, keywords: [indicator.name, indicator.businessLine, indicator.departmentName, '指标'], content: `${indicator.name}，归属${indicator.departmentName}，单位：${indicator.unit}，2025 基数：${indicator.base2025}。年度目标：${indicator.yearlyValues.map((item) => `${item.year}年${item.target ?? '未设置'}`).join('；')}。` })),
  ...departments.map((department) => ({ id: `department-${department.id}`, title: department.name, route: '/workbench', section: '部门与账号', keywords: [department.name, ...(department.aliases ?? [])], content: `${department.name}是平台中的部门。演示账号：${department.account ?? '资料未提供'}。` })),
  ...dashboardSeed.systemProjects.map((project, index) => ({ id: `system-${index}`, title: project.name, route: '/cockpit', section: '系统建设事项', keywords: [project.name, project.leadDepartment, project.status, '系统'], content: `${project.name}由${project.leadDepartment}牵头，计划完成时间：${project.dueDate}，当前状态：${project.status}。` })),
];
