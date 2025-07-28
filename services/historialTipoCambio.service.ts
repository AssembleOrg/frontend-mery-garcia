// This service has been deprecated and replaced by backend integration
// All exchange rate history is now handled by the exchangeRateStore via backend API
// 
// Migration: Use useExchangeRate().cargarHistorial() instead
//
// This file should be removed once all references are updated.

export const historialTipoCambioService = {
  getHistorial(): never[] {
    console.warn('historialTipoCambioService is deprecated. Use exchangeRateStore.cargarHistorial() instead');
    return [];
  },

  agregarRegistro(): void {
    console.warn('historialTipoCambioService.agregarRegistro is deprecated. Exchange rates are now saved via backend API');
  },

  limpiarHistorial(): void {
    console.warn('historialTipoCambioService.limpiarHistorial is deprecated. Use exchangeRateStore.limpiarHistorial() instead');
  },
};
