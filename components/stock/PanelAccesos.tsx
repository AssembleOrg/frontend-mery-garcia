'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Spinner from '@/components/common/Spinner';
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
import { solicitudesStockService, type AccesoEmpleado } from '@/services/stock.service';
import type { TrabajadorNew } from '@/services/unidadNegocio.service';

const sugerirUsuario = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.')
    .replace(/[^a-z0-9.]/g, '');

/**
 * Usuario y contraseña para que el personal entre a pedir productos. Entran
 * con ese usuario (sin email) y sólo ven "Mis productos".
 */
export default function PanelAccesos({ trabajadores }: { trabajadores: TrabajadorNew[] }) {
  const [accesos, setAccesos] = useState<AccesoEmpleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aQuitar, setAQuitar] = useState<TrabajadorNew | null>(null);

  useEffect(() => {
    solicitudesStockService
      .accesos()
      .then(setAccesos)
      .catch((e) => {
        console.error(e);
        toast.error('No se pudieron cargar los accesos');
      })
      .finally(() => setCargando(false));
  }, []);

  const porTrabajador = useMemo(() => new Map(accesos.map((a) => [a.trabajadorId, a])), [accesos]);

  const abrir = (t: TrabajadorNew) => {
    const a = porTrabajador.get(t.id);
    setEditando(t.id);
    setUsuario(a?.usuario ?? sugerirUsuario(t.nombre));
    setPassword('');
    setVerPassword(false);
  };

  const guardar = async (t: TrabajadorNew) => {
    const existente = porTrabajador.get(t.id);
    const necesitaPassword = !existente || !existente.activo;
    if (usuario.trim().length < 3) return toast.error('El usuario tiene que tener al menos 3 letras');
    if (necesitaPassword && password.length < 6) return toast.error('La contraseña tiene que tener al menos 6 caracteres');
    if (password && password.length < 6) return toast.error('La contraseña tiene que tener al menos 6 caracteres');
    setGuardando(true);
    try {
      const guardado = await solicitudesStockService.guardarAcceso(t.id, usuario, password || undefined);
      setAccesos((prev) => [...prev.filter((a) => a.trabajadorId !== t.id), guardado]);
      setEditando(null);
      toast.success(`${t.nombre} ya puede entrar con el usuario "${guardado.usuario}"`);
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error && error.message.includes('409') ? 'Ese usuario ya está en uso' : 'No se pudo guardar el acceso';
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async () => {
    if (!aQuitar) return;
    try {
      await solicitudesStockService.quitarAcceso(aQuitar.id);
      setAccesos((prev) => prev.map((a) => (a.trabajadorId === aQuitar.id ? { ...a, activo: false } : a)));
      toast.success(`${aQuitar.nombre} ya no puede entrar`);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo quitar el acceso');
    } finally {
      setAQuitar(null);
    }
  };

  return (
    <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[#4a3540]">
          <KeyRound className="h-5 w-5 text-[#8b5a6b]" />
          Accesos del personal
        </CardTitle>
        <p className="text-sm text-[#6b4c57]">
          Con su usuario y contraseña entran desde el celular a pedir productos. No ven nada más del sistema.
        </p>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : trabajadores.length === 0 ? (
          <p className="text-center text-sm text-[#8b5a6b]">No hay personal activo.</p>
        ) : (
          <ul className="divide-y divide-[#f9bbc4]/15 rounded-lg border border-[#f9bbc4]/20">
            {trabajadores.map((t) => {
              const a = porTrabajador.get(t.id);
              const activo = !!a?.activo;
              return (
                <li key={t.id} className="px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 text-sm font-medium text-[#4a3540]">{t.nombre}</span>
                    {activo ? (
                      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                        {a!.usuario}
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#8b5a6b]">Sin acceso</span>
                    )}
                    {editando !== t.id && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => abrir(t)}
                          className="h-9 border-[#f9bbc4]/40 text-[#6b4c57]"
                        >
                          {activo ? 'Cambiar' : 'Dar acceso'}
                        </Button>
                        {activo && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Quitar acceso a ${t.nombre}`}
                            onClick={() => setAQuitar(t)}
                            className="h-9 w-9 p-0 text-[#8b5a6b] hover:bg-red-50 hover:text-red-500"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {editando === t.id && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value.toLowerCase())}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="Usuario"
                        className="h-10 border-[#f9bbc4]/40"
                      />
                      <div className="relative">
                        <Input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={verPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder={activo ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                          className="h-10 border-[#f9bbc4]/40 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setVerPassword((v) => !v)}
                          aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#8b5a6b]"
                        >
                          {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditando(null)}
                          className="h-10 flex-1 border-[#f9bbc4]/40 text-[#6b4c57]"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => guardar(t)}
                          disabled={guardando}
                          className="h-10 flex-1 bg-[#d4748c] font-semibold text-white hover:bg-[#c0607a]"
                        >
                          {guardando ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <AlertDialog open={!!aQuitar} onOpenChange={(open) => !open && setAQuitar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar el acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              {aQuitar?.nombre} no va a poder entrar más. Sus pedidos quedan guardados y le podés volver a dar acceso
              cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={quitar} className="bg-red-500 text-white hover:bg-red-600">
              Quitar acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
