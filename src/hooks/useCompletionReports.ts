import { useEffect, useMemo } from 'react';
import type { AnnualStandardReport, Year } from '../types';
import { cleanReports } from '../utils/progressCalculations';
import { useLocalStorage } from './useLocalStorage';

export const COMPLETION_REPORT_STORAGE_KEY = 'rizhao-completion-standard-reports-v4';
const PREVIOUS_COMPLETION_REPORT_STORAGE_KEY = 'rizhao-completion-standard-reports-v3';

type ReportState = {
  reports: AnnualStandardReport[];
};

const emptyState: ReportState = { reports: [] };

export function useCompletionReports() {
  const [state, setState] = useLocalStorage<ReportState>(COMPLETION_REPORT_STORAGE_KEY, emptyState);
  const reports = useMemo(() => cleanReports(state.reports), [state.reports]);

  useEffect(() => {
    migrateCompletionReportsV3ToV4(setState);
  }, [setState]);

  function getReport(taskId: string, standardId: string, year: Year, departmentId: string) {
    return reports.find((report) => report.taskId === taskId && report.standardId === standardId && report.year === year && report.departmentId === departmentId);
  }

  function saveReport(report: AnnualStandardReport) {
    const submittedAt = new Date().toISOString();
    const previousFeedback = reports.find((item) => item.taskId === report.taskId && item.year === report.year && item.departmentId === report.departmentId && item.reviewFeedback)?.reviewFeedback ?? '';
    const resetReview = reports.map((item) => item.taskId === report.taskId && item.year === report.year && item.departmentId === report.departmentId
      ? { ...item, reviewStatus: 'pending' as const, submittedAt, reviewedAt: undefined }
      : item);
    const next = resetReview.filter((item) => !(item.taskId === report.taskId && item.standardId === report.standardId && item.year === report.year && item.departmentId === report.departmentId));
    setState({ reports: [...next, { ...report, reviewStatus: 'pending', reviewFeedback: previousFeedback, submittedAt, reviewedAt: undefined }] });
  }

  function reviewTaskReports(taskId: string, year: Year, departmentId: string, reviewStatus: 'approved' | 'rejected', reviewFeedback = '') {
    const feedback = reviewFeedback.trim();
    if (reviewStatus === 'rejected' && !feedback) return false;
    const reviewedAt = new Date().toISOString();
    setState({
      reports: reports.map((item) => item.taskId === taskId && item.year === year && item.departmentId === departmentId
        ? { ...item, reviewStatus, reviewFeedback: reviewStatus === 'rejected' ? feedback : '', reviewedAt }
        : item),
    });
    return true;
  }

  function resetReport(taskId: string, standardId: string, year: Year, departmentId: string) {
    setState({
      reports: reports.filter((item) => !(item.taskId === taskId && item.standardId === standardId && item.year === year && item.departmentId === departmentId)),
    });
  }

  return { reports, getReport, saveReport, reviewTaskReports, resetReport };
}

export function migrateCompletionReportsV3ToV4(setState: (state: ReportState) => void) {
  try {
    if (localStorage.getItem(COMPLETION_REPORT_STORAGE_KEY)) return;
    const raw = localStorage.getItem(PREVIOUS_COMPLETION_REPORT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as ReportState;
    const migrated = cleanReports(parsed.reports ?? []);
    setState({ reports: migrated });
    localStorage.setItem(COMPLETION_REPORT_STORAGE_KEY, JSON.stringify({ reports: migrated }));
  } catch {
    localStorage.setItem(COMPLETION_REPORT_STORAGE_KEY, JSON.stringify(emptyState));
  }
}
