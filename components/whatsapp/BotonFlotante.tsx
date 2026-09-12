'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  noLeidos: number;
  esperando: number;
  conexion: 'desconocido' | 'conectado' | 'desconectado';
  onClick: () => void;
}

const CLAVE = 'wa-boton-posicion';
const TAMANO = 60;
const MARGEN = 12;

interface Posicion {
  x: number;
  y: number;
}

function acotar(p: Posicion): Posicion {
  const maxX = window.innerWidth - TAMANO - MARGEN;
  const maxY = window.innerHeight - TAMANO - MARGEN;
  return { x: Math.min(Math.max(MARGEN, p.x), maxX), y: Math.min(Math.max(MARGEN, p.y), maxY) };
}

function leerPosicion(): Posicion {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) {
      const p = JSON.parse(raw) as Posicion;
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) return acotar(p);
    }
  } catch {
    /* sin posición guardada */
  }
  return acotar({ x: window.innerWidth - TAMANO - 24, y: window.innerHeight - TAMANO - 24 });
}

/**
 * Botón flotante del WhatsApp. Se arrastra a donde quede cómodo y recuerda
 * el lugar en este navegador. Un click corto lo abre; un arrastre lo mueve.
 */
export default function BotonFlotante({ noLeidos, esperando, conexion, onClick }: Props) {
  const [pos, setPos] = useState<Posicion | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const inicioRef = useRef<{ px: number; py: number; x: number; y: number; movio: boolean } | null>(null);

  useEffect(() => {
    setPos(leerPosicion());
    const alRedimensionar = () => setPos((p) => (p ? acotar(p) : p));
    window.addEventListener('resize', alRedimensionar);
    return () => window.removeEventListener('resize', alRedimensionar);
  }, []);

  if (!pos) return null;

  const bajar = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    inicioRef.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y, movio: false };
  };
  const mover = (e: React.PointerEvent<HTMLButtonElement>) => {
    const i = inicioRef.current;
    if (!i) return;
    const dx = e.clientX - i.px;
    const dy = e.clientY - i.py;
    if (!i.movio && Math.hypot(dx, dy) < 6) return;
    i.movio = true;
    setArrastrando(true);
    setPos(acotar({ x: i.x + dx, y: i.y + dy }));
  };
  const soltar = (e: React.PointerEvent<HTMLButtonElement>) => {
    const i = inicioRef.current;
    inicioRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setArrastrando(false);
    if (i?.movio) {
      try {
        localStorage.setItem(CLAVE, JSON.stringify(pos));
      } catch {
        /* sin storage */
      }
      return;
    }
    onClick();
  };

  const total = noLeidos;
  const puntoColor = conexion === 'conectado' ? 'bg-emerald-500' : conexion === 'desconectado' ? 'bg-rose-500' : 'bg-gray-400';

  return (
    <button
      type="button"
      onPointerDown={bajar}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={() => {
        inicioRef.current = null;
        setArrastrando(false);
      }}
      style={{ left: pos.x, top: pos.y, width: TAMANO, height: TAMANO }}
      className={cn(
        'fixed z-[60] flex touch-none items-center justify-center rounded-full text-white shadow-xl select-none',
        'bg-gradient-to-br from-[#25D366] to-[#128C7E] ring-4 ring-white/70',
        arrastrando ? 'cursor-grabbing scale-105' : 'cursor-grab transition-transform hover:scale-105',
      )}
      aria-label="Abrir WhatsApp"
      title={conexion === 'conectado' ? 'WhatsApp conectado' : conexion === 'desconectado' ? 'WhatsApp desconectado' : 'WhatsApp'}
    >
      <MessageCircle className="h-7 w-7" />
      <span className={cn('absolute right-1 bottom-1 h-3.5 w-3.5 rounded-full border-2 border-white', puntoColor)} />
      {(total > 0 || esperando > 0) && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white shadow',
            esperando > 0 ? 'animate-pulse bg-amber-500' : 'bg-[#c2637f]',
          )}
        >
          {esperando > 0 ? esperando : total > 99 ? '99+' : total}
        </span>
      )}
    </button>
  );
}
