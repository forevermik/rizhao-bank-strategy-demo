import { useMemo } from 'react';
import type { QuarterlyTaskReport } from '../types';
import { useLocalStorage } from './useLocalStorage';

export const QUARTERLY_REPORT_STORAGE_KEY = 'rizhao-quarterly-task-reports-v1';

type QuarterlyReportState = {
  reports: QuarterlyTaskReport[];
};

export function useQuarterlyReports() {
  const [state, setState] = useLocalStorage<QuarterlyReportState>(QUARTERLY_REPORT_STORAGE_KEY, { reports: [] });
  const reports = useMemo(() => state.reports.filter((report) => report?.content?.trim()), [state.reports]);

  function saveReport(report: QuarterlyTaskReport) {
    const remaining = state.reports.filter((item) => !(
      item.taskId === report.taskId
      && item.year === report.year
      && item.quarter === report.quarter
      && item.departmentId === report.departmentId
    ));
    const content = report.content.trim();
    setState({ reports: content ? [...remaining, { ...report, content }] : remaining });
  }

  return { reports, saveReport };
}
