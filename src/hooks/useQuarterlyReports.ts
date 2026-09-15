import { useMemo } from 'react';
import type { QuarterlyTaskReport } from '../types';
import { useLocalStorage } from './useLocalStorage';

export const QUARTERLY_REPORT_STORAGE_KEY = 'rizhao-quarterly-measure-reports-v2';

type QuarterlyReportState = {
  reports: QuarterlyTaskReport[];
};

export function useQuarterlyReports() {
  const [state, setState] = useLocalStorage<QuarterlyReportState>(QUARTERLY_REPORT_STORAGE_KEY, { reports: [] });
  const reports = useMemo(() => state.reports.filter((report) => (
    report?.content?.trim() || report?.expectedCompletionTime?.trim()
  )), [state.reports]);

  function saveReport(report: QuarterlyTaskReport) {
    const remaining = state.reports.filter((item) => !(
      item.taskId === report.taskId
      && item.measureId === report.measureId
      && item.year === report.year
      && item.quarter === report.quarter
      && item.departmentId === report.departmentId
    ));
    const content = report.content.trim();
    const expectedCompletionTime = report.expectedCompletionTime?.trim() ?? '';
    setState({
      reports: content || expectedCompletionTime
        ? [...remaining, { ...report, content, expectedCompletionTime }]
        : remaining,
    });
  }

  return { reports, saveReport };
}
