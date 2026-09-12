'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Hand, Loader2, Mic, Paperclip, Send, UserRound, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useWhatsappStore } from '@/features/whatsapp/store/whatsappStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Mensaje } from '@/services/whatsapp.service';
import BurbujaMensaje from './BurbujaMensaje';
import GrabadorAudio from './GrabadorAudio';
import { ESTADO_TEXTO, MOTIVO_TEXTO, claveDia, etiquetaDia } from './formato';

const ACEPTA = 'image/jpeg,image/png,image/webp,application/pdf,audio/*';
const MAX_BYTES = 16 * 1024 * 1024;

export default function HiloConversacion() {
  const { user } = useAuth();
  const { seleccionadaId, conversaciones, mensajes, hayMas, cargandoMensajes, cargarMasMensajes, enviarTexto, enviarAdjunto, tomar, cerrar, devolverAlBot } =
    useWhatsappStore();
  const conv = conversaciones.find((c) => c.id === seleccionadaId) ?? null;
  const lista = useMemo(() => (seleccionadaId ? (mensajes[seleccionadaId] ?? []) : []), [mensajes, seleccionadaId]);

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [imagenGrande, setImagenGrande] = useState<string | null>(null);
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [adjuntoPendiente, setAdjuntoPendiente] = useState<File | null>(null);
  const fondoRef = useRef<HTMLDivElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const ultimoIdRef = useRef<string | null>(null);

  // Al fondo cuando llega algo nuevo o cambia la charla.
  useEffect(() => {
    const ultimo = lista[lista.length - 1]?.id ?? null;
    if (ultimo !== ultimoIdRef.current) {
      ultimoIdRef.current = ultimo;
      requestAnimationFrame(() => fondoRef.current?.scrollTo({ top: fondoRef.current.scrollHeight }));
    }
  }, [lista]);

  useEffect(() => {
    setTexto('');
    setGrabando(false);
    setAdjuntoPendiente(null);
  }, [seleccionadaId]);

  if (!conv) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[#8b5a6b]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f9bbc4]/20">
          <UserRound className="h-8 w-8 text-[#d4a7ca]" />
        </div>
        <p className="text-sm">Elegí una charla de la izquierda para leerla y responder.</p>
      </div>
    );
  }

  const estado = ESTADO_TEXTO[conv.estado];
  const puedoEscribir = true; // escribir toma la charla; en una cerrada la reabre
  const esMia = conv.estado === 'ATENDIDA' && conv.atendidaPor?.id === user?.id;

  const mandarTexto = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    try {
      await enviarTexto(conv.id, t);
      setTexto('');
      areaRef.current?.focus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar');
    } finally {
      setEnviando(false);
    }
  };

  const mandarAdjunto = async (archivo: File, caption?: string) => {
    if (archivo.size > MAX_BYTES) {
      toast.error('El archivo supera los 16 MB.');
      return;
    }
    setEnviando(true);
    try {
      await enviarAdjunto(conv.id, archivo, archivo.name, { caption });
      setAdjuntoPendiente(null);
      setTexto('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar el archivo');
    } finally {
      setEnviando(false);
    }
  };

  const mandarAudio = async (blob: Blob, mime: string, segundos: number) => {
    const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    try {
      await enviarAdjunto(conv.id, blob, `nota-de-voz.${ext}`, { duracionSegundos: segundos });
      setGrabando(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar el audio');
    }
  };

  const accion = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo hacer');
    }
  };

  // Separadores por día.
  const conSeparadores: Array<{ tipo: 'dia'; clave: string; etiqueta: string } | { tipo: 'msg'; m: Mensaje }> = [];
  let diaAnterior = '';
  for (const m of lista) {
    const d = claveDia(m.createdAt);
    if (d !== diaAnterior) {
      diaAnterior = d;
      conSeparadores.push({ tipo: 'dia', clave: d, etiqueta: etiquetaDia(m.createdAt) });
    }
    conSeparadores.push({ tipo: 'msg', m });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-[#f9bbc4]/25 bg-white/70 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-base font-semibold text-[#4a3540]">{conv.contacto.etiqueta}</span>
            <Badge variant="outline" className={cn('text-[11px]', estado.clase)}>
              {estado.texto}
            </Badge>
            {conv.contacto.cliente && (
              <Badge variant="outline" className="border-[#d4a7ca]/50 bg-[#d4a7ca]/10 text-[11px] text-[#8b5a6b]">
                Clienta del sistema
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-[#8b5a6b]">
            {conv.contacto.telefono ? (
              <span>{conv.contacto.telefono}</span>
            ) : (
              <span className="italic">Número no disponible</span>
            )}
            {conv.contacto.cliente && conv.contacto.nombreWhatsapp && <span>WhatsApp: {conv.contacto.nombreWhatsapp}</span>}
            {conv.estado === 'ESPERANDO' && conv.motivoEspera && <span className="text-amber-700">{MOTIVO_TEXTO[conv.motivoEspera] ?? conv.motivoEspera}</span>}
            {conv.estado === 'ATENDIDA' && conv.atendidaPor && <span>Atiende: {esMia ? 'vos' : conv.atendidaPor.nombre}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {(conv.estado === 'ESPERANDO' || conv.estado === 'BOT' || (conv.estado === 'ATENDIDA' && !esMia)) && (
            <Button size="sm" onClick={() => accion(() => tomar(conv.id), 'Charla tomada')} className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white">
              <Hand className="mr-1.5 h-4 w-4" /> Tomar
            </Button>
          )}
          {conv.estado === 'ATENDIDA' && (
            <Button size="sm" variant="outline" onClick={() => accion(() => devolverAlBot(conv.id), 'Vuelve a responder el bot')} title="Que el bot siga respondiendo">
              <Bot className="mr-1.5 h-4 w-4" /> Al bot
            </Button>
          )}
          {conv.estado !== 'CERRADA' && (
            <Button size="sm" variant="outline" onClick={() => setConfirmarCierre(true)} className="text-rose-600">
              <XCircle className="mr-1.5 h-4 w-4" /> Cerrar
            </Button>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div ref={fondoRef} className="flex-1 overflow-y-auto bg-[#fdf6f7] px-4 py-3">
        {seleccionadaId && hayMas[seleccionadaId] && (
          <div className="mb-2 text-center">
            <button type="button" onClick={() => void cargarMasMensajes(conv.id)} className="text-xs font-medium text-[#c2637f] hover:underline">
              Ver mensajes anteriores
            </button>
          </div>
        )}
        {cargandoMensajes && lista.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-[#d4a7ca]" />
          </div>
        ) : (
          <div className="space-y-2">
            {conSeparadores.map((item) =>
              item.tipo === 'dia' ? (
                <div key={`d-${item.clave}`} className="my-3 flex justify-center">
                  <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-medium text-[#8b5a6b] shadow-sm">{item.etiqueta}</span>
                </div>
              ) : (
                <BurbujaMensaje key={item.m.id} mensaje={item.m} onVerImagen={setImagenGrande} />
              ),
            )}
          </div>
        )}
      </div>

      {/* Redacción */}
      <div className="border-t border-[#f9bbc4]/25 bg-white p-3">
        {conv.estado === 'CERRADA' && (
          <div className="mb-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">Charla cerrada. Si escribís, se reabre y queda a tu cargo.</div>
        )}
        {conv.estado === 'BOT' && (
          <div className="mb-2 rounded-lg bg-sky-50 px-3 py-1.5 text-xs text-sky-700">La está atendiendo el bot. Si escribís, la tomás vos y el bot deja de responder.</div>
        )}

        {adjuntoPendiente && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#f9bbc4]/40 bg-[#f9bbc4]/10 px-3 py-2 text-xs text-[#6b4c57]">
            <Paperclip className="h-4 w-4 shrink-0" />
            <span className="truncate">{adjuntoPendiente.name}</span>
            <span className="ml-auto flex items-center gap-1">
              <Button size="sm" disabled={enviando} onClick={() => mandarAdjunto(adjuntoPendiente, texto.trim() || undefined)} className="h-7 bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white">
                {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Enviar'}
              </Button>
              <button type="button" onClick={() => setAdjuntoPendiente(null)} className="rounded-full p-1 hover:bg-[#f9bbc4]/30" aria-label="Quitar">
                <X className="h-4 w-4" />
              </button>
            </span>
          </div>
        )}

        {grabando ? (
          <GrabadorAudio onListo={mandarAudio} onCancelar={() => setGrabando(false)} />
        ) : (
          <div className="flex items-end gap-2">
            <input
              ref={archivoRef}
              type="file"
              accept={ACEPTA}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setAdjuntoPendiente(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => archivoRef.current?.click()}
              disabled={!puedoEscribir || enviando}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#8b5a6b] transition hover:bg-[#f9bbc4]/20"
              aria-label="Adjuntar"
              title="Imagen, PDF o audio"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              ref={areaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (adjuntoPendiente) void mandarAdjunto(adjuntoPendiente, texto.trim() || undefined);
                  else void mandarTexto();
                }
              }}
              placeholder={adjuntoPendiente ? 'Texto para acompañar el archivo (opcional)' : 'Escribí un mensaje… (Enter envía, Shift+Enter salto de línea)'}
              rows={1}
              className="max-h-40 min-h-[40px] flex-1 resize-y rounded-2xl border border-[#f9bbc4]/40 bg-[#fdf6f7] px-4 py-2 text-sm text-[#4a3540] outline-none focus:border-[#e8b4c6]"
            />
            {texto.trim() || adjuntoPendiente ? (
              <button
                type="button"
                onClick={() => (adjuntoPendiente ? mandarAdjunto(adjuntoPendiente, texto.trim() || undefined) : mandarTexto())}
                disabled={enviando}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f9bbc4] to-[#c2637f] text-white shadow-md transition active:scale-95 disabled:opacity-50"
                aria-label="Enviar"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setGrabando(true)}
                disabled={enviando}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f9bbc4] to-[#c2637f] text-white shadow-md transition active:scale-95"
                aria-label="Grabar nota de voz"
                title="Grabar nota de voz"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Imagen grande */}
      {imagenGrande && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6" onClick={() => setImagenGrande(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagenGrande} alt="" className="max-h-full max-w-full rounded-lg shadow-2xl" />
          <button type="button" className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <AlertDialog open={confirmarCierre} onOpenChange={setConfirmarCierre}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar la charla</AlertDialogTitle>
            <AlertDialogDescription>
              Se da por terminada. Si la clienta vuelve a escribir, arranca una charla nueva con el bot. ¿Mandar el mensaje de despedida?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              onClick={() => accion(() => cerrar(conv.id, false), 'Charla cerrada')}
            >
              Cerrar sin despedida
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white"
              onClick={() => accion(() => cerrar(conv.id, true), 'Charla cerrada con despedida')}
            >
              Cerrar y despedir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
