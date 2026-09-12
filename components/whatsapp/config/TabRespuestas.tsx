'use client';

import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { whatsappService, type Respuesta, type RespuestaInput } from '@/services/whatsapp.service';

const VACIA: RespuestaInput = {
  clave: '',
  titulo: '',
  descripcion: '',
  ejemplos: [],
  respuesta: '',
  derivaAPersona: false,
  activa: true,
  orden: 0,
};

export default function TabRespuestas() {
  const [lista, setLista] = useState<Respuesta[] | null>(null);
  const [editando, setEditando] = useState<{ id: string | null; datos: RespuestaInput } | null>(null);
  const [ejemplosTexto, setEjemplosTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aBorrar, setABorrar] = useState<Respuesta | null>(null);

  const cargar = async () => {
    try {
      setLista(await whatsappService.respuestas());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron cargar las respuestas');
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const abrir = (r?: Respuesta) => {
    const datos: RespuestaInput = r
      ? { clave: r.clave, titulo: r.titulo, descripcion: r.descripcion, ejemplos: r.ejemplos, respuesta: r.respuesta, derivaAPersona: r.derivaAPersona, activa: r.activa, orden: r.orden }
      : { ...VACIA, orden: (lista?.length ?? 0) };
    setEditando({ id: r?.id ?? null, datos });
    setEjemplosTexto(datos.ejemplos.join('\n'));
  };

  const guardar = async () => {
    if (!editando) return;
    setGuardando(true);
    const datos: RespuestaInput = {
      ...editando.datos,
      clave: editando.datos.clave.trim().toUpperCase().replace(/\s+/g, '_'),
      ejemplos: ejemplosTexto.split('\n').map((e) => e.trim()).filter(Boolean),
    };
    try {
      if (editando.id) await whatsappService.editarRespuesta(editando.id, datos);
      else await whatsappService.crearRespuesta(datos);
      toast.success('Respuesta guardada');
      setEditando(null);
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const alternarActiva = async (r: Respuesta) => {
    try {
      await whatsappService.editarRespuesta(r.id, { activa: !r.activa });
      setLista((l) => l?.map((x) => (x.id === r.id ? { ...x, activa: !r.activa } : x)) ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cambiar');
    }
  };

  const borrar = async () => {
    if (!aBorrar) return;
    try {
      await whatsappService.borrarRespuesta(aBorrar.id);
      toast.success('Respuesta borrada');
      setABorrar(null);
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo borrar');
    }
  };

  if (!lista) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#d4a7ca]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#6b4c57]">
          El bot lee lo que escribe la clienta, elige <strong>una</strong> de estas respuestas y la manda tal cual está escrita acá. Si no encuentra
          ninguna, pregunta con un menú y, si sigue sin entender, pasa la charla a una persona.
        </p>
        <Button onClick={() => abrir()} className="shrink-0 bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white">
          <Plus className="mr-2 h-4 w-4" /> Nueva respuesta
        </Button>
      </div>

      <div className="divide-y divide-[#f9bbc4]/20 overflow-hidden rounded-xl border border-[#f9bbc4]/30 bg-white">
        {lista.map((r) => (
          <div key={r.id} className="flex items-start gap-3 px-4 py-3">
            <Switch checked={r.activa} onCheckedChange={() => void alternarActiva(r)} className="mt-1" aria-label="Activa" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-[#4a3540]">{r.titulo}</span>
                <code className="rounded bg-[#f9bbc4]/15 px-1.5 py-0.5 text-[11px] text-[#8b5a6b]">{r.clave}</code>
                {r.derivaAPersona && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] text-amber-700">
                    <UserRound className="mr-1 h-3 w-3" /> Pasa a una persona
                  </Badge>
                )}
                {!r.activa && <Badge variant="outline" className="text-[11px] text-gray-500">Desactivada</Badge>}
              </div>
              <div className="mt-0.5 text-xs text-[#8b5a6b]">{r.descripcion}</div>
              <div className="mt-1 line-clamp-2 text-xs whitespace-pre-line text-[#6b4c57]/80">{r.respuesta}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="ghost" onClick={() => abrir(r)} aria-label="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setABorrar(r)} className="text-rose-600" aria-label="Borrar">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(editando)} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#4a3540]">{editando?.id ? 'Editar respuesta' : 'Nueva respuesta'}</DialogTitle>
            <DialogDescription>
              La <em>descripción</em> y los <em>ejemplos</em> le sirven al bot para reconocer la pregunta. La <em>respuesta</em> es lo que recibe la
              clienta, palabra por palabra.
            </DialogDescription>
          </DialogHeader>
          {editando && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="titulo">Título (para vos)</Label>
                  <Input id="titulo" value={editando.datos.titulo} onChange={(e) => setEditando({ ...editando, datos: { ...editando.datos, titulo: e.target.value } })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="clave">Clave</Label>
                  <Input
                    id="clave"
                    value={editando.datos.clave}
                    onChange={(e) => setEditando({ ...editando, datos: { ...editando.datos, clave: e.target.value.toUpperCase() } })}
                    placeholder="EJ_MI_RESPUESTA"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="descripcion">Cuándo aplica</Label>
                <Input
                  id="descripcion"
                  value={editando.datos.descripcion}
                  onChange={(e) => setEditando({ ...editando, datos: { ...editando.datos, descripcion: e.target.value } })}
                  placeholder="Pregunta qué es el nanoblading o en qué consiste."
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ejemplos">Ejemplos de cómo lo preguntan (uno por línea)</Label>
                <Textarea id="ejemplos" rows={3} value={ejemplosTexto} onChange={(e) => setEjemplosTexto(e.target.value)} placeholder={'qué es el nanoblading?\nen qué consiste el nano?'} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="respuesta">Respuesta que recibe la clienta</Label>
                <Textarea id="respuesta" rows={8} value={editando.datos.respuesta} onChange={(e) => setEditando({ ...editando, datos: { ...editando.datos, respuesta: e.target.value } })} />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-[#6b4c57]">
                  <Switch checked={editando.datos.derivaAPersona} onCheckedChange={(v) => setEditando({ ...editando, datos: { ...editando.datos, derivaAPersona: v } })} />
                  Después de responder, pasa la charla a una persona
                </label>
                <label className="flex items-center gap-2 text-sm text-[#6b4c57]">
                  <Switch checked={editando.datos.activa} onCheckedChange={(v) => setEditando({ ...editando, datos: { ...editando.datos, activa: v } })} />
                  Activa
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando} className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white">
              {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(aBorrar)} onOpenChange={(o) => !o && setABorrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrar “{aBorrar?.titulo}”</AlertDialogTitle>
            <AlertDialogDescription>El bot deja de reconocer esta pregunta. Si preferís pausarla, desactivala en vez de borrarla.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={borrar} className="bg-rose-600 text-white hover:bg-rose-700">
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
