'use client';

import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validacionComandasService } from '@/services/validacionComandas.service';

/** Imagen escaneada de una hoja (se pide con el token y se cachea por hoja). */
export default function ImagenHoja({ paginaId, alt, className }: { paginaId: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    setUrl(null);
    setError(false);
    validacionComandasService
      .imagenUrl(paginaId)
      .then((u) => vivo && setUrl(u))
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
    };
  }, [paginaId]);

  if (error) {
    return (
      <div className={cn('flex items-center justify-center bg-[#f7ecef] text-[#9a7d88]', className)}>
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  if (!url) return <div className={cn('animate-pulse bg-[#f7ecef]', className)} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={cn('bg-white object-contain', className)} />;
}
