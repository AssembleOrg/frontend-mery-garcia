import { useExchangeRateStore } from '../store/exchangeRateStore';

export const useExchangeRate = () => {
  const store = useExchangeRateStore();
  return {
    // Estado
    tipoCambio: store.tipoCambio,
    inicializado: store.inicializado,
    cargando: store.cargando,
    error: store.error,
    historial: store.historial,

    // Acciones
    cargarTipoCambioInicial: store.cargarTipoCambioInicial,
    actualizar: store.actualizarTipoCambio,
    guardarManual: store.guardarTipoCambioManual,
    cargarHistorial: store.cargarHistorial,
    reiniciar: store.reiniciar,
    limpiarError: store.limpiarError,

    // Utilidades
    valorVenta: store.tipoCambio.valorVenta,
    esValido: store.tipoCambio.valorVenta > 0,
  };
};
