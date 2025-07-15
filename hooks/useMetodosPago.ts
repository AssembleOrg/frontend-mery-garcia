import { useState, useCallback } from 'react';

export interface MetodoPagoForm {
  tipo: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  monto: number;
  montoFinal: number;
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
  const [metodosPago, setMetodosPago] = useState<MetodoPagoForm[]>([
    { tipo: 'efectivo', monto: 0, montoFinal: 0 },
  ]);

  const agregarMetodoPago = useCallback(() => {
    const nuevoMetodo: MetodoPagoForm = {
      tipo: 'efectivo',
      monto: 0,
      montoFinal: 0,
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

          metodo.montoFinal = metodo.monto + metodo.monto / 100;
        }

        return nuevosMetodos;
      });
    },
    []
  );

  const resetMetodosPago = useCallback(() => {
    setMetodosPago([{ tipo: 'efectivo', monto: 0, montoFinal: 0 }]);
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
