import { useState } from 'react';
import { useComandas } from '@/features/comandas/hooks/useComandas';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { toast } from 'sonner';

import { TipoMoneda } from '@/services/comandas.service';

interface CrearComandaManualParams {
  tipo: 'ingreso' | 'egreso';
  monto: number;
  detalle: string;
  moneda?: TipoMoneda;
  cajaDestino?: string;
}

export const useCrearComandaManual = () => {
  const { crearComandaManual: crearComandaManualStore, cargando } = useComandas();
  const { user } = useAuthStore();
  const { tipoCambio } = useExchangeRateStore();
  const [isCreating, setIsCreating] = useState(false);

  const crearComandaManual = async ({
    tipo,
    monto,
    detalle,
    moneda = TipoMoneda.USD,
    cajaDestino
  }: CrearComandaManualParams): Promise<boolean> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return false;
    }

    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return false;
    }

    if (!detalle.trim()) {
      toast.error('El detalle es requerido');
      return false;
    }

    setIsCreating(true);

    try {
      const success = await crearComandaManualStore(tipo, monto, detalle, moneda, cajaDestino);
      
      if (success) {
        toast.success(`Movimiento manual ${tipo === 'ingreso' ? 'de ingreso' : 'de egreso'} creado exitosamente`);
      }
      
      return success;
    } catch (error) {
      console.error('Error creando comanda manual:', error);
      toast.error('Error al crear el movimiento manual');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    crearComandaManual,
    isCreating: isCreating || cargando,
  };
}; 