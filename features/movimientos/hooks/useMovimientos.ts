import { useMovimientosStore } from '../store/movimientosStore';
import { MovimientoCreateNew } from '@/services/unidadNegocio.service';

export const useMovimientos = () => {
  const store = useMovimientosStore();

  return {
    // Estado
    movimientos: store.movimientos,
    loading: store.loading,
    error: store.error,

    // Acciones
    crearMovimiento: store.crearMovimiento,
    resetError: store.resetError,
    resetState: store.resetState,

    // Helpers
    isCreating: store.loading,
    hasError: !!store.error,
  };
}; 