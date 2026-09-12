'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import Spinner from '@/components/common/Spinner';
import { Download, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  duracion,
  fechaCorta,
  reportesService,
  type EstadoDia,
  type ReporteAsistencia,
  type RevisionDia,
} from '@/services/presentismo.service';

const ESTADO: Record<EstadoDia, { texto: string; clase: string }> = {
  TRABAJADO: { texto: 'Trabajado', clase: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  INCOMPLETO: { texto: 'Incompleto', clase: 'border-amber-200 bg-amber-50 text-amber-700' },
  AUSENTE: { texto: 'Ausente', clase: 'border-rose-200 bg-rose-50 text-rose-700' },
  LICENCIA: { texto: 'Licencia', clase: 'border-sky-200 bg-sky-50 text-sky-700' },
  SIN_TURNO: { texto: 'Sin turno', clase: 'border-neutral-200 bg-neutral-50 text-neutral-600' },
};

const REVISION: Record<RevisionDia, { texto: string; clase: string }> = {
  VALIDO: { texto: 'Justificado', clase: 'text-emerald-700' },
  PENDIENTE: { texto: 'A revisar', clase: 'text-amber-700' },
  RECHAZADO: { texto: 'Rechazado', clase: 'text-rose-700' },
};

/** Date → YYYY-MM-DD, sin correrse de día por el huso. */
function aFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function inicioDeMes(): DateRange {
  const hoy = new Date();
  return { from: new Date(hoy.getFullYear(), hoy.getMonth(), 1), to: hoy };
}

export default function TabReportes() {
  const [rango, setRango] = useState<DateRange | undefined>(inicioDeMes);
  const [datos, setDatos] = useState<ReporteAsistencia | null>(null);
  const [cargando, setCargando] = useState(false);

  const buscar = useCallback(async () => {
    if (!rango?.from || !rango?.to) {
      toast.error('Elegí un período');
      return;
    }
    setCargando(true);
    try {
      setDatos(await reportesService.asistencia(aFecha(rango.from), aFecha(rango.to)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el reporte');
    } finally {
      setCargando(false);
    }
  }, [rango]);

  const [bajando, setBajando] = useState(false);

  const descargar = async () => {
    if (!rango?.from || !rango?.to) return;
    setBajando(true);
    try {
      await reportesService.descargarPdf(aFecha(rango.from), aFecha(rango.to));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo bajar el PDF');
    } finally {
      setBajando(false);
    }
  };

  const resumen = datos?.summary;

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DateRangePicker dateRange={rango} onDateRangeChange={setRango} />
            <Button onClick={buscar} disabled={cargando} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Ver reporte
            </Button>
          </div>
          <Button
            onClick={descargar}
            disabled={!datos || cargando || bajando}
            className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </CardContent>
      </Card>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !datos ? (
        <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#d4a7ca]" />
            <p className="text-sm text-[#8b5a6b]">
              Elegí un período y tocá «Ver reporte» para ver entradas, salidas y horas de
              cada persona.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen */}
          {resumen && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Horas trabajadas', valor: `${(resumen.workedMinutes / 60).toFixed(1)} h`, alerta: false },
                { label: 'Horas planificadas', valor: `${(resumen.plannedMinutes / 60).toFixed(1)} h`, alerta: false },
                { label: 'Días con llegada tarde', valor: String(resumen.lateDays), alerta: resumen.lateDays > 0 },
                { label: 'Días a revisar', valor: String(resumen.pendingDays), alerta: resumen.pendingDays > 0 },
              ].map((m) => (
                <Card key={m.label} className="border border-[#f9bbc4]/30 bg-white/95">
                  <CardContent className="p-4">
                    <div className="text-xs text-[#6b4c57]">{m.label}</div>
                    <div
                      className={`mt-1 text-2xl font-bold ${
                        m.alerta ? 'text-amber-600' : 'text-[#4a3540]'
                      }`}
                    >
                      {m.valor}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Detalle */}
          <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#f9bbc4]/30 text-xs text-[#6b4c57]">
                      <th className="p-3 text-left font-semibold">Persona</th>
                      <th className="p-3 text-left font-semibold">Fecha</th>
                      <th className="p-3 text-left font-semibold">Turno</th>
                      <th className="p-3 text-left font-semibold">Entrada</th>
                      <th className="p-3 text-left font-semibold">Salida</th>
                      <th className="p-3 text-right font-semibold">Pausa</th>
                      <th className="p-3 text-right font-semibold">Trabajado</th>
                      <th className="p-3 text-right font-semibold">Saldo</th>
                      <th className="p-3 text-right font-semibold">Tarde</th>
                      <th className="p-3 text-left font-semibold">Estado</th>
                      <th className="p-3 text-left font-semibold">Revisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.rows.map((fila, i) => (
                      <tr
                        key={`${fila.userId}-${fila.day}`}
                        className={`border-b border-[#f9bbc4]/10 ${
                          i % 2 === 0 ? 'bg-[#f9bbc4]/5' : ''
                        }`}
                      >
                        <td className="p-3 font-medium text-[#4a3540]">{fila.fullName}</td>
                        <td className="p-3 text-[#6b4c57]">{fechaCorta(fila.day)}</td>
                        <td className="p-3 text-[#6b4c57]">
                          {fila.shiftStart ? `${fila.shiftStart}–${fila.shiftEnd}` : '—'}
                        </td>
                        <td className="p-3 text-[#4a3540]">{fila.checkIn ?? '—'}</td>
                        <td className="p-3 text-[#4a3540]">{fila.checkOut ?? '—'}</td>
                        <td className="p-3 text-right text-[#6b4c57]">
                          {fila.breakMinutes ? duracion(fila.breakMinutes) : '—'}
                        </td>
                        <td className="p-3 text-right font-medium text-[#4a3540]">
                          {duracion(fila.workedMinutes)}
                        </td>
                        <td
                          className={`p-3 text-right ${
                            fila.balanceMinutes < 0 ? 'text-rose-600' : 'text-[#6b4c57]'
                          }`}
                        >
                          {fila.plannedMinutes ? duracion(fila.balanceMinutes) : '—'}
                        </td>
                        <td
                          className={`p-3 text-right ${
                            fila.lateMinutes > 0 ? 'text-amber-600' : 'text-[#6b4c57]'
                          }`}
                        >
                          {fila.lateMinutes ? `${fila.lateMinutes}m` : '—'}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={ESTADO[fila.state].clase}>
                            {ESTADO[fila.state].texto}
                          </Badge>
                        </td>
                        <td
                          className={`p-3 text-xs ${
                            fila.review ? REVISION[fila.review].clase : 'text-[#8b5a6b]'
                          }`}
                          title={fila.reviewReason ?? undefined}
                        >
                          {fila.review ? REVISION[fila.review].texto : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {datos.rows.length === 0 && (
                <p className="py-12 text-center text-sm text-[#8b5a6b]">
                  No hubo movimientos en el período elegido.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
