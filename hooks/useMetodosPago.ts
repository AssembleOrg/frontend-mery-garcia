import { useState, useCallback } from 'react';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';
import { MetodoPago, MetodoPagoForm } from '@/types/caja';

export type { MetodoPagoForm } from '@/types/caja';

export interface UseMetodosPagoReturn {
  metodosPago: MetodoPagoForm[];
  totalPagado: number;
  agregarMetodoPago: () => void;
  eliminarMetodoPago: (index: number) => void;
  actualizarMetodoPago: (
    index: number,
    campo: keyof MetodoPagoForm,
    valor: string | number | { nombre: string; codigo: string }
  ) => void;
  setMetodosPago: (metodos: MetodoPagoForm[]) => void;
  resetMetodosPago: () => void;
  validarMetodosPago: (montoTotal: number) => {
    esValido: boolean;
    error?: string;
  };
  convertirParaPersistencia: () => MetodoPago[];
}

export function useMetodosPago(): UseMetodosPagoReturn {
  const { descuentosPorMetodo } = useConfiguracion();
  const [metodosPago, setMetodosPago] = useState<MetodoPagoForm[]>([
    {
      tipo: 'efectivo',
      monto: 0,
      montoFinal: 0,
      descuentoAplicado: 0,
    },
  ]);

  const calcularMontoFinal = useCallback(
    (tipo: MetodoPagoForm['tipo'], monto: number) => {
      if (tipo === 'mixto' || tipo === 'giftcard' || tipo === 'qr') {
        return { montoFinal: monto, descuentoAplicado: 0 };
      }

      const porcentajeDescuento = descuentosPorMetodo[tipo] || 0;
      const descuento = (monto * porcentajeDescuento) / 100;
      return {
        montoFinal: monto - descuento,
        descuentoAplicado: descuento,
      };
    },
    [descuentosPorMetodo]
  );

  const agregarMetodoPago = useCallback(() => {
    const nuevoMetodo: MetodoPagoForm = {
      tipo: 'efectivo',
      monto: 0,
      montoFinal: 0,
      descuentoAplicado: 0,
    };
    setMetodosPago((prev) => [...prev, nuevoMetodo]);
  }, []);

  const eliminarMetodoPago = useCallback((index: number) => {
    setMetodosPago((prev) => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  const actualizarMetodoPago = useCallback(
    (
      index: number,
      campo: keyof MetodoPagoForm,
      valor: string | number | { nombre: string; codigo: string }
    ) => {
      setMetodosPago((prev) => {
        const nuevosMetodos = [...prev];
        nuevosMetodos[index] = { ...nuevosMetodos[index], [campo]: valor };

        if (campo === 'tipo' || campo === 'monto') {
          const metodo = nuevosMetodos[index];
          const { montoFinal, descuentoAplicado } = calcularMontoFinal(
            metodo.tipo,
            metodo.monto
          );

          metodo.montoFinal = montoFinal;
          metodo.descuentoAplicado = descuentoAplicado;
        }

        return nuevosMetodos;
      });
    },
    [calcularMontoFinal]
  );

  const resetMetodosPago = useCallback(() => {
    setMetodosPago([
      { tipo: 'efectivo', monto: 0, montoFinal: 0, descuentoAplicado: 0 },
    ]);
  }, []);

  const validarMetodosPago = useCallback(
    (montoTotal: number) => {
      if (metodosPago.length === 0) {
        return {
          esValido: false,
          error: 'Debe agregar al menos un método de pago',
        };
      }

      const totalPagado = metodosPago.reduce(
        (sum, mp) => sum + mp.montoFinal,
        0
      );

      if (totalPagado === 0) {
        return {
          esValido: false,
          error: 'El monto total pagado no puede ser 0',
        };
      }

      if (Math.abs(totalPagado - montoTotal) > 0.01) {
        return {
          esValido: false,
          error: `El total pagado ($${totalPagado.toFixed(2)}) no coincide con el monto total ($${montoTotal.toFixed(2)})`,
        };
      }

      return { esValido: true };
    },
    [metodosPago]
  );

  const convertirParaPersistencia = useCallback((): MetodoPago[] => {
    return metodosPago.map((metodo) => {
      const metodoPersistencia: MetodoPago = {
        tipo: metodo.tipo,
        monto: metodo.montoFinal,
      };

      if (metodo.tipo === 'giftcard' && metodo.giftcard) {
        metodoPersistencia.giftcard = metodo.giftcard;
      }

      return metodoPersistencia;
    });
  }, [metodosPago]);

  const totalPagado = metodosPago.reduce((sum, mp) => sum + mp.montoFinal, 0);

  return {
    metodosPago,
    totalPagado,
    agregarMetodoPago,
    eliminarMetodoPago,
    actualizarMetodoPago,
    setMetodosPago,
    resetMetodosPago,
    validarMetodosPago,
    convertirParaPersistencia,
  };
}
