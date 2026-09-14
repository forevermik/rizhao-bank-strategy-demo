import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { StrategicCockpitPage } from '../pages/StrategicCockpitPage';
import { DepartmentWorkbenchPage } from '../pages/DepartmentWorkbenchPage';
import { TaskListPage } from '../pages/TaskListPage';
import { TaskDetailPage } from '../pages/TaskDetailPage';
import { IndicatorListPage } from '../pages/IndicatorListPage';
import { IndicatorDetailPage } from '../pages/IndicatorDetailPage';
import { MiniProgramPage } from '../pages/MiniProgramPage';
import { useAuth } from '../hooks/useAuth';

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'strategy' ? '/cockpit' : '/workbench'} replace />;
}

function StrategicOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'strategy') return <Navigate to="/workbench" replace />;
  return <>{children}</>;
}

function DepartmentOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'strategy') return <Navigate to="/cockpit" replace />;
  return <>{children}</>;
}

function TasksEntry() {
  const { user } = useAuth();
  if (user?.role === 'department') return <Navigate to="/workbench?view=tasks" replace />;
  return <TaskListPage />;
}

function OverviewRedirect() {
  return <Navigate to="/cockpit" replace />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/mini-program', element: <MiniProgramPage /> },
  {
    path: '/',
    element: (
      <Protected>
        <AppShell />
      </Protected>
    ),
    children: [
      { index: true, element: <RoleHome /> },
      { path: 'cockpit', element: <StrategicOnly><StrategicCockpitPage /></StrategicOnly> },
      { path: 'workbench', element: <DepartmentOnly><DepartmentWorkbenchPage /></DepartmentOnly> },
      { path: 'tasks', element: <TasksEntry /> },
      { path: 'tasks/:taskId', element: <TaskDetailPage /> },
      { path: 'indicators', element: <IndicatorListPage /> },
      { path: 'indicators/:indicatorId', element: <IndicatorDetailPage /> },
      { path: 'overview', element: <OverviewRedirect /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
