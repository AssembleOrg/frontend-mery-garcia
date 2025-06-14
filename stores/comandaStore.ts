import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  Comanda,
  FiltrosComanda,
  ResumenCaja,
  Personal,
  ProductoServicio,
  TipoCambio,
  ConfiguracionRecargo,
  UnidadNegocio,
} from '@/types/caja';
import {
  personalMock,
  productosServiciosMock,
  tipoCambioMock,
  configuracionRecargosMock,
  getPersonalPorUnidad,
  buscarProductosServicios,
} from '@/data/mockData';

interface ComandaState {
  // Estados principales
  comandas: Comanda[];
  filtros: FiltrosComanda;
  cargando: boolean;
  error: string | null;

  // Datos de referencia
  personal: Personal[];
  productosServicios: ProductoServicio[];
  tipoCambio: TipoCambio;
  configuracionRecargos: ConfiguracionRecargo[];

  // Acciones - Comandas
  agregarComanda: (comanda: Comanda) => void;
  actualizarComanda: (id: string, comanda: Partial<Comanda>) => void;
  eliminarComanda: (id: string) => void;
  obtenerComandaPorId: (id: string) => Comanda | undefined;

  // Acciones - Filtros
  actualizarFiltros: (filtros: Partial<FiltrosComanda>) => void;
  limpiarFiltros: () => void;

  // Acciones - Cálculos
  obtenerComandasFiltradas: () => Comanda[];
  obtenerResumenCaja: () => ResumenCaja;
  obtenerProximoNumero: (tipo: 'ingreso' | 'egreso') => string;

  // Acciones - Datos de referencia
  actualizarTipoCambio: (tipoCambio: TipoCambio) => void;
  obtenerPersonalPorUnidad: (unidad: string) => Personal[];
  buscarProductosServicios: (
    termino: string,
    unidad?: string
  ) => ProductoServicio[];

  // Acciones - Sistema
  inicializar: () => void;
  reiniciar: () => void;
}

const estadoInicial = {
  comandas: [],
  filtros: {},
  cargando: false,
  error: null,
  personal: personalMock,
  productosServicios: productosServiciosMock,
  tipoCambio: tipoCambioMock,
  configuracionRecargos: configuracionRecargosMock,
};

