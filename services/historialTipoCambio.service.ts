import { HistorialTipoCambio } from '@/types/caja';

const STORAGE_KEY = 'historial_tipo_cambio';

export const historialTipoCambioService = {
  // Obtener historial desde localStorage
  getHistorial(): HistorialTipoCambio[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Agregar nuevo registro al historial
  agregarRegistro(tipoCambio: {
    valorCompra: number;
    valorVenta: number;
  }): void {
    const historial = this.getHistorial();
    const nuevoRegistro: HistorialTipoCambio = {
      id: Date.now().toString(),
      valorCompra: tipoCambio.valorCompra,
      valorVenta: tipoCambio.valorVenta,
      fechaCreacion: new Date(),
    };

    historial.unshift(nuevoRegistro); // Agregar al inicio

    // Mantener solo los últimos 50 registros
    const historialLimitado = historial.slice(0, 50);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(historialLimitado));
  },

  // Limpiar historial
  limpiarHistorial(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
