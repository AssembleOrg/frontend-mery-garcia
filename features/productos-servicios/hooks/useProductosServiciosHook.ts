import { useEffect } from 'react';
import useProductosServiciosStore from '../store/productosServiciosStore';
import useUnidadNegocioStore from '../store/unidadNegocioStore';

export const useProductosServicios = () => {
  const {
    productosServicios,
    isLoading,
    error,
    loadProductosServicios,
    hasLoaded,
  } = useProductosServiciosStore();

  const {
    unidadesNegocio,
    isLoading: isLoadingUnidades,
    loadUnidadNegocio,
    hasLoaded: hasLoadedUnidades,
  } = useUnidadNegocioStore();

  // Cargar datos al montar el componente
  useEffect(() => {
    if (!hasLoaded) {
      loadProductosServicios();
    }
  }, [hasLoaded, loadProductosServicios]);

  useEffect(() => {
    if (!hasLoadedUnidades) {
      loadUnidadNegocio();
    }
  }, [hasLoadedUnidades, loadUnidadNegocio]);

  return {
    productosServicios,
    unidadesNegocio,
    isLoading: isLoading || isLoadingUnidades,
    error,
    hasLoaded: hasLoaded && hasLoadedUnidades,
  };
};