export const useComandaStore = create<ComandaState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // === ACCIONES DE COMANDAS ===
        agregarComanda: (comanda: Comanda) => {
          set((state) => ({
            comandas: [...state.comandas, comanda],
          }));
        },

        actualizarComanda: (
          id: string,
          comandaActualizada: Partial<Comanda>
        ) => {
          set((state) => ({
            comandas: state.comandas.map((c) =>
              c.id === id ? { ...c, ...comandaActualizada } : c
            ),
          }));
        },

        eliminarComanda: (id: string) => {
          set((state) => ({
            comandas: state.comandas.filter((c) => c.id !== id),
          }));
        },

        obtenerComandaPorId: (id: string) => {
          return get().comandas.find((c) => c.id === id);
        },

        // === ACCIONES DE FILTROS ===
        actualizarFiltros: (nuevosFiltros: Partial<FiltrosComanda>) => {
          set((state) => ({
            filtros: { ...state.filtros, ...nuevosFiltros },
          }));
        },

        limpiarFiltros: () => {
          set({ filtros: {} });
        },

        // === CÁLCULOS Y CONSULTAS ===
        obtenerComandasFiltradas: () => {
          const { comandas, filtros } = get();

          return comandas.filter((comanda) => {
            // Filtro por fecha
            if (filtros.fechaInicio && comanda.fecha < filtros.fechaInicio) {
              return false;
            }
            if (filtros.fechaFin && comanda.fecha > filtros.fechaFin) {
              return false;
            }

            // Filtro por unidad de negocio
            if (
              filtros.unidadNegocio &&
              comanda.unidadNegocio !== filtros.unidadNegocio
            ) {
              return false;
            }

            // Filtro por estado
            if (filtros.estado && comanda.estado !== filtros.estado) {
              return false;
            }

            // Filtro por personal
            if (
              filtros.personalId &&
              comanda.personalPrincipal.id !== filtros.personalId
            ) {
              return false;
            }

            // Filtro por número de comanda
            if (
              filtros.numeroComanda &&
              !comanda.numero
                .toLowerCase()
                .includes(filtros.numeroComanda.toLowerCase())
            ) {
              return false;
            }

            // Filtro por cliente
            if (
              filtros.cliente &&
              !comanda.cliente.nombre
                .toLowerCase()
                .includes(filtros.cliente.toLowerCase())
            ) {
              return false;
            }

            // Búsqueda general
            if (filtros.busqueda) {
              const termino = filtros.busqueda.toLowerCase();
              return (
                comanda.numero.toLowerCase().includes(termino) ||
                comanda.cliente.nombre.toLowerCase().includes(termino) ||
                comanda.personalPrincipal.nombre
                  .toLowerCase()
                  .includes(termino) ||
                comanda.items.some((item) =>
                  item.nombre.toLowerCase().includes(termino)
                )
              );
            }

            return true;
          });
        },

        obtenerResumenCaja: () => {
          const comandas = get().comandas;
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);

          const comandasHoy = comandas.filter((c) => {
            const fechaComanda = new Date(c.fecha);
            fechaComanda.setHours(0, 0, 0, 0);
            return fechaComanda.getTime() === hoy.getTime();
          });

          const ingresos = comandasHoy.filter((c) => c.tipo === 'ingreso');
          const egresos = comandasHoy.filter((c) => c.tipo === 'egreso');

          const totalIngresos = ingresos.reduce(
            (sum, c) => sum + c.totalFinal,
            0
          );
          const totalEgresos = egresos.reduce(
            (sum, c) => sum + c.totalFinal,
            0
          );

          // Obtener unidad más activa
          const unidadesPorActividad = comandasHoy.reduce(
            (acc, c) => {
              acc[c.unidadNegocio] = (acc[c.unidadNegocio] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          const unidadMasActiva = Object.entries(unidadesPorActividad).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0];

          // Obtener personal con más ventas
          const ventasPorPersonal = comandasHoy.reduce(
            (acc, c) => {
              acc[c.personalPrincipal.nombre] =
                (acc[c.personalPrincipal.nombre] || 0) + c.totalFinal;
              return acc;
            },
            {} as Record<string, number>
          );

          const personalMasVentas = Object.entries(ventasPorPersonal).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0];

          const comisionesTotales = comandasHoy.reduce(
            (sum, c) =>
              sum +
              c.comisiones.reduce((cSum, com) => cSum + com.montoComision, 0),
            0
          );

          return {
            totalIngresos,
            totalEgresos,
            saldo: totalIngresos - totalEgresos,
            cantidadComandas: comandasHoy.length,
            comisionesTotales,
            unidadMasActiva,
            personalMasVentas,
          };
        },

        obtenerProximoNumero: (tipo: 'ingreso' | 'egreso') => {
          const comandas = get().comandas;
          const prefijo = tipo === 'ingreso' ? 'ING' : 'EGR';

          const numerosMismoTipo = comandas
            .filter((c) => c.tipo === tipo)
            .map((c) => {
              const match = c.numero.match(new RegExp(`${prefijo}-(\\d+)`));
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter((num) => !isNaN(num));

          const ultimoNumero =
            numerosMismoTipo.length > 0 ? Math.max(...numerosMismoTipo) : 0;

          return `${prefijo}-${String(ultimoNumero + 1).padStart(3, '0')}`;
        },

        // === DATOS DE REFERENCIA ===
        actualizarTipoCambio: (tipoCambio: TipoCambio) => {
          set({ tipoCambio });
        },

        obtenerPersonalPorUnidad: (unidad: string) => {
          return getPersonalPorUnidad(unidad as UnidadNegocio);
        },

        buscarProductosServicios: (termino: string, unidad?: string) => {
          return buscarProductosServicios(
            termino,
            unidad as UnidadNegocio | undefined
          );
        },

        // === SISTEMA ===
        inicializar: () => {
          // Cargar datos iniciales si es necesario
          set(estadoInicial);
        },

        reiniciar: () => {
          set(estadoInicial);
        },
      }),
      {
        name: 'comanda-store',
        partialize: (state) => ({
          comandas: state.comandas,
          tipoCambio: state.tipoCambio,
          configuracionRecargos: state.configuracionRecargos,
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
    filtros: store.filtros,
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

export const useDatosReferencia = () => {
  const store = useComandaStore();
  return {
    personal: store.personal,
    productosServicios: store.productosServicios,
    tipoCambio: store.tipoCambio,
    configuracionRecargos: store.configuracionRecargos,
    obtenerPersonalPorUnidad: store.obtenerPersonalPorUnidad,
    buscarProductosServicios: store.buscarProductosServicios,
    actualizarTipoCambio: store.actualizarTipoCambio,
  };
};
