'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Moneda, PuntoSerie } from '@/services/contable.service';
import { COLOR, formatMonto, formatMontoCorto, nombreMes } from './ui';

/** Ancho real del contenedor, para dibujar el SVG en píxeles (texto sin deformar). */
function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho] as const;
}

/** Escala "linda": máximo redondeado y 4 marcas. */
function escala(max: number) {
  if (max <= 0) return { tope: 1, marcas: [0] };
  const bruto = max / 4;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * pot).find((p) => p >= bruto)!;
  const tope = paso * Math.ceil(max / paso);
  const marcas: number[] = [];
  for (let v = 0; v <= tope + paso / 2; v += paso) marcas.push(v);
  return { tope, marcas };
}

function Tooltip({ x, y, anchoContenedor, children }: { x: number; y: number; anchoContenedor: number; children: ReactNode }) {
  const izquierda = x > anchoContenedor - 190;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-[160px] rounded-xl border border-[#f0dde3] bg-white px-3 py-2 text-xs shadow-lg"
      style={{
        left: izquierda ? undefined : x + 12,
        right: izquierda ? anchoContenedor - x + 12 : undefined,
        top: Math.max(0, y - 10),
      }}
    >
      {children}
    </div>
  );
}

function FilaTooltip({ color, etiqueta, valor }: { color?: string; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="flex items-center gap-1.5 text-[#6b4c57]">
        {color && <span className="h-2 w-2 rounded-sm" style={{ background: color }} />}
        {etiqueta}
      </span>
      <span className="font-semibold text-[#3d2a32] tabular-nums">{valor}</span>
    </div>
  );
}

export function Leyenda({ items }: { items: { color: string; texto: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-[#6b4c57]">
      {items.map((i) => (
        <span key={i.texto} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.texto}
        </span>
      ))}
    </div>
  );
}

const MARGEN = { arriba: 12, derecha: 8, abajo: 26, izquierda: 64 };

/** Barras agrupadas por mes: deuda nueva vs pagos. */
export function BarrasMensuales({ serie, moneda, alto = 240 }: { serie: PuntoSerie[]; moneda: Moneda; alto?: number }) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [activo, setActivo] = useState<number | null>(null);
  const datos = serie.map((p) => p[moneda]);
  const { tope, marcas } = escala(Math.max(0, ...datos.flatMap((d) => [d.deuda, d.pagos])));

  const w = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha);
  const h = alto - MARGEN.arriba - MARGEN.abajo;
  const banda = serie.length ? w / serie.length : 0;
  const anchoBarra = Math.max(3, Math.min(18, (banda - 10) / 2));
  const y = (v: number) => MARGEN.arriba + h - (v / tope) * h;
  const cada = banda < 34 ? 2 : 1;

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setActivo(null)}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} role="img" aria-label="Deuda nueva y pagos por mes">
          {marcas.map((m) => (
            <g key={m}>
              <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(m)} y2={y(m)} stroke={COLOR.grilla} />
              <text x={MARGEN.izquierda - 8} y={y(m)} dy="0.32em" textAnchor="end" fontSize="11" fill={COLOR.tenue}>
                {formatMontoCorto(m, moneda)}
              </text>
            </g>
          ))}
          {serie.map((p, i) => {
            const cx = MARGEN.izquierda + banda * i + banda / 2;
            const d = p[moneda];
            return (
              <g key={p.mes}>
                {activo === i && (
                  <rect x={cx - banda / 2} y={MARGEN.arriba} width={banda} height={h} fill="#8b5a6b" opacity={0.05} rx={6} />
                )}
                {[
                  { v: d.deuda, color: COLOR.deuda, x: cx - anchoBarra - 1 },
                  { v: d.pagos, color: COLOR.pagos, x: cx + 1 },
                ].map((b, j) =>
                  b.v > 0 ? (
                    <path
                      key={j}
                      d={barraRedondeada(b.x, y(b.v), anchoBarra, MARGEN.arriba + h - y(b.v))}
                      fill={b.color}
                    />
                  ) : null,
                )}
                {i % cada === 0 && (
                  <text x={cx} y={alto - 8} textAnchor="middle" fontSize="11" fill={activo === i ? COLOR.tinta : COLOR.tenue}>
                    {nombreMes(p.mes)}
                  </text>
                )}
                <rect
                  x={cx - banda / 2}
                  y={0}
                  width={banda}
                  height={alto}
                  fill="transparent"
                  onMouseEnter={() => setActivo(i)}
                  onFocus={() => setActivo(i)}
                  tabIndex={0}
                  aria-label={`${nombreMes(p.mes, true)}: deuda nueva ${formatMonto(d.deuda, moneda)}, pagos ${formatMonto(d.pagos, moneda)}`}
                />
              </g>
            );
          })}
          <line
            x1={MARGEN.izquierda}
            x2={ancho - MARGEN.derecha}
            y1={MARGEN.arriba + h}
            y2={MARGEN.arriba + h}
            stroke="#e3cbd3"
          />
        </svg>
      )}
      {activo !== null && ancho > 0 && (
        <Tooltip x={MARGEN.izquierda + banda * activo + banda / 2} y={MARGEN.arriba} anchoContenedor={ancho}>
          <p className="mb-1 font-semibold capitalize text-[#3d2a32]">{nombreMes(serie[activo].mes, true)}</p>
          <FilaTooltip color={COLOR.deuda} etiqueta="Deuda nueva" valor={formatMonto(datos[activo].deuda, moneda)} />
          <FilaTooltip color={COLOR.pagos} etiqueta="Pagos" valor={formatMonto(datos[activo].pagos, moneda)} />
          <div className="mt-1 border-t border-[#f4e6ea] pt-1">
            <FilaTooltip etiqueta="Saldo al cierre" valor={formatMonto(datos[activo].saldo, moneda)} />
          </div>
        </Tooltip>
      )}
    </div>
  );
}

