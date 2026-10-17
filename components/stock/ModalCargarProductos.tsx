'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { stockService, type ProductoStock } from '@/services/stock.service';

interface Fila {
  id: string;
  nombre: string;
}

const nuevaFila = (nombre = ''): Fila => ({
  id: `fila-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  nombre,
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreados: (productos: ProductoStock[]) => void;
}

export default function ModalCargarProductos({ isOpen, onClose, onCreados }: Props) {
  const [filas, setFilas] = useState<Fila[]>([nuevaFila()]);
  const [guardando, setGuardando] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const enfocar = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const primera = nuevaFila();
      enfocar.current = primera.id;
      setFilas([primera]);
    }
  }, [isOpen]);

  // Foco en la fila recién agregada
  useEffect(() => {
    if (enfocar.current) {
      inputs.current[enfocar.current]?.focus();
      enfocar.current = null;
    }
  }, [filas]);

  const agregarFila = (despuesDe?: number) => {
    const fila = nuevaFila();
    enfocar.current = fila.id;
    setFilas((prev) => {
      const copia = [...prev];
      copia.splice(despuesDe === undefined ? copia.length : despuesDe + 1, 0, fila);
      return copia;
    });
  };

  const actualizarFila = (index: number, nombre: string) =>
    setFilas((prev) => prev.map((f, i) => (i === index ? { ...f, nombre } : f)));

  const eliminarFila = (index: number) =>
    setFilas((prev) => (prev.length === 1 ? [nuevaFila()] : prev.filter((_, i) => i !== index)));

  // Pegar una lista (una por línea) la reparte en varias filas
  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const lineas = e.clipboardData
      .getData('text')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lineas.length < 2) return;
    e.preventDefault();
    setFilas((prev) => {
      const copia = [...prev];
      const nuevas = lineas.map((l) => nuevaFila(l));
      // Si la fila actual está vacía la reemplaza
      copia.splice(index, copia[index].nombre.trim() ? 0 : 1, ...nuevas);
      return copia;
    });
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarFila(index);
    } else if (e.key === 'Backspace' && !filas[index].nombre && filas.length > 1) {
      e.preventDefault();
      const anterior = filas[index - 1] ?? filas[index + 1];
      enfocar.current = anterior?.id ?? null;
      eliminarFila(index);
    }
  };

  const nombres = filas.map((f) => f.nombre.trim()).filter(Boolean);

  const handleGuardar = async () => {
    if (!nombres.length) {
      toast.error('Escribí al menos un producto');
      return;
    }
    setGuardando(true);
    try {
      const creados = await stockService.crearProductos(nombres);
      toast.success(
        creados.length === 1 ? 'Producto cargado' : `${creados.length} productos cargados`,
      );
      onCreados(creados);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar los productos');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <Package className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">Cargar productos</h2>
                <p className="text-sm text-gray-600">
                  Enter agrega otra fila. También podés pegar una lista.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-6">
            {filas.map((fila, index) => (
              <div key={fila.id} className="flex items-center gap-2">
                <span className="w-6 text-right text-xs text-[#8b5a6b]">{index + 1}</span>
                <Input
                  ref={(el) => {
                    inputs.current[fila.id] = el;
                  }}
                  value={fila.nombre}
                  onChange={(e) => actualizarFila(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(index, e)}
                  placeholder="Ej: Tintura 7.1"
                  maxLength={150}
                  className="border-[#f9bbc4]/40 focus-visible:ring-[#f9bbc4]/40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarFila(index)}
                  className="text-[#8b5a6b] hover:bg-[#f9bbc4]/10 hover:text-red-500"
                  tabIndex={-1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => agregarFila()}
              className="mt-2 w-full border-dashed border-[#f9bbc4]/60 text-[#8b5a6b] hover:bg-[#f9bbc4]/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar fila
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 border-t p-6">
            <span className="text-sm text-[#6b4c57]">
              {nombres.length} {nombres.length === 1 ? 'producto' : 'productos'}
            </span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                onClick={handleGuardar}
                disabled={guardando || !nombres.length}
                className="bg-[#d4748c] font-semibold text-white hover:bg-[#c0607a]"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
