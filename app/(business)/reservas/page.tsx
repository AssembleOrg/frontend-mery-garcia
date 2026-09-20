'use client';

import { useCallback, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import Spinner from '@/components/common/Spinner';
import { Calculator, FileDown, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  reservasService,
  type Coincidencia,
  type FilaReservado,
  type ReporteReservados,
} from '@/services/reservas.service';

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Reservas' },
];

function estadoDe(f: FilaReservado): string {
  return f.estadoUso === 'SIN_USAR' ? 'SIN_USAR' : (f.coincidencia ?? 'INDETERMINADO');
}

const BADGE: Record<string, { texto: string; clase: string }> = {
  COINCIDE: { texto: 'Coincide', clase: 'border-green-200 bg-green-50 text-green-700' },
  PARCIAL: { texto: 'Parcial', clase: 'border-amber-200 bg-amber-50 text-amber-700' },
  DISTINTO: { texto: 'Se hizo otro', clase: 'border-rose-200 bg-rose-50 text-rose-700' },
  INDETERMINADO: { texto: 'A revisar', clase: 'border-gray-200 bg-gray-50 text-gray-600' },
  SIN_USAR: { texto: 'Sin usar', clase: 'border-gray-200 bg-gray-50 text-gray-500' },
};

function fechaCorta(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function fmtFecha(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function ReservasPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [soloDiscrepancias, setSoloDiscrepancias] = useState(false);
  const [data, setData] = useState<ReporteReservados | null>(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const params = useCallback(
    () => ({
      fechaDesde: dateRange.from ? fmtFecha(dateRange.from) : undefined,
      fechaHasta: dateRange.to ? fmtFecha(dateRange.to) : undefined,
      soloDiscrepancias,
    }),
    [dateRange, soloDiscrepancias],
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setData(await reservasService.reporte(params()));
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cargar el reporte');
    } finally {
      setCargando(false);
    }
  }, [params]);

  const descargar = useCallback(async () => {
    setDescargando(true);
    try {
      await reservasService.descargarPdf(params());
      toast.success('Reporte descargado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo generar el PDF');
    } finally {
      setDescargando(false);
    }
  }, [params]);

  const r = data?.resumen;

  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Reservas: lo reservado vs lo realizado" />
          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            <Card className="mb-4 border border-[#f9bbc4]/30 bg-white/95">
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={(v) => v && setDateRange(v)}
                  />
                  <label className="flex items-center gap-2 text-sm text-[#6b4c57]">
                    <input
                      type="checkbox"
                      checked={soloDiscrepancias}
                      onChange={(e) => setSoloDiscrepancias(e.target.checked)}
                      className="accent-[#e8b4c6]"
                    />
                    Solo las que no coinciden
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={cargar}
                    disabled={cargando}
                    className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    {cargando ? 'Cargando...' : 'Ver'}
                  </Button>
                  <Button
                    onClick={descargar}
                    disabled={descargando || cargando}
                    variant="outline"
                    className="border-[#f9bbc4]/40 text-[#6b4c57]"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {descargando ? 'Generando...' : 'PDF'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {r && (
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {[
                  { label: 'Reservas', valor: r.total, clase: 'text-[#4a3540]' },
                  { label: 'Coinciden', valor: r.coincide, clase: 'text-green-600' },
                  { label: 'Se hizo otro', valor: r.distinto, clase: 'text-rose-600' },
                  { label: 'Parcial', valor: r.parcial, clase: 'text-amber-600' },
                  { label: 'Sin usar', valor: r.sinUsar, clase: 'text-gray-500' },
                ].map((m) => (
                  <Card key={m.label} className="border border-[#f9bbc4]/30 bg-white/95">
                    <CardContent className="p-3">
                      <div className="text-xs text-[#6b4c57]">{m.label}</div>
                      <div className={`mt-1 text-2xl font-bold ${m.clase}`}>{m.valor}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {cargando ? (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            ) : !data ? (
              <Card className="border border-[#f9bbc4]/30 bg-white/95">
                <CardContent className="py-16 text-center text-sm text-[#8b5a6b]">
                  <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-[#d4a7ca]" />
                  Elegí un rango de fechas y tocá “Ver”. Solo aparecen las reservas que entraron
                  desde que se activó la integración con turnos.
                </CardContent>
              </Card>
            ) : data.filas.length === 0 ? (
              <Card className="border border-[#f9bbc4]/30 bg-white/95">
                <CardContent className="py-16 text-center text-sm text-[#8b5a6b]">
                  No hay reservas para mostrar en este período.
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-[#f9bbc4]/20 text-left text-xs text-[#8b5a6b]">
                        <th className="p-3">Turno</th>
                        <th className="p-3">Clienta</th>
                        <th className="p-3">Reservó</th>
                        <th className="p-3">Se hizo</th>
                        <th className="p-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.filas.map((f) => {
                        const est = estadoDe(f);
                        return (
                          <tr key={f.prepagoId} className="border-b border-[#f9bbc4]/10 hover:bg-[#f9bbc4]/5">
                            <td className="whitespace-nowrap p-3 text-[#6b4c57]">{fechaCorta(f.fechaTurno)}</td>
                            <td className="p-3 font-medium text-[#4a3540]">{f.clienta}</td>
                            <td className="p-3 text-[#6b4c57]">{f.servicioReservado}</td>
                            <td className={`p-3 ${est === 'DISTINTO' ? 'text-rose-600' : 'text-[#6b4c57]'}`}>
                              {f.estadoUso === 'SIN_USAR' ? '—' : f.serviciosTomados.join(', ') || '—'}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={BADGE[est]?.clase}>
                                {BADGE[est]?.texto ?? est}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
