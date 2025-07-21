'use client';

import { useActivityStore } from '@/features/activity/store/activityStore';

export type {
  ActivityLog,
  ActivityFilters,
  ActivityStatistics,
} from '@/features/activity/store/activityStore';

export const useActivityLogs = () => {
  const store = useActivityStore();

  return {
    logs: store.getFilteredLogs(),
    filters: store.filters,
    statistics: store.getStatistics(),
    updateFilters: store.updateFilters,
    clearFilters: store.clearFilters,
    exportToCSV: store.exportToCSV,
  };
};
