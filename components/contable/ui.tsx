'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Building2, CheckCircle2, CircleDashed, Clock, Timer, User } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Deuda, EstadoDeuda, Moneda, TipoAcreedor } from '@/services/contable.service';

/**
 * Piezas chicas de la vista contable. Paleta: tinta ciruela sobre blanco, el
 * rosa de la marca para "deuda" y un azul para "pagos" (par validado para
 * daltonismo). Los estados usan su propio color + ícono + texto.
 */
export const COLOR = {
  deuda: '#d05f86',
  pagos: '#3565b8',
  tinta: '#3d2a32',
  tinta2: '#6b4c57',
  tenue: '#9a7d88',
  grilla: '#f1e4e8',
} as const;

// ─── Formatos ───────────────────────────────────────────────────

export function formatMonto(n: number, moneda: Moneda): string {
  const cuerpo = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
  return moneda === 'USD' ? `US$ ${cuerpo}` : `$ ${cuerpo}`;
}

/** Para ejes y etiquetas chicas: "$ 1,2 M", "US$ 15 k". */
export function formatMontoCorto(n: number, moneda: Moneda): string {
  const abs = Math.abs(n);
  const pref = `${n < 0 ? '−' : ''}${moneda === 'USD' ? 'US$ ' : '$ '}`;
  const f = (v: number, suf: string) =>
    `${pref}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: v < 10 ? 1 : 0 }).format(v)}${suf}`;
  if (abs >= 1_000_000) return f(abs / 1_000_000, ' M');
  if (abs >= 1_000) return f(abs / 1_000, ' k');
  return f(abs, '');
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "2026-09" → "sep" / "septiembre 2026". */
export function nombreMes(mes: string, largo = false): string {
  const [y, m] = mes.split('-').map(Number);
  return largo ? `${MESES_LARGOS[m - 1]} ${y}` : MESES_CORTOS[m - 1];
}

/** Date local → "AAAA-MM-DD" (sin pasar por UTC). */
export function diaDeFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fechaDeDia(dia: string | null | undefined): Date | undefined {
  if (!dia) return undefined;
  const [y, m, d] = dia.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function hoyLocal(): string {
  return diaDeFecha(new Date());
}

/** Días entre hoy y un día (negativo = ya pasó). */
export function diasHasta(dia: string, hoy = hoyLocal()): number {
  return Math.round((fechaDeDia(dia)!.getTime() - fechaDeDia(hoy)!.getTime()) / 86_400_000);
}

/** "hace 5 min", "hace 3 h", "hace 2 días". */
export function haceCuanto(iso: string): string {
  const seg = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return 'recién';
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`;
  const d = Math.floor(seg / 86400);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

// ─── Piezas ─────────────────────────────────────────────────────

export function Panel({
  titulo,
  subtitulo,
  accion,
  children,
  className,
  cuerpoClassName,
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  accion?: ReactNode;
  children: ReactNode;
  className?: string;
  cuerpoClassName?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[#f0dde3] bg-white/90 shadow-[0_1px_2px_rgba(139,90,107,0.06),0_8px_24px_-12px_rgba(139,90,107,0.18)]',
        className,
      )}
    >
      {(titulo || accion) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            {titulo && <h3 className="text-[15px] font-semibold text-[#3d2a32]">{titulo}</h3>}
            {subtitulo && <p className="mt-0.5 text-xs text-[#9a7d88]">{subtitulo}</p>}
          </div>
          {accion}
        </header>
      )}
      <div className={cn('p-5', cuerpoClassName)}>{children}</div>
    </section>
  );
}

export function IconoAcreedor({ tipo, className }: { tipo: TipoAcreedor; className?: string }) {
  const Icono = tipo === 'EMPRESA' ? Building2 : User;
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fbeef2] text-[#8b5a6b]',
        className,
      )}
      title={tipo === 'EMPRESA' ? 'Empresa' : 'Persona'}
    >
      <Icono className="h-4 w-4" />
    </span>
  );
}

const ESTADOS: Record<EstadoDeuda | 'VENCIDA', { texto: string; clase: string; Icono: typeof Clock }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'bg-[#fbeef2] text-[#8b5a6b]', Icono: CircleDashed },
  PARCIAL: { texto: 'Pago parcial', clase: 'bg-amber-50 text-amber-800', Icono: Clock },
  SALDADA: { texto: 'Saldada', clase: 'bg-emerald-50 text-emerald-800', Icono: CheckCircle2 },
  VENCIDA: { texto: 'Vencida', clase: 'bg-red-50 text-red-700', Icono: AlertTriangle },
};

export function EstadoBadge({ deuda }: { deuda: Pick<Deuda, 'estado' | 'vencida'> }) {
  const e = ESTADOS[deuda.vencida ? 'VENCIDA' : deuda.estado];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', e.clase)}>
      <e.Icono className="h-3 w-3" />
      {e.texto}
    </span>
  );
}

/** Aviso de cuánto queda para corregir algo (regla de 24 h). */
export function VentanaEdicion({ hasta }: { hasta: string }) {
  const restanteMin = Math.max(0, Math.floor((new Date(hasta).getTime() - Date.now()) / 60000));
  if (restanteMin <= 0) return null;
  const texto = restanteMin >= 60 ? `${Math.floor(restanteMin / 60)} h` : `${restanteMin} min`;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800"
      title="Se puede editar o borrar durante las primeras 24 h"
    >
      <Timer className="h-3 w-3" />
      Editable {texto} más
    </span>
  );
}

/** Barra de avance de lo pagado sobre el total. */
export function BarraAvance({ pagado, total, className }: { pagado: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.min(100, (pagado / total) * 100) : 0;
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#f4e6ea]', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Porcentaje pagado"
    >
      <div className="h-full rounded-full bg-[#3565b8] transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SelectorMoneda({ valor, onCambio }: { valor: Moneda; onCambio: (m: Moneda) => void }) {
  return (
    <div className="inline-flex rounded-full border border-[#f0dde3] bg-white p-0.5 shadow-sm" role="radiogroup" aria-label="Moneda">
      {(['ARS', 'USD'] as Moneda[]).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={valor === m}
          onClick={() => onCambio(m)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            valor === m ? 'bg-[#8b5a6b] text-white shadow' : 'text-[#6b4c57] hover:bg-[#fbeef2]',
          )}
        >
          {m === 'ARS' ? 'Pesos' : 'Dólares'}
        </button>
      ))}
    </div>
  );
}

/** Monto con decimales en formato argentino ("150.000,50"). */
export function MontoInput({
  valor,
  onCambio,
  moneda,
  disabled,
  id,
  autoFocus,
}: {
  valor: number;
  onCambio: (n: number) => void;
  moneda: Moneda;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
}) {
  const aTexto = (n: number) =>
    n ? new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n) : '';
  const [texto, setTexto] = useState(aTexto(valor));
  const editando = useRef(false);

  useEffect(() => {
    if (!editando.current) setTexto(aTexto(valor));
  }, [valor]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[#9a7d88]">
        {moneda === 'USD' ? 'US$' : '$'}
      </span>
      <Input
        id={id}
        autoFocus={autoFocus}
        inputMode="decimal"
        disabled={disabled}
        value={texto}
        className={cn('text-right text-base tabular-nums', moneda === 'USD' ? 'pl-12' : 'pl-7')}
        placeholder="0"
        onFocus={() => (editando.current = true)}
        onBlur={() => {
          editando.current = false;
          setTexto(aTexto(valor));
        }}
        onChange={(e) => {
          // Sólo dígitos y una coma decimal; los puntos son de miles.
          const limpio = e.target.value.replace(/[^\d,]/g, '');
          const [ent, ...dec] = limpio.split(',');
          const decimales = dec.join('').slice(0, 2);
          const entero = ent.replace(/^0+(?=\d)/, '');
          const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          setTexto(limpio.includes(',') ? `${conMiles},${decimales}` : conMiles);
          onCambio(Number(`${entero || '0'}.${decimales || '0'}`));
        }}
      />
    </div>
  );
}

/** DatePicker del sistema, pero con días "AAAA-MM-DD". */
export function SelectorDia({
  valor,
  onCambio,
  placeholder,
  disabled,
}: {
  valor: string | null;
  onCambio: (dia: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <DatePicker
      key={valor ?? 'vacio'}
      date={fechaDeDia(valor)}
      onDateChange={(d) => onCambio(d ? diaDeFecha(d) : null)}
      placeholder={placeholder}
      disabled={disabled}
      accentColor="#8b5a6b"
    />
  );
}

export function Vacio({ icono, titulo, texto, accion }: { icono: ReactNode; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbeef2] text-[#8b5a6b]">{icono}</div>
      <p className="font-medium text-[#3d2a32]">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-[#9a7d88]">{texto}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

export function Cargando({ alto = 'h-40' }: { alto?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[#f7ecef]', alto)} />;
}
