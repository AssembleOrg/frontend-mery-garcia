'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ClipboardList, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/common/Spinner';
import {
  solicitudesStockService,
  type EstadoSolicitudStock,
  type SolicitudStock,
} from '@/services/stock.service';
import { ESTADOS_SOLICITUD, fechaSolicitud, horaAutoconfirma, resumenItems } from './estadosSolicitud';

const FILTROS: { valor: EstadoSolicitudStock | 'TODAS'; texto: string }[] = [
  { valor: 'PENDIENTE', texto: 'Pendientes' },
  { valor: 'APROBADA', texto: 'Confirmadas' },
  { valor: 'RECHAZADA', texto: 'Anuladas' },
  { valor: 'TODAS', texto: 'Todas' },
];

type Periodo = 'hoy' | '7' | '30';
const PERIODOS: { valor: Periodo; texto: string }[] = [
  { valor: 'hoy', texto: 'Hoy' },
  { valor: '7', texto: '7 días' },
  { valor: '30', texto: '30 días' },
];

/** AAAA-MM-DD en el salón, `dias` días atrás. */
const diaSalon = (dias = 0) =>
  new Date(Date.now() - dias * 86_400_000).toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });

/**
 * Productos que el personal anota (desde Ritmo o el panel). Lo que nadie
 * anula se confirma solo a la hora; acá se puede confirmar o anular en
 * cualquier momento, salvo lo que ella misma canceló. Se refresca solo
 * cuando entra un aviso nuevo.
 */
