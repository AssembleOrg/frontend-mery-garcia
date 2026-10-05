'use client';

import { Fragment, type ReactNode } from 'react';
import { cn, formatDiaISO } from '@/lib/utils';
import type { ComandaSistema, Hoja } from '@/services/validacionComandas.service';
import { formatMonto } from '@/components/contable/ui';

/**
 * Gemelo digital: la comanda del sistema dibujada con la misma grilla que la
 * comanda en papel, para compararlas a ojo fila contra fila. Los valores van en
 * "tinta" azul, como en el papel; las filas donde la IA vio diferencias quedan
 * resaltadas con lo que dice el papel.
 */

export type ClaveServicio =
  | 'modelado' | 'modelado mery' | 'tinte cejas' | 'laminado' | 'refill' | 'lifting' | 'tinte pestanas'
  | 'nano' | 'nano retoque' | 'nano mant' | 'lip blush' | 'lashes line' | 'camuflaje' | 'otros';
export type ClaveGemelo = ClaveServicio | 'nombre' | 'fecha' | 'sena' | 'saldo' | 'observaciones';

type Renglon = { seccion: string } | { clave: ClaveServicio; texto: string };
const FORMULARIO: Renglon[] = [
  { seccion: 'CEJAS' },
  { clave: 'modelado', texto: 'MODELADO' },
  { clave: 'modelado mery', texto: 'MODELADO MERY' },
  { clave: 'tinte cejas', texto: 'TINTE DE CEJAS' },
  { clave: 'laminado', texto: 'LAMINADO' },
  { clave: 'refill', texto: 'REFILL' },
  { seccion: 'PESTAÑAS' },
  { clave: 'lifting', texto: 'LIFTING' },
  { clave: 'tinte pestanas', texto: 'TINTE DE PESTAÑAS' },
  { seccion: 'TATTOO COSMETICO' },
  { clave: 'nano', texto: 'NANOBLADING / 1RA SESIÓN' },
  { clave: 'nano retoque', texto: 'NANOBLADING / RETOQUE' },
  { clave: 'nano mant', texto: 'NANOBLADING / MANTENIMIENTO' },
  { clave: 'lip blush', texto: 'LIP BLUSH' },
  { clave: 'lashes line', texto: 'LASHES LINE' },
  { clave: 'camuflaje', texto: 'CAMUFLAJE' },
  { clave: 'otros', texto: 'OTROS' },
];

const norm = (t: string | null | undefined) =>
  (t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).join(' ');

/** Ítem del sistema → fila del papel (lo que no tiene fila propia va a OTROS). */
const MAPA_SISTEMA: [string, ClaveServicio][] = [
  ['modelado de cejas by mery', 'modelado mery'], ['modelado de cejas', 'modelado'], ['tinte de cejas', 'tinte cejas'],
  ['laminado de cejas', 'laminado'], ['refill de lashes', 'otros'], ['refill', 'refill'], ['lifting', 'lifting'],
  ['tinte de pestanas', 'tinte pestanas'], ['nanoblading retoque', 'nano retoque'], ['nanoblading mant', 'nano mant'],
  ['nanoblading', 'nano'], ['lip blush', 'lip blush'], ['lashes line', 'lashes line'], ['camuflaje', 'camuflaje'],
];
export function filaDeItem(nombre: string): ClaveServicio {
  const n = norm(nombre);
  return MAPA_SISTEMA.find(([k]) => n.startsWith(k))?.[1] ?? 'otros';
}

/** Fila del papel (como la nombra la IA) → clave; lo escrito encima manda ("consulta", "solo ins."). */
function filaDePapel(fila: string, anotacion: string | null): ClaveServicio {
  const a = norm(anotacion);
  if (a.includes('consulta') || a.split(' ').includes('ins') || a.includes('insumos')) return 'otros';
  const f = norm(fila);
  const r = FORMULARIO.find((x): x is { clave: ClaveServicio; texto: string } => 'clave' in x && norm(x.texto) === f);
  return r?.clave ?? 'otros';
}

const RESP: Record<string, string> = { ro: 'rosario', rosario: 'rosario', luna: 'luna', lu: 'luna', mery: 'mery', mica: 'mica' };
const persona = (t: string) => {
  const p = norm(t).split(' ')[0] ?? '';
  return RESP[p] ?? p;
};
/** Consulta previa / prueba: ítems de $1 que el papel no anota (la comparación tampoco los exige). */
const esTecnico = (nombre: string) => /^(consulta|prueba alergia)/.test(norm(nombre));

