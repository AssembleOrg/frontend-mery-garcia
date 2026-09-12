'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Spinner from '@/components/common/Spinner';
import { AlertTriangle, Clock, LogIn, LogOut, UserCheck, UserX, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { presentismoService, type PresentismoHoy } from '@/services/presentismo.service';

/** Lo que llega por el stream cuando alguien ficha. */
interface EventoFichaje {
  nombre: string | null;
  kind: string;
  presente: boolean;
  happenedAt: string;
  aRevisar: boolean;
  motivo: string | null;
}

const TONOS: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  alerta: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function TabHoy() {
  const [datos, setDatos] = useState<PresentismoHoy | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enVivo, setEnVivo] = useState(false);
  const [ultimos, setUltimos] = useState<EventoFichaje[]>([]);
  const cargandoRef = useRef(false);

  /**
   * Se relee todo en vez de parchear el estado con lo que trae el evento: si
   * se perdió alguno durante una reconexión, la pantalla queda bien igual.
   */
  const cargar = useCallback(async () => {
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    try {
      setDatos(await presentismoService.hoy());
    } catch (error) {
      console.error('Error cargando presentismo:', error);
      toast.error('No se pudo cargar el presentismo de hoy');
    } finally {
      cargandoRef.current = false;
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Stream de eventos: el backend avisa apenas alguien entra o sale.
  useEffect(() => {
    const source = new EventSource(presentismoService.urlEventos());

    source.onopen = () => setEnVivo(true);
    source.onerror = () => setEnVivo(false); // EventSource reintenta solo.

    source.addEventListener('fichaje', (e) => {
      const evento = JSON.parse((e as MessageEvent).data) as EventoFichaje;
      setUltimos((previos) => [evento, ...previos].slice(0, 8));

      const quien = evento.nombre ?? 'Alguien';
      const que = evento.kind === 'ENTRADA' ? 'entró' : evento.kind === 'SALIDA' ? 'salió' : 'fichó';
      if (evento.aRevisar) {
        toast.warning(`${quien} ${que} · a revisar`, { description: evento.motivo ?? undefined });
      } else {
        toast.success(`${quien} ${que}`);
      }
      void cargar();
    });

    return () => source.close();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!datos) return null;

  const metricas = [
    { label: 'Trabajando ahora', valor: datos.metrics.onShift, icono: UserCheck, color: 'text-emerald-600' },
    { label: 'Llegaron tarde', valor: datos.metrics.late, icono: Clock, color: 'text-amber-600' },
    { label: 'Faltaron', valor: datos.metrics.absent, icono: UserX, color: 'text-rose-600' },
    { label: 'A revisar', valor: datos.metrics.toReview, icono: AlertTriangle, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado con reloj y estado del stream */}
      <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-[#4a3540]">{datos.dateLabel}</div>
            <div className="text-sm text-[#8b5a6b]">
              {datos.teamSize} {datos.teamSize === 1 ? 'persona' : 'personas'} en el equipo
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tabular-nums text-[#4a3540]">{datos.clock}</span>
            <Badge
              variant="outline"
              className={
                enVivo
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-500'
              }
            >
              {enVivo ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
              {enVivo ? 'En vivo' : 'Reconectando…'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricas.map(({ label, valor, icono: Icono, color }) => (
          <Card key={label} className="border border-[#f9bbc4]/30 bg-white/95">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-[#6b4c57]">
                <Icono className={`h-4 w-4 ${color}`} />
                <span>{label}</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-[#4a3540]">{valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Quién está adentro */}
        <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#4a3540]">
              <UserCheck className="h-5 w-5" />
              Trabajando ahora
            </CardTitle>
          </CardHeader>
          <CardContent>
            {datos.onNow.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#8b5a6b]">
                No hay nadie fichado en este momento.
              </p>
            ) : (
              <ul className="space-y-2">
                {datos.onNow.map((persona) => (
                  <li
                    key={persona.userId}
                    className="flex items-center justify-between rounded-md bg-[#f9bbc4]/10 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-xs font-bold text-white">
                        {persona.initials}
                      </span>
                      <div>
                        <div className="font-medium text-[#4a3540]">{persona.name}</div>
                        <div className="text-xs text-[#8b5a6b]">{persona.detail}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={TONOS[persona.statusTone] ?? TONOS.info}>
                      {persona.statusLabel}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Marcas que fueron llegando mientras la pantalla está abierta */}
        <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#4a3540]">
              <Clock className="h-5 w-5" />
              Últimas marcas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimos.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#8b5a6b]">
                Las entradas y salidas van a aparecer acá apenas alguien fiche.
              </p>
            ) : (
              <ul className="space-y-2">
                {ultimos.map((evento, i) => (
                  <li
                    key={`${evento.happenedAt}-${i}`}
                    className="flex items-center justify-between rounded-md border border-[#e8b4c6]/30 p-3"
                  >
                    <div className="flex items-center gap-2">
                      {evento.presente ? (
                        <LogIn className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <LogOut className="h-4 w-4 text-rose-600" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-[#4a3540]">
                          {evento.nombre ?? 'Sin nombre'}
                        </div>
                        <div className="text-xs text-[#8b5a6b]">
                          {evento.kind.toLowerCase().replace('_', ' ')} ·{' '}
                          {new Date(evento.happenedAt).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    {evento.aRevisar && (
                      <Badge variant="outline" className={TONOS.alerta} title={evento.motivo ?? ''}>
                        A revisar
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
