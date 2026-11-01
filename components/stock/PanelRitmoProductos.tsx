'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Spinner from '@/components/common/Spinner';
import { vinculosRitmoService, type VinculoRitmo } from '@/services/stock.service';

/**
 * A quién le aparece en Ritmo la opción "Productos que usé". No es
 * obligatorio usarla: esto sólo la muestra. Hace falta que la trabajadora
 * esté vinculada a su persona de Ritmo.
 */
export default function PanelRitmoProductos() {
  const [vinculos, setVinculos] = useState<VinculoRitmo[] | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  useEffect(() => {
    vinculosRitmoService
      .listar()
      .then((v) => setVinculos(v.filter((x) => x.activo)))
      .catch((error) => {
        console.error(error);
        setVinculos([]);
        toast.error('No se pudo leer quién está en Ritmo');
      });
  }, []);

  const cambiar = async (v: VinculoRitmo, valor: boolean) => {
    setGuardando(v.trabajadorId);
    setVinculos((prev) => prev?.map((x) => (x.trabajadorId === v.trabajadorId ? { ...x, ritmoRegistraProductos: valor } : x)) ?? null);
    try {
      await vinculosRitmoService.registraProductos(v.trabajadorId, valor);
      toast.success(valor ? `${v.nombre} ya puede anotar productos` : `${v.nombre} ya no ve la opción`);
    } catch (error) {
      console.error(error);
      setVinculos((prev) => prev?.map((x) => (x.trabajadorId === v.trabajadorId ? { ...x, ritmoRegistraProductos: !valor } : x)) ?? null);
      toast.error('No se pudo guardar (sólo la cuenta de administración puede cambiarlo)');
    } finally {
      setGuardando(null);
    }
  };

  const enRitmo = vinculos?.filter((v) => v.ritmoUserId) ?? [];
  const sinRitmo = vinculos?.filter((v) => !v.ritmoUserId) ?? [];

  return (
    <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[#4a3540]">
          <Smartphone className="h-5 w-5 text-[#8b5a6b]" />
          Quién anota desde Ritmo
        </CardTitle>
        <p className="text-sm text-[#8b5a6b]">
          Les aparece &quot;Productos que usé&quot; en la app. No están obligadas a usarlo.
        </p>
      </CardHeader>
      <CardContent>
        {vinculos === null ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : enRitmo.length === 0 ? (
          <p className="text-sm text-[#8b5a6b]">Ninguna trabajadora está vinculada a Ritmo todavía.</p>
        ) : (
          <ul className="divide-y divide-[#f9bbc4]/20">
            {enRitmo.map((v) => (
              <li key={v.trabajadorId} className="flex items-center justify-between gap-3 py-2.5">
                <label htmlFor={`ritmo-prod-${v.trabajadorId}`} className="text-sm font-medium text-[#4a3540]">
                  {v.nombre}
                </label>
                <Switch
                  id={`ritmo-prod-${v.trabajadorId}`}
                  checked={v.ritmoRegistraProductos}
                  disabled={guardando === v.trabajadorId}
                  onCheckedChange={(valor) => void cambiar(v, valor)}
                  className="data-[state=checked]:bg-[#d4748c]"
                />
              </li>
            ))}
          </ul>
        )}
        {sinRitmo.length > 0 && (
          <p className="mt-2 text-xs text-[#8b5a6b]">
            Sin Ritmo: {sinRitmo.map((v) => v.nombre).join(', ')}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
