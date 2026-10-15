'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck, Clock, Pencil, Plus, Scale, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  comisionesConfigService,
  ComisionesConfig as Config,
  EsquemaComisionTrabajador,
} from '@/services/comisionesConfig.service';
import { formatARSNative, formatDiaISO, formatMes } from '@/lib/utils';

// ---------- helpers ----------

const fmtPct = (n: number) => `${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;

const rango = (min: number, max: number | null) =>
  max != null && max !== min
    ? `${min.toLocaleString('es-AR', { maximumFractionDigits: 2 })}–${fmtPct(max)}`
    : fmtPct(min);

/** "32,5" → 32.5; vacío o inválido → null. */
const parsePct = (v: string): number | null => {
  const t = v.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/** Deja escribir solo números con un separador decimal. */
const limpiarPct = (v: string) => {
  const s = v.replace(/[^0-9.,]/g, '').replace(',', '.');
  const [ent, ...dec] = s.split('.');
  return dec.length ? `${ent}.${dec.join('')}` : ent;
};

const pctATexto = (n: number | null | undefined) => (n == null ? '' : String(n));

/** "YYYY-MM-DD" → Date local (sin corrimiento de zona horaria). */
const diaADate = (dia: string | null): Date | undefined => {
  if (!dia) return undefined;
  const [y, m, d] = dia.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const dateADia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const mesActual = () => dateADia(new Date()).slice(0, 7);

/** Meses entre `desde` y `hasta` ("YYYY-MM"), del más nuevo al más viejo. */
const mesesEntre = (desde: string, hasta: string): string[] => {
  const out: string[] = [];
  let [y, m] = hasta.split('-').map(Number);
  const [yd, md] = desde.split('-').map(Number);
  while (y > yd || (y === yd && m >= md)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
};

/** Doce meses para atrás, como alternativa cuando no hay fecha de inicio. */
const haceUnAnio = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 11);
  return dateADia(d).slice(0, 7);
};

const mensajeError = (e: unknown, porDefecto: string) => {
  const msg = e instanceof Error ? e.message : '';
  const m = /^API \d+: (.+)$/.exec(msg);
  return m && !m[1].startsWith('{') && !m[1].startsWith('[') ? m[1] : porDefecto;
};

const usaEsquema = (t: EsquemaComisionTrabajador) => t.baseDesde != null || t.bases.length > 0;

// ---------- formularios ----------

interface FilaBase {
  key: number;
  categoriaId: string;
  montoBase: number;
}

interface FormEsquema {
  trabajador: EsquemaComisionTrabajador;
  min: string;
  max: string;
  productos: string;
  desde: Date | undefined;
  bases: FilaBase[];
}

interface FormMes {
  trabajador: EsquemaComisionTrabajador;
  mes: string;
  porcentaje: string;
  nota: string;
}

let siguienteKey = 1;

/**
 * Esquema de comisión por base fija: cada servicio comisiona sobre el monto
 * base de su categoría × el % del mes (no sobre lo cobrado). El % es un rango
 * que se confirma al cierre de cada mes; mientras tanto se calcula al mínimo.
 * Todos los que entran a Configuración lo ven; solo admin edita.
 */
export default function ComisionesConfig({ puedeEditar }: { puedeEditar: boolean }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formEsquema, setFormEsquema] = useState<FormEsquema | null>(null);
  const [formMes, setFormMes] = useState<FormMes | null>(null);
  const [mesABorrar, setMesABorrar] = useState<{ trabajador: EsquemaComisionTrabajador; mes: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      setConfig(await comisionesConfigService.obtener());
    } catch {
      toast.error('No se pudo cargar la configuración de comisiones');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const conEsquema = useMemo(() => config?.trabajadores.filter(usaEsquema) ?? [], [config]);
  const sinEsquema = useMemo(() => config?.trabajadores.filter((t) => !usaEsquema(t)) ?? [], [config]);
  const nombreCategoria = useMemo(
    () => new Map(config?.categorias.map((c) => [c.id, c.nombre]) ?? []),
    [config],
  );

  /** Meses desde el inicio del esquema hasta hoy que todavía no tienen % confirmado. */
  const mesesPendientes = (t: EsquemaComisionTrabajador) => {
    if (!t.baseDesde) return [];
    const confirmados = new Set(t.meses.map((m) => m.mes));
    return mesesEntre(t.baseDesde.slice(0, 7), mesActual()).filter((m) => !confirmados.has(m));
  };

  // ----- esquema -----

  const abrirEsquema = (t: EsquemaComisionTrabajador) => {
    setFormEsquema({
      trabajador: t,
      min: pctATexto(t.porcentajeMin),
      max: pctATexto(t.porcentajeMax),
      productos: pctATexto(t.productosPorcentaje),
      desde: diaADate(t.baseDesde),
      bases: t.bases.map((b) => ({ key: siguienteKey++, categoriaId: b.categoriaId, montoBase: b.montoBase })),
    });
  };

  const actualizarFila = (key: number, cambios: Partial<FilaBase>) =>
    setFormEsquema((f) =>
      f ? { ...f, bases: f.bases.map((b) => (b.key === key ? { ...b, ...cambios } : b)) } : f,
    );

  const guardarEsquema = async () => {
    if (!formEsquema) return;
    const min = parsePct(formEsquema.min);
    const max = parsePct(formEsquema.max);
    const productos = parsePct(formEsquema.productos);
    if (min == null || min < 0 || min > 100) {
      toast.error('El % mínimo tiene que estar entre 0 y 100');
      return;
    }
    if (max != null && (max > 100 || max < min)) {
      toast.error('El % máximo no puede ser menor al mínimo ni pasar de 100');
      return;
    }
    if (productos != null && (productos < 0 || productos > 100)) {
      toast.error('El % de productos tiene que estar entre 0 y 100');
      return;
    }
    if (formEsquema.bases.some((b) => !b.categoriaId)) {
      toast.error('Elegí la categoría de cada base o borrá la fila');
      return;
    }
    if (formEsquema.bases.some((b) => !(b.montoBase > 0))) {
      toast.error('Cada base tiene que tener un monto');
      return;
    }
    setGuardando(true);
    try {
      const nuevo = await comisionesConfigService.actualizarTrabajador(formEsquema.trabajador.id, {
        porcentajeMin: min,
        porcentajeMax: max,
        productosPorcentaje: productos,
        baseDesde: formEsquema.desde ? dateADia(formEsquema.desde) : null,
        bases: formEsquema.bases.map((b) => ({ categoriaId: b.categoriaId, montoBase: b.montoBase })),
      });
      setConfig(nuevo);
      toast.success(`Esquema de ${formEsquema.trabajador.nombre} guardado`);
      setFormEsquema(null);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo guardar el esquema'));
    } finally {
      setGuardando(false);
    }
  };

  // ----- meses -----

  const opcionesMes = (t: EsquemaComisionTrabajador) => {
    const desde = t.baseDesde ? t.baseDesde.slice(0, 7) : haceUnAnio();
    return mesesEntre(desde, mesActual());
  };

  const abrirMes = (t: EsquemaComisionTrabajador) => {
    // Por defecto, el mes sin confirmar más viejo (el que se está cerrando).
    const pendientes = mesesPendientes(t);
    const mes = pendientes[pendientes.length - 1] ?? opcionesMes(t)[0] ?? mesActual();
    const existente = t.meses.find((m) => m.mes === mes);
    setFormMes({
      trabajador: t,
      mes,
      porcentaje: pctATexto(existente?.porcentaje),
      nota: existente?.nota ?? '',
    });
  };

  const cambiarMes = (mes: string) =>
    setFormMes((f) => {
      if (!f) return f;
      const existente = f.trabajador.meses.find((m) => m.mes === mes);
      return {
        ...f,
        mes,
        porcentaje: existente ? pctATexto(existente.porcentaje) : f.porcentaje,
        nota: existente?.nota ?? f.nota,
      };
    });

  const guardarMes = async () => {
    if (!formMes) return;
    const p = parsePct(formMes.porcentaje);
    if (p == null || p < 0 || p > 100) {
      toast.error('El % tiene que estar entre 0 y 100');
      return;
    }
    setGuardando(true);
    try {
      const nuevo = await comisionesConfigService.confirmarMes(
        formMes.trabajador.id,
        formMes.mes,
        p,
        formMes.nota.trim() || undefined,
      );
      setConfig(nuevo);
      toast.success(`${formMes.trabajador.nombre}: ${formatMes(formMes.mes)} confirmado al ${fmtPct(p)}`);
      setFormMes(null);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo confirmar el mes'));
    } finally {
      setGuardando(false);
    }
  };

  const borrarMes = async () => {
    if (!mesABorrar) return;
    try {
      const nuevo = await comisionesConfigService.quitarMes(mesABorrar.trabajador.id, mesABorrar.mes);
      setConfig(nuevo);
      toast.success(`${formatMes(mesABorrar.mes)} vuelve a calcularse al mínimo`);
      setMesABorrar(null);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo quitar el mes'));
    }
  };

  // ----- derivados de los formularios -----

  const pctMes = formMes ? parsePct(formMes.porcentaje) : null;
  const fueraDeRango =
    formMes != null &&
    pctMes != null &&
    (pctMes < formMes.trabajador.porcentajeMin ||
      pctMes > (formMes.trabajador.porcentajeMax ?? formMes.trabajador.porcentajeMin));
  const mesYaConfirmado = formMes?.trabajador.meses.find((m) => m.mes === formMes.mes);

  return (
    <Card className="mt-6 border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <div className="mt-6">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
            <Scale className="h-6 w-6 text-pink-600" />
            Comisiones
          </CardTitle>
          <p className="mt-2 text-sm text-gray-600">
            Base fija por categoría: cada servicio comisiona sobre el monto base de su categoría
            por el % del mes, no sobre lo que se cobró. El % se confirma al cierre de cada mes;
            mientras tanto se calcula al mínimo del rango.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 bg-white p-6">
        {cargando ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : !config ? (
          <p className="text-sm text-gray-500">No se pudo cargar.</p>
        ) : (
          <>
            {conEsquema.length === 0 && (
              <p className="text-sm text-gray-500">
                Nadie usa todavía la base fija. Todas comisionan con el esquema histórico (30% de
                servicios, 10% de productos).
              </p>
            )}

            {conEsquema.map((t) => {
              const pendientes = mesesPendientes(t);
              return (
                <div key={t.id} className="rounded-lg border-2 border-[#f9bbc4]/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800">{t.nombre}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="border-[#f9bbc4] text-[#8b5a6b]">
                          Servicios {rango(t.porcentajeMin, t.porcentajeMax)}
                        </Badge>
                        <Badge variant="outline" className="border-[#f9bbc4] text-[#8b5a6b]">
                          Productos {fmtPct(t.productosPorcentaje ?? 0)} del efectivo
                        </Badge>
                        {t.baseDesde ? (
                          <Badge variant="outline" className="border-[#f9bbc4] text-[#8b5a6b]">
                            Desde {formatDiaISO(t.baseDesde)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-300 text-amber-800">
                            Sin fecha de inicio: no se aplica
                          </Badge>
                        )}
                      </div>
                    </div>
                    {puedeEditar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEsquema(t)}
                        aria-label={`Editar esquema de ${t.nombre}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Bases por categoría */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.bases.length === 0 ? (
                      <span className="text-xs text-gray-400">Sin bases cargadas</span>
                    ) : (
                      t.bases.map((b) => (
                        <Badge key={b.categoriaId} variant="secondary" className="bg-[#f9bbc4]/20 text-[#4a3540]">
                          {b.categoria ?? nombreCategoria.get(b.categoriaId) ?? 'Categoría'}:{' '}
                          <span className="ml-1 font-semibold">{formatARSNative(b.montoBase)}</span>
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Porcentaje por mes */}
                  <div className="mt-4 border-t border-[#f9bbc4]/30 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#6b4c57]">% por mes</span>
                      {puedeEditar && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirMes(t)}
                          className="border-[#f9bbc4]/50 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
                        >
                          <CalendarCheck className="mr-1 h-4 w-4" />
                          Confirmar % del mes
                        </Button>
                      )}
                    </div>

                    {pendientes.length > 0 && (
                      <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          Sin confirmar: {pendientes.map(formatMes).join(', ')}. Se calcula al{' '}
                          {fmtPct(t.porcentajeMin)}
                          {t.porcentajeMax != null && t.porcentajeMax !== t.porcentajeMin
                            ? ` (podría llegar al ${fmtPct(t.porcentajeMax)})`
                            : ''}
                          .
                        </span>
                      </div>
                    )}

                    {t.meses.length > 0 ? (
                      <ul className="mt-2 divide-y divide-[#f9bbc4]/20 text-sm">
                        {t.meses.map((m) => (
                          <li key={m.mes} className="flex items-center justify-between gap-3 py-1.5">
                            <div className="min-w-0">
                              <span className="text-gray-800 capitalize">{formatMes(m.mes)}</span>
                              <span className="ml-2 font-semibold text-green-700">{fmtPct(m.porcentaje)}</span>
                              {m.nota && <span className="ml-2 text-xs text-gray-500">· {m.nota}</span>}
                            </div>
                            {puedeEditar && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setMesABorrar({ trabajador: t, mes: m.mes })}
                                aria-label={`Quitar ${formatMes(m.mes)}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      pendientes.length === 0 && (
                        <p className="mt-2 text-xs text-gray-400">Todavía no hay meses confirmados.</p>
                      )
                    )}
                  </div>
                </div>
              );
            })}

            {sinEsquema.length > 0 && (
              <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <summary className="cursor-pointer font-medium text-gray-700">
                  {sinEsquema.length} con el esquema histórico (30% servicios, 10% productos)
                </summary>
                <ul className="mt-2 divide-y divide-gray-200">
                  {sinEsquema.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-gray-800">{t.nombre}</span>
                      {puedeEditar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEsquema(t)}
                          className="text-pink-700 hover:bg-[#f9bbc4]/10"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Pasar a base fija
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </CardContent>

      {/* Editar esquema */}
      <Dialog open={!!formEsquema} onOpenChange={(o) => !o && !guardando && setFormEsquema(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col bg-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[#4a3540]">Esquema de {formEsquema?.trabajador.nombre}</DialogTitle>
            <DialogDescription className="text-[#8b5a6b]">
              Rango del %, % de productos, desde cuándo rige y monto base de cada categoría.
            </DialogDescription>
          </DialogHeader>

          {formEsquema && (
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="esq-min">% mínimo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="esq-min"
                      inputMode="decimal"
                      value={formEsquema.min}
                      placeholder="30"
                      onChange={(e) => setFormEsquema({ ...formEsquema, min: limpiarPct(e.target.value) })}
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="esq-max">% máximo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="esq-max"
                      inputMode="decimal"
                      value={formEsquema.max}
                      placeholder="35"
                      onChange={(e) => setFormEsquema({ ...formEsquema, max: limpiarPct(e.target.value) })}
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="esq-prod">% productos</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="esq-prod"
                      inputMode="decimal"
                      value={formEsquema.productos}
                      placeholder="5"
                      onChange={(e) => setFormEsquema({ ...formEsquema, productos: limpiarPct(e.target.value) })}
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
              </div>
              <p className="-mt-3 text-xs text-gray-500">
                Dejá el máximo vacío si el % es fijo. El de productos se toma sobre el precio en
                efectivo.
              </p>

              <div className="space-y-1">
                <Label>Rige desde</Label>
                <DatePicker
                  date={formEsquema.desde}
                  onDateChange={(d) => setFormEsquema({ ...formEsquema, desde: d })}
                  placeholder="Sin fecha (no se aplica)"
                />
                <p className="text-xs text-gray-500">
                  Las comandas anteriores a esta fecha siguen con el esquema histórico. Sin fecha,
                  no se aplica la base fija.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Bases por categoría</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={formEsquema.bases.length >= (config?.categorias.length ?? 0)}
                    onClick={() =>
                      setFormEsquema({
                        ...formEsquema,
                        bases: [...formEsquema.bases, { key: siguienteKey++, categoriaId: '', montoBase: 0 }],
                      })
                    }
                    className="border-[#f9bbc4]/50 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                {formEsquema.bases.length === 0 ? (
                  <p className="rounded-md border border-dashed p-3 text-center text-xs text-gray-500">
                    Sin bases. Los servicios de categorías sin base no comisionan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formEsquema.bases.map((b) => {
                      const usadas = new Set(
                        formEsquema.bases.filter((o) => o.key !== b.key).map((o) => o.categoriaId),
                      );
                      return (
                        <div key={b.key} className="flex items-center gap-2">
                          <Select
                            value={b.categoriaId || undefined}
                            onValueChange={(v) => actualizarFila(b.key, { categoriaId: v })}
                          >
                            <SelectTrigger className="min-w-0 flex-1" aria-label="Categoría">
                              <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {config?.categorias
                                .filter((c) => !usadas.has(c.id))
                                .map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.nombre}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <MoneyInput
                            value={b.montoBase}
                            onChange={(v) => actualizarFila(b.key, { montoBase: v })}
                            placeholder="$ base"
                            className="w-36"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() =>
                              setFormEsquema({
                                ...formEsquema,
                                bases: formEsquema.bases.filter((o) => o.key !== b.key),
                              })
                            }
                            aria-label="Quitar base"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormEsquema(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardarEsquema} disabled={guardando} className="bg-pink-600 text-white hover:bg-pink-700">
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar % del mes */}
      <Dialog open={!!formMes} onOpenChange={(o) => !o && !guardando && setFormMes(null)}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#4a3540]">Confirmar % de {formMes?.trabajador.nombre}</DialogTitle>
            <DialogDescription className="text-[#8b5a6b]">
              Al cierre del mes, fijá el % con el que se liquidan sus servicios.
              {formMes &&
                ` Rango: ${rango(formMes.trabajador.porcentajeMin, formMes.trabajador.porcentajeMax)}.`}
            </DialogDescription>
          </DialogHeader>

          {formMes && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Mes</Label>
                  <Select value={formMes.mes} onValueChange={cambiarMes}>
                    <SelectTrigger className="w-full capitalize" aria-label="Mes">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {opcionesMes(formMes.trabajador).map((m) => (
                        <SelectItem key={m} value={m} className="capitalize">
                          {formatMes(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mes-pct">Porcentaje</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="mes-pct"
                      inputMode="decimal"
                      value={formMes.porcentaje}
                      placeholder={String(formMes.trabajador.porcentajeMax ?? formMes.trabajador.porcentajeMin)}
                      onChange={(e) => setFormMes({ ...formMes, porcentaje: limpiarPct(e.target.value) })}
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
              </div>

              {mesYaConfirmado && (
                <p className="text-xs text-gray-600">
                  Ya estaba confirmado al {fmtPct(mesYaConfirmado.porcentaje)}; lo reemplaza.
                </p>
              )}
              {fueraDeRango && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Ojo: {fmtPct(pctMes!)} está fuera del rango (
                  {rango(formMes.trabajador.porcentajeMin, formMes.trabajador.porcentajeMax)}). Se
                  puede guardar igual.
                </p>
              )}

              <div className="space-y-1">
                <Label htmlFor="mes-nota">Nota (opcional)</Label>
                <Input
                  id="mes-nota"
                  value={formMes.nota}
                  maxLength={255}
                  placeholder="Ej.: llegó al objetivo de ventas"
                  onChange={(e) => setFormMes({ ...formMes, nota: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormMes(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardarMes} disabled={guardando} className="bg-pink-600 text-white hover:bg-pink-700">
              {guardando ? 'Guardando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quitar mes confirmado */}
      <AlertDialog open={!!mesABorrar} onOpenChange={(o) => !o && setMesABorrar(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Quitar el % de {mesABorrar ? formatMes(mesABorrar.mes) : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mesABorrar &&
                `Los servicios de ${mesABorrar.trabajador.nombre} de ese mes vuelven a calcularse al mínimo (${fmtPct(mesABorrar.trabajador.porcentajeMin)}) hasta que lo confirmes de nuevo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={borrarMes} className="bg-red-600 text-white hover:bg-red-700">
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
