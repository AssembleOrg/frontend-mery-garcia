'use client';
import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/lib/utils';
import { ComandaValidationService } from '@/services/comandaValidation.service';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import {
  Comanda,
  FiltrosComanda,
  ResumenCaja,
  EstadoComandaNegocio,
  ResumenConMontoParcial,
} from '@/types/caja';

interface ComandaState {
  comandas: Comanda[];
  filters: FiltrosComanda;
  cargando: boolean;
  error: string | null;
  lastUpdate: number;

  agregarComanda: (comanda: Comanda) => void;
  actualizarComanda: (id: string, comanda: Partial<Comanda>) => void;
  eliminarComanda: (id: string) => void;
  obtenerComandaPorId: (id: string) => Comanda | undefined;

  actualizarFiltros: (filters: Partial<FiltrosComanda>) => void;
  limpiarFiltros: () => void;

  obtenerComandasFiltradas: () => Comanda[];
  obtenerResumenCaja: () => ResumenCaja;
  obtenerProximoNumero: (tipo: 'ingreso' | 'egreso') => string;

  inicializar: () => void;
  reiniciar: () => void;
  limpiarDuplicados: () => void;
  migrarDatosValidacion: () => void;

  actualizarEstadoNegocio: (
    comandaId: string,
    nuevoEstado: 'pendiente' | 'completado' | 'cancelado'
  ) => void;

  actualizarEstadoValidacion: (
    comandaId: string,
    nuevoEstado: 'no_validado' | 'validado'
  ) => void;

  // === OPERACIONES MASIVAS ===
  validarComandasRango: (fechaDesde: Date, fechaHasta: Date) => number;
  obtenerResumenRango: (
    fechaDesde: Date,
    fechaHasta: Date
  ) => {
    totalCompletados: number;
    totalPendientes: number;
    montoNeto: number;
    totalIngresos: number;
    totalEgresos: number;
  };

  // NUEVAS FUNCIONES PARA MONTO PARCIAL
  obtenerResumenConMontoParcial: (
    fechaDesde: Date,
    fechaHasta: Date
  ) => ResumenConMontoParcial;

  validarComandasParaTraspasoParcial: (
    fechaDesde: Date,
    fechaHasta: Date,
    montoParcialUSD: number,
    montoParcialARS: number
  ) => Promise<{
    idsValidados: string[];
    montoTrasladadoUSD: number;
    montoTrasladadoARS: number;
    montoResidualUSD: number;
    montoResidualARS: number;
    success: boolean;
    comandasValidadas: number;
  }>;

  obtenerResumenCajaRango: (
    fechaDesde: Date,
    fechaHasta: Date
  ) => Promise<{
    totalCompletados: number;
    totalPendientes: number;
    montoNeto: number;
  }>;
}

const estadoInicial = {
  comandas: [],
  filters: {} as Partial<FiltrosComanda>,
  cargando: false,
  error: null,
  lastUpdate: Date.now(),
};

const safeJSONStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  const memoryStore = new Map<string, string>();
  return {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
  } as Storage;
});