/** Rectángulo con las esquinas de arriba redondeadas (4 px) y la base plana. */
function barraRedondeada(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Evolución del saldo pendiente al cierre de cada mes, con cursor. */
export function LineaSaldo({ serie, moneda, alto = 240 }: { serie: PuntoSerie[]; moneda: Moneda; alto?: number }) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [activo, setActivo] = useState<number | null>(null);
  const valores = serie.map((p) => p[moneda].saldo);
  // El saldo neto puede quedar negativo si se adelantó más de lo que se debía.
  const minimo = Math.min(0, ...valores);
  const maximo = Math.max(0, ...valores);
  const esc = escala(maximo - minimo);
  const pasoEje = esc.marcas.length > 1 ? esc.marcas[1] - esc.marcas[0] : 1;
  const piso = minimo < 0 ? Math.floor(minimo / pasoEje) * pasoEje : 0;
  const marcas: number[] = [];
  for (let v = piso; v < maximo + pasoEje; v += pasoEje) marcas.push(v);
  const tope = marcas[marcas.length - 1];

  const w = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha - 8);
  const h = alto - MARGEN.arriba - MARGEN.abajo;
  const paso = serie.length > 1 ? w / (serie.length - 1) : 0;
  const x = (i: number) => MARGEN.izquierda + 4 + paso * i;
  const y = (v: number) => MARGEN.arriba + h - ((v - piso) / (tope - piso || 1)) * h;
  const linea = valores.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('');
  const area = `${linea}L${x(valores.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const cada = paso < 34 ? 2 : 1;

  const alMover = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round((e.clientX - rect.left - x(0)) / (paso || 1));
    setActivo(Math.max(0, Math.min(serie.length - 1, i)));
  };

  return (
    <div ref={ref} className="relative w-full">
      {ancho > 0 && (
        <svg
          width={ancho}
          height={alto}
          role="img"
          aria-label="Saldo neto al cierre de cada mes"
          onMouseMove={alMover}
          onMouseLeave={() => setActivo(null)}
        >
          <defs>
            <linearGradient id={`relleno-saldo-${moneda}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5a6b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8b5a6b" stopOpacity="0" />
            </linearGradient>
          </defs>
          {marcas.map((m) => (
            <g key={m}>
              <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(m)} y2={y(m)} stroke={COLOR.grilla} />
              <text x={MARGEN.izquierda - 8} y={y(m)} dy="0.32em" textAnchor="end" fontSize="11" fill={COLOR.tenue}>
                {formatMontoCorto(m, moneda)}
              </text>
            </g>
          ))}
          <path d={area} fill={`url(#relleno-saldo-${moneda})`} />
          <path d={linea} fill="none" stroke="#8b5a6b" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {serie.map((p, i) =>
            i % cada === 0 ? (
              <text key={p.mes} x={x(i)} y={alto - 8} textAnchor="middle" fontSize="11" fill={activo === i ? COLOR.tinta : COLOR.tenue}>
                {nombreMes(p.mes)}
              </text>
            ) : null,
          )}
          {/* Último punto siempre marcado: es "hoy". */}
          <circle cx={x(valores.length - 1)} cy={y(valores[valores.length - 1] ?? 0)} r={4.5} fill="#8b5a6b" stroke="white" strokeWidth={2} />
          {activo !== null && (
            <>
              <line x1={x(activo)} x2={x(activo)} y1={MARGEN.arriba} y2={MARGEN.arriba + h} stroke="#c9a9b5" strokeDasharray="3 3" />
              <circle cx={x(activo)} cy={y(valores[activo])} r={5} fill="#8b5a6b" stroke="white" strokeWidth={2} />
            </>
          )}
        </svg>
      )}
      {activo !== null && ancho > 0 && (
        <Tooltip x={x(activo)} y={y(valores[activo]) - 20} anchoContenedor={ancho}>
          <p className="mb-1 font-semibold capitalize text-[#3d2a32]">{nombreMes(serie[activo].mes, true)}</p>
          <FilaTooltip
            color="#8b5a6b"
            etiqueta={valores[activo] < 0 ? 'Adelantado de más' : 'Saldo neto'}
            valor={formatMonto(Math.abs(valores[activo]), moneda)}
          />
        </Tooltip>
      )}
    </div>
  );
}

/** Ranking horizontal (saldo por acreedor). Etiquetas directas, sin ejes. */
export function BarrasHorizontales({
  items,
  moneda,
  onClick,
}: {
  items: { id: string; nombre: string; valor: number; extra?: ReactNode }[];
  moneda: Moneda;
  onClick?: (id: string) => void;
}) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  const total = items.reduce((s, i) => s + i.valor, 0);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.id}>
          <button
            type="button"
            onClick={() => onClick?.(i.id)}
            className="group w-full rounded-lg text-left focus-visible:ring-2 focus-visible:ring-[#d4a7ca] focus-visible:outline-none"
            title={`${i.nombre}: ${formatMonto(i.valor, moneda)} (${total ? Math.round((i.valor / total) * 100) : 0}% del total)`}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 truncate text-[#3d2a32] group-hover:text-[#8b5a6b]">
                <span className="truncate">{i.nombre}</span>
                {i.extra}
              </span>
              <span className="shrink-0 font-semibold text-[#3d2a32] tabular-nums">{formatMonto(i.valor, moneda)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#f7ecef]">
              <div
                className="h-full rounded-full bg-[#d05f86] transition-[width] duration-500 group-hover:bg-[#b84d74]"
                style={{ width: `${(i.valor / max) * 100}%` }}
              />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
