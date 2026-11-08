'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Copy,
  ExternalLink,
  FileText,
  Lock,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  comprasService,
  type Categoria,
  type ComprobantePedido,
  type EstadoPedido,
  type GuardarItem,
  type GuardarPedido,
  type Moneda,
  type Pedido,
  type Proveedor,
} from '@/services/compras.service';
import type { ProductoStock } from '@/services/stock.service';
import {
  BOTON_ICONO,
  BOTON_PELIGRO,
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO,
  CAMPO_BASE,
  ESTADOS,
  ETIQUETA,
  FLUJO,
  FOCO,
  fechaHora,
  mensajeError,
  normalizar,
  plata,
} from './formato';

/** Lo que se precarga en un pedido nuevo (desde "Quedan pocos"). */
export interface PedidoInicial {
  titulo?: string;
  items?: GuardarItem[];
}

interface Renglon {
  clave: string;
  productoId: string | null;
  nombre: string;
  cantidad: string;
  precio: string;
  afectaStock: boolean;
  categoriaIds: string[];
  /** Lo que llegó (sólo con el pedido entregado). Vacío = todo. */
  recibido: string;
}

interface Borrador {
  titulo: string;
  nota: string;
  estado: EstadoPedido;
  moneda: Moneda;
  total: string;
  medioPago: string;
  proveedorIds: string[];
  items: Renglon[];
}

const MEDIOS = ['Transferencia', 'Efectivo', 'Mercado Pago', 'Tarjeta'];

let contador = 0;
const nuevaClave = () => `r${++contador}`;

function renglonVacio(): Renglon {
  return {
    clave: nuevaClave(),
    productoId: null,
    nombre: '',
    cantidad: '1',
    precio: '',
    afectaStock: false,
    categoriaIds: [],
    recibido: '',
  };
}

function borradorDe(p: Pedido | null, inicial?: PedidoInicial): Borrador {
  if (!p) {
    const items = (inicial?.items ?? []).map<Renglon>((i) => ({
      ...renglonVacio(),
      productoId: i.productoId ?? null,
      nombre: i.nombre,
      cantidad: String(i.cantidad),
      afectaStock: !!i.afectaStock,
      categoriaIds: i.categoriaIds ?? [],
    }));
    return {
      titulo: inicial?.titulo ?? '',
      nota: '',
      estado: 'ANOTADO',
      moneda: 'ARS',
      total: '',
      medioPago: '',
      proveedorIds: [],
      items: items.length ? items : [renglonVacio()],
    };
  }
  return {
    titulo: p.titulo ?? '',
    nota: p.nota ?? '',
    estado: p.estado,
    moneda: p.moneda,
    total: p.total === null ? '' : enTexto(p.total),
    medioPago: p.medioPago ?? '',
    proveedorIds: p.proveedores.map((x) => x.id),
    items: p.items.map((i) => ({
      clave: nuevaClave(),
      productoId: i.productoId,
      nombre: i.nombre,
      cantidad: String(i.cantidad),
      precio: i.precioUnitario === null ? '' : enTexto(i.precioUnitario),
      afectaStock: i.afectaStock,
      categoriaIds: i.categorias.map((c) => c.id),
      recibido: i.cantidadRecibida === null ? '' : String(i.cantidadRecibida),
    })),
  };
}

