'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
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
import { comprasService, type Categoria } from '@/services/compras.service';
import { BOTON_ICONO, BOTON_PRIMARIO, CAMPO, mensajeError } from './formato';

const ordenar = (lista: Categoria[]) =>
  [...lista].sort(
    (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es')
  );

export default function TabCategorias({ onCambio }: { onCambio?: () => void }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nueva, setNueva] = useState('');
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [moviendo, setMoviendo] = useState(false);
  const [aBorrar, setABorrar] = useState<Categoria | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCategorias(ordenar(await comprasService.categorias()));
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudieron cargar las categorías'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const nombre = nueva.trim();
    if (!nombre) return;
    setCreando(true);
    try {
      const c = await comprasService.crearCategoria({ nombre });
      setCategorias((prev) => ordenar([...prev, c]));
      setNueva('');
      onCambio?.();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo crear la categoría'));
    } finally {
      setCreando(false);
    }
  };

  const renombrar = async () => {
    if (!editando) return;
    const nombre = editando.nombre.trim();
    const actual = categorias.find((c) => c.id === editando.id);
    if (!nombre) {
      toast.error('El nombre no puede quedar vacío');
      return;
    }
    if (!actual || actual.nombre === nombre) {
      setEditando(null);
      return;
    }
    try {
      const c = await comprasService.actualizarCategoria(editando.id, {
        nombre,
        orden: actual.orden,
      });
      setCategorias((prev) =>
        ordenar(prev.map((x) => (x.id === c.id ? c : x)))
      );
      setEditando(null);
      onCambio?.();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo renombrar'));
    }
  };

  /** Intercambia el orden con la vecina (arriba o abajo). */
  const mover = async (indice: number, paso: -1 | 1) => {
    const a = categorias[indice];
    const b = categorias[indice + paso];
    if (!a || !b) return;
    // Si comparten número (cargadas a mano), se separan para que el cambio se note.
    const ordenA = b.orden === a.orden ? a.orden + paso : b.orden;
    const ordenB = a.orden;
    setMoviendo(true);
    try {
      const [nuevaA, nuevaB] = await Promise.all([
        comprasService.actualizarCategoria(a.id, {
          nombre: a.nombre,
          orden: ordenA,
        }),
        comprasService.actualizarCategoria(b.id, {
          nombre: b.nombre,
          orden: ordenB,
        }),
      ]);
      setCategorias((prev) =>
        ordenar(
          prev.map((x) =>
            x.id === nuevaA.id ? nuevaA : x.id === nuevaB.id ? nuevaB : x
          )
        )
      );
      onCambio?.();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo cambiar el orden'));
      await cargar();
    } finally {
      setMoviendo(false);
    }
  };

  const borrar = async () => {
    if (!aBorrar) return;
    try {
      await comprasService.eliminarCategoria(aBorrar.id);
      setCategorias((prev) => prev.filter((c) => c.id !== aBorrar.id));
      toast.success(`Categoría ${aBorrar.nombre} borrada`);
      onCambio?.();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo borrar'));
    } finally {
      setABorrar(null);
    }
  };

  return (
    <div className="max-w-xl space-y-4 text-[#4a3540]">
      <form onSubmit={crear} className="flex gap-2">
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          maxLength={60}
          placeholder="Nueva categoría (ej. Café y cocina)"
          aria-label="Nombre de la categoría nueva"
          className={CAMPO}
        />
        <button
          type="submit"
          disabled={creando || !nueva.trim()}
          className={BOTON_PRIMARIO}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Agregar</span>
          <span className="sr-only sm:hidden">Agregar categoría</span>
        </button>
      </form>

      {cargando ? (
        <div
          className="space-y-1.5 rounded-xl border border-[#f5d0d9] bg-white p-3"
          aria-busy
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-md bg-[#fcf0f3]"
            />
          ))}
        </div>
      ) : categorias.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e8b4c6] bg-white px-6 py-10 text-center">
          <Tags className="mx-auto mb-3 h-8 w-8 text-[#d4a7ca]" />
          <p className="text-sm text-[#6b4c57]">No hay categorías.</p>
          <p className="mt-1 text-xs text-[#8b5a6b]">
            Sirven para agrupar lo que se compra: un artículo puede tener
            varias.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#fcf0f3] overflow-hidden rounded-xl border border-[#f5d0d9] bg-white">
          {categorias.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-1 px-3 py-1.5 hover:bg-[#fdf8fa]"
            >
              {editando?.id === c.id ? (
                <>
                  <input
                    autoFocus
                    value={editando.nombre}
                    maxLength={60}
                    onChange={(e) =>
                      setEditando({ id: c.id, nombre: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renombrar();
                      if (e.key === 'Escape') setEditando(null);
                    }}
                    aria-label={`Nuevo nombre de ${c.nombre}`}
                    className={`${CAMPO} h-8`}
                  />
                  <button
                    type="button"
                    onClick={renombrar}
                    aria-label="Guardar nombre"
                    className={`${BOTON_ICONO} text-[#24533a]`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(null)}
                    aria-label="Cancelar"
                    className={BOTON_ICONO}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {c.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0 || moviendo}
                    aria-label={`Subir ${c.nombre}`}
                    className={`${BOTON_ICONO} disabled:opacity-30`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === categorias.length - 1 || moviendo}
                    aria-label={`Bajar ${c.nombre}`}
                    className={`${BOTON_ICONO} disabled:opacity-30`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando({ id: c.id, nombre: c.nombre })}
                    aria-label={`Renombrar ${c.nombre}`}
                    className={BOTON_ICONO}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setABorrar(c)}
                    aria-label={`Borrar ${c.nombre}`}
                    className={`${BOTON_ICONO} hover:bg-[#fdf0f5] hover:text-[#9b1450]`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={!!aBorrar}
        onOpenChange={(abierto) => !abierto && setABorrar(null)}
      >
        <AlertDialogContent className="border-[#f5d0d9] text-[#4a3540] shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Borrar la categoría {aBorrar?.nombre}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#6b4c57]">
              Se saca de todos los renglones de pedidos que la tenían. Los
              pedidos no se borran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f5d0d9] text-[#6b4c57] hover:bg-[#fcf0f3]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={borrar}
              className="bg-[#9b1450] text-white hover:bg-[#7d1040]"
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
