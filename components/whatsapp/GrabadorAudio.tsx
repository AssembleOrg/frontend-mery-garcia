'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Mic, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { duracionLegible } from './formato';

interface Props {
  onListo: (blob: Blob, mime: string, segundos: number) => Promise<void> | void;
  onCancelar: () => void;
}

function elegirMime(): string {
  const candidatos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const c of candidatos) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

/**
 * Graba una nota de voz con el micrófono. Muestra el tiempo y un medidor de
 * nivel en vivo; al confirmar entrega el blob (el sidecar lo convierte a
 * OGG/Opus para que WhatsApp lo muestre como nota de voz).
 */
export default function GrabadorAudio({ onListo, onCancelar }: Props) {
  const [segundos, setSegundos] = useState(0);
  const [niveles, setNiveles] = useState<number[]>(() => Array(24).fill(0.08));
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const grabadorRef = useRef<MediaRecorder | null>(null);
  const trozosRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const inicioRef = useRef(0);
  const animRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const finalizarRef = useRef<((blob: Blob | null) => void) | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const mime = elegirMime();
        const grabador = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        grabadorRef.current = grabador;
        trozosRef.current = [];
        grabador.ondataavailable = (e) => {
          if (e.data.size > 0) trozosRef.current.push(e.data);
        };
        grabador.onstop = () => {
          const blob = new Blob(trozosRef.current, { type: grabador.mimeType || mime || 'audio/webm' });
          finalizarRef.current?.(blob);
        };
        grabador.start(250);
        inicioRef.current = Date.now();

        // Medidor de nivel.
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctor) {
          const ctx = new Ctor();
          ctxRef.current = ctx;
          const fuente = ctx.createMediaStreamSource(stream);
          const analizador = ctx.createAnalyser();
          analizador.fftSize = 256;
          fuente.connect(analizador);
          const datos = new Uint8Array(analizador.frequencyBinCount);
          const tick = () => {
            analizador.getByteTimeDomainData(datos);
            let suma = 0;
            for (let i = 0; i < datos.length; i++) {
              const v = (datos[i] - 128) / 128;
              suma += v * v;
            }
            const rms = Math.sqrt(suma / datos.length);
            setNiveles((prev) => [...prev.slice(1), Math.min(1, 0.08 + rms * 3)]);
            setSegundos((Date.now() - inicioRef.current) / 1000);
            animRef.current = requestAnimationFrame(tick);
          };
          animRef.current = requestAnimationFrame(tick);
        }
      } catch (e) {
        setError(
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? 'Sin permiso para usar el micrófono.'
            : 'No se pudo iniciar la grabación.',
        );
      }
    })();

    return () => {
      cancelado = true;
      cancelAnimationFrame(animRef.current);
      const g = grabadorRef.current;
      if (g && g.state !== 'inactive') {
        finalizarRef.current = null;
        g.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close();
    };
  }, []);

  const detener = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const g = grabadorRef.current;
      if (!g || g.state === 'inactive') return resolve(null);
      finalizarRef.current = resolve;
      g.stop();
    });

  const confirmar = async () => {
    if (enviando) return;
    setEnviando(true);
    cancelAnimationFrame(animRef.current);
    const blob = await detener();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (!blob || blob.size === 0) {
      setError('La grabación quedó vacía.');
      setEnviando(false);
      return;
    }
    const dur = Math.max(1, Math.round((Date.now() - inicioRef.current) / 1000));
    try {
      await onListo(blob, blob.type, dur);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-3 py-2">
      <button
        type="button"
        onClick={onCancelar}
        disabled={enviando}
        className="flex h-9 w-9 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-100"
        aria-label="Descartar"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 text-rose-600">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
        </span>
        <Mic className="h-4 w-4" />
        <span className="w-10 text-sm font-semibold tabular-nums">{duracionLegible(segundos)}</span>
      </div>

      <div className="flex h-8 flex-1 items-center gap-[3px] overflow-hidden">
        {error ? (
          <span className="text-xs text-rose-600">{error}</span>
        ) : (
          niveles.map((n, i) => (
            <div
              key={i}
              className="w-[4px] rounded-full bg-rose-400 transition-[height] duration-75"
              style={{ height: `${Math.round(n * 100)}%` }}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={confirmar}
        disabled={enviando || Boolean(error)}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition active:scale-95',
          'bg-gradient-to-br from-emerald-400 to-emerald-600 disabled:opacity-50',
        )}
        aria-label="Enviar nota de voz"
      >
        <Check className="h-5 w-5" />
      </button>
    </div>
  );
}