export default function PanelSolicitudes({ onPendientes }: { onPendientes?: (n: number) => void }) {
  const [filtro, setFiltro] = useState<EstadoSolicitudStock | 'TODAS'>('PENDIENTE');
  const [periodo, setPeriodo] = useState<Periodo>('7');
  const [solicitudes, setSolicitudes] = useState<SolicitudStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resolviendo, setResolviendo] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, pendientes] = await Promise.all([
        solicitudesStockService.listar({
          ...(filtro === 'TODAS' ? {} : { estado: filtro }),
          // Lo pendiente se muestra siempre entero: es lo que hay que mirar.
          ...(filtro === 'PENDIENTE' ? {} : { desde: diaSalon(periodo === 'hoy' ? 0 : Number(periodo) - 1) }),
        }),
        solicitudesStockService.pendientes(),
      ]);
      setSolicitudes(lista);
      onPendientes?.(pendientes);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar las solicitudes');
    } finally {
      setCargando(false);
    }
  }, [filtro, periodo, onPendientes]);

  useEffect(() => {
    setCargando(true);
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const alAviso = (e: Event) => {
      const tipo = (e as CustomEvent<{ tipo?: string }>).detail?.tipo;
      if (tipo === 'SOLICITUD_STOCK') void cargar();
    };
    window.addEventListener('mery:notificacion', alAviso);
    return () => window.removeEventListener('mery:notificacion', alAviso);
  }, [cargar]);

  const resolver = async (s: SolicitudStock, accion: 'aprobar' | 'rechazar') => {
    setResolviendo(s.id);
    try {
      const actualizada = await solicitudesStockService.resolver(s.id, accion, respuestas[s.id]);
      setSolicitudes((prev) =>
        filtro === 'TODAS' || filtro === actualizada.estado
          ? prev.map((x) => (x.id === s.id ? actualizada : x))
          : prev.filter((x) => x.id !== s.id),
      );
      toast.success(accion === 'aprobar' ? 'Confirmado' : 'Anulado');
      void solicitudesStockService.pendientes().then((n) => onPendientes?.(n));
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar (quizás ella lo canceló recién)');
      void cargar();
    } finally {
      setResolviendo(null);
    }
  };

  return (
    <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[#4a3540]">
          <ClipboardList className="h-5 w-5 text-[#8b5a6b]" />
          Productos que usó el personal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <Button
              key={f.valor}
              type="button"
              size="sm"
              variant={filtro === f.valor ? 'default' : 'outline'}
              onClick={() => setFiltro(f.valor)}
              className={
                filtro === f.valor
                  ? 'h-9 bg-[#d4748c] text-white hover:bg-[#c0607a]'
                  : 'h-9 border-[#f9bbc4]/40 text-[#6b4c57]'
              }
            >
              {f.texto}
            </Button>
          ))}
          {filtro !== 'PENDIENTE' && (
            <div className="ml-auto flex gap-1 rounded-lg bg-[#f9bbc4]/10 p-1" role="group" aria-label="Período">
              {PERIODOS.map((p) => (
                <button
                  key={p.valor}
                  type="button"
                  aria-pressed={periodo === p.valor}
                  onClick={() => setPeriodo(p.valor)}
                  className={`h-7 rounded-md px-2.5 text-xs font-medium ${
                    periodo === p.valor ? 'bg-white text-[#4a3540] shadow-sm' : 'text-[#8b5a6b]'
                  }`}
                >
                  {p.texto}
                </button>
              ))}
            </div>
          )}
        </div>

        {cargando ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : solicitudes.length === 0 ? (
          <p className="rounded-lg border-2 border-dashed border-[#f9bbc4]/40 p-8 text-center text-sm text-[#8b5a6b]">
            {filtro === 'PENDIENTE'
              ? 'No hay nada pendiente. Lo que anotan se confirma solo a la hora.'
              : 'No hay registros en este período.'}
          </p>
        ) : (
          <div className="space-y-3">
            {solicitudes.map((s) => (
              <div key={s.id} className="rounded-lg border border-[#f9bbc4]/25 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium text-[#4a3540]">
                    {s.trabajador.nombre}
                    {s.origen === 'RITMO' && (
                      <span className="rounded bg-[#f9bbc4]/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8b5a6b]">
                        Ritmo
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8b5a6b]">{fechaSolicitud(s.createdAt)}</span>
                    <Badge variant="outline" className={ESTADOS_SOLICITUD[s.estado].clase}>
                      {ESTADOS_SOLICITUD[s.estado].texto}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1.5 text-sm text-[#4a3540]">{resumenItems(s)}</p>
                {s.nota && <p className="mt-1 text-xs text-[#6b4c57]">{s.nota}</p>}
                {s.estado !== 'PENDIENTE' && (s.resueltaPor || s.respuesta) && (
                  <p className="mt-1 text-xs text-[#8b5a6b]">
                    {s.resueltaPor ? `${s.resueltaPor}` : ''}
                    {s.resueltaAt ? ` · ${fechaSolicitud(s.resueltaAt)}` : ''}
                    {s.respuesta ? ` · ${s.respuesta}` : ''}
                  </p>
                )}
                {s.estado === 'PENDIENTE' && s.origen === 'RITMO' && (
                  <p className="mt-1 text-xs text-[#8b5a6b]">Si nadie lo anula, se confirma solo a las {horaAutoconfirma(s.createdAt)}.</p>
                )}
                {(s.estado === 'APROBADA' || s.estado === 'RECHAZADA') && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => resolver(s, s.estado === 'APROBADA' ? 'rechazar' : 'aprobar')}
                      disabled={resolviendo === s.id}
                      className={
                        s.estado === 'APROBADA'
                          ? 'h-8 border-red-200 text-red-600 hover:bg-red-50'
                          : 'h-8 border-[#f9bbc4]/40 text-[#6b4c57]'
                      }
                    >
                      {s.estado === 'APROBADA' ? 'Anular' : 'Confirmar'}
                    </Button>
                  </div>
                )}
                {s.estado === 'PENDIENTE' && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={respuestas[s.id] ?? ''}
                      onChange={(e) => setRespuestas((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      maxLength={300}
                      placeholder="Comentario (opcional)"
                      className="h-10 flex-1 border-[#f9bbc4]/40"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => resolver(s, 'rechazar')}
                        disabled={resolviendo === s.id}
                        variant="outline"
                        className="h-10 flex-1 border-red-200 text-red-600 hover:bg-red-50 sm:flex-none"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Anular
                      </Button>
                      <Button
                        type="button"
                        onClick={() => resolver(s, 'aprobar')}
                        disabled={resolviendo === s.id}
                        className="h-10 flex-1 bg-[#d4748c] font-semibold text-white hover:bg-[#c0607a] sm:flex-none"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
