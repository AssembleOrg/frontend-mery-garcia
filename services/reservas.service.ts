import { apiFetch, getToken } from '@/lib/apiClient';

export type Coincidencia = 'COINCIDE' | 'PARCIAL' | 'DISTINTO' | 'INDETERMINADO';

export interface FilaReservado {
  prepagoId: string;
  bookingCode: string | null;
  fechaTurno: string | null;
  clienta: string;
  servicioReservado: string;
  empleadoReservado: string | null;
  estadoUso: 'SIN_USAR' | 'USADA';
  comandaNumero: string | null;
  comandaFecha: string | null;
  serviciosTomados: string[];
  coincidencia: Coincidencia | null;
}

export interface ReporteReservados {
  fechaDesde: string;
  fechaHasta: string;
  filas: FilaReservado[];
  resumen: {
    total: number;
    sinUsar: number;
    coincide: number;
    parcial: number;
    distinto: number;
    indeterminado: number;
  };
}

interface Envelope<T> {
  status: string;
  data: T;
}

export interface ServicioBooking {
  id: string;
  nombre: string;
  categoria: string | null;
}

const BASE = '/api/reservas/reporte';

class ReservasService {
  async servicios(): Promise<ServicioBooking[]> {
    const res = await apiFetch<Envelope<ServicioBooking[]>>(`${BASE}/servicios`);
    return res.data;
  }

  async reporte(params: {
    fechaDesde?: string;
    fechaHasta?: string;
    soloDiscrepancias?: boolean;
  }): Promise<ReporteReservados> {
    const qs = new URLSearchParams();
    if (params.fechaDesde) qs.append('fechaDesde', params.fechaDesde);
    if (params.fechaHasta) qs.append('fechaHasta', params.fechaHasta);
    if (params.soloDiscrepancias) qs.append('soloDiscrepancias', 'true');
    const res = await apiFetch<Envelope<ReporteReservados>>(`${BASE}/reservados?${qs.toString()}`);
    return res.data;
  }

  async descargarPdf(params: {
    fechaDesde?: string;
    fechaHasta?: string;
    soloDiscrepancias?: boolean;
  }): Promise<void> {
    const qs = new URLSearchParams();
    if (params.fechaDesde) qs.append('fechaDesde', params.fechaDesde);
    if (params.fechaHasta) qs.append('fechaHasta', params.fechaHasta);
    if (params.soloDiscrepancias) qs.append('soloDiscrepancias', 'true');
    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}${BASE}/reservados/pdf?${qs.toString()}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!res.ok) throw new Error('No se pudo generar el PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas-vs-realizado_${params.fechaDesde ?? ''}_a_${params.fechaHasta ?? ''}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const reservasService = new ReservasService();