export const useComandaStore = create<ComandaState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        agregarComanda: (comanda: Comanda) => {
          const { tipoCambio } = useExchangeRateStore.getState();

          const comandaConTipoCambio: Comanda = {
            ...comanda,
            tipoCambioAlCrear:
              tipoCambio.valorVenta > 0 ? tipoCambio : undefined,
          };

          set((state) => ({
            comandas: [...state.comandas, comandaConTipoCambio],
            error: null,
            lastUpdate: Date.now(),
          }));
        },

        actualizarComanda: (
          id: string,
          comandaActualizada: Partial<Comanda>
        ) => {
          set((state) => ({
            comandas: state.comandas.map((c) => {
              if (c.id !== id) return c;

              let actualizada = { ...c, ...comandaActualizada };

              if (comandaActualizada.estado) {
                actualizada = {
                  ...actualizada,
                  estadoNegocio:
                    comandaActualizada.estado as EstadoComandaNegocio,
                };
              }

              return actualizada;
            }),
            lastUpdate: Date.now(),
          }));
        },

        eliminarComanda: (id: string) => {
          set((state) => ({
            comandas: state.comandas.filter((c) => c.id !== id),
            lastUpdate: Date.now(),
          }));
        },

        obtenerComandaPorId: (id: string) => {
          return get().comandas.find((c) => c.id === id);
        },

        actualizarFiltros: (nuevosFiltros: Partial<FiltrosComanda>) => {
          set((state) => ({
            filters: { ...state.filters, ...nuevosFiltros },
          }));
        },

        limpiarFiltros: () => {
          set({ filters: {} as Partial<FiltrosComanda> });
        },

        obtenerComandasFiltradas: () => {
          const { comandas, filters } = get();

          return comandas.filter((comanda) => {
            if (filters.startDate && comanda.fecha < filters.startDate) {
              return false;
            }
            if (filters.endDate && comanda.fecha > filters.endDate) {
              return false;
            }
            if (
              filters.businessUnit &&
              comanda.businessUnit !== filters.businessUnit
            ) {
              return false;
            }
            if (filters.estado && comanda.estado !== filters.estado) {
              return false;
            }
            if (
              filters.personalId &&
              comanda.mainStaff?.id !== filters.personalId
            ) {
              return false;
            }
            if (
              filters.numeroComanda &&
              !comanda.numero
                .toLowerCase()
                .includes(filters.numeroComanda.toLowerCase())
            ) {
              return false;
            }
            if (
              filters.cliente &&
              !comanda.cliente.nombre
                .toLowerCase()
                .includes(filters.cliente.toLowerCase())
            ) {
              return false;
            }
            if (filters.busqueda) {
              const termino = filters.busqueda.toLowerCase();
              return (
                comanda.numero.toLowerCase().includes(termino) ||
                comanda.cliente.nombre.toLowerCase().includes(termino) ||
                comanda.mainStaff?.nombre?.toLowerCase().includes(termino) ||
                comanda.items.some((item) =>
                  item.nombre.toLowerCase().includes(termino)
                )
              );
            }

            return true;
          });
        },

        obtenerResumenCaja: () => {
          const { comandas } = get();
          const hoy = new Date();
          const inicioHoy = new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            hoy.getDate()
          );
          const finHoy = new Date(
            inicioHoy.getTime() + 24 * 60 * 60 * 1000 - 1
          );

          const comandasHoy = comandas.filter((c) => {
            const fechaComanda = new Date(c.fecha);
            return fechaComanda >= inicioHoy && fechaComanda <= finHoy;
          });

          const totalIncoming = comandasHoy
            .filter((c) => c.tipo === 'ingreso')
            .reduce((sum, c) => sum + c.totalFinal, 0);

          const totalOutgoing = comandasHoy
            .filter((c) => c.tipo === 'egreso')
            .reduce((sum, c) => sum + c.totalFinal, 0);

          const unidadConteo = comandasHoy.reduce(
            (acc, c) => {
              acc[c.businessUnit] = (acc[c.businessUnit] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          const unidadMasActiva = Object.entries(unidadConteo).reduce(
            (max, [unidad, count]) =>
              count > max.count ? { unidad, count } : max,
            { unidad: 'N/A', count: 0 }
          ).unidad;

          return {
            totalIncoming,
            totalOutgoing,
            saldo: totalIncoming - totalOutgoing,
            cantidadComandas: comandasHoy.length,
            unidadMasActiva,
            personalMasVentas: 'N/A', // Eliminado el mock
          };
        },

        obtenerProximoNumero: (tipo: 'ingreso' | 'egreso') => {
          const { comandas } = get();
          const comandasTipo = comandas.filter((c) => c.tipo === tipo);
          const prefix = tipo === 'ingreso' ? '01' : '02';
          const comandasConPrefijo = comandasTipo.filter(
            (c) => c.numero && c.numero.startsWith(prefix)
          );

          if (comandasConPrefijo.length === 0) {
            return `${prefix}-0001`;
          }

          const numeros = comandasConPrefijo
            .map((c) => {
              const match = c.numero.match(/\d+$/);
              return match ? parseInt(match[0], 10) : 0;
            })
            .filter((n) => !isNaN(n));

          const numeroMaximo = Math.max(...numeros, 0);
          const siguienteNumero = numeroMaximo + 1;

          return `${prefix}-${siguienteNumero.toString().padStart(4, '0')}`;
        },

        inicializar: () => {
          logger.info('Store inicializado manualmente');
          get().migrarDatosValidacion();
        },

        reiniciar: () => {
          set(estadoInicial);
          logger.info('Store reiniciado al estado inicial');
        },

        limpiarDuplicados: () => {
          const { comandas } = get();
          const { comandasLimpias } =
            ComandaValidationService.limpiarDuplicados(comandas);

          if (comandasLimpias.length !== comandas.length) {
            set({ comandas: comandasLimpias });
          }
        },

        migrarDatosValidacion: () => {
          const { comandas } = get();
          const { comandasActualizadas } =
            ComandaValidationService.migrarDatosValidacion(comandas);

          if (comandasActualizadas !== comandas) {
            set({ comandas: comandasActualizadas });
          }
        },

        validarComandasRango: (fechaDesde: Date, fechaHasta: Date) => {
          const { comandas } = get();
          const { comandasActualizadas, idsValidados } =
            ComandaValidationService.validarComandasRango(
              comandas,
              fechaDesde,
              fechaHasta
            );

          if (idsValidados.length > 0) {
            set({ comandas: comandasActualizadas });
          }

          return idsValidados.length;
        },

        obtenerResumenRango: (fechaDesde: Date, fechaHasta: Date) => {
          const { comandas } = get();
          return ComandaValidationService.obtenerResumenRango(
            comandas,
            fechaDesde,
            fechaHasta
          );
        },

        obtenerResumenConMontoParcial: (fechaDesde: Date, fechaHasta: Date) => {
          const { comandas } = get();
          return ComandaValidationService.obtenerResumenConMontoParcial(
            comandas,
            fechaDesde,
            fechaHasta
          );
        },

        validarComandasParaTraspasoParcial: async (
          fechaDesde: Date,
          fechaHasta: Date,
          montoParcialUSD: number,
          montoParcialARS: number
        ) => {
          const { comandas } = get();
          const resultado =
            ComandaValidationService.validarComandasParaTraspasoParcial(
              comandas,
              fechaDesde,
              fechaHasta,
              montoParcialUSD,
              montoParcialARS
            );

          set({
            comandas: resultado.comandasActualizadas,
            lastUpdate: Date.now(), // Actualizar timestamp para trigger recálculos
          });

          return {
            idsValidados: resultado.idsValidados,
            montoTrasladadoUSD: resultado.montoTrasladadoUSD,
            montoTrasladadoARS: resultado.montoTrasladadoARS,
            montoResidualUSD: resultado.montoResidualUSD,
            montoResidualARS: resultado.montoResidualARS,
            success: true,
            comandasValidadas: resultado.idsValidados.length,
          };
        },

        actualizarEstadoNegocio: (
          comandaId: string,
          nuevoEstado: 'pendiente' | 'completado' | 'cancelado'
        ) => {
          set((state) => ({
            comandas: state.comandas.map((comanda) =>
              comanda.id === comandaId
                ? {
                    ...comanda,
                    estado: nuevoEstado,
                    estadoNegocio: nuevoEstado as EstadoComandaNegocio,
                  }
                : comanda
            ),
          }));
        },

        actualizarEstadoValidacion: (
          comandaId: string,
          nuevoEstado: 'no_validado' | 'validado'
        ) => {
          set((state) => ({
            comandas: state.comandas.map((comanda) =>
              comanda.id === comandaId
                ? { ...comanda, estadoValidacion: nuevoEstado }
                : comanda
            ),
          }));
        },

        obtenerResumenCajaRango: async (fechaDesde: Date, fechaHasta: Date) => {
          const { apiFetch } = await import('@/lib/apiClient');

          const toIso = (d: Date) => d.toISOString().split('T')[0];
          const query = new URLSearchParams({
            fechaInicio: toIso(fechaDesde),
            fechaFin: toIso(fechaHasta),
          }).toString();

          try {
            return await apiFetch<{
              totalCompletados: number;
              totalPendientes: number;
              montoNeto: number;
            }>(`/api/comandas/estadisticas/resumen?${query}`);
          } catch (error) {
            logger.error('Error al obtener resumen remoto', error);
            throw error;
          }
        },
      }),
      {
        name: 'comanda-store',
        storage: safeJSONStorage,
        partialize: (state) => ({
          comandas: state.comandas,
        }),
      }
    ),
    {
      name: 'ComandaStore',
    }
  )
);

// Hooks especializados para casos de uso específicos
export const useComandas = () => {
  const store = useComandaStore();
  return {
    comandas: store.obtenerComandasFiltradas(),
    agregarComanda: store.agregarComanda,
    actualizarComanda: store.actualizarComanda,
    eliminarComanda: store.eliminarComanda,
    cargando: store.cargando,
    error: store.error,
  };
};

export const useFiltrosComanda = () => {
  const store = useComandaStore();
  return {
    filters: store.filters,
    actualizarFiltros: store.actualizarFiltros,
    limpiarFiltros: store.limpiarFiltros,
  };
};

export const useResumenCaja = () => {
  const store = useComandaStore();
  return {
    resumen: store.obtenerResumenCaja(),
    obtenerProximoNumero: store.obtenerProximoNumero,
  };
};
