'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileText, ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { mensajeError, validacionComandasService, type LoteDetalle } from '@/services/validacionComandas.service';
import { hoyLocal, Panel, SelectorDia } from '@/components/contable/ui';

const ACEPTA = 'application/pdf,image/jpeg,image/png';

/** Subir las comandas en papel de un día. Subir no lee nada: la lectura con IA se inicia aparte. */
export default function SubirLote({ onSubido }: { onSubido: (l: LoteDetalle) => void }) {
  const [fecha, setFecha] = useState(hoyLocal());
  const [archivos, setArchivos] = useState<File[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sumar = (lista: FileList | null) => {
    if (!lista) return;
    const nuevos = Array.from(lista).filter((a) => {
      const ok = ACEPTA.split(',').includes(a.type) || a.name.toLowerCase().endsWith('.pdf');
      if (!ok) toast.error(`${a.name}: sólo PDF, JPG o PNG`);
      return ok;
    });
    setArchivos((l) => [...l, ...nuevos]);
  };

  const subir = async () => {
    if (!archivos.length) return toast.error('Elegí el PDF o las fotos de las comandas');
    setSubiendo(true);
    try {
      const lote = await validacionComandasService.subir(fecha, archivos);
      toast.success(`${lote.totalPaginas} ${lote.totalPaginas === 1 ? 'hoja subida' : 'hojas subidas'}. Todavía no se leyó nada.`);
      setArchivos([]);
      onSubido(lote);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo subir'));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <Panel titulo="Subir comandas del día" subtitulo="El PDF de Adobe Scan (una comanda por hoja) o las fotos sueltas.">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium tracking-wide text-[#6b4c57] uppercase">Día de las comandas</Label>
          <SelectorDia valor={fecha} onCambio={(d) => setFecha(d ?? hoyLocal())} />
          <p className="text-xs text-[#9a7d88]">Se valida que cada comanda esté cargada en el sistema con esta fecha.</p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            sumar(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-6 text-center text-sm transition-colors',
            arrastrando ? 'border-[#8b5a6b] bg-[#fbeef2]' : 'border-[#e6cfd7] text-[#6b4c57] hover:bg-[#fdf6f8]',
          )}
        >
          <Upload className="h-5 w-5 text-[#8b5a6b]" />
          <span>Arrastrá o tocá para elegir</span>
          <span className="text-xs text-[#9a7d88]">PDF, JPG o PNG</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACEPTA}
            className="hidden"
            onChange={(e) => {
              sumar(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {archivos.length > 0 && (
          <ul className="space-y-1">
            {archivos.map((a, i) => (
              <li key={`${a.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-[#f0dde3] px-2.5 py-1.5 text-sm">
                {a.type === 'application/pdf' ? (
                  <FileText className="h-4 w-4 shrink-0 text-[#8b5a6b]" />
                ) : (
                  <ImageIcon className="h-4 w-4 shrink-0 text-[#8b5a6b]" />
                )}
                <span className="truncate text-[#3d2a32]">{a.name}</span>
                <span className="ml-auto text-xs text-[#9a7d88]">{(a.size / 1024 / 1024).toFixed(1)} MB</span>
                <button
                  type="button"
                  className="text-[#9a7d88] hover:text-red-600"
                  title="Quitar"
                  onClick={() => setArchivos((l) => l.filter((_, j) => j !== i))}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button className="w-full bg-[#8b5a6b] text-white hover:bg-[#744a5a]" onClick={subir} disabled={subiendo || !archivos.length}>
          {subiendo ? 'Subiendo…' : 'Subir (sin leer)'}
        </Button>
        <p className="text-xs text-[#9a7d88]">
          Subir no lee nada ni cambia comandas. La lectura con IA se inicia aparte, desde el lote.
        </p>
      </div>
    </Panel>
  );
}