/** Qué filas del gemelo resaltar y por qué, a partir de las diferencias detectadas. */
export function resaltadosDe(h: Hoja): Partial<Record<ClaveGemelo, string>> {
  const out: Partial<Record<ClaveGemelo, string>> = {};
  const L = h.lectura, S = h.sistema;
  const dif = new Map((h.diferencias ?? []).map((d) => [d.campo, d]));
  if (!L || !S) return out;
  if (dif.has('cliente')) out.nombre = `En el papel: ${dif.get('cliente')!.papel}`;
  if (dif.has('fecha')) out.fecha = `Cargada con otra fecha que el lote`;
  if (dif.has('servicios')) {
    const papel = new Set(L.servicios.map((s) => filaDePapel(s.fila, s.anotacion)));
    if (L.otros.length) papel.add('otros');
    const sis = new Set(S.items.filter((i) => !esTecnico(i.nombre)).map((i) => filaDeItem(i.nombre)));
    for (const k of new Set([...papel, ...sis])) {
      if (papel.has(k) && !sis.has(k)) out[k] = 'En el papel está marcado y acá no';
      if (sis.has(k) && !papel.has(k)) out[k] = 'En el papel no está marcado';
    }
  }
  if (dif.has('responsables')) {
    for (const s of L.servicios) {
      if (!s.responsable) continue;
      const k = filaDePapel(s.fila, s.anotacion);
      const trabajadores = S.items.filter((i) => filaDeItem(i.nombre) === k).map((i) => persona(i.trabajador ?? ''));
      const delPapel = s.responsable.split(/[/,&]/).map(persona);
      if (!delPapel.some((p) => trabajadores.includes(p)) && !out[k]) out[k] = `En el papel lo hizo: ${s.responsable}`;
    }
  }
  if (dif.has('sena')) out.sena = `En el papel: ${dif.get('sena')!.papel}`;
  if (dif.has('cobrado')) out.saldo = `En el papel se cobró: ${dif.get('cobrado')!.papel}`;
  if (dif.has('anulada')) out.observaciones = 'El papel dice que se anuló / no vino';
  return out;
}

const TIPO_PAGO: Record<string, string> = {
  EFECTIVO: 'EF', TRANSFERENCIA: 'TRANSF', TARJETA: 'TARJETA', QR: 'QR', MERCADO_PAGO: 'MP', GIFT_CARD: 'GIFT',
};
const tinta = 'text-[#1d4ed8]';

function Celda({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn('min-h-[2.1rem] border-b border-[#2b2b2b]/70 px-2 py-1', className)}>{children}</div>;
}

function Nota({ texto }: { texto?: string }) {
  if (!texto) return null;
  return <p className="mt-0.5 text-[11px] leading-tight font-medium text-amber-800">⚠ {texto}</p>;
}

