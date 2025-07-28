import { useState, useCallback } from 'react';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { MetodoPago, MetodoPagoForm } from '@/types/caja';
import { MONEDAS } from '@/lib/constants';

export type { MetodoPagoForm } from '@/types/caja';

export interface ResumenDual {
  totalUSD: number;
  totalARS: number;
  totalPagadoUSD: number;
  totalPagadoARS: number;
  detallesPorMoneda: {
    USD: { total: number; metodos: number };
    ARS: { total: number; metodos: number };
  };
}

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
  obtenerResumenDual: () => ResumenDual;
}

export function useMetodosPago(
  aplicarDescuentos: boolean = true,
  hayItemsCongelados: boolean = false
): UseMetodosPagoReturn {
  const { descuentosPorMetodo } = useConfiguracion();
  const { arsToUsd, usdToArs } = useCurrencyConverter();

  const [metodosPago, setMetodosPago] = useState<MetodoPagoForm[]>([
    {
      tipo: 'efectivo',
      monto: 0,
      montoOriginal: 0,
      montoFinal: 0,
      descuentoAplicado: 0,
      moneda: hayItemsCongelados ? MONEDAS.ARS : MONEDAS.USD,
    },
  ]);

  const calcularMontoFinal = useCallback(
    (
      tipo: MetodoPagoForm['tipo'],
      monto: number,
      moneda: string = MONEDAS.USD
    ) => {
      // Si no se deben aplicar descuentos, devolver el monto original
      if (!aplicarDescuentos) {
        // Para items congelados (ARS fijo): NO convertir a USD, mantener ARS nativo
        if (hayItemsCongelados && moneda === MONEDAS.ARS) {
          return {
            montoFinal: monto, // Mantener valor ARS nativo como montoFinal
            descuentoAplicado: 0,
            montoFinalOriginalARS: monto,
          };
        }
        
        const montoUSD = moneda === MONEDAS.ARS ? arsToUsd(monto) : monto;
        return {
          montoFinal: montoUSD,
          descuentoAplicado: 0,
          // Para egresos ARS, preservar monto original nativo
          montoFinalOriginalARS: moneda === MONEDAS.ARS ? monto : undefined,
        };
      }

      if (tipo === 'mixto' || tipo === 'giftcard' || tipo === 'qr' || tipo === 'precio_lista') {
        // Para items congelados (ARS fijo): NO convertir a USD, mantener ARS nativo
        if (hayItemsCongelados && moneda === MONEDAS.ARS) {
          return {
            montoFinal: monto, // Mantener valor ARS nativo
            descuentoAplicado: 0,
            montoFinalOriginalARS: monto,
          };
        }
        
        // Para estos tipos no hay descuento (precio_lista es igual que tarjeta sin descuento)
        const montoUSD = moneda === MONEDAS.ARS ? arsToUsd(monto) : monto;
        return {
          montoFinal: montoUSD,
          descuentoAplicado: 0,
        };
      }

      const porcentajeDescuento = descuentosPorMetodo[tipo] || 0;

      if (moneda === MONEDAS.ARS) {
        // Para ARS: aplicar descuento en ARS
        const descuentoARS = (monto * porcentajeDescuento) / 100;
        const montoFinalARS = monto - descuentoARS;
        
        // Para items congelados (ARS fijo): NO convertir a USD, mantener ARS nativo
        if (hayItemsCongelados) {
          return {
            montoFinal: montoFinalARS, // Mantener valor ARS nativo
            descuentoAplicado: descuentoARS, // Descuento en ARS nativo
            descuentoOriginalARS: descuentoARS,
            montoFinalOriginalARS: montoFinalARS,
          };
        }
        
        // Para casos normales: convertir a USD
        const montoFinalUSD = arsToUsd(montoFinalARS);
        const descuentoUSD = arsToUsd(descuentoARS);

        return {
          montoFinal: montoFinalUSD,
          descuentoAplicado: descuentoUSD, // Descuento convertido a USD para consistencia
          // Campos adicionales para tracking
          descuentoOriginalARS: descuentoARS,
          montoFinalOriginalARS: montoFinalARS,
        };
      } else {
        // Para USD: aplicar descuento directamente en USD
        const descuentoUSD = (monto * porcentajeDescuento) / 100;
        const montoFinalUSD = monto - descuentoUSD;

        return {
          montoFinal: montoFinalUSD,
          descuentoAplicado: descuentoUSD,
        };
      }
    },
    [descuentosPorMetodo, arsToUsd, aplicarDescuentos]
  );

  const agregarMetodoPago = useCallback(() => {
    const nuevoMetodo: MetodoPagoForm = {
      tipo: 'efectivo',
      monto: 0,
      montoOriginal: 0,
      montoFinal: 0,
      descuentoAplicado: 0,
      moneda: hayItemsCongelados ? MONEDAS.ARS : MONEDAS.USD,
    };
    setMetodosPago((prev) => [...prev, nuevoMetodo]);
  }, [hayItemsCongelados]);

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

        // Si se actualiza el monto, también actualizar montoOriginal
        if (campo === 'monto') {
          nuevosMetodos[index].montoOriginal = valor as number;
        }

        if (campo === 'tipo' || campo === 'monto' || campo === 'moneda') {
          const metodo = nuevosMetodos[index];
          const monedaActual = metodo.moneda || MONEDAS.USD;
          const calculado = calcularMontoFinal(
            metodo.tipo,
            metodo.montoOriginal || metodo.monto,
            monedaActual
          );

          // Aplicar todos los campos calculados
          Object.assign(metodo, calculado);
        }

        return nuevosMetodos;
      });
    },
    [calcularMontoFinal]
  );

  const resetMetodosPago = useCallback(() => {
    setMetodosPago([
      {
        tipo: 'efectivo',
        monto: 0,
        montoOriginal: 0,
        montoFinal: 0,
        descuentoAplicado: 0,
        moneda: hayItemsCongelados ? MONEDAS.ARS : MONEDAS.USD,
      },
    ]);
  }, [hayItemsCongelados]);

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
      const monedaActual = metodo.moneda || MONEDAS.USD;
      
      const metodoPersistencia: MetodoPago = {
        tipo: metodo.tipo,
        // Guardar monto en su moneda nativa - SOLUCIÓN DEFINITIVA
        monto: monedaActual === MONEDAS.ARS 
          ? (metodo.montoFinalOriginalARS || 0) // Valor nativo ARS
          : metodo.montoFinal, // Valor nativo USD
        moneda: monedaActual,
      };

      if (metodo.tipo === 'giftcard' && metodo.giftcard) {
        metodoPersistencia.giftcard = metodo.giftcard;
      }

      return metodoPersistencia;
    });
  }, [metodosPago]);

  const obtenerResumenDual = useCallback((): ResumenDual => {
    const resumen = {
      totalUSD: 0,
      totalARS: 0,
      totalPagadoUSD: 0,
      totalPagadoARS: 0,
      detallesPorMoneda: {
        USD: { total: 0, metodos: 0 },
        ARS: { total: 0, metodos: 0 },
      },
    };

    metodosPago.forEach((metodo) => {
      const moneda = metodo.moneda || MONEDAS.USD;

      if (moneda === MONEDAS.USD) {
        // Para USD: usar el monto final (ya con descuento aplicado)
        resumen.detallesPorMoneda.USD.total += metodo.montoFinal;
        resumen.detallesPorMoneda.USD.metodos += 1;
        resumen.totalPagadoUSD += metodo.montoFinal;
      } else {
        // Para ARS: usar el monto final en ARS (ya con descuento aplicado)
        const montoFinalARS = metodo.montoFinalOriginalARS || metodo.monto;
        resumen.detallesPorMoneda.ARS.total += montoFinalARS;
        resumen.detallesPorMoneda.ARS.metodos += 1;
        resumen.totalPagadoARS += montoFinalARS;
      }
    });

    // Para items congelados: totalUSD debe ser 0 ya que todo es ARS nativo
    if (hayItemsCongelados) {
      resumen.totalUSD = 0; // No hay USD cuando hay items congelados
      resumen.totalARS = resumen.totalPagadoARS; // Solo ARS nativo
    } else {
      // El total USD es la suma de todos los montos finales (ya convertidos a USD)
      resumen.totalUSD = metodosPago.reduce((sum, mp) => sum + mp.montoFinal, 0);
      
      // Para el total ARS equivalente: convertir la parte USD + la parte ARS ya existente
      const usdPartInARS =
        resumen.totalPagadoUSD > 0 ? usdToArs(resumen.totalPagadoUSD) : 0;
      resumen.totalARS = usdPartInARS + resumen.totalPagadoARS;
    }

    return resumen;
  }, [metodosPago, usdToArs]);

  // Para items congelados: totalPagado debe ser en ARS nativo
  const totalPagado = hayItemsCongelados 
    ? metodosPago.reduce((sum, mp) => sum + mp.montoFinal, 0) // Ya son ARS nativos
    : metodosPago.reduce((sum, mp) => sum + mp.montoFinal, 0); // USD normales

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
    obtenerResumenDual,
  };
}
