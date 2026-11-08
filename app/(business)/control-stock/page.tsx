'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import Spinner from '@/components/common/Spinner';
import ModalCargarProductos from '@/components/stock/ModalCargarProductos';
import PanelSolicitudes from '@/components/stock/PanelSolicitudes';
import PanelAccesos from '@/components/stock/PanelAccesos';
import PanelRitmoProductos from '@/components/stock/PanelRitmoProductos';
import BotonAvisosCelular from '@/components/common/BotonAvisosCelular';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertTriangle,
  Check,
  ClipboardCheck,
  ClipboardList,
  KeyRound,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { CLASE_POCO_STOCK, fechaHora, mensajeError } from '@/components/compras/formato';
import { toast } from 'sonner';
import {
  solicitudesStockService,
  stockService,
  type AjusteStock,
  type ProductoStock,
} from '@/services/stock.service';
import { trabajadoresService } from '@/services/trabajadores.service';
import type { TrabajadorNew } from '@/services/unidadNegocio.service';

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Control de Stock' },
];

type Pestana = 'productos' | 'solicitudes' | 'accesos';
const PESTANAS: { id: Pestana; texto: string; icono: typeof Package }[] = [
  { id: 'productos', texto: 'Productos', icono: Package },
  { id: 'solicitudes', texto: 'Registros', icono: ClipboardList },
  { id: 'accesos', texto: 'Accesos', icono: KeyRound },
];