export default function GemeloComanda({
  sistema: S,
  resaltar = {},
  className,
}: {
  sistema: ComandaSistema;
  resaltar?: Partial<Record<ClaveGemelo, string>>;
  className?: string;
}) {
  const porFila = new Map<ClaveServicio, ComandaSistema['items']>();
  for (const i of S.items) porFila.set(filaDeItem(i.nombre), [...(porFila.get(filaDeItem(i.nombre)) ?? []), i]);
  const pagos = S.pagos.filter((p) => !(p.tipo === 'GIFT_CARD' && p.monto <= 1));
  const fondo = (k: ClaveGemelo) => (resaltar[k] ? 'bg-amber-100/80' : '');
  const fecha = formatDiaISO(S.fecha).replace(/\/(\d{2})(\d{2})$/, '/$2');

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-hidden rounded-md border-2 border-[#2b2b2b] bg-white text-[13px] text-black shadow-sm">
        {/* Cabecera: Nombre | N° y fecha */}
        <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] sm:grid-cols-[minmax(0,1fr)_9.5rem] border-b-2 border-[#2b2b2b]">
          <div className={cn('border-r-2 border-[#2b2b2b] px-2 py-1.5', fondo('nombre'))}>
            <p className="text-[11px] italic">Nombre:</p>
            <p className={cn('text-base leading-tight font-medium', tinta)}>{S.cliente ?? '—'}</p>
            <Nota texto={resaltar.nombre} />
          </div>
          <div className={cn('px-2 py-1.5', fondo('fecha'))}>
            <p className="font-semibold">N° {S.numero}</p>
            <p className="text-[12px]">
              Fecha: <span className={cn('font-medium', tinta)}>{fecha}</span>
            </p>
            <Nota texto={resaltar.fecha} />
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] sm:grid-cols-[minmax(0,1fr)_9.5rem]">
          {FORMULARIO.map((r, idx) =>
            'seccion' in r ? (
              <Fragment key={r.seccion}>
                <Celda className="border-r-2 border-r-[#2b2b2b] font-bold">{r.seccion}</Celda>
                <Celda className="text-center text-[11px] font-bold">{idx === 0 ? 'RESPONSABLE' : ''}</Celda>
              </Fragment>
            ) : (
              <Fragment key={r.clave}>
                <Celda className={cn('border-r-2 border-r-[#2b2b2b]', fondo(r.clave))}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="min-w-0">{r.texto}</span>
                    {porFila.get(r.clave) && (
                      <span className={cn('ml-auto min-w-0 text-right text-[12px] leading-tight', tinta)}>
                        {porFila
                          .get(r.clave)!
                          .map((i) => `● ${i.nombre}${i.cantidad && i.cantidad > 1 ? ` ×${i.cantidad}` : ''}`)
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                  <Nota texto={resaltar[r.clave]} />
                </Celda>
                <Celda className={cn('text-[12px]', tinta, fondo(r.clave))}>
                  {[...new Set((porFila.get(r.clave) ?? []).map((i) => i.trabajador).filter(Boolean))].join(', ')}
                </Celda>
              </Fragment>
            ),
          )}

          {/* Dinero */}
          <Celda className={cn('border-r-2 border-r-[#2b2b2b] font-bold', fondo('sena'))}>
            <div className="flex items-baseline justify-between gap-2">
              SEÑA:
              <span className={cn('text-[12px] font-normal', tinta)}>
                {S.senas.map((s) => (s.tipoPago ? TIPO_PAGO[s.tipoPago] ?? s.tipoPago : '')).filter(Boolean).join(' · ')}
              </span>
            </div>
            <Nota texto={resaltar.sena} />
          </Celda>
          <Celda className={cn('text-right font-medium', tinta, fondo('sena'))}>
            {S.senas.map((s, i) => (
              <div key={i}>{formatMonto(s.monto, s.moneda === 'USD' ? 'USD' : 'ARS')}</div>
            ))}
          </Celda>

          <Celda className={cn('border-r-2 border-r-[#2b2b2b] font-bold', fondo('saldo'))}>
            <div className="flex items-baseline justify-between gap-2">
              SALDO:
              <span className={cn('text-right text-[12px] font-normal', tinta)}>
                {pagos.map((p) => TIPO_PAGO[p.tipo] ?? p.tipo).join(' · ')}
              </span>
            </div>
            <Nota texto={resaltar.saldo} />
          </Celda>
          <Celda className={cn('text-right font-medium', tinta, fondo('saldo'))}>
            {pagos.map((p, i) => (
              <div key={i}>{formatMonto(p.monto, p.moneda === 'USD' ? 'USD' : 'ARS')}</div>
            ))}
          </Celda>

          <Celda className="border-r-2 border-r-[#2b2b2b] font-bold">SEÑA PRÓXIMO SERVICIO:</Celda>
          <Celda className="text-center text-[11px] text-[#9a7d88]">no se registra en la comanda</Celda>
        </div>

        <div className={cn('min-h-[3.2rem] px-2 py-1.5', fondo('observaciones'))}>
          <p className="text-[12px]">Observaciones:</p>
          <p className={cn('text-[12px] leading-snug', tinta)}>{S.observaciones || ''}</p>
          <Nota texto={resaltar.observaciones} />
        </div>
      </div>
      <p className="text-[11px] text-[#6b4c57]">
        Estado en el sistema: <b>{S.estado}</b>
        {S.cargadaPor && <> · cargada por {S.cargadaPor}</>}
        {S.precioPesos || S.precioDolar ? (
          <>
            {' '}
            · total {[S.precioPesos ? formatMonto(S.precioPesos, 'ARS') : '', S.precioDolar ? formatMonto(S.precioDolar, 'USD') : ''].filter(Boolean).join(' + ')}
          </>
        ) : null}
      </p>
    </div>
  );
}
