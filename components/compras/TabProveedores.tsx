'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Store, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  comprasService,
  type GuardarProveedor,
  type Proveedor,
} from '@/services/compras.service';
import {
  BOTON_ICONO,
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO,
  ETIQUETA,
  mensajeError,
  normalizar,
} from './formato';

const VACIO: GuardarProveedor = {
  nombre: '',
  documento: '',
  telefono: '',
  email: '',
  notas: '',
};

export default function TabProveedores({
  onCambio,
}: {
  onCambio?: () => void;
}) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState('');
  /** null = cerrado; id null = nuevo. */
  const [editando, setEditando] = useState<{
    id: string | null;
    datos: GuardarProveedor;
  } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aBorrar, setABorrar] = useState<Proveedor | null>(null);

  const cargar = useCallback(async () => {
    try {
      setProveedores(await comprasService.proveedores());
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudieron cargar los proveedores'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const q = normalizar(buscar);
    if (!q) return proveedores;
    return proveedores.filter((p) =>
      [p.nombre, p.documento, p.telefono, p.email, p.notas].some(
        (v) => v && normalizar(v).includes(q)
      )
    );
  }, [proveedores, buscar]);

  const abrirNuevo = () => setEditando({ id: null, datos: { ...VACIO } });
  const abrirEditar = (p: Proveedor) =>
    setEditando({
      id: p.id,
      datos: {
        nombre: p.nombre,
        documento: p.documento ?? '',
        telefono: p.telefono ?? '',
        email: p.email ?? '',
        notas: p.notas ?? '',
      },
    });

  const cambiar = (campo: keyof GuardarProveedor, valor: string) =>
    setEditando((e) =>
      e ? { ...e, datos: { ...e.datos, [campo]: valor } } : e
    );

  const guardar = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!editando) return;
    const nombre = editando.datos.nombre.trim();
    if (!nombre) {
      toast.error('Poné el nombre del proveedor');
      return;
    }
    const datos: GuardarProveedor = {
      nombre,
      documento: editando.datos.documento?.trim() || null,
      telefono: editando.datos.telefono?.trim() || null,
      email: editando.datos.email?.trim() || null,
      notas: editando.datos.notas?.trim() || null,
    };
    setGuardando(true);
    try {
      if (editando.id) {
        await comprasService.actualizarProveedor(editando.id, datos);
        toast.success('Proveedor guardado');
      } else {
        await comprasService.crearProveedor(datos);
        toast.success(`${nombre} cargado`);
      }
      setEditando(null);
      await cargar();
      onCambio?.();
    } catch (e) {
      toast.error(
        mensajeError(
          e,
          'No se pudo guardar. Revisá que el email esté bien escrito.'
        )
      );
    } finally {
      setGuardando(false);
    }
  };

  const darDeBaja = async () => {
    if (!aBorrar) return;
    try {
      await comprasService.eliminarProveedor(aBorrar.id);
      toast.success(`${aBorrar.nombre} dado de baja`);
      setProveedores((prev) => prev.filter((p) => p.id !== aBorrar.id));
      onCambio?.();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo dar de baja'));
    } finally {
      setABorrar(null);
    }
  };

  return (
    <div className="space-y-4 text-[#4a3540]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre, CUIT, teléfono…"
            aria-label="Buscar proveedor"
            className={`${CAMPO} pl-8`}
          />
        </div>
        <button type="button" onClick={abrirNuevo} className={BOTON_PRIMARIO}>
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </button>
      </div>

      {cargando ? (
        <div
          className="space-y-1.5 rounded-xl border border-[#f5d0d9] bg-white p-3"
          aria-busy
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-md bg-[#fcf0f3]"
            />
          ))}
        </div>
      ) : proveedores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e8b4c6] bg-white px-6 py-10 text-center">
          <Store className="mx-auto mb-3 h-8 w-8 text-[#d4a7ca]" />
          <p className="text-sm text-[#6b4c57]">Todavía no hay proveedores.</p>
          <p className="mt-1 text-xs text-[#8b5a6b]">
            Cargá a quién le comprás (insumos, descartables, café…) para
            elegirlo en los pedidos.
          </p>
          <button
            type="button"
            onClick={abrirNuevo}
            className={`${BOTON_SECUNDARIO} mt-4`}
          >
            <Plus className="h-4 w-4" />
            Cargar el primero
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#f5d0d9] bg-white">
          {/* Encabezado sólo en pantallas anchas */}
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_4.5rem] gap-3 border-b border-[#f5d0d9] px-4 py-2 text-xs text-[#8b5a6b] md:grid">
            <span>Proveedor</span>
            <span>Teléfono</span>
            <span>Email</span>
            <span>Notas</span>
            <span className="sr-only">Acciones</span>
          </div>
          <ul className="divide-y divide-[#fcf0f3]">
            {visibles.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-4 py-2.5 hover:bg-[#fdf8fa] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_4.5rem] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{p.nombre}</p>
                  {p.documento && (
                    <p className="truncate text-xs text-[#8b5a6b] tabular-nums">
                      {p.documento}
                    </p>
                  )}
                </div>
                <div className="col-start-1 min-w-0 text-xs text-[#6b4c57] tabular-nums md:col-start-auto md:text-sm">
                  {p.telefono || (
                    <span className="hidden text-[#b496a2] md:inline">—</span>
                  )}
                </div>
                <div className="col-start-1 min-w-0 truncate text-xs text-[#6b4c57] md:col-start-auto md:text-sm">
                  {p.email || (
                    <span className="hidden text-[#b496a2] md:inline">—</span>
                  )}
                </div>
                <div
                  className="col-start-1 min-w-0 truncate text-xs text-[#8b5a6b] md:col-start-auto"
                  title={p.notas ?? undefined}
                >
                  {p.notas || (
                    <span className="hidden text-[#b496a2] md:inline">—</span>
                  )}
                </div>
                <div className="col-start-2 row-span-4 row-start-1 flex items-start justify-end gap-0.5 md:col-start-auto md:row-span-1 md:row-start-auto md:items-center">
                  <button
                    type="button"
                    onClick={() => abrirEditar(p)}
                    aria-label={`Editar ${p.nombre}`}
                    className={BOTON_ICONO}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setABorrar(p)}
                    aria-label={`Dar de baja ${p.nombre}`}
                    className={`${BOTON_ICONO} hover:bg-[#fdf0f5] hover:text-[#9b1450]`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {visibles.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[#8b5a6b]">
              Ningún proveedor coincide con «{buscar}».
            </p>
          )}
        </div>
      )}

      <Dialog
        open={!!editando}
        onOpenChange={(abierto) => !abierto && setEditando(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#f5d0d9] text-[#4a3540] shadow-none sm:max-w-md">
          <DialogTitle className="text-lg font-medium text-[#4a3540]">
            {editando?.id ? 'Editar proveedor' : 'Nuevo proveedor'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Datos del proveedor para elegirlo en los pedidos.
          </DialogDescription>
          {editando && (
            <form onSubmit={guardar} className="space-y-3">
              <Campo etiqueta="Nombre" id="prov-nombre">
                <input
                  id="prov-nombre"
                  autoFocus
                  required
                  maxLength={120}
                  value={editando.datos.nombre}
                  onChange={(e) => cambiar('nombre', e.target.value)}
                  placeholder="Oui Classy SRL"
                  className={CAMPO}
                />
              </Campo>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo etiqueta="CUIT / DNI" id="prov-doc">
                  <input
                    id="prov-doc"
                    maxLength={40}
                    inputMode="numeric"
                    value={editando.datos.documento ?? ''}
                    onChange={(e) => cambiar('documento', e.target.value)}
                    placeholder="30-71809162-0"
                    className={`${CAMPO} tabular-nums`}
                  />
                </Campo>
                <Campo etiqueta="Teléfono" id="prov-tel">
                  <input
                    id="prov-tel"
                    type="tel"
                    maxLength={40}
                    value={editando.datos.telefono ?? ''}
                    onChange={(e) => cambiar('telefono', e.target.value)}
                    placeholder="11 5555 6666"
                    className={`${CAMPO} tabular-nums`}
                  />
                </Campo>
              </div>
              <Campo etiqueta="Email" id="prov-email">
                <input
                  id="prov-email"
                  type="email"
                  maxLength={120}
                  value={editando.datos.email ?? ''}
                  onChange={(e) => cambiar('email', e.target.value)}
                  placeholder="ventas@proveedor.com"
                  className={CAMPO}
                />
              </Campo>
              <Campo etiqueta="Notas" id="prov-notas">
                <textarea
                  id="prov-notas"
                  rows={3}
                  maxLength={2000}
                  value={editando.datos.notas ?? ''}
                  onChange={(e) => cambiar('notas', e.target.value)}
                  placeholder="Alias o CBU, horarios, a quién hablarle…"
                  className={`${CAMPO} h-auto py-2`}
                />
              </Campo>
              <div className="flex justify-end gap-2 border-t border-[#f5d0d9] pt-3">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className={BOTON_SECUNDARIO}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className={BOTON_PRIMARIO}
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!aBorrar}
        onOpenChange={(abierto) => !abierto && setABorrar(null)}
      >
        <AlertDialogContent className="border-[#f5d0d9] text-[#4a3540] shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Dar de baja a {aBorrar?.nombre}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#6b4c57]">
              Deja de aparecer para elegirlo en pedidos nuevos. Los pedidos
              viejos lo siguen mostrando.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f5d0d9] text-[#6b4c57] hover:bg-[#fcf0f3]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={darDeBaja}
              className="bg-[#9b1450] text-white hover:bg-[#7d1040]"
            >
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Campo({
  etiqueta,
  id,
  children,
}: {
  etiqueta: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={ETIQUETA}>
        {etiqueta}
      </label>
      {children}
    </div>
  );
}
