import { useState, useCallback } from 'react';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';

export interface MetodoPagoForm {
  tipo: 'efectivo' | 'tarjeta' | 'transferencia' | 'giftcard' | 'qr' | 'mixto';
  monto: number;
  montoFinal: number;
  descuentoAplicado: number; // mostrar el descuento
}

export interface UseMetodosPagoReturn {
  metodosPago: MetodoPagoForm[];
  totalPagado: number;
  agregarMetodoPago: () => void;
  eliminarMetodoPago: (index: number) => void;
  actualizarMetodoPago: (
    index: number,
    campo: keyof MetodoPagoForm,
    valor: string | number
  ) => void;
  setMetodosPago: (metodos: MetodoPagoForm[]) => void;
  resetMetodosPago: () => void;
  validarMetodosPago: (montoTotal: number) => {
    esValido: boolean;
    error?: string;
  };
}

export function useMetodosPago(): UseMetodosPagoReturn {
  const { descuentosPorMetodo } = useConfiguracion();
  const [metodosPago, setMetodosPago] = useState<MetodoPagoForm[]>([
    { tipo: 'efectivo', monto: 0, montoFinal: 0, descuentoAplicado: 0 },
  ]);

  const calcularMontoFinal = useCallback(
    (tipo: MetodoPagoForm['tipo'], monto: number) => {
      // Métodos sin descuento automático
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
    (index: number, campo: keyof MetodoPagoForm, valor: string | number) => {
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

  // Cálculos derivados
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
  };
}
