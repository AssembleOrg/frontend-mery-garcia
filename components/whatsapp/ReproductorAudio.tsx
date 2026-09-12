'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { duracionLegible } from './formato';

interface Props {
  /** Carga los bytes recién cuando hace falta (blob: URL). */
  cargar: () => Promise<string>;
  /** Duración conocida de antemano, para mostrar antes de cargar. */
  duracionSegundos?: number | null;
  /** Semilla para que la "onda" sea estable entre renders. */
  semilla: string;
  claro?: boolean;
}

const VELOCIDADES = [1, 1.5, 2];
const BARRAS = 34;

function ondaDe(semilla: string): number[] {
  // Pseudo-onda determinista: no es el audio real, pero da la lectura de
  // "nota de voz" y avanza con la reproducción.
  let h = 2166136261;
  for (let i = 0; i < semilla.length; i++) h = (h ^ semilla.charCodeAt(i)) * 16777619;
  const out: number[] = [];
  for (let i = 0; i < BARRAS; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const v = ((h >>> 0) % 1000) / 1000;
    out.push(0.25 + 0.75 * (0.35 * v + 0.65 * Math.abs(Math.sin(i * 0.9 + v * 3))));
  }
  return out;
}

/** Reproductor propio de notas de voz: play, onda, progreso arrastrable y velocidad. */
export default function ReproductorAudio({ cargar, duracionSegundos, semilla, claro }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [duracion, setDuracion] = useState<number>(duracionSegundos ?? 0);
  const [velocidad, setVelocidad] = useState(1);
  const onda = useMemo(() => ondaDe(semilla), [semilla]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const asegurarAudio = useCallback(async (): Promise<HTMLAudioElement | null> => {
    if (audioRef.current) return audioRef.current;
    setCargando(true);
    setError(null);
    try {
      const u = await cargar();
      setUrl(u);
      const a = new Audio(u);
      a.preload = 'metadata';
      a.playbackRate = velocidad;
      a.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(a.duration) && a.duration > 0) setDuracion(a.duration);
      });
      a.addEventListener('timeupdate', () => setTiempo(a.currentTime));
      a.addEventListener('play', () => setReproduciendo(true));
      a.addEventListener('pause', () => setReproduciendo(false));
      a.addEventListener('ended', () => {
        setReproduciendo(false);
        setTiempo(0);
      });
      a.addEventListener('error', () => setError('No se pudo reproducir'));
      audioRef.current = a;
      return a;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar');
      return null;
    } finally {
      setCargando(false);
    }
  }, [cargar, velocidad]);

  const alternar = async () => {
    const a = await asegurarAudio();
    if (!a) return;
    if (a.paused) void a.play().catch(() => setError('No se pudo reproducir'));
    else a.pause();
  };

  const cambiarVelocidad = () => {
    const i = VELOCIDADES.indexOf(velocidad);
    const v = VELOCIDADES[(i + 1) % VELOCIDADES.length];
    setVelocidad(v);
    if (audioRef.current) audioRef.current.playbackRate = v;
  };

  const buscar = (fraccion: number) => {
    const a = audioRef.current;
    if (!a || !duracion) return;
    a.currentTime = Math.max(0, Math.min(duracion, fraccion * duracion));
    setTiempo(a.currentTime);
  };

  const alArrastrar = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const mover = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      buscar((ev.clientX - r.left) / r.width);
    };
    mover(e.nativeEvent);
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };

  const progreso = duracion > 0 ? Math.min(1, tiempo / duracion) : 0;
  const colorActivo = claro ? 'bg-white' : 'bg-[#c2637f]';
  const colorInactivo = claro ? 'bg-white/40' : 'bg-[#e8b4c6]/60';

  return (
    <div className="flex w-[260px] max-w-full items-center gap-2 select-none">
      <button
        type="button"
        onClick={alternar}
        disabled={cargando}
        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md transition active:scale-95',
          claro ? 'bg-white text-[#c2637f]' : 'bg-gradient-to-br from-[#f9bbc4] to-[#d4a7ca] text-white',
        )}
      >
        {cargando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : reproduciendo ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className="flex h-8 cursor-pointer items-end gap-[2px]"
          onPointerDown={alArrastrar}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso * 100)}
        >
          {onda.map((alto, i) => {
            const activa = i / BARRAS <= progreso;
            return (
              <div
                key={i}
                className={cn('w-[4px] rounded-full transition-colors', activa ? colorActivo : colorInactivo)}
                style={{ height: `${Math.round(alto * 100)}%` }}
              />
            );
          })}
        </div>
        <div className={cn('mt-1 flex items-center justify-between text-[11px] tabular-nums', claro ? 'text-white/80' : 'text-[#8b5a6b]')}>
          <span>{error ?? `${duracionLegible(reproduciendo || tiempo > 0 ? tiempo : duracion)}`}</span>
          <button
            type="button"
            onClick={cambiarVelocidad}
            className={cn(
              'rounded-full px-1.5 py-[1px] text-[10px] font-semibold',
              claro ? 'bg-white/20 hover:bg-white/30' : 'bg-[#f9bbc4]/30 hover:bg-[#f9bbc4]/50',
            )}
          >
            {velocidad}×
          </button>
        </div>
      </div>
    </div>
  );
}
