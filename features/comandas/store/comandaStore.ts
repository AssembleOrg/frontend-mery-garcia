import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  Comanda,
  FiltrosComanda,
  ResumenCaja,
  Personal,
  PersonalSimple,
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
  personalSimple: PersonalSimple[]; // Lista simple para gestión de personal
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

  // Acciones - Productos/Servicios CRUD
  agregarProductoServicio: (producto: Omit<ProductoServicio, 'id'>) => void;
  actualizarProductoServicio: (
    id: string,
    producto: Partial<ProductoServicio>
  ) => void;
  eliminarProductoServicio: (id: string) => void;
  obtenerProductoServicioPorId: (id: string) => ProductoServicio | undefined;

  // Acciones - Personal Simple CRUD
  agregarPersonalSimple: (personal: Omit<PersonalSimple, 'id'>) => void;
  actualizarPersonalSimple: (
    id: string,
    personal: Partial<PersonalSimple>
  ) => void;
  eliminarPersonalSimple: (id: string) => void;
  obtenerPersonalSimplePorId: (id: string) => PersonalSimple | undefined;

  // Acciones - Sistema
  inicializar: () => void;
  reiniciar: () => void;
}

// Personal simple convertido del personal mock
const personalSimpleMock: PersonalSimple[] = [
  {
    id: '1',
    nombre: 'Ana Pérez',
    comision: 10,
    rol: 'vendedor',
  },
  {
    id: '2',
    nombre: 'María García',
    comision: 10,
    rol: 'admin',
  },
  {
    id: '3',
    nombre: 'Carmen López',
    comision: 10,
    rol: 'vendedor',
  },
];

const estadoInicial = {
  comandas: [],
  filtros: {},
  cargando: false,
  error: null,
  personal: personalMock,
  personalSimple: personalSimpleMock,
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

        // === PRODUCTOS/SERVICIOS CRUD ===
        agregarProductoServicio: (producto: Omit<ProductoServicio, 'id'>) => {
          const nuevoProducto: ProductoServicio = {
            ...producto,
            id: `producto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };

          set((state) => ({
            productosServicios: [...state.productosServicios, nuevoProducto],
          }));

          console.log('✅ [MOCK] Producto/Servicio creado:', nuevoProducto);
        },

        actualizarProductoServicio: (
          id: string,
          productoActualizado: Partial<ProductoServicio>
        ) => {
          set((state) => ({
            productosServicios: state.productosServicios.map((p) =>
              p.id === id ? { ...p, ...productoActualizado } : p
            ),
          }));

          console.log('✅ [MOCK] Producto/Servicio actualizado:', {
            id,
            ...productoActualizado,
          });
        },

        eliminarProductoServicio: (id: string) => {
          set((state) => ({
            productosServicios: state.productosServicios.filter(
              (p) => p.id !== id
            ),
          }));

          console.log('✅ [MOCK] Producto/Servicio eliminado:', id);
        },

        obtenerProductoServicioPorId: (id: string) => {
          return get().productosServicios.find((p) => p.id === id);
        },

        // === PERSONAL SIMPLE CRUD ===
        agregarPersonalSimple: (personal: Omit<PersonalSimple, 'id'>) => {
          const nuevoPersonal: PersonalSimple = {
            ...personal,
            id: `personal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };

          set((state) => ({
            personalSimple: [...state.personalSimple, nuevoPersonal],
          }));

          console.log('✅ [MOCK] Personal creado:', nuevoPersonal);
        },

        actualizarPersonalSimple: (
          id: string,
          personalActualizado: Partial<PersonalSimple>
        ) => {
          set((state) => ({
            personalSimple: state.personalSimple.map((p) =>
              p.id === id ? { ...p, ...personalActualizado } : p
            ),
          }));

          console.log('✅ [MOCK] Personal actualizado:', {
            id,
            ...personalActualizado,
          });
        },

        eliminarPersonalSimple: (id: string) => {
          set((state) => ({
            personalSimple: state.personalSimple.filter((p) => p.id !== id),
          }));

          console.log('✅ [MOCK] Personal eliminado:', id);
        },

        obtenerPersonalSimplePorId: (id: string) => {
          return get().personalSimple.find((p) => p.id === id);
        },

        // === SISTEMA ===
        inicializar: () => {
          // Solo agregar comandas de prueba si no hay datos existentes
          const { comandas } = get();
          if (comandas.length === 0) {
            console.log('Agregando comandas de prueba con fechas para filtros');
            // Se pueden agregar comandas manualmente desde la UI
          } else {
            console.log('Store de comandas ya tiene datos');
          }
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
    personalSimple: store.personalSimple,
    productosServicios: store.productosServicios,
    tipoCambio: store.tipoCambio,
    configuracionRecargos: store.configuracionRecargos,
    obtenerPersonalPorUnidad: store.obtenerPersonalPorUnidad,
    buscarProductosServicios: store.buscarProductosServicios,
    actualizarTipoCambio: store.actualizarTipoCambio,
    // CRUD Productos/Servicios
    agregarProductoServicio: store.agregarProductoServicio,
    actualizarProductoServicio: store.actualizarProductoServicio,
    eliminarProductoServicio: store.eliminarProductoServicio,
    obtenerProductoServicioPorId: store.obtenerProductoServicioPorId,
    // CRUD Personal Simple
    agregarPersonalSimple: store.agregarPersonalSimple,
    actualizarPersonalSimple: store.actualizarPersonalSimple,
    eliminarPersonalSimple: store.eliminarPersonalSimple,
    obtenerPersonalSimplePorId: store.obtenerPersonalSimplePorId,
  };
};
