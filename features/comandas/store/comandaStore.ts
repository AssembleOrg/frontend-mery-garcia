import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { logger } from '@/lib/utils';
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
  EstadoComandaNegocio,
  EstadoValidacion,
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
  filters: FiltrosComanda;
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
  updateFilters: (filters: Partial<FiltrosComanda>) => void;
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

  // Acciones - Validación
  cambiarEstadoComanda: (
    comandaId: string,
    nuevoEstado: EstadoComandaNegocio,
    observaciones?: string
  ) => Promise<boolean>;
  validarComanda: (
    comandaId: string,
    observaciones?: string
  ) => Promise<boolean>;
  obtenerPermisosComanda: (comandaId: string) => {
    puedeEditar: boolean;
    puedeEliminar: boolean;
    puedeCambiarEstado: boolean;
    puedeValidar: boolean;
    puedeVerHistorial: boolean;
  };
  obtenerUsuarioActual: () => {
    id: string;
    nombre: string;
    rol: 'admin' | 'vendedor';
  };

  // Acciones - Sistema
  inicializar: () => void;
  reiniciar: () => void;

  // === FUNCIÓN PARA LIMPIAR DUPLICADOS ===
  limpiarDuplicados: () => void;
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
  filters: {},
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
          // Asegurar que la comanda tenga campos de validación
          const comandaConValidacion = {
            ...comanda,
            estadoNegocio:
              ((comanda as unknown as Record<string, unknown>)
                .estadoNegocio as EstadoComandaNegocio) || 'pendiente',
            estadoValidacion:
              ((comanda as unknown as Record<string, unknown>)
                .estadoValidacion as EstadoValidacion) || 'no_validado',
          };

          set((state) => ({
            comandas: [...state.comandas, comandaConValidacion],
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
        updateFilters: (nuevosFiltros: Partial<FiltrosComanda>) => {
          set((state) => ({
            filters: { ...state.filters, ...nuevosFiltros },
          }));
        },

        limpiarFiltros: () => {
          set({ filters: {} });
        },

        // === CÁLCULOS Y CONSULTAS ===
        obtenerComandasFiltradas: () => {
          const { comandas, filters } = get();

          return comandas.filter((comanda) => {
            // Filtro por fecha
            if (filters.startDate && comanda.fecha < filters.startDate) {
              return false;
            }
            if (filters.endDate && comanda.fecha > filters.endDate) {
              return false;
            }

            // Filtro por unidad de negocio
            if (
              filters.businessUnit &&
              comanda.businessUnit !== filters.businessUnit
            ) {
              return false;
            }

            // Filtro por estado
            if (filters.estado && comanda.estado !== filters.estado) {
              return false;
            }

            // Filtro por personal
            if (
              filters.personalId &&
              comanda.mainStaff?.id !== filters.personalId
            ) {
              return false;
            }

            // Filtro por número de comanda
            if (
              filters.numeroComanda &&
              !comanda.numero
                .toLowerCase()
                .includes(filters.numeroComanda.toLowerCase())
            ) {
              return false;
            }

            // Filtro por cliente
            if (
              filters.cliente &&
              !comanda.cliente.nombre
                .toLowerCase()
                .includes(filters.cliente.toLowerCase())
            ) {
              return false;
            }

            // Búsqueda general
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

          const totalIncoming = ingresos.reduce(
            (sum, c) => sum + c.totalFinal,
            0
          );
          const totalOutgoing = egresos.reduce(
            (sum, c) => sum + c.totalFinal,
            0
          );

          // Obtener unidad más activa
          const unidadesPorActividad = comandasHoy.reduce(
            (acc, c) => {
              acc[c.businessUnit] = (acc[c.businessUnit] || 0) + 1;
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
              const nombrePersonal = c.mainStaff?.nombre || 'Sin asignar';
              acc[nombrePersonal] = (acc[nombrePersonal] || 0) + c.totalFinal;
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
            totalIncoming,
            totalOutgoing,
            saldo: totalIncoming - totalOutgoing,
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

        // === VALIDACIÓN ===
        cambiarEstadoComanda: async (
          comandaId: string,
          nuevoEstado: EstadoComandaNegocio,
          observaciones?: string
        ) => {
          set({ cargando: true, error: null });

          try {
            // Importar dinámicamente el service para evitar dependencias circulares
            const { cambiarEstadoComanda: cambiarEstadoAPI } = await import(
              '@/services/validacion.service'
            );
            const { obtenerUsuarioActual } = get();
            const usuario = obtenerUsuarioActual();

            const resultado = await cambiarEstadoAPI({
              comandaId,
              nuevoEstado,
              observaciones,
              usuarioId: usuario.id,
            });

            if (resultado.exito) {
              // Actualizar la comanda en el store
              set((state) => ({
                comandas: state.comandas.map((c) =>
                  c.id === comandaId
                    ? {
                        ...c,
                        estadoNegocio: nuevoEstado,
                        // Actualizar trazabilidad si existe
                        ...(resultado.data?.trazabilidad
                          ? {
                              trazabilidad: resultado.data.trazabilidad,
                            }
                          : {}),
                      }
                    : c
                ),
                cargando: false,
              }));

              logger.success(
                '[STORE] Estado de comanda actualizado exitosamente'
              );
              return true;
            } else {
              set({ error: resultado.mensaje, cargando: false });
              return false;
            }
          } catch (error) {
            const mensaje =
              error instanceof Error ? error.message : 'Error desconocido';
            set({ error: mensaje, cargando: false });
            logger.error('[STORE] Error al cambiar estado:', error);
            return false;
          }
        },

        validarComanda: async (comandaId: string, observaciones?: string) => {
          set({ cargando: true, error: null });

          try {
            const { validarComanda: validarComandaAPI } = await import(
              '@/services/validacion.service'
            );
            const { obtenerUsuarioActual } = get();
            const usuario = obtenerUsuarioActual();

            if (usuario.rol !== 'admin') {
              set({
                error: 'Solo los administradores pueden validar comandas',
                cargando: false,
              });
              return false;
            }

            const resultado = await validarComandaAPI({
              comandaId,
              observaciones,
              adminId: usuario.id,
            });

            if (resultado.exito) {
              // Actualizar la comanda en el store
              set((state) => ({
                comandas: state.comandas.map((c) =>
                  c.id === comandaId
                    ? {
                        ...c,
                        estadoValidacion: 'validado' as const,
                        // Actualizar trazabilidad si existe
                        ...(resultado.data?.trazabilidad
                          ? {
                              trazabilidad: resultado.data.trazabilidad,
                            }
                          : {}),
                      }
                    : c
                ),
                cargando: false,
              }));

              console.log('🔒 [STORE] Comanda validada exitosamente');
              return true;
            } else {
              set({ error: resultado.mensaje, cargando: false });
              return false;
            }
          } catch (error) {
            const mensaje =
              error instanceof Error ? error.message : 'Error desconocido';
            set({ error: mensaje, cargando: false });
            console.error('❌ [STORE] Error al validar comanda:', error);
            return false;
          }
        },

        obtenerPermisosComanda: (comandaId: string) => {
          const comanda = get().comandas.find((c) => c.id === comandaId);
          const usuario = get().obtenerUsuarioActual();

          if (!comanda) {
            return {
              puedeEditar: false,
              puedeEliminar: false,
              puedeCambiarEstado: false,
              puedeValidar: false,
              puedeVerHistorial: false,
            };
          }

          const estaValidado =
            (comanda as Comanda & { estadoValidacion?: string })
              .estadoValidacion === 'validado';
          const esAdmin = usuario.rol === 'admin';

          return {
            puedeEditar: !estaValidado,
            puedeEliminar: !estaValidado && esAdmin,
            puedeCambiarEstado: !estaValidado,
            puedeValidar: esAdmin && !estaValidado,
            puedeVerHistorial: true,
          };
        },

        obtenerUsuarioActual: () => {
          // Mock del usuario actual - en producción vendría del auth store
          return {
            id: 'user-1',
            nombre: 'Usuario Demo',
            rol: 'admin' as const,
          };
        },

        // === SISTEMA ===
        inicializar: () => {
          // Esta función puede ser llamada para inicializar datos por defecto
          logger.info('Store inicializado manualmente');
        },

        reiniciar: () => {
          set(estadoInicial);
          logger.info('Store reiniciado al estado inicial');
        },

        // === FUNCIÓN PARA LIMPIAR DUPLICADOS ===
        limpiarDuplicados: () => {
          const { comandas } = get();

          if (comandas.length === 0) {
            logger.info('🔍 No hay comandas para verificar duplicados');
            return;
          }

          logger.info(
            `🔍 Verificando duplicados en ${comandas.length} comandas`
          );

          // Crear un Map para rastrear duplicados más eficientemente
          const comandasMap = new Map<string, Comanda>();
          const duplicadosEncontrados: string[] = [];

          comandas.forEach((comanda) => {
            if (comandasMap.has(comanda.id)) {
              duplicadosEncontrados.push(comanda.id);
              logger.warning(`⚠️ Duplicado encontrado: ${comanda.id}`);
            } else {
              comandasMap.set(comanda.id, comanda);
            }
          });

          if (duplicadosEncontrados.length > 0) {
            const comandasUnicas = Array.from(comandasMap.values());

            logger.info(
              `🧹 Limpiando ${duplicadosEncontrados.length} comandas duplicadas`
            );
            logger.info(
              `📋 IDs duplicados: [${duplicadosEncontrados.join(', ')}]`
            );
            logger.info(
              `✅ IDs únicos resultantes: [${comandasUnicas.map((c) => c.id).join(', ')}]`
            );

            set({ comandas: comandasUnicas });
          } else {
            logger.info(`✅ No se encontraron duplicados`);
          }
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
    filters: store.filters,
    updateFilters: store.updateFilters,
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

// Hook especializado para validación de comandas
export const useValidacionComandas = () => {
  const store = useComandaStore();
  return {
    // Estado
    cargando: store.cargando,
    error: store.error,
    usuarioActual: store.obtenerUsuarioActual(),

    // Acciones
    cambiarEstadoComanda: store.cambiarEstadoComanda,
    validarComanda: store.validarComanda,
    obtenerPermisosComanda: store.obtenerPermisosComanda,

    // Utilidades
    limpiarError: () => store.reiniciar(), // Temporal, en producción sería más específico
  };
};
