import { useState, useMemo } from 'react';

interface UsePaginacionProps<T> {
  data: T[];
  itemsPorPagina?: number;
}

interface UsePaginacionReturn<T> {
  // Datos paginados
  datosPaginados: T[];

  // Estado de paginación
  paginaActual: number;
  totalPaginas: number;
  totalItems: number;
  itemsPorPagina: number;

  // Información de rango
  itemInicio: number;
  itemFin: number;

  // Acciones
  irAPagina: (pagina: number) => void;
  paginaAnterior: () => void;
  paginaSiguiente: () => void;
  cambiarItemsPorPagina: (items: number) => void;

  // Estados
  hayPaginaAnterior: boolean;
  hayPaginaSiguiente: boolean;
}

export function usePaginacion<T>({
  data,
  itemsPorPagina = 10,
}: UsePaginacionProps<T>): UsePaginacionReturn<T> {
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPaginaState, setItemsPorPaginaState] =
    useState(itemsPorPagina);

  // Cálculos memoizados
  const { datosPaginados, totalPaginas, itemInicio, itemFin } = useMemo(() => {
    const totalItems = data.length;
    const totalPags = Math.ceil(totalItems / itemsPorPaginaState) || 1;

    // Ajustar página actual si es necesario
    const paginaValida = Math.min(paginaActual, totalPags);

    const inicio = (paginaValida - 1) * itemsPorPaginaState;
    const fin = Math.min(inicio + itemsPorPaginaState, totalItems);

    const datosPag = data.slice(inicio, fin);

    return {
      datosPaginados: datosPag,
      totalPaginas: totalPags,
      itemInicio: inicio + 1,
      itemFin: fin,
    };
  }, [data, paginaActual, itemsPorPaginaState]);

  // Acciones
  const irAPagina = (pagina: number) => {
    const paginaValida = Math.max(1, Math.min(pagina, totalPaginas));
    setPaginaActual(paginaValida);
  };

  const paginaAnterior = () => {
    irAPagina(paginaActual - 1);
  };

  const paginaSiguiente = () => {
    irAPagina(paginaActual + 1);
  };

  const cambiarItemsPorPagina = (items: number) => {
    setItemsPorPaginaState(items);
    setPaginaActual(1); // Resetear a primera página
  };

  // Estados derivados
  const hayPaginaAnterior = paginaActual > 1;
  const hayPaginaSiguiente = paginaActual < totalPaginas;

  return {
    // Datos
    datosPaginados,

    // Estado
    paginaActual,
    totalPaginas,
    totalItems: data.length,
    itemsPorPagina: itemsPorPaginaState,

    // Información de rango
    itemInicio,
    itemFin,

    // Acciones
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
    cambiarItemsPorPagina,

    // Estados
    hayPaginaAnterior,
    hayPaginaSiguiente,
  };
}
