'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { comprasService, type Pedido } from '@/services/compras.service';
import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO_BASE,
  mensajeError,
} from './formato';

/**
 * "Llegó": confirma cuánto llegó de cada artículo. Lo que afecta stock suma
 * desde ahora. Se puede marcar aunque hayan pasado las 48 h de la compra.
 */
export default function DialogoEntregar({
  pedido,
  onCerrar,
  onEntregado,
}: {
  pedido: Pedido | null;
  onCerrar: () => void;
  onEntregado: (p: Pedido) => void;
}) {
  const [llegaron, setLlegaron] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (pedido)
      setLlegaron(
        Object.fromEntries(pedido.items.map((i) => [i.id, String(i.cantidad)]))
      );
  }, [pedido]);

  const confirmar = async () => {
    if (!pedido) return;
    const recibidos: { itemId: string; cantidadRecibida: number }[] = [];
    for (const i of pedido.items) {
      const texto = (llegaron[i.id] ?? '').trim();
      const n = texto === '' ? i.cantidad : Number(texto);
      if (!Number.isInteger(n) || n < 0) {
        toast.error(`Revisá cuántos llegaron de "${i.nombre}".`);
        return;
      }
      if (n !== i.cantidad)
        recibidos.push({ itemId: i.id, cantidadRecibida: n });
    }
    setGuardando(true);
    try {
      const p = await comprasService.entregar(pedido.id, recibidos);
      const suman = p.items.filter((i) => i.afectaStock).length;
      toast.success(
        suman
          ? `Pedido N° ${p.numero} entregado: ya suma al stock`
          : `Pedido N° ${p.numero} entregado`
      );
      onEntregado(p);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo marcar como entregado'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={!!pedido} onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto border-[#f5d0d9] bg-white p-0 text-[#4a3540] sm:max-w-md">
        <div className="border-b border-[#f5d0d9] px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-medium">
            ¿Llegó el pedido N° {pedido?.numero}?
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-[#8b5a6b]">
            Corregí lo que no llegó completo. Lo marcado con &quot;stock&quot;
            suma en Control de Stock.
          </DialogDescription>
        </div>
        <ul className="divide-y divide-[#fcf0f3] px-5">
          {pedido?.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{i.nombre}</p>
                <p className="text-[11px] text-[#8b5a6b] tabular-nums">
                  Pedidos: {i.cantidad}
                  {i.afectaStock && ' · stock'}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-[#6b4c57]">
                Llegaron
                <input
                  inputMode="numeric"
                  value={llegaron[i.id] ?? ''}
                  onChange={(e) =>
                    setLlegaron((x) => ({
                      ...x,
                      [i.id]: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                  className={`${CAMPO_BASE} h-8 w-16 text-center tabular-nums`}
                />
              </label>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2 border-t border-[#f5d0d9] px-5 py-3">
          <button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>
            Todavía no
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={confirmar}
            className={BOTON_PRIMARIO}
          >
            <Truck className="h-4 w-4" />
            {guardando ? 'Guardando…' : 'Llegó'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
