'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bot, Download, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { whatsappService, type Mensaje } from '@/services/whatsapp.service';
import ReproductorAudio from './ReproductorAudio';
import { horaCorta, tamanoLegible } from './formato';

interface Props {
  mensaje: Mensaje;
  onVerImagen: (url: string) => void;
}

function Texto({ texto }: { texto: string }) {
  // Links clickeables, el resto texto plano (nunca HTML de la clienta).
  const partes = texto.split(/(https?:\/\/[^\s]+)/g);
  return (
    <span className="whitespace-pre-wrap break-words">
      {partes.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

function Imagen({ mensaje, onVerImagen, claro }: { mensaje: Mensaje; onVerImagen: (url: string) => void; claro: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let activo = true;
    whatsappService
      .adjuntoUrl(mensaje.id)
      .then((r) => activo && setUrl(r.url))
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, [mensaje.id]);
  if (error) return <span className={cn('text-xs', claro ? 'text-white/80' : 'text-rose-600')}>No se pudo cargar la imagen</span>;
  if (!url)
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-xl bg-black/5">
        <Loader2 className="h-5 w-5 animate-spin opacity-60" />
      </div>
    );
  return (
    <button type="button" onClick={() => onVerImagen(url)} className="block overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={mensaje.texto ?? 'Imagen'} className="max-h-72 max-w-[280px] object-cover transition hover:opacity-95" />
    </button>
  );
}

function Documento({ mensaje, claro }: { mensaje: Mensaje; claro: boolean }) {
  const [abriendo, setAbriendo] = useState(false);
  const abrir = async () => {
    setAbriendo(true);
    try {
      const { url } = await whatsappService.adjuntoUrl(mensaje.id);
      window.open(url, '_blank', 'noopener');
    } finally {
      setAbriendo(false);
    }
  };
  return (
    <button
      type="button"
      onClick={abrir}
      className={cn(
        'flex w-[260px] max-w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition',
        claro ? 'border-white/30 bg-white/10 hover:bg-white/20' : 'border-[#f9bbc4]/40 bg-white hover:bg-[#f9bbc4]/10',
      )}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', claro ? 'bg-white/20' : 'bg-[#f9bbc4]/30 text-[#c2637f]')}>
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{mensaje.adjunto?.nombreArchivo ?? 'Archivo'}</div>
        <div className={cn('text-[11px]', claro ? 'text-white/75' : 'text-[#8b5a6b]')}>
          {mensaje.adjunto?.mimeType === 'application/pdf' ? 'PDF' : mensaje.adjunto?.mimeType} {tamanoLegible(mensaje.adjunto?.tamanoBytes ?? null)}
        </div>
      </div>
      {abriendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 opacity-70" />}
    </button>
  );
}

export default function BurbujaMensaje({ mensaje, onVerImagen }: Props) {
  const entrante = mensaje.direccion === 'ENTRANTE';
  const esBot = mensaje.autor === 'BOT';
  const cargarAudio = useCallback(() => whatsappService.adjuntoUrl(mensaje.id).then((r) => r.url), [mensaje.id]);

  const claro = !entrante && !esBot;

  return (
    <div className={cn('flex w-full', entrante ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'relative max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          entrante && 'rounded-tl-md bg-white text-[#4a3540]',
          esBot && 'rounded-tr-md border border-sky-100 bg-sky-50 text-[#4a3540]',
          claro && 'rounded-tr-md bg-gradient-to-br from-[#e8a0b4] to-[#c2637f] text-white',
        )}
      >
        {!entrante && (
          <div className={cn('mb-0.5 flex items-center gap-1 text-[11px] font-semibold', esBot ? 'text-sky-700' : 'text-white/85')}>
            {esBot ? (
              <>
                <Bot className="h-3 w-3" /> Bot automático
              </>
            ) : (
              mensaje.operador?.nombre ?? 'Equipo'
            )}
          </div>
        )}

        {mensaje.tipo === 'AUDIO' && mensaje.adjunto && (
          <ReproductorAudio cargar={cargarAudio} duracionSegundos={mensaje.adjunto.duracionSegundos} semilla={mensaje.id} claro={claro} />
        )}
        {mensaje.tipo === 'IMAGEN' && mensaje.adjunto && <Imagen mensaje={mensaje} onVerImagen={onVerImagen} claro={claro} />}
        {mensaje.tipo === 'DOCUMENTO' && mensaje.adjunto && <Documento mensaje={mensaje} claro={claro} />}
        {mensaje.tipo === 'OTRO' && (
          <span className={cn('text-xs italic', claro ? 'text-white/80' : 'text-[#8b5a6b]')}>
            Contenido que no se puede mostrar acá (video, sticker o ubicación). Se ve en el teléfono.
          </span>
        )}
        {mensaje.texto && (mensaje.tipo === 'TEXTO' || mensaje.tipo === 'IMAGEN' || mensaje.tipo === 'DOCUMENTO') && (
          <div className={cn(mensaje.tipo !== 'TEXTO' && 'mt-1.5')}>
            <Texto texto={mensaje.texto} />
          </div>
        )}

        <div className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', claro ? 'text-white/75' : 'text-[#8b5a6b]/80')}>
          {mensaje.estadoEnvio === 'FALLIDO' && (
            <span className="flex items-center gap-0.5 text-rose-200" title="No se pudo enviar">
              <AlertCircle className="h-3 w-3" /> No enviado
            </span>
          )}
          <span>{horaCorta(mensaje.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
