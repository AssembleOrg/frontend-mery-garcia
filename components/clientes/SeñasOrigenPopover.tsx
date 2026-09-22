'use client';

import { useRef, useState, type ReactNode } from 'react';
import { CalendarClock, Info, Store } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { PrepagoGuardadoNew } from '@/services/unidadNegocio.service';

const METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  QR: 'QR',
  GIFT_CARD: 'Gift card',
  MERCADO_PAGO: 'Mercado Pago',
};

const TZ = 'America/Argentina/Buenos_Aires';

export function señasActivas(
  prepagos: PrepagoGuardadoNew[] | undefined,
  moneda: 'ARS' | 'USD',
): PrepagoGuardadoNew[] {
  return (prepagos ?? [])
    .filter(
      (p) =>
        !p.deletedAt &&
        (p.estado === 'ACTIVO' || (p.estado as string) === 'ACTIVA') &&
        p.moneda === moneda,
    )
    .sort(
      (a, b) =>
        new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime(),
    );
}

export function formatoMonto(monto: number, moneda: 'ARS' | 'USD') {
  const n = Math.round(Number(monto)).toLocaleString('es-AR');
  return moneda === 'USD' ? `USD ${n}` : `$${n}`;
}

export function fechaCorta(iso?: string | null, conHora = false) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(conHora ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  });
}

/** Texto de observaciones sin el relleno automático del sistema. */
function notaUtil(obs?: string) {
  const t = (obs ?? '').trim();
  if (!t || /^Seña (ARS|USD) creada( automáticamente)?$/i.test(t)) return '';
  return t;
}

function Fila({ seña, moneda }: { seña: PrepagoGuardadoNew; moneda: 'ARS' | 'USD' }) {
  const online = !!seña.bookingCode;
  const servicios = seña.serviciosReservados?.length
    ? seña.serviciosReservados.join(', ')
    : seña.servicioReservado;
  const nota = notaUtil(seña.observaciones);
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-[#4a3540] tabular-nums">
          {formatoMonto(seña.monto, moneda)}
        </span>
        <span className="text-xs text-[#8b5a6b]">{fechaCorta(seña.fechaCreacion)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-[#f9bbc4]/25 px-2 py-0.5 text-[11px] font-medium text-[#6b4c57]">
          {METODO[seña.tipoPago ?? ''] ?? seña.tipoPago ?? 'Sin método'}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-[#6b4c57]">
          {online ? (
            <>
              <CalendarClock className="h-3 w-3" /> Reserva online {seña.bookingCode}
            </>
          ) : (
            <>
              <Store className="h-3 w-3" /> Carga manual en caja
            </>
          )}
        </span>
      </div>
      {(servicios || seña.empleadoReservado || seña.fechaTurno) && (
        <p className="mt-1 text-[11px] leading-snug text-[#8b5a6b]">
          {[
            servicios,
            seña.empleadoReservado ? `con ${seña.empleadoReservado}` : '',
            seña.fechaTurno ? `turno ${fechaCorta(seña.fechaTurno, true)}` : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {nota && !online && (
        <p className="mt-1 text-[11px] leading-snug text-[#8b5a6b]/80 break-words">{nota}</p>
      )}
    </li>
  );
}

/**
 * Envuelve el badge del total de señas. Si la clienta tiene señas activas en
 * esa moneda, al pasar el mouse (o tocar, en pantallas táctiles) muestra de
 * dónde sale el total: fecha, monto, método de pago original y origen de cada
 * seña.
 */
export function SeñasOrigenPopover({
  prepagos,
  moneda,
  children,
}: {
  prepagos: PrepagoGuardadoNew[] | undefined;
  moneda: 'ARS' | 'USD';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const cierre = useRef<number | null>(null);
  const lista = señasActivas(prepagos, moneda);

  if (lista.length === 0) return <>{children}</>;

  const abrir = () => {
    if (cierre.current) window.clearTimeout(cierre.current);
    setOpen(true);
  };
  const cerrarLuego = () => {
    cierre.current = window.setTimeout(() => setOpen(false), 120);
  };
  const total = lista.reduce((acc, s) => acc + Number(s.monto), 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={abrir}
          onMouseLeave={cerrarLuego}
          onFocus={abrir}
          onBlur={cerrarLuego}
          aria-label={
            lista.length === 1
              ? `Ver el origen de la seña en ${moneda}`
              : `Ver el origen de las ${lista.length} señas en ${moneda}`
          }
          className="inline-flex items-center gap-1 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9bbc4]"
        >
          {children}
          <Info className="h-3.5 w-3.5 shrink-0 text-[#8b5a6b]" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        onMouseEnter={abrir}
        onMouseLeave={cerrarLuego}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-80 border-[#f9bbc4]/40 p-0"
      >
        <div className="border-b border-[#f9bbc4]/30 bg-[#fdf4f6] px-4 py-2.5">
          <p className="text-sm font-semibold text-[#4a3540]">
            Seña {moneda} · {formatoMonto(total, moneda)}
          </p>
          <p className="text-[11px] text-[#8b5a6b]">
            {lista.length === 1
              ? 'Origen de la seña activa'
              : `Suma de ${lista.length} señas activas, de la más antigua a la más nueva`}
          </p>
        </div>
        <ul className="max-h-80 divide-y divide-[#f9bbc4]/25 overflow-y-auto px-4 py-2.5">
          {lista.map((s) => (
            <Fila key={s.id} seña={s} moneda={moneda} />
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
