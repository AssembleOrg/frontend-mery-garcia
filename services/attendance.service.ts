import { apiFetch } from '@/lib/apiClient';

export interface AttendanceDetail {
  date: string;
  entry: string;
  exit: string;
  hours: number;
}

export interface AttendanceRecord {
  id: string;
  name: string;
  details: AttendanceDetail[];
}

export const attendanceService = {
  async getReport(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    const queryParams = new URLSearchParams({ 
      start_date: startDate, 
      end_date: endDate 
    }).toString();
    
    // Llamada al endpoint 
    return apiFetch<AttendanceRecord[]>(`attendance/report?${queryParams}`, {
      method: 'GET'
    });
  }
};