/** "Quedan 2" / "Sin stock". */
const textoPoco = (cantidad: number | null) =>
  cantidad !== null && cantidad <= 0 ? 'Sin stock' : `Quedan ${cantidad ?? 0}`;

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function ControlStockPage() {
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [trabajadores, setTrabajadores] = useState<TrabajadorNew[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pestana, setPestana] = useState<Pestana>('productos');
  const [pendientes, setPendientes] = useState(0);

  // Los avisos de pedidos traen ?tab=solicitudes.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'solicitudes' || tab === 'accesos') setPestana(tab);
    solicitudesStockService.pendientes().then(setPendientes).catch(() => {});
  }, []);

  useEffect(() => {
    const alAviso = (e: Event) => {
      if ((e as CustomEvent<{ tipo?: string }>).detail?.tipo === 'SOLICITUD_STOCK') {
        setPendientes((n) => n + 1);
      }
    };
    window.addEventListener('mery:notificacion', alAviso);
    return () => window.removeEventListener('mery:notificacion', alAviso);
  }, []);

  const cambiarPestana = (p: Pestana) => {
    setPestana(p);
    const url = new URL(window.location.href);
    if (p === 'productos') url.searchParams.delete('tab');
    else url.searchParams.set('tab', p);
    window.history.replaceState(null, '', url);
  };

  // Lista de productos
  const [busquedaProductos, setBusquedaProductos] = useState('');
  const [editando, setEditando] = useState<{ id: string; nombre: string } | null>(null);
  const [aEliminar, setAEliminar] = useState<ProductoStock | null>(null);

  // Conteo (ajuste a lo que hay) y mínimo para el aviso
  const [contando, setContando] = useState<ProductoStock | null>(null);
  const [contado, setContado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [minimo, setMinimo] = useState('');
  const [ajustes, setAjustes] = useState<AjusteStock[]>([]);
  const [guardandoConteo, setGuardandoConteo] = useState(false);

  // Asignación
  const [trabajadorId, setTrabajadorId] = useState<string>('');
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [busquedaAsignar, setBusquedaAsignar] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [prods, trabs] = await Promise.all([
        stockService.listarProductos(),
        trabajadoresService.getTrabajadores(),
      ]);
      setProductos(prods);
      setTrabajadores(
        trabs
          .filter((t) => t.activo && !t.deletedAt)
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cargar el control de stock');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // trabajadorId -> productos asignados
  const asignados = useMemo(() => {
    const mapa = new Map<string, Set<string>>();
    for (const p of productos) {
      for (const t of p.trabajadores) {
        if (!mapa.has(t.id)) mapa.set(t.id, new Set());
        mapa.get(t.id)!.add(p.id);
      }
    }
    return mapa;
  }, [productos]);

  const seleccionarTrabajador = (id: string) => {
    setTrabajadorId(id);
    setSeleccion(new Set(asignados.get(id) ?? []));
    setBusquedaAsignar('');
  };

  const original = asignados.get(trabajadorId) ?? new Set<string>();
  const hayCambios =
    !!trabajadorId &&
    (seleccion.size !== original.size || [...seleccion].some((id) => !original.has(id)));

  const productosFiltrados = useMemo(() => {
    const q = normalizar(busquedaProductos.trim());
    return q ? productos.filter((p) => normalizar(p.nombre).includes(q)) : productos;
  }, [productos, busquedaProductos]);

  const productosAsignar = useMemo(() => {
    const q = normalizar(busquedaAsignar.trim());
    return q ? productos.filter((p) => normalizar(p.nombre).includes(q)) : productos;
  }, [productos, busquedaAsignar]);

  const toggleProducto = (id: string) =>
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  const marcarVisibles = (marcar: boolean) =>
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      productosAsignar.forEach((p) => (marcar ? nuevo.add(p.id) : nuevo.delete(p.id)));
      return nuevo;
    });

  const guardarAsignacion = async () => {
    const trabajador = trabajadores.find((t) => t.id === trabajadorId);
    if (!trabajador) return;
    setGuardando(true);
    try {
      await stockService.asignarProductos(trabajadorId, [...seleccion]);
      setProductos((prev) =>
        prev.map((p) => {
          const sinEl = p.trabajadores.filter((t) => t.id !== trabajadorId);
          return {
            ...p,
            trabajadores: seleccion.has(p.id)
              ? [...sinEl, { id: trabajador.id, nombre: trabajador.nombre }]
              : sinEl,
          };
        }),
      );
      toast.success(`Productos de ${trabajador.nombre} guardados`);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar la asignación');
    } finally {
      setGuardando(false);
    }
  };

  const guardarNombre = async () => {
    if (!editando) return;
    const nombre = editando.nombre.trim();
    if (!nombre) {
      toast.error('El nombre no puede quedar vacío');
      return;
    }
    try {
      await stockService.renombrarProducto(editando.id, nombre);
      setProductos((prev) =>
        prev
          .map((p) => (p.id === editando.id ? { ...p, nombre } : p))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setEditando(null);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo renombrar el producto');
    }
  };

  const eliminarProducto = async () => {
    if (!aEliminar) return;
    try {
      await stockService.eliminarProducto(aEliminar.id);
      setProductos((prev) => prev.filter((p) => p.id !== aEliminar.id));
      setSeleccion((prev) => {
        const nuevo = new Set(prev);
        nuevo.delete(aEliminar.id);
        return nuevo;
      });
      toast.success('Producto eliminado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar el producto');
    } finally {
      setAEliminar(null);
    }
  };

  const abrirConteo = (p: ProductoStock) => {
    setContando(p);
    setContado(p.cantidad !== null && p.cantidad >= 0 ? String(p.cantidad) : '');
    setMotivo('');
    setMinimo(p.stockMinimo !== null ? String(p.stockMinimo) : '');
    setAjustes([]);
    stockService
      .ajustes(p.id)
      .then(setAjustes)
      .catch(() => setAjustes([]));
  };

  const guardarConteo = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!contando) return;
    if (!/^\d+$/.test(contado.trim())) {
      toast.error('Escribí cuántos hay (un número entero, 0 o más)');
      return;
    }
    if (minimo.trim() && !/^\d+$/.test(minimo.trim())) {
      toast.error('El aviso tiene que ser un número entero, o dejalo vacío');
      return;
    }
    const nuevoMinimo = minimo.trim() ? Number(minimo.trim()) : null;
    setGuardandoConteo(true);
    try {
      if (nuevoMinimo !== contando.stockMinimo) {
        await stockService.cambiarMinimo(contando.id, nuevoMinimo);
      }
      const r = await stockService.ajustar(contando.id, Number(contado.trim()), motivo.trim());
      setProductos((prev) =>
        prev.map((p) =>
          p.id === contando.id ? { ...p, ...r, stockMinimo: nuevoMinimo } : p,
        ),
      );
      toast.success(`${contando.nombre}: quedan ${r.cantidad ?? 0}`);
      setContando(null);
      cargar();
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo guardar el conteo'));
    } finally {
      setGuardandoConteo(false);
    }
  };

  const bajos = useMemo(() => productos.filter((p) => p.bajo), [productos]);

  const onCreados = (nuevos: ProductoStock[]) =>
    setProductos((prev) =>
      [...prev, ...nuevos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );

  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Control de Stock" />

          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8">
              <div
                role="tablist"
                aria-label="Secciones de Control de Stock"
                className="mb-6 flex gap-1 rounded-xl border border-[#f9bbc4]/30 bg-white/80 p-1"
              >
                {PESTANAS.map(({ id, texto, icono: Icono }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={pestana === id}
                    onClick={() => cambiarPestana(id)}
                    className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium whitespace-nowrap transition-colors sm:gap-2 sm:px-3 ${
                      pestana === id ? 'bg-[#d4748c] text-white shadow' : 'text-[#6b4c57] hover:bg-[#f9bbc4]/15'
                    }`}
                  >
                    {/* En el celular sin ícono: así entran las tres pestañas con el contador. */}
                    <Icono className="hidden h-4 w-4 sm:block" />
                    {texto}
                    {id === 'solicitudes' && pendientes > 0 && (
                      <span
                        className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                          pestana === id ? 'bg-white/90 text-[#c0607a]' : 'bg-[#d4748c] text-white'
                        }`}
                      >
                        {pendientes}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {cargando ? (
                <div className="flex justify-center py-16">
                  <Spinner />
                </div>
              ) : pestana === 'solicitudes' ? (
                <div className="space-y-4">
                  <BotonAvisosCelular className="w-full sm:w-auto" />
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <PanelSolicitudes onPendientes={setPendientes} />
                    </div>
                    <PanelRitmoProductos />
                  </div>
                </div>
              ) : pestana === 'accesos' ? (
                <PanelAccesos trabajadores={trabajadores} />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* Productos */}
                    <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl lg:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-[#4a3540]">
                          <span className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-[#8b5a6b]" />
                            Productos
                            <Badge variant="outline" className="border-[#f9bbc4]/40 text-[#8b5a6b]">
                              {productos.length}
                            </Badge>
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setModalAbierto(true)}
                            className="bg-[#d4748c] font-semibold text-white hover:bg-[#c0607a]"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Cargar productos
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {bajos.length > 0 && (
                          <p className="flex items-start gap-1.5 text-xs text-[#7a4a05]">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span>
                              Quedan pocos:{' '}
                              {bajos.map((p, i) => (
                                <span key={p.id} className="tabular-nums">
                                  {i > 0 && ' · '}
                                  {p.nombre} ({p.cantidad ?? 0})
                                </span>
                              ))}
                            </span>
                          </p>
                        )}

                        {productos.length > 0 && (
                          <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
                            <Input
                              value={busquedaProductos}
                              onChange={(e) => setBusquedaProductos(e.target.value)}
                              placeholder="Buscar producto..."
                              className="border-[#f9bbc4]/40 pl-9"
                            />
                          </div>
                        )}

                        {productos.length === 0 ? (
                          <div className="rounded-lg border-2 border-dashed border-[#f9bbc4]/40 p-8 text-center">
                            <Package className="mx-auto mb-3 h-10 w-10 text-[#d4a7ca]" />
                            <p className="text-sm font-medium text-[#6b4c57]">
                              Todavía no hay productos
                            </p>
                            <p className="text-xs text-[#8b5a6b]">
                              Tocá &quot;Cargar productos&quot; para empezar
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[60dvh] divide-y divide-[#f9bbc4]/15 overflow-y-auto rounded-lg border border-[#f9bbc4]/20">
                            {productosFiltrados.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-1 px-3 py-1.5 hover:bg-[#f9bbc4]/5 sm:gap-2"
                              >
                                {editando?.id === p.id ? (
                                  <>
                                    <Input
                                      autoFocus
                                      value={editando.nombre}
                                      maxLength={150}
                                      onChange={(e) =>
                                        setEditando({ id: p.id, nombre: e.target.value })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') guardarNombre();
                                        if (e.key === 'Escape') setEditando(null);
                                      }}
                                      className="h-8 border-[#f9bbc4]/40"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Guardar nombre"
                                      onClick={guardarNombre}
                                      className="h-10 w-10 shrink-0 p-0 text-green-600 hover:bg-green-50 sm:h-8 sm:w-8"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Cancelar edición"
                                      onClick={() => setEditando(null)}
                                      className="h-10 w-10 shrink-0 p-0 text-[#8b5a6b] sm:h-8 sm:w-8"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="min-w-0 flex-1 text-sm break-words text-[#4a3540]">
                                      {p.nombre}
                                      {p.trabajadores.length > 0 && (
                                        <span className="block text-xs text-[#8b5a6b]">
                                          {`${p.trabajadores.length} ${p.trabajadores.length === 1 ? 'persona' : 'personas'}`}
                                        </span>
                                      )}
                                    </span>
                                    {p.bajo ? (
                                      <span
                                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs tabular-nums ${CLASE_POCO_STOCK}`}
                                        title={
                                          p.stockMinimo !== null
                                            ? `Avisa cuando quedan ${p.stockMinimo} o menos`
                                            : 'Avisa cuando queda 1 o ninguno'
                                        }
                                      >
                                        <AlertTriangle className="h-3 w-3" aria-hidden />
                                        {textoPoco(p.cantidad)}
                                      </span>
                                    ) : p.cantidad === null ? (
                                      <span
                                        className="shrink-0 px-1 text-sm text-[#b496a2]"
                                        title="Todavía no se lleva la cuenta: entra con una compra entregada o con un conteo"
                                      >
                                        —
                                      </span>
                                    ) : (
                                      <span
                                        className="shrink-0 px-1 text-sm text-[#4a3540] tabular-nums"
                                        title="Cantidad que hay"
                                      >
                                        {p.cantidad}
                                      </span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label={`Contar ${p.nombre}`}
                                      title="Contar cuántos hay"
                                      onClick={() => abrirConteo(p)}
                                      className="h-10 w-10 shrink-0 p-0 text-[#8b5a6b] hover:bg-[#f9bbc4]/10 sm:h-8 sm:w-8"
                                    >
                                      <ClipboardCheck className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Renombrar"
                                      onClick={() => setEditando({ id: p.id, nombre: p.nombre })}
                                      className="h-10 w-10 shrink-0 p-0 text-[#8b5a6b] hover:bg-[#f9bbc4]/10 sm:h-8 sm:w-8"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Eliminar"
                                      onClick={() => setAEliminar(p)}
                                      className="h-10 w-10 shrink-0 p-0 text-[#8b5a6b] hover:bg-red-50 hover:text-red-500 sm:h-8 sm:w-8"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            ))}
                            {productosFiltrados.length === 0 && (
                              <p className="p-4 text-center text-sm text-[#8b5a6b]">
                                Ningún producto coincide con la búsqueda
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Asignación */}
                    <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl lg:col-span-3">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-[#4a3540]">
                          <UserCheck className="h-5 w-5 text-[#8b5a6b]" />
                          Asignar productos al personal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Select value={trabajadorId} onValueChange={seleccionarTrabajador}>
                          <SelectTrigger className="w-full border-[#f9bbc4]/40">
                            <SelectValue placeholder="Elegí a alguien del personal" />
                          </SelectTrigger>
                          <SelectContent>
                            {trabajadores.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nombre}
                                {asignados.get(t.id)?.size
                                  ? ` · ${asignados.get(t.id)!.size} productos`
                                  : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {!trabajadorId ? (
                          <div className="rounded-lg border-2 border-dashed border-[#f9bbc4]/40 p-8 text-center text-sm text-[#8b5a6b]">
                            {trabajadores.length === 0
                              ? 'No hay personal activo. Cargalo desde "Personal y Clientes".'
                              : 'Elegí una persona para marcar los productos que usa.'}
                          </div>
                        ) : productos.length === 0 ? (
                          <div className="rounded-lg border-2 border-dashed border-[#f9bbc4]/40 p-8 text-center text-sm text-[#8b5a6b]">
                            Primero cargá algún producto.
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
                                <Input
                                  value={busquedaAsignar}
                                  onChange={(e) => setBusquedaAsignar(e.target.value)}
                                  placeholder="Filtrar productos..."
                                  className="border-[#f9bbc4]/40 pl-9"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => marcarVisibles(true)}
                                  className="border-[#f9bbc4]/40 text-[#6b4c57]"
                                >
                                  Marcar todos
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => marcarVisibles(false)}
                                  className="border-[#f9bbc4]/40 text-[#6b4c57]"
                                >
                                  Ninguno
                                </Button>
                              </div>
                            </div>

                            <div className="grid max-h-[50dvh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                              {productosAsignar.map((p) => {
                                const marcado = seleccion.has(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                      marcado
                                        ? 'border-[#e8b4c6] bg-[#f9bbc4]/15 text-[#4a3540]'
                                        : 'border-[#f9bbc4]/20 text-[#6b4c57] hover:bg-[#f9bbc4]/5'
                                    }`}
                                  >
                                    <Checkbox
                                      checked={marcado}
                                      onCheckedChange={() => toggleProducto(p.id)}
                                      className="border-[#d4a7ca] data-[state=checked]:border-[#e292a3] data-[state=checked]:bg-[#e292a3]"
                                    />
                                    {p.nombre}
                                  </label>
                                );
                              })}
                            </div>

                            <div className="flex items-center justify-between border-t border-[#f9bbc4]/20 pt-4">
                              <span className="text-sm text-[#6b4c57]">
                                {seleccion.size} {seleccion.size === 1 ? 'producto marcado' : 'productos marcados'}
                              </span>
                              <Button
                                onClick={guardarAsignacion}
                                disabled={!hayCambios || guardando}
                                className="bg-[#d4748c] font-semibold text-white hover:bg-[#c0607a]"
                              >
                                {guardando ? 'Guardando...' : 'Guardar'}
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Resumen por persona */}
                  {asignados.size > 0 && (
                    <Card className="mt-6 border border-[#f9bbc4]/30 bg-white/95">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-[#4a3540]">
                          Qué usa cada persona
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {trabajadores
                          .filter((t) => asignados.get(t.id)?.size)
                          .map((t) => (
                            <div
                              key={t.id}
                              className="flex flex-col gap-2 border-b border-[#f9bbc4]/10 pb-3 last:border-0 last:pb-0 sm:flex-row"
                            >
                              <button
                                type="button"
                                onClick={() => seleccionarTrabajador(t.id)}
                                className="w-44 shrink-0 text-left text-sm font-medium text-[#4a3540] hover:text-[#e292a3]"
                              >
                                {t.nombre}
                              </button>
                              <div className="flex flex-wrap gap-1.5">
                                {productos
                                  .filter((p) => asignados.get(t.id)!.has(p.id))
                                  .map((p) => (
                                    <Badge
                                      key={p.id}
                                      variant="outline"
                                      className="border-[#f9bbc4]/40 bg-[#f9bbc4]/10 text-[#6b4c57]"
                                    >
                                      {p.nombre}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <ModalCargarProductos
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onCreados={onCreados}
        />

        <Dialog open={!!contando} onOpenChange={(abierto) => !abierto && setContando(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-[#f5d0d9] text-[#4a3540] sm:max-w-sm">
            <DialogTitle className="text-lg font-medium text-[#4a3540]">
              Contar {contando?.nombre}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6b4c57]">
              {contando?.cantidad === null || contando?.cantidad === undefined
                ? 'Desde este conteo se empieza a llevar la cuenta.'
                : `Según el sistema hay ${contando.cantidad}. Si contaste otra cosa, queda lo que pongas.`}
            </DialogDescription>
            {contando && (
              <form onSubmit={guardarConteo} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="conteo-hay" className="text-xs text-[#8b5a6b]">
                    ¿Cuántos hay ahora?
                  </label>
                  <Input
                    id="conteo-hay"
                    autoFocus
                    required
                    inputMode="numeric"
                    value={contado}
                    onChange={(e) => setContado(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="border-[#f9bbc4]/40 tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="conteo-motivo" className="text-xs text-[#8b5a6b]">
                    Motivo (opcional)
                  </label>
                  <Input
                    id="conteo-motivo"
                    maxLength={200}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Conteo del lunes, se rompió uno…"
                    className="border-[#f9bbc4]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="conteo-minimo" className="text-xs text-[#8b5a6b]">
                    Avisar cuando queden (opcional)
                  </label>
                  <Input
                    id="conteo-minimo"
                    inputMode="numeric"
                    value={minimo}
                    onChange={(e) => setMinimo(e.target.value.replace(/\D/g, ''))}
                    placeholder="Vacío: avisa con 1 o ninguno"
                    className="border-[#f9bbc4]/40 tabular-nums"
                  />
                </div>

                {ajustes.length > 0 && (
                  <div className="space-y-1 border-t border-[#f9bbc4]/20 pt-3">
                    <p className="text-xs text-[#8b5a6b]">Últimos conteos</p>
                    <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-[#6b4c57]">
                      {ajustes.slice(0, 8).map((a) => (
                        <li key={a.id} className="flex gap-2">
                          <span className="shrink-0 tabular-nums">{fechaHora(a.createdAt)}</span>
                          <span className="w-10 shrink-0 text-right tabular-nums">
                            {a.cantidad > 0 ? `+${a.cantidad}` : a.cantidad < 0 ? `−${Math.abs(a.cantidad)}` : '0'}
                          </span>
                          <span className="min-w-0 truncate" title={a.motivo ?? undefined}>
                            {a.motivo}
                            {a.hechoPorNombre ? ` · ${a.hechoPorNombre}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setContando(null)}
                    className="border-[#f9bbc4]/40 text-[#6b4c57]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={guardandoConteo}
                    className="bg-[#d4748c] font-semibold text-white hover:bg-[#c0607a]"
                  >
                    {guardandoConteo ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!aEliminar} onOpenChange={(open) => !open && setAEliminar(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Se va a eliminar &quot;{aEliminar?.nombre}&quot;
                {aEliminar?.trabajadores.length
                  ? ` y se va a quitar a ${aEliminar.trabajadores.length === 1 ? '1 persona' : `${aEliminar.trabajadores.length} personas`} que lo tienen asignado`
                  : ''}
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={eliminarProducto}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
