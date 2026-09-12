import { useMemo } from 'react';
import { tasks as seedTasks } from '../data/tasks';
import { useLocalStorage } from './useLocalStorage';
import type { StrategicTask, TaskNode, Year } from '../types';

type ReportingState = {
  taskOverrides: Record<string, Partial<StrategicTask>>;
  nodeOverrides: Record<string, Partial<TaskNode>>;
  addedNodes: Record<string, TaskNode[]>;
  deletedNodeIds: string[];
};

const emptyState: ReportingState = {
  taskOverrides: {},
  nodeOverrides: {},
  addedNodes: {},
  deletedNodeIds: [],
};

export const TASK_REPORTING_STORAGE_KEY = 'rizhao-task-reporting-v2';

export function useTaskReporting() {
  const [state, setState] = useLocalStorage<ReportingState>(TASK_REPORTING_STORAGE_KEY, emptyState);

  const tasks = useMemo(() => seedTasks.map((task) => mergeTask(task, state)), [state]);

  function updateTask(taskId: string, patch: Partial<StrategicTask>) {
    setState({
      ...state,
      taskOverrides: {
        ...(state.taskOverrides ?? {}),
        [taskId]: {
          ...((state.taskOverrides ?? {})[taskId] ?? {}),
          ...patch,
        },
      },
    });
  }

  function updateNode(node: TaskNode) {
    setState({
      ...state,
      nodeOverrides: { ...state.nodeOverrides, [node.id]: node },
      addedNodes: mapAddedNodes(state.addedNodes, node),
    });
  }

  function addNode(taskId: string, year: Year, draft: Omit<TaskNode, 'id' | 'year'>) {
    const node: TaskNode = {
      ...draft,
      id: `${taskId}-${year}-custom-${Date.now()}`,
      year,
    };
    const key = `${taskId}:${year}`;
    setState({
      ...state,
      addedNodes: { ...state.addedNodes, [key]: [...(state.addedNodes[key] ?? []), node] },
    });
  }

  function deleteNode(nodeId: string) {
    const addedNodes = Object.fromEntries(
      Object.entries(state.addedNodes).map(([key, nodes]) => [key, nodes.filter((node) => node.id !== nodeId)]),
    );
    setState({
      ...state,
      deletedNodeIds: [...new Set([...state.deletedNodeIds, nodeId])],
      addedNodes,
    });
  }

  return { tasks, updateTask, updateNode, addNode, deleteNode };
}

function mapAddedNodes(addedNodes: Record<string, TaskNode[]>, node: TaskNode) {
  const next = { ...addedNodes };
  for (const [key, nodes] of Object.entries(next)) {
    next[key] = nodes.map((item) => (item.id === node.id ? node : item));
  }
  return next;
}

function mergeTask(task: StrategicTask, state: ReportingState): StrategicTask {
  return {
    ...task,
    ...((state.taskOverrides ?? {})[task.id] ?? {}),
  };
}
