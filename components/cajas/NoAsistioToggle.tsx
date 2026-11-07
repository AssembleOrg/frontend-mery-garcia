'use client';

import { useId } from 'react';
import { UserX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { formatARSNative, formatUSD } from '@/lib/utils';

/**
 * "No se presentó": la clienta faltó y se pierde la seña. Va arriba en la
 * comanda, a la vista. Encendido, la comanda solo lleva el servicio y quién lo
 * iba a hacer; la seña se consume y no se cargan pagos. La comisión del
 * servicio se calcula sobre la seña.
 */
export default function NoAsistioToggle({
  activo,
  onChange,
  señaARS,
  señaUSD,
  hayClienta,
}: {
  activo: boolean;
  onChange: (activo: boolean) => void;
  /** Seña que se va a consumir (la activa más vieja de cada moneda). */
  señaARS: number;
  señaUSD: number;
  hayClienta: boolean;
}) {
  const id = useId();
  const haySeña = señaARS > 0 || señaUSD > 0;
  const puede = activo || (hayClienta && haySeña);
  const seña = [
    señaARS > 0 ? formatARSNative(señaARS) : null,
    señaUSD > 0 ? formatUSD(señaUSD) : null,
  ]
    .filter(Boolean)
    .join(' + ');

  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors ${
        activo
          ? 'border-red-400 bg-red-50'
          : 'border-gray-200 bg-white hover:border-red-200'
      } ${puede ? '' : 'cursor-not-allowed opacity-70'}`}
    >
      <UserX
        className={`mt-0.5 h-5 w-5 shrink-0 ${activo ? 'text-red-600' : 'text-gray-500'}`}
      />
      <span className="flex-1">
        <span
          className={`block text-sm font-semibold ${activo ? 'text-red-700' : 'text-gray-900'}`}
        >
          No se presentó
        </span>
        <span className="block text-xs text-gray-600">
          {activo
            ? `Se consume la seña${seña ? ` (${seña})` : ''} y no se cargan pagos. La comisión del servicio va sobre la seña.`
            : !hayClienta
              ? 'Elegí la clienta para marcar que no vino.'
              : !haySeña
                ? 'La clienta no tiene seña disponible.'
                : `La clienta faltó: se pierde la seña (${seña}).`}
        </span>
      </span>
      <Switch
        id={id}
        checked={activo}
        disabled={!puede}
        onCheckedChange={onChange}
        className="mt-0.5 h-6 w-10 data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-gray-300 [&>span]:size-5 [&>span]:bg-white [&>span]:shadow [&>span]:data-[state=checked]:translate-x-4"
        aria-label="No se presentó"
      />
    </label>
  );
}
