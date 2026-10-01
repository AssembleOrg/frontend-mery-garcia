'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, HandCoins, PiggyBank, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { contableService, type Resumen } from '@/services/contable.service';
import { useContable } from './contexto';
import { BarrasHorizontales, BarrasMensuales, Leyenda, LineaSaldo } from './graficos';
import { Cargando, COLOR, diasHasta, formatMonto, nombreMes, Panel, Vacio } from './ui';
import { ItemHistorial } from './HistorialTab';

export default function ResumenTab() {
  const { moneda, version, verAcreedor, nuevaDeuda } = useContable();
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [meses, setMeses] = useState(12);

  useEffect(() => {
    contableService
      .resumen(meses)
      .then(setDatos)
      .catch(() => toast.error('No se pudo cargar el resumen'));
  }, [version, meses]);

  if (!datos) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Cargando key={i} alto="h-32" />)}
        </div>
        <Cargando alto="h-72" />
      </div>
    );
  }

  const k = datos.kpis[moneda];
  const sinNada =
    datos.kpis.ARS.deudaTotal === 0 &&
    datos.kpis.USD.deudaTotal === 0 &&
    datos.kpis.ARS.saldoAFavor === 0 &&
    datos.kpis.USD.saldoAFavor === 0;
  if (sinNada) {
    return (
      <Panel>
        <Vacio
          icono={<Wallet className="h-6 w-6" />}
          titulo="Todavía no hay deudas cargadas"
          texto="Registrá lo que el negocio le debe a una persona o empresa y después andá descontando con pagos."
          accion={
            <Button className="bg-[#8b5a6b] text-white hover:bg-[#744a5a]" onClick={() => nuevaDeuda()}>
              <Plus className="mr-1 h-4 w-4" /> Nueva deuda
            </Button>
          }
        />
      </Panel>
    );
  }

  const variacion = k.pagadoMesAnterior > 0 ? ((k.pagadoMes - k.pagadoMesAnterior) / k.pagadoMesAnterior) * 100 : null;
  const acreedores = datos.acreedores
    .filter((a) => a[moneda] > 0)
    .sort((a, b) => b[moneda] - a[moneda]);
  const top = acreedores.slice(0, 7);
  const resto = acreedores.slice(7).reduce((s, a) => s + a[moneda], 0);
  const vencimientos = datos.proximosVencimientos.filter((d) => d.moneda === moneda);
  const adelantos = datos.adelantosPendientes.filter((a) => a.moneda === moneda);
  const mesActual = nombreMes(datos.hoy.slice(0, 7), true);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b2139] via-[#7a3f55] to-[#9c5a73] p-5 text-white shadow-[0_12px_32px_-16px_rgba(91,33,57,0.7)]">
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-medium tracking-[0.14em] text-white/70 uppercase">Saldo pendiente</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums sm:text-[34px]">{formatMonto(k.saldo, moneda)}</p>
          <p className="mt-1 text-sm text-white/75">
            {k.deudasAbiertas} {k.deudasAbiertas === 1 ? 'deuda abierta' : 'deudas abiertas'} · {k.acreedoresConSaldo}{' '}
            {k.acreedoresConSaldo === 1 ? 'acreedor' : 'acreedores'}
          </p>
          {k.saldoAFavor > 0 && (
            <p className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-xs tabular-nums">
              {k.saldoNeto >= 0
                ? `Neto ${formatMonto(k.saldoNeto, moneda)} descontando adelantos`
                : `Adelantado de más: ${formatMonto(-k.saldoNeto, moneda)}`}
            </p>
          )}
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11px] text-white/70">
              <span>Cancelado {Math.round(k.porcentajeCancelado)}%</span>
              <span className="tabular-nums">de {formatMonto(k.deudaTotal, moneda)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, k.porcentajeCancelado)}%` }} />
            </div>
          </div>
        </div>

        <Kpi
          titulo="Vencido"
          icono={<AlertTriangle className="h-4 w-4" />}
          valor={formatMonto(k.saldoVencido, moneda)}
          tono={k.saldoVencido > 0 ? 'alerta' : 'neutro'}
          pie={k.deudasVencidas > 0 ? `${k.deudasVencidas} ${k.deudasVencidas === 1 ? 'deuda vencida' : 'deudas vencidas'}` : 'Nada vencido'}
        />
        <Kpi
          titulo="A favor"
          icono={<PiggyBank className="h-4 w-4" />}
          valor={formatMonto(k.saldoAFavor, moneda)}
          tono={k.saldoAFavor > 0 ? 'favor' : 'neutro'}
          pie={
            k.adelantosAbiertos > 0
              ? `${k.adelantosAbiertos} ${k.adelantosAbiertos === 1 ? 'adelanto' : 'adelantos'} sin descontar`
              : 'Sin adelantos pendientes'
          }
        />
        <Kpi
          titulo={`Pagado en ${mesActual.split(' ')[0]}`}
          icono={<HandCoins className="h-4 w-4" />}
          valor={formatMonto(k.pagadoMes, moneda)}
          pie={
            variacion === null ? (
              `Incluye adelantos · mes anterior ${formatMonto(k.pagadoMesAnterior, moneda)}`
            ) : (
              <span className="inline-flex items-center gap-1">
                {variacion >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(Math.round(variacion))}% vs. mes anterior
              </span>
            )
          }
        />
        <Kpi
          titulo={`Deuda nueva en ${mesActual.split(' ')[0]}`}
          icono={<Wallet className="h-4 w-4" />}
          valor={formatMonto(k.nuevaDeudaMes, moneda)}
          pie={`Total histórico: ${formatMonto(k.deudaTotal, moneda)}`}
        />
      </div>

      {/* Evolución */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          titulo="Deuda nueva vs. pagos"
          subtitulo="Por mes, según la fecha de cada movimiento"
          accion={
            <div className="flex rounded-full border border-[#f0dde3] p-0.5 text-xs">
              {[6, 12, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMeses(m)}
                  className={cn('rounded-full px-2.5 py-1', meses === m ? 'bg-[#fbeef2] font-semibold text-[#5b2139]' : 'text-[#9a7d88]')}
                >
                  {m} m
                </button>
              ))}
            </div>
          }
        >
          <BarrasMensuales serie={datos.serie} moneda={moneda} />
          <div className="mt-2">
            <Leyenda items={[{ color: COLOR.deuda, texto: 'Deuda nueva' }, { color: COLOR.pagos, texto: 'Pagos y adelantos' }]} />
          </div>
        </Panel>
        <Panel titulo="Saldo neto" subtitulo="Lo que se debía al cierre de cada mes, descontando adelantos">
          <LineaSaldo serie={datos.serie} moneda={moneda} />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Panel titulo="A quién se le debe" subtitulo={`${acreedores.length} con saldo en ${moneda === 'ARS' ? 'pesos' : 'dólares'}`}>
          {top.length ? (
            <>
              <BarrasHorizontales
                moneda={moneda}
                onClick={verAcreedor}
                items={top.map((a) => ({ id: a.id, nombre: a.nombre, valor: a[moneda] }))}
              />
              {resto > 0 && (
                <p className="mt-3 text-xs text-[#9a7d88]">
                  + {acreedores.length - top.length} más: {formatMonto(resto, moneda)}
                </p>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-[#9a7d88]">Sin saldos pendientes en esta moneda.</p>
          )}
        </Panel>

        <div className="space-y-5">
        <Panel titulo="Vencimientos" subtitulo="Deudas abiertas con fecha de vencimiento" cuerpoClassName="p-2">
          {vencimientos.length ? (
            <ul className="divide-y divide-[#f7ecef]">
              {vencimientos.map((d) => {
                const dias = diasHasta(d.vencimiento!, datos.hoy);
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => verAcreedor(d.acreedorId)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#fdf6f8]"
                    >
                      <div
                        className={cn(
                          'flex w-12 shrink-0 flex-col items-center rounded-lg py-1 text-center',
                          dias < 0 ? 'bg-red-50 text-red-700' : dias <= 7 ? 'bg-amber-50 text-amber-800' : 'bg-[#fbeef2] text-[#8b5a6b]',
                        )}
                      >
                        <span className="text-base leading-none font-semibold">{d.vencimiento!.slice(8, 10)}</span>
                        <span className="text-[10px] uppercase">{nombreMes(d.vencimiento!.slice(0, 7))}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#3d2a32]">{d.acreedor?.nombre}</p>
                        <p className="truncate text-xs text-[#9a7d88]">{d.concepto}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#3d2a32] tabular-nums">{formatMonto(d.saldo, d.moneda)}</p>
                        <p className={cn('text-[11px]', dias < 0 ? 'font-medium text-red-700' : 'text-[#9a7d88]')}>
                          {dias < 0 ? `Venció hace ${-dias} ${dias === -1 ? 'día' : 'días'}` : dias === 0 ? 'Vence hoy' : `En ${dias} ${dias === 1 ? 'día' : 'días'}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-sm text-[#9a7d88]">
              <CalendarClock className="h-5 w-5" /> Nada por vencer.
            </div>
          )}
        </Panel>

        {adelantos.length > 0 && (
          <Panel titulo="Adelantos a liquidar" subtitulo="Saldo a favor que se descuenta al cargar la deuda" cuerpoClassName="p-2">
            <ul className="divide-y divide-[#f7ecef]">
              {adelantos.map((a) => {
                const dias = a.fechaEstimada ? diasHasta(a.fechaEstimada, datos.hoy) : null;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => verAcreedor(a.acreedorId)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#fdf6f8]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                        <PiggyBank className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#3d2a32]">{a.acreedor?.nombre}</p>
                        <p className="truncate text-xs text-[#9a7d88]">{a.concepto}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-teal-800 tabular-nums">{formatMonto(a.disponible, a.moneda)}</p>
                        <p className="text-[11px] text-[#9a7d88]">
                          {dias === null
                            ? 'Sin fecha estimada'
                            : dias < 0
                              ? `Se esperaba hace ${-dias} ${dias === -1 ? 'día' : 'días'}`
                              : dias === 0
                                ? 'Se liquida hoy (aprox.)'
                                : `Se liquida en ~${dias} ${dias === 1 ? 'día' : 'días'}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
        </div>
      </div>

      <Panel titulo="Actividad reciente" cuerpoClassName="px-3 pb-3 pt-2">
        <ul>
          {datos.actividad.map((m) => (
            <ItemHistorial key={m.id} m={m} compacto />
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Kpi({
  titulo,
  icono,
  valor,
  pie,
  tono = 'neutro',
}: {
  titulo: string;
  icono: React.ReactNode;
  valor: string;
  pie: React.ReactNode;
  tono?: 'neutro' | 'alerta' | 'favor';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white/90 p-5 shadow-[0_1px_2px_rgba(139,90,107,0.06)]',
        tono === 'alerta' ? 'border-red-200' : tono === 'favor' ? 'border-teal-200' : 'border-[#f0dde3]',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-[0.12em] text-[#9a7d88] uppercase">{titulo}</p>
        <span className={cn('rounded-lg p-1.5', tono === 'alerta' ? 'bg-red-50 text-red-700' : tono === 'favor' ? 'bg-teal-50 text-teal-700' : 'bg-[#fbeef2] text-[#8b5a6b]')}>{icono}</span>
      </div>
      <p className={cn('mt-3 text-2xl font-semibold tabular-nums', tono === 'alerta' ? 'text-red-700' : tono === 'favor' ? 'text-teal-800' : 'text-[#3d2a32]')}>{valor}</p>
      <p className="mt-1 text-xs text-[#9a7d88]">{pie}</p>
    </div>
  );
}