/** 15000.5 → "15.000,5" (como se escribe acá; `numero` lo vuelve a leer igual). */
function enTexto(n: number): string {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

/** "1.500,50", "1.200" o "1500.5" → número; vacío → null; basura → NaN. */
export function numero(texto: string): number | null {
  const t = texto.trim().replace(/\$/g, '').replace(/\s/g, '');
  if (!t) return null;
  let normal: string;
  if (t.includes(','))
    normal = t.replace(/\./g, '').replace(',', '.'); // coma decimal, puntos de miles
  else if (/^\d{1,3}(\.\d{3})+$/.test(t))
    normal = t.replace(/\./g, ''); // "1.200" = mil doscientos
  else normal = t;
  return /^\d+(\.\d{1,2})?$/.test(normal) ? Number(normal) : NaN;
}

function entero(texto: string): number | null {
  const t = texto.trim();
  if (!t) return null;
  return /^\d+$/.test(t) ? Number(t) : NaN;
}

function aGuardar(b: Borrador, version?: number): GuardarPedido | string {
  const items: GuardarItem[] = [];
  for (const [n, r] of b.items.entries()) {
    const nombre = r.nombre.trim();
    // Un renglón vacío al final no cuenta.
    if (
      !nombre &&
      !r.precio.trim() &&
      b.items.length > 1 &&
      n === b.items.length - 1
    )
      continue;
    if (!nombre && !r.precio.trim() && b.items.length === 1) continue;
    if (!nombre) return `Al artículo ${n + 1} le falta el nombre.`;
    const cantidad = entero(r.cantidad);
    if (!cantidad || Number.isNaN(cantidad))
      return `Revisá la cantidad de "${nombre}".`;
    const precio = numero(r.precio);
    if (Number.isNaN(precio))
      return `Revisá el precio de "${nombre}" (ej. 1500 o 1.500,50).`;
    const recibido = b.estado === 'ENTREGADO' ? entero(r.recibido) : null;
    if (Number.isNaN(recibido)) return `Revisá cuánto llegó de "${nombre}".`;
    items.push({
      productoId: r.productoId,
      nombre,
      cantidad,
      precioUnitario: precio,
      afectaStock: r.afectaStock,
      categoriaIds: r.categoriaIds,
      cantidadRecibida: recibido,
    });
  }
  const total = numero(b.total);
  if (Number.isNaN(total)) return 'Revisá el total (ej. 15000 o 15.000,50).';
  return {
    titulo: b.titulo.trim() || null,
    nota: b.nota.trim() || null,
    estado: b.estado,
    moneda: b.moneda,
    total,
    medioPago: b.medioPago.trim() || null,
    proveedorIds: b.proveedorIds,
    items,
    version,
  };
}

const COSTEAR: Record<
  string,
  { texto: string; clase: string; reintentar?: boolean }
> = {
  PENDIENTE: { texto: 'Costear lo está leyendo', clase: 'text-[#8b5a6b]' },
  PROCESSING: { texto: 'Costear lo está leyendo', clase: 'text-[#8b5a6b]' },
  MATCHED: {
    texto: 'En Costear: conciliado con el banco',
    clase: 'text-[#24533a]',
  },
  CREATED: { texto: 'En Costear: gasto cargado', clase: 'text-[#24533a]' },
  REVIEW: { texto: 'En Costear: a revisar', clase: 'text-[#7a4a05]' },
  DUPLICATE: { texto: 'Ya estaba en Costear', clase: 'text-[#8b5a6b]' },
  IGNORED: { texto: 'Costear lo ignoró', clase: 'text-[#8b5a6b]' },
  FAILED: {
    texto: 'Costear no lo pudo leer',
    clase: 'text-[#9b1450]',
    reintentar: true,
  },
  ERROR: {
    texto: 'No llegó a Costear',
    clase: 'text-[#9b1450]',
    reintentar: true,
  },
};

interface Props {
  abierto: boolean;
  /** Null = pedido nuevo. */
  pedido: Pedido | null;
  inicial?: PedidoInicial;
  proveedores: Proveedor[];
  categorias: Categoria[];
  productos: ProductoStock[];
  onCerrar: () => void;
  /** Se guardó algo: el pedido actualizado (el editor sigue abierto). */
  onGuardado: (p: Pedido) => void;
  onEliminado: (id: string) => void;
  onRepetido: (p: Pedido) => void;
  onProveedorCreado: (p: Proveedor) => void;
  onEntregar: (p: Pedido) => void;
}

export default function EditorPedido(props: Props) {
  const { abierto, pedido, inicial, onCerrar } = props;
  const [b, setB] = useState<Borrador>(() => borradorDe(pedido, inicial));
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [sucio, setSucio] = useState(false);
  const archivoRef = useRef<HTMLInputElement>(null);

  // Al abrir otro pedido (o uno nuevo) se rearma el borrador.
  const claveApertura = `${abierto}|${pedido?.id ?? 'nuevo'}`;
  const ultimaApertura = useRef('');
  useEffect(() => {
    if (ultimaApertura.current === claveApertura) return;
    ultimaApertura.current = claveApertura;
    if (abierto) {
      setB(borradorDe(pedido, inicial));
      setSucio(false);
    }
  }, [claveApertura, abierto, pedido, inicial]);

  const soloLectura = !!pedido?.bloqueado;
  const cambiar = (cambio: Partial<Borrador>) => {
    setB((x) => ({ ...x, ...cambio }));
    setSucio(true);
  };
  const cambiarRenglon = (clave: string, cambio: Partial<Renglon>) => {
    setB((x) => ({
      ...x,
      items: x.items.map((r) => (r.clave === clave ? { ...r, ...cambio } : r)),
    }));
    setSucio(true);
  };

  const totalCalculado = useMemo(() => {
    let centavos = 0;
    let alguno = false;
    for (const r of b.items) {
      const precio = numero(r.precio);
      const cantidad = entero(r.cantidad);
      if (
        precio === null ||
        Number.isNaN(precio) ||
        !cantidad ||
        Number.isNaN(cantidad)
      )
        continue;
      alguno = true;
      centavos += Math.round(precio * cantidad * 100);
    }
    return alguno ? centavos / 100 : null;
  }, [b.items]);

  const conNombre = b.items.filter((r) => r.nombre.trim());
  const todosAfectan =
    conNombre.length > 0 && conNombre.every((r) => r.afectaStock);

  const guardar = async (cerrar: boolean) => {
    const datos = aGuardar(b, pedido?.version);
    if (typeof datos === 'string') {
      toast.error(datos);
      return;
    }
    setGuardando(true);
    try {
      const guardado = pedido
        ? await comprasService.actualizar(pedido.id, datos)
        : await comprasService.crear(datos);
      toast.success(
        pedido ? 'Pedido guardado' : `Pedido N° ${guardado.numero} anotado`
      );
      setSucio(false);
      props.onGuardado(guardado);
      if (cerrar) onCerrar();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo guardar el pedido'));
    } finally {
      setGuardando(false);
    }
  };

  const subir = async (archivos: FileList | null) => {
    if (!pedido || !archivos?.length) return;
    if (sucio) {
      toast.error('Guardá los cambios antes de adjuntar.');
      return;
    }
    setSubiendo(true);
    try {
      const p = await comprasService.subirComprobantes(pedido.id, [
        ...archivos,
      ]);
      toast.success(
        archivos.length === 1
          ? 'Comprobante adjuntado'
          : 'Comprobantes adjuntados'
      );
      props.onGuardado(p);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo adjuntar'));
    } finally {
      setSubiendo(false);
      if (archivoRef.current) archivoRef.current.value = '';
    }
  };

  const accion = async (
    fn: () => Promise<Pedido>,
    ok: string,
    error: string
  ) => {
    try {
      const p = await fn();
      if (ok) toast.success(ok);
      // Lo que cambió en el servidor (p. ej. cancelar) no se pisa al guardar después.
      setB((x) => ({ ...x, estado: p.estado }));
      props.onGuardado(p);
    } catch (e) {
      toast.error(mensajeError(e, error));
    }
  };

  const repetir = async () => {
    if (!pedido) return;
    try {
      const p = await comprasService.repetir(pedido.id);
      toast.success(`Pedido N° ${p.numero} anotado con lo mismo`);
      props.onRepetido(p);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo repetir'));
    }
  };

  const eliminar = async () => {
    if (!pedido) return;
    try {
      await comprasService.eliminar(pedido.id);
      toast.success('Pedido eliminado');
      props.onEliminado(pedido.id);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo eliminar'));
    } finally {
      setConfirmarBorrar(false);
    }
  };

  const titulo = pedido ? `Pedido N° ${pedido.numero}` : 'Nuevo pedido';

  return (
    <Sheet open={abierto} onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto border-[#f5d0d9] bg-white p-0 text-[#4a3540] sm:max-w-2xl"
      >
        {/* Encabezado */}
        <div className="border-b border-[#f5d0d9] px-4 pt-4 pr-12 pb-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-lg font-medium text-[#4a3540]">
              {titulo}
            </SheetTitle>
            {pedido && <ChipEstado estado={pedido.estado} />}
          </div>
          <SheetDescription asChild>
            <div className="mt-1 space-y-0.5 text-xs text-[#8b5a6b] tabular-nums">
              {pedido ? (
                <p>
                  Anotado por {pedido.creadoPorNombre} el{' '}
                  {fechaHora(pedido.createdAt)}
                  {pedido.actualizadoPorNombre &&
                    ` · último cambio de ${pedido.actualizadoPorNombre} el ${fechaHora(pedido.updatedAt)}`}
                </p>
              ) : (
                <p>
                  Anotá lo que falta. Precio, proveedor y comprobantes se
                  completan después.
                </p>
              )}
              {pedido?.bloqueado ? (
                <p className="flex items-center gap-1 text-[#6b4c57]">
                  <Lock className="h-3 w-3" aria-hidden />
                  Cerrado: pasaron 48 h desde que se compró
                  {pedido.estado === 'COMPRADO'
                    ? '. Sólo queda marcar que llegó y adjuntar comprobantes.'
                    : '. Todavía se pueden adjuntar comprobantes.'}
                </p>
              ) : pedido?.editableHasta ? (
                <p>
                  Se puede corregir hasta el {fechaHora(pedido.editableHasta)}.
                </p>
              ) : null}
            </div>
          </SheetDescription>
        </div>

        <fieldset
          disabled={soloLectura}
          className="min-w-0 space-y-0 divide-y divide-[#f5d0d9]"
        >
          {/* Estado */}
          <Seccion titulo="Estado">
            <div
              role="radiogroup"
              aria-label="Estado del pedido"
              className="grid grid-cols-2 gap-0.5 rounded-lg border border-[#f5d0d9] bg-white p-0.5 sm:inline-grid sm:grid-cols-4"
            >
              {FLUJO.map((e) => {
                const activo = b.estado === e;
                return (
                  <button
                    key={e}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => cambiar({ estado: e })}
                    className={`rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 ${FOCO} ${
                      activo
                        ? 'bg-[#4a3540] text-white'
                        : 'text-[#6b4c57] hover:bg-[#fcf0f3]'
                    }`}
                  >
                    {ESTADOS[e].texto}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[#8b5a6b]">
              {b.estado === 'CANCELADO'
                ? ESTADOS.CANCELADO.ayuda
                : ESTADOS[b.estado].ayuda}
              {(b.estado === 'COMPRADO' || b.estado === 'ENTREGADO') &&
                ' Necesita al menos un proveedor.'}
            </p>
          </Seccion>

          {/* Qué */}
          <Seccion titulo="Qué se pide">
            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className={ETIQUETA}>Título (opcional)</span>
                <input
                  value={b.titulo}
                  maxLength={150}
                  onChange={(e) => cambiar({ titulo: e.target.value })}
                  placeholder="Ej. Reposición de descartables"
                  className={CAMPO}
                />
              </label>
              <label className="grid gap-1">
                <span className={ETIQUETA}>Nota</span>
                <textarea
                  value={b.nota}
                  maxLength={4000}
                  rows={2}
                  onChange={(e) => cambiar({ nota: e.target.value })}
                  placeholder="Ej. No quedan hisopos; pedirlos la semana que viene"
                  className={`${CAMPO} h-auto min-h-[2.25rem] py-2`}
                />
              </label>
            </div>
          </Seccion>

          {/* Artículos */}
          <Seccion
            titulo="Artículos"
            extra={
              conNombre.length > 1 && !soloLectura ? (
                <label className="flex items-center gap-2 text-xs text-[#6b4c57]">
                  Todos afectan stock
                  <Switch
                    checked={todosAfectan}
                    onCheckedChange={(v) =>
                      setB((x) => {
                        setSucio(true);
                        return {
                          ...x,
                          items: x.items.map((r) =>
                            r.nombre.trim() ? { ...r, afectaStock: v } : r
                          ),
                        };
                      })
                    }
                    className="data-[state=checked]:bg-[#4a3540] data-[state=unchecked]:bg-[#f5d0d9]"
                  />
                </label>
              ) : null
            }
          >
            <div className="space-y-2">
              {b.items.map((r, n) => (
                <FilaArticulo
                  key={r.clave}
                  r={r}
                  n={n}
                  moneda={b.moneda}
                  entregado={b.estado === 'ENTREGADO'}
                  productos={props.productos}
                  categorias={props.categorias}
                  soloLectura={soloLectura}
                  onCambio={(c) => cambiarRenglon(r.clave, c)}
                  onQuitar={
                    b.items.length > 1
                      ? () => {
                          setB((x) => ({
                            ...x,
                            items: x.items.filter((y) => y.clave !== r.clave),
                          }));
                          setSucio(true);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
            {!soloLectura && (
              <button
                type="button"
                onClick={() => cambiar({ items: [...b.items, renglonVacio()] })}
                className={`${BOTON_SECUNDARIO} mt-2`}
              >
                <Plus className="h-4 w-4" />
                Agregar artículo
              </button>
            )}
            <p className="mt-2 text-xs text-[#8b5a6b]">
              &quot;Stock&quot; prendido: cuando el pedido llega, la cantidad
              suma en Control de Stock.
            </p>
          </Seccion>

          {/* A quién */}
          <Seccion titulo="Proveedores">
            <SelectorProveedores
              elegidos={b.proveedorIds}
              pedido={pedido}
              proveedores={props.proveedores}
              soloLectura={soloLectura}
              onCambio={(ids) => cambiar({ proveedorIds: ids })}
              onCreado={props.onProveedorCreado}
            />
          </Seccion>

          {/* Pago */}
          <Seccion titulo="Pago">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="grid gap-1">
                <span className={ETIQUETA}>Total</span>
                <input
                  inputMode="decimal"
                  value={b.total}
                  onChange={(e) => cambiar({ total: e.target.value })}
                  placeholder={
                    totalCalculado !== null
                      ? `${plata(totalCalculado, b.moneda)} (suma de artículos)`
                      : 'Sin precio todavía'
                  }
                  className={`${CAMPO} tabular-nums`}
                />
              </label>
              <div className="grid gap-1">
                <span className={ETIQUETA}>Moneda</span>
                <div className="inline-flex rounded-lg border border-[#f5d0d9] bg-white p-0.5">
                  {(['ARS', 'USD'] as Moneda[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={b.moneda === m}
                      onClick={() => cambiar({ moneda: m })}
                      className={`rounded-md px-3 py-1 text-sm transition-colors ${FOCO} ${
                        b.moneda === m
                          ? 'bg-[#4a3540] text-white'
                          : 'text-[#6b4c57] hover:bg-[#fcf0f3]'
                      }`}
                    >
                      {m === 'ARS' ? 'Pesos' : 'Dólares'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-1">
              <span className={ETIQUETA}>Cómo se pagó</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {MEDIOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={b.medioPago === m}
                    onClick={() =>
                      cambiar({ medioPago: b.medioPago === m ? '' : m })
                    }
                    className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${FOCO} ${
                      b.medioPago === m
                        ? 'border-[#4a3540] bg-[#4a3540] text-white'
                        : 'border-[#f5d0d9] text-[#6b4c57] hover:bg-[#fcf0f3]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
                <input
                  value={MEDIOS.includes(b.medioPago) ? '' : b.medioPago}
                  maxLength={40}
                  onChange={(e) => cambiar({ medioPago: e.target.value })}
                  placeholder="Otro…"
                  aria-label="Otro medio de pago"
                  className={`${CAMPO_BASE} h-7 w-32 text-xs`}
                />
              </div>
            </div>
          </Seccion>
        </fieldset>

        {/* Comprobantes: fuera del fieldset para poder abrirlos aunque esté cerrado */}
        <Seccion titulo="Comprobantes">
          {!pedido ? (
            <p className="text-xs text-[#8b5a6b]">
              Guardá el pedido para adjuntar la factura o la transferencia.
            </p>
          ) : (
            <>
              {pedido.comprobantes.length > 0 && (
                <ul className="mb-2 divide-y divide-[#fcf0f3] rounded-lg border border-[#f5d0d9]">
                  {pedido.comprobantes.map((c) => (
                    <FilaComprobante
                      key={c.id}
                      c={c}
                      soloLectura={soloLectura}
                      onAbrir={() =>
                        comprasService
                          .abrirComprobante(c)
                          .catch((e) => toast.error(mensajeError(e)))
                      }
                      onBorrar={() =>
                        accion(
                          () => comprasService.eliminarComprobante(c.id),
                          'Comprobante borrado',
                          'No se pudo borrar'
                        )
                      }
                      onReintentar={() =>
                        accion(
                          () => comprasService.reenviarACostear(c.id),
                          '',
                          'No se pudo mandar a Costear'
                        )
                      }
                      onActualizar={() =>
                        accion(
                          () => comprasService.estadoEnCostear(c.id),
                          '',
                          'No se pudo consultar a Costear'
                        )
                      }
                    />
                  ))}
                </ul>
              )}
              {/* Adjuntar se puede siempre, aunque esté cerrado: la factura
                  suele llegar con la entrega. Borrar no. */}
              {
                <>
                  <input
                    ref={archivoRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="sr-only"
                    onChange={(e) => subir(e.target.files)}
                  />
                  <button
                    type="button"
                    disabled={subiendo}
                    onClick={() => archivoRef.current?.click()}
                    className={BOTON_SECUNDARIO}
                  >
                    <Paperclip className="h-4 w-4" />
                    {subiendo ? 'Subiendo…' : 'Adjuntar comprobante'}
                  </button>
                  <p className="mt-2 text-xs text-[#8b5a6b]">
                    Imagen o PDF, hasta 10 MB. Se manda solo a Costear para
                    conciliarlo.
                  </p>
                </>
              }
            </>
          )}
        </Seccion>

        {/* Acciones */}
        {/* pr-24: que la burbuja de WhatsApp (abajo a la derecha) no tape "Guardar". */}
        <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-2 border-t border-[#f5d0d9] bg-white py-3 pr-24 pl-4 sm:pl-6">
          {pedido && (
            <button
              type="button"
              onClick={repetir}
              className={BOTON_SECUNDARIO}
              title="Pedido nuevo con lo mismo (sin precios)"
            >
              <Copy className="h-4 w-4" />
              Repetir
            </button>
          )}
          {pedido?.bloqueado && pedido.estado === 'COMPRADO' && (
            <button
              type="button"
              onClick={() => props.onEntregar(pedido)}
              className={BOTON_PRIMARIO}
            >
              <Truck className="h-4 w-4" />
              Llegó
            </button>
          )}
          {pedido && !soloLectura && pedido.estado !== 'CANCELADO' && (
            <button
              type="button"
              onClick={() =>
                accion(
                  () => comprasService.cambiarEstado(pedido.id, 'CANCELADO'),
                  'Pedido cancelado',
                  'No se pudo cancelar'
                )
              }
              className={BOTON_PELIGRO}
            >
              Cancelar pedido
            </button>
          )}
          {pedido && !soloLectura && (
            <button
              type="button"
              onClick={() => setConfirmarBorrar(true)}
              className={BOTON_PELIGRO}
              aria-label="Eliminar pedido"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className={BOTON_SECUNDARIO}
            >
              {soloLectura ? 'Cerrar' : 'Volver'}
            </button>
            {!soloLectura && (
              <button
                type="button"
                disabled={guardando}
                onClick={() => guardar(!pedido ? false : true)}
                className={BOTON_PRIMARIO}
              >
                {guardando
                  ? 'Guardando…'
                  : pedido
                    ? 'Guardar'
                    : 'Anotar pedido'}
              </button>
            )}
          </div>
        </div>

        <AlertDialog open={confirmarBorrar} onOpenChange={setConfirmarBorrar}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Eliminar el pedido N° {pedido?.numero}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Se borra con sus comprobantes. Si ya había llegado, lo que sumó
                al stock deja de contar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction
                onClick={eliminar}
                className="bg-[#9b1450] text-white hover:bg-[#7d1041]"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

// ─── Piezas ───────────────────────────────────────────────────

export function ChipEstado({ estado }: { estado: EstadoPedido }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs whitespace-nowrap ${ESTADOS[estado].clase}`}
    >
      {ESTADOS[estado].texto}
    </span>
  );
}

function Seccion({
  titulo,
  extra,
  children,
}: {
  titulo: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-4 sm:px-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm text-[#6b4c57]">{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function FilaArticulo({
  r,
  n,
  moneda,
  entregado,
  productos,
  categorias,
  soloLectura,
  onCambio,
  onQuitar,
}: {
  r: Renglon;
  n: number;
  moneda: Moneda;
  entregado: boolean;
  productos: ProductoStock[];
  categorias: Categoria[];
  soloLectura: boolean;
  onCambio: (c: Partial<Renglon>) => void;
  onQuitar?: () => void;
}) {
  const [sugerir, setSugerir] = useState(false);
  const sugerencias = useMemo(() => {
    const q = normalizar(r.nombre);
    if (!q) return productos.slice(0, 8);
    return productos
      .filter((p) => normalizar(p.nombre).includes(q))
      .slice(0, 8);
  }, [productos, r.nombre]);
  const producto = r.productoId
    ? productos.find((p) => p.id === r.productoId)
    : undefined;
  const elegidas = categorias.filter((c) => r.categoriaIds.includes(c.id));
  const precio = numero(r.precio);
  const cantidad = entero(r.cantidad);
  const subtotal =
    precio !== null &&
    !Number.isNaN(precio) &&
    cantidad &&
    !Number.isNaN(cantidad)
      ? precio * cantidad
      : null;

  return (
    <div className="rounded-lg border border-[#f5d0d9] p-2.5">
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_7rem_auto]">
        {/* Artículo con sugerencias del catálogo de stock */}
        <div className="relative col-span-2 sm:col-span-1">
          <label className="sr-only" htmlFor={`art-${r.clave}`}>
            Artículo {n + 1}
          </label>
          <input
            id={`art-${r.clave}`}
            value={r.nombre}
            maxLength={150}
            autoComplete="off"
            placeholder="Artículo (ej. Hisopos)"
            onFocus={() => setSugerir(true)}
            onBlur={() => setTimeout(() => setSugerir(false), 150)}
            onChange={(e) => {
              const nombre = e.target.value;
              // Si se cambia el nombre deja de ser el del catálogo.
              const sigue =
                producto && normalizar(producto.nombre) === normalizar(nombre);
              onCambio({ nombre, productoId: sigue ? r.productoId : null });
            }}
            className={CAMPO}
          />
          {sugerir && !soloLectura && sugerencias.length > 0 && (
            <ul className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-[#f5d0d9] bg-white py-1 text-sm">
              {sugerencias.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onCambio({
                        nombre: p.nombre,
                        productoId: p.id,
                        afectaStock: true,
                      });
                      setSugerir(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[#4a3540] hover:bg-[#fcf0f3]"
                  >
                    <span className="truncate">{p.nombre}</span>
                    {p.cantidad !== null && (
                      <span className="shrink-0 text-xs text-[#8b5a6b] tabular-nums">
                        hay {p.cantidad}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="grid gap-0.5">
          <span className="text-[11px] text-[#8b5a6b] sm:sr-only">
            Cantidad
          </span>
          <input
            inputMode="numeric"
            value={r.cantidad}
            onChange={(e) =>
              onCambio({ cantidad: e.target.value.replace(/\D/g, '') })
            }
            aria-label="Cantidad"
            className={`${CAMPO} text-center tabular-nums`}
          />
        </label>
        <label className="grid gap-0.5">
          <span className="text-[11px] text-[#8b5a6b] sm:sr-only">
            Precio c/u
          </span>
          <input
            inputMode="decimal"
            value={r.precio}
            onChange={(e) => onCambio({ precio: e.target.value })}
            placeholder="Precio c/u"
            aria-label="Precio por unidad"
            className={`${CAMPO} tabular-nums`}
          />
        </label>
        {onQuitar && !soloLectura ? (
          <button
            type="button"
            onClick={onQuitar}
            aria-label="Quitar artículo"
            className={`${BOTON_ICONO} self-end sm:self-auto`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <span className="hidden sm:block sm:w-8" />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex items-center gap-1.5 text-xs text-[#6b4c57]">
          <Switch
            checked={r.afectaStock}
            onCheckedChange={(v) => onCambio({ afectaStock: v })}
            disabled={soloLectura}
            className="data-[state=checked]:bg-[#4a3540] data-[state=unchecked]:bg-[#f5d0d9]"
          />
          Stock
        </label>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={soloLectura}
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-[#6b4c57] hover:bg-[#fcf0f3] ${FOCO}`}
            >
              <Tag className="h-3.5 w-3.5" aria-hidden />
              {elegidas.length
                ? elegidas.map((c) => c.nombre).join(', ')
                : 'Categorías'}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-56 border-[#f5d0d9] bg-white p-1.5 shadow-none"
          >
            {categorias.length === 0 ? (
              <p className="p-2 text-xs text-[#8b5a6b]">
                No hay categorías. Se cargan en la pestaña Categorías.
              </p>
            ) : (
              categorias.map((c) => {
                const marcada = r.categoriaIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#4a3540] hover:bg-[#fcf0f3]"
                  >
                    <Checkbox
                      checked={marcada}
                      onCheckedChange={() =>
                        onCambio({
                          categoriaIds: marcada
                            ? r.categoriaIds.filter((x) => x !== c.id)
                            : [...r.categoriaIds, c.id],
                        })
                      }
                      className="border-[#d4a7ca] data-[state=checked]:border-[#4a3540] data-[state=checked]:bg-[#4a3540]"
                    />
                    {c.nombre}
                  </label>
                );
              })
            )}
          </PopoverContent>
        </Popover>

        {entregado && (
          <label className="flex items-center gap-1.5 text-xs text-[#6b4c57]">
            Llegaron
            <input
              inputMode="numeric"
              value={r.recibido}
              onChange={(e) =>
                onCambio({ recibido: e.target.value.replace(/\D/g, '') })
              }
              placeholder={r.cantidad || '0'}
              aria-label="Cuántos llegaron"
              className={`${CAMPO_BASE} h-7 w-16 text-center tabular-nums`}
            />
          </label>
        )}

        {subtotal !== null && (
          <span className="ml-auto text-xs text-[#8b5a6b] tabular-nums">
            {plata(subtotal, moneda)}
          </span>
        )}
      </div>
      {r.afectaStock && !r.productoId && r.nombre.trim() && (
        <p className="mt-1.5 text-[11px] text-[#8b5a6b]">
          Se suma al catálogo de Control de Stock al guardar.
        </p>
      )}
    </div>
  );
}

function SelectorProveedores({
  elegidos,
  pedido,
  proveedores,
  soloLectura,
  onCambio,
  onCreado,
}: {
  elegidos: string[];
  pedido: Pedido | null;
  proveedores: Proveedor[];
  soloLectura: boolean;
  onCambio: (ids: string[]) => void;
  onCreado: (p: Proveedor) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [creando, setCreando] = useState(false);

  // Los dados de baja que ya estaban en el pedido se siguen mostrando.
  const nombreDe = (id: string) =>
    proveedores.find((p) => p.id === id)?.nombre ??
    pedido?.proveedores.find((p) => p.id === id)?.nombre ??
    '…';
  const q = normalizar(buscar);
  const filtrados = q
    ? proveedores.filter((p) => normalizar(p.nombre).includes(q))
    : proveedores;
  const exacto = proveedores.some((p) => normalizar(p.nombre) === q);

  const crear = async () => {
    const nombre = buscar.trim();
    if (!nombre) return;
    setCreando(true);
    try {
      const p = await comprasService.crearProveedor({ nombre });
      onCreado(p);
      onCambio([...elegidos, p.id]);
      setBuscar('');
      toast.success(`Proveedor "${p.nombre}" creado`);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo crear el proveedor'));
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {elegidos.map((id) => (
        <span
          key={id}
          className="inline-flex items-center gap-1 rounded-full border border-[#f5d0d9] bg-[#fcf0f3] py-0.5 pr-1 pl-2.5 text-sm text-[#4a3540]"
        >
          {nombreDe(id)}
          {!soloLectura && (
            <button
              type="button"
              onClick={() => onCambio(elegidos.filter((x) => x !== id))}
              aria-label={`Sacar ${nombreDe(id)}`}
              className={`rounded-full p-0.5 text-[#8b5a6b] hover:bg-white ${FOCO}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!soloLectura && (
        <Popover open={abierto} onOpenChange={setAbierto}>
          <PopoverTrigger asChild>
            <button type="button" className={`${BOTON_SECUNDARIO} py-1`}>
              <Plus className="h-4 w-4" />
              {elegidos.length ? 'Otro proveedor' : 'Elegir proveedor'}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-72 border-[#f5d0d9] bg-white p-2 shadow-none"
          >
            <div className="relative mb-1.5">
              <Search
                className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#8b5a6b]"
                aria-hidden
              />
              <input
                autoFocus
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    buscar.trim() &&
                    !exacto &&
                    filtrados.length === 0
                  ) {
                    e.preventDefault();
                    crear();
                  }
                }}
                placeholder="Buscar o crear…"
                className={`${CAMPO} pl-8`}
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtrados.map((p) => {
                const marcado = elegidos.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#4a3540] hover:bg-[#fcf0f3]"
                  >
                    <Checkbox
                      checked={marcado}
                      onCheckedChange={() =>
                        onCambio(
                          marcado
                            ? elegidos.filter((x) => x !== p.id)
                            : [...elegidos, p.id]
                        )
                      }
                      className="border-[#d4a7ca] data-[state=checked]:border-[#4a3540] data-[state=checked]:bg-[#4a3540]"
                    />
                    <span className="truncate">{p.nombre}</span>
                  </label>
                );
              })}
              {filtrados.length === 0 && !buscar.trim() && (
                <p className="p-2 text-xs text-[#8b5a6b]">
                  Todavía no hay proveedores. Escribí el nombre para crearlo.
                </p>
              )}
            </div>
            {buscar.trim() && !exacto && (
              <button
                type="button"
                disabled={creando}
                onClick={crear}
                className={`mt-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[#4a3540] hover:bg-[#fcf0f3] ${FOCO}`}
              >
                <Plus className="h-4 w-4 text-[#8b5a6b]" />
                Crear &quot;{buscar.trim()}&quot;
              </button>
            )}
          </PopoverContent>
        </Popover>
      )}
      {elegidos.length === 0 && soloLectura && (
        <span className="text-sm text-[#8b5a6b]">Sin proveedor</span>
      )}
    </div>
  );
}

function FilaComprobante({
  c,
  soloLectura,
  onAbrir,
  onBorrar,
  onReintentar,
  onActualizar,
}: {
  c: ComprobantePedido;
  soloLectura: boolean;
  onAbrir: () => void;
  onBorrar: () => void;
  onReintentar: () => void;
  onActualizar: () => void;
}) {
  const costear = c.costearEstado
    ? (COSTEAR[c.costearEstado] ?? {
        texto: `Costear: ${c.costearEstado}`,
        clase: 'text-[#8b5a6b]',
      })
    : null;
  const leyendo =
    c.costearEstado === 'PENDIENTE' || c.costearEstado === 'PROCESSING';
  return (
    <li className="flex items-center gap-2 px-2.5 py-2">
      <FileText className="h-4 w-4 shrink-0 text-[#8b5a6b]" aria-hidden />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onAbrir}
          className={`flex max-w-full items-center gap-1 truncate text-left text-sm text-[#4a3540] hover:underline ${FOCO}`}
        >
          <span className="truncate">{c.nombre}</span>
          <ExternalLink
            className="h-3 w-3 shrink-0 text-[#8b5a6b]"
            aria-hidden
          />
        </button>
        <p className="text-[11px] text-[#8b5a6b] tabular-nums">
          {fechaHora(c.createdAt)}
          {c.subidoPorNombre && ` · ${c.subidoPorNombre}`}
          {costear && (
            <span
              className={`ml-1 ${costear.clase}`}
              title={c.costearDetalle ?? undefined}
            >
              · {costear.texto}
            </span>
          )}
        </p>
      </div>
      {costear?.reintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className={`${BOTON_SECUNDARIO} px-2 py-0.5 text-xs`}
        >
          Reintentar
        </button>
      )}
      {leyendo && (
        <button
          type="button"
          onClick={onActualizar}
          aria-label="Ver cómo quedó en Costear"
          className={BOTON_ICONO}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
      {!soloLectura && (
        <button
          type="button"
          onClick={onBorrar}
          aria-label={`Borrar ${c.nombre}`}
          className={BOTON_ICONO}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}
