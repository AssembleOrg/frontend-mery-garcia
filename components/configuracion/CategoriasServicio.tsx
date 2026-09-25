'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  categoriasServicioService,
  CategoriaServicio,
  ServicioParaCategorizar,
} from '@/services/categoriasServicio.service';

const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Formulario {
  id: string | null;
  nombre: string;
  descripcion: string;
  servicioIds: Set<string>;
}

/**
 * ABM de categorías de servicio (A, B, C...). Cada servicio pertenece a una
 * sola categoría; en Comisiones se cuenta cuántos de cada una hizo cada
 * profesional.
 */
export default function CategoriasServicio() {
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
  const [servicios, setServicios] = useState<ServicioParaCategorizar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState<Formulario | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aBorrar, setABorrar] = useState<CategoriaServicio | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [cats, servs] = await Promise.all([
        categoriasServicioService.listar(),
        categoriasServicioService.serviciosDisponibles(),
      ]);
      setCategorias(cats);
      setServicios(servs);
    } catch {
      toast.error('No se pudieron cargar las categorías');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Servicio → categoría actual (según la lista de categorías, que es la fuente fresca).
  const categoriaDeServicio = useMemo(() => {
    const m = new Map<string, CategoriaServicio>();
    for (const c of categorias) for (const s of c.servicios) m.set(s.id, c);
    return m;
  }, [categorias]);

  const sinCategoria = useMemo(
    () =>
      servicios.filter(
        (s) =>
          s.activo &&
          !categoriaDeServicio.has(s.id) &&
          s.unidadNegocio?.nombre !== 'Consultas',
      ),
    [servicios, categoriaDeServicio],
  );

  const abrirNueva = () => {
    setBusqueda('');
    setForm({ id: null, nombre: '', descripcion: '', servicioIds: new Set() });
  };

  const abrirEdicion = (c: CategoriaServicio) => {
    setBusqueda('');
    setForm({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion ?? '',
      servicioIds: new Set(c.servicios.map((s) => s.id)),
    });
  };

  const alternarServicio = (id: string) => {
    setForm((f) => {
      if (!f) return f;
      const ids = new Set(f.servicioIds);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { ...f, servicioIds: ids };
    });
  };

  // Servicios para elegir: activos, más los inactivos que ya estén marcados.
  const serviciosFiltrados = useMemo(() => {
    if (!form) return [];
    const q = normalizar(busqueda.trim());
    return servicios
      .filter((s) => s.activo || form.servicioIds.has(s.id))
      .filter((s) => !q || normalizar(s.nombre).includes(q))
      .sort((a, b) => {
        // Marcados primero, después por unidad y nombre.
        const ma = form.servicioIds.has(a.id) ? 0 : 1;
        const mb = form.servicioIds.has(b.id) ? 0 : 1;
        if (ma !== mb) return ma - mb;
        const ua = a.unidadNegocio?.nombre ?? '';
        const ub = b.unidadNegocio?.nombre ?? '';
        return ua.localeCompare(ub, 'es') || a.nombre.localeCompare(b.nombre, 'es');
      });
  }, [servicios, busqueda, form]);

  const guardar = async () => {
    if (!form) return;
    const nombre = form.nombre.trim();
    if (!nombre) {
      toast.error('Poné un nombre a la categoría');
      return;
    }
    setGuardando(true);
    try {
      const datos = {
        nombre,
        descripcion: form.descripcion.trim(),
        servicioIds: [...form.servicioIds],
      };
      if (form.id) await categoriasServicioService.actualizar(form.id, datos);
      else await categoriasServicioService.crear(datos);
      toast.success(form.id ? 'Categoría actualizada' : 'Categoría creada');
      setForm(null);
      await cargar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(msg.includes('409') ? 'Ya existe una categoría con ese nombre' : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    if (!aBorrar) return;
    try {
      await categoriasServicioService.eliminar(aBorrar.id);
      toast.success(`"${aBorrar.nombre}" eliminada. Sus servicios quedaron sin categoría.`);
      setABorrar(null);
      await cargar();
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <Card className="mt-6 border-0 shadow-lg">
      <CardHeader className="border-b bg-white">
        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
              <Layers className="h-6 w-6 text-pink-600" />
              Categorías de servicio
            </CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Agrupá los servicios (A, B, C...). En Caja → Comisiones se ve cuántos de
              cada categoría hizo cada profesional.
            </p>
          </div>
          <Button onClick={abrirNueva} className="bg-pink-600 text-white hover:bg-pink-700">
            <Plus className="mr-1 h-4 w-4" />
            Nueva categoría
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 bg-white p-6">
        {cargando ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : categorias.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no hay categorías. Creá la primera con &quot;Nueva categoría&quot;.
          </p>
        ) : (
          categorias.map((c) => (
            <div key={c.id} className="rounded-lg border-2 border-[#f9bbc4]/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{c.nombre}</span>
                    <Badge variant="outline" className="border-[#f9bbc4] text-[#8b5a6b]">
                      {c.servicios.length} {c.servicios.length === 1 ? 'servicio' : 'servicios'}
                    </Badge>
                  </div>
                  {c.descripcion && <p className="mt-0.5 text-sm text-gray-500">{c.descripcion}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => abrirEdicion(c)} aria-label={`Editar ${c.nombre}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setABorrar(c)}
                    aria-label={`Eliminar ${c.nombre}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.servicios.length === 0 ? (
                  <span className="text-xs text-gray-400">Sin servicios asignados</span>
                ) : (
                  c.servicios.map((s) => (
                    <Badge
                      key={s.id}
                      variant="secondary"
                      className={`bg-[#f9bbc4]/20 text-[#4a3540] ${s.activo ? '' : 'opacity-50 line-through'}`}
                    >
                      {s.nombre}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          ))
        )}

        {!cargando && sinCategoria.length > 0 && (
          <details className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-amber-800">
              {sinCategoria.length} servicios activos sin categoría
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sinCategoria.map((s) => (
                <Badge key={s.id} variant="outline" className="border-amber-300 text-amber-900">
                  {s.nombre}
                </Badge>
              ))}
            </div>
          </details>
        )}
      </CardContent>

      {/* Alta / edición */}
      <Dialog open={!!form} onOpenChange={(o) => !o && !guardando && setForm(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col bg-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[#4a3540]">
              {form?.id ? 'Editar categoría' : 'Nueva categoría'}
            </DialogTitle>
            <DialogDescription className="text-[#8b5a6b]">
              Marcá los servicios que pertenecen a esta categoría.
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="cat-nombre">Nombre</Label>
                  <Input
                    id="cat-nombre"
                    value={form.nombre}
                    maxLength={60}
                    placeholder="Categoría A"
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cat-desc">Descripción (opcional)</Label>
                  <Input
                    id="cat-desc"
                    value={form.descripcion}
                    maxLength={255}
                    placeholder="Laminado, modelado, refill"
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>
              </div>

              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar servicio…"
                  className="pl-9"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                {serviciosFiltrados.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">Sin resultados</p>
                ) : (
                  serviciosFiltrados.map((s) => {
                    const marcado = form.servicioIds.has(s.id);
                    const otra = categoriaDeServicio.get(s.id);
                    const enOtra = otra && otra.id !== form.id;
                    return (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-[#f9bbc4]/10 ${marcado ? 'bg-[#f9bbc4]/15' : ''}`}
                      >
                        <Checkbox checked={marcado} onCheckedChange={() => alternarServicio(s.id)} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-gray-800">{s.nombre}</div>
                          <div className="text-xs text-gray-500">
                            {s.unidadNegocio?.nombre}
                            {!s.activo && ' · inactivo'}
                          </div>
                        </div>
                        {enOtra && (
                          <span
                            className={`shrink-0 text-xs ${marcado ? 'font-medium text-amber-700' : 'text-gray-400'}`}
                          >
                            {marcado ? `se mueve de ${otra.nombre}` : `en ${otra.nombre}`}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-gray-500">{form.servicioIds.size} seleccionados</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando} className="bg-pink-600 text-white hover:bg-pink-700">
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar borrado */}
      <AlertDialog open={!!aBorrar} onOpenChange={(o) => !o && setABorrar(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar &quot;{aBorrar?.nombre}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Sus {aBorrar?.servicios.length ?? 0} servicios quedan sin categoría. Los servicios
              no se borran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={borrar} className="bg-red-600 text-white hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
