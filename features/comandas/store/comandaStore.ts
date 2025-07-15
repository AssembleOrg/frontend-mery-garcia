'use client';
import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/lib/utils';
import {
  Comanda,
  FiltrosComanda,
  ResumenCaja,
  ProductoServicio,
  EstadoComandaNegocio,
  EstadoValidacion,
  UnidadNegocio,
} from '@/types/caja';

interface ComandaState {
  // Estados principales
  comandas: Comanda[];
  filters: FiltrosComanda;
  cargando: boolean;
  error: string | null;

  productosServicios: ProductoServicio[];

  // Acciones - Comandas
  agregarComanda: (comanda: Comanda) => void;
  actualizarComanda: (id: string, comanda: Partial<Comanda>) => void;
  eliminarComanda: (id: string) => void;
  obtenerComandaPorId: (id: string) => Comanda | undefined;

  // Acciones - Filtros
  actualizarFiltros: (filters: Partial<FiltrosComanda>) => void;
  limpiarFiltros: () => void;

  // Acciones - Cálculos
  obtenerComandasFiltradas: () => Comanda[];
  obtenerResumenCaja: () => ResumenCaja;
  obtenerProximoNumero: (tipo: 'ingreso' | 'egreso') => string;

  buscarProductosServicios: (
    query?: string,
    unidad?: UnidadNegocio
  ) => ProductoServicio[];

  // Acciones - Productos/Servicios CRUD
  agregarProductoServicio: (producto: Omit<ProductoServicio, 'id'>) => void;
  actualizarProductoServicio: (
    id: string,
    producto: Partial<ProductoServicio>
  ) => void;
  eliminarProductoServicio: (id: string) => void;
  obtenerProductoServicioPorId: () => ProductoServicio | undefined;

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

  // === FUNCIÓN PARA MIGRAR DATOS EXISTENTES ===
  migrarDatosValidacion: () => void;

  // Actualizar estado de comanda (simplificado - solo un campo estado)
  actualizarEstadoComanda: (
    comandaId: string,
    nuevoEstado: 'pendiente' | 'completado' | 'validado' | 'cancelado'
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

  /**
   * Obtiene un resumen de comandas directamente del backend utilizando el
   * endpoint /api/comandas/estadisticas/resumen.
   */
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
  filters: {},
  cargando: false,
  error: null,
  productosServicios: [],
};

// Storage helper que evita acceder a localStorage durante el render en servidor
const safeJSONStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  // Dummy in-memory storage compatible with Storage interface
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
            comandas: state.comandas.map((c) => {
              if (c.id !== id) return c;

              // Si viene una actualización de 'estado', reflejarla en estadoNegocio para compatibilidad
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

          // Calcular unidad más activa
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

          // Calcular personal con más ventas (usando datos mock)
          const personalMasVentas = 'Personal Demo';

          return {
            totalIncoming,
            totalOutgoing,
            saldo: totalIncoming - totalOutgoing,
            cantidadComandas: comandasHoy.length,
            unidadMasActiva,
            personalMasVentas,
          };
        },

        obtenerProximoNumero: (tipo: 'ingreso' | 'egreso') => {
          const { comandas } = get();

          // Filtrar comandas por tipo
          const comandasTipo = comandas.filter((c) => c.tipo === tipo);

          // Obtener el prefijo según el tipo
          const prefix = tipo === 'ingreso' ? '01' : '02';

          // Filtrar solo las comandas con el prefijo correcto
          const comandasConPrefijo = comandasTipo.filter(
            (c) => c.numero && c.numero.startsWith(prefix)
          );

          // Si no hay comandas de este tipo, empezar desde 1
          if (comandasConPrefijo.length === 0) {
            return `${prefix}-0001`;
          }

          // Extraer números y encontrar el máximo
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

        /**
         * Devuelve productos y servicios filtrados por búsqueda y unidad.
         * Actualmente realiza un filtrado simple en memoria sobre el estado.
         * En el futuro se debería reemplazar por una consulta al backend.
         */
        buscarProductosServicios: (query = '', unidad?: UnidadNegocio) => {
          const { productosServicios } = get();

          const texto = query.trim().toLowerCase();

          return productosServicios.filter((ps) => {
            const coincideTexto = ps.nombre.toLowerCase().includes(texto);
            const coincideUnidad = unidad ? ps.businessUnit === unidad : true;
            return coincideTexto && coincideUnidad && ps.activo;
          });
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

        obtenerProductoServicioPorId: () => undefined,

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
          // Ejecutar migración de datos de validación
          get().migrarDatosValidacion();
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

        // === FUNCIÓN PARA MIGRAR DATOS EXISTENTES ===
        migrarDatosValidacion: () => {
          const { comandas } = get();

          if (comandas.length === 0) {
            logger.info('🔍 No hay comandas para migrar');
            return;
          }

          logger.info(
            `🔄 Verificando migración de validación en ${comandas.length} comandas`
          );

          let comandasMigradas = 0;

          const comandasActualizadas = comandas.map((comanda) => {
            const necesitaMigracion =
              !comanda.estadoNegocio ||
              !comanda.estadoValidacion ||
              (comanda.estadoNegocio as unknown as string) === 'completo';

            if (necesitaMigracion) {
              comandasMigradas++;
              return {
                ...comanda,
                estadoNegocio:
                  (comanda.estadoNegocio as unknown as string) === 'completo'
                    ? 'completado'
                    : comanda.estadoNegocio || 'pendiente',
                estadoValidacion: comanda.estadoValidacion || 'no_validado',
              };
            }

            return comanda;
          });

          if (comandasMigradas > 0) {
            set({ comandas: comandasActualizadas });
            logger.info(
              `✅ Migradas ${comandasMigradas} comandas con propiedades de validación`
            );
          } else {
            logger.info(
              '✅ Todas las comandas ya tienen propiedades de validación'
            );
          }
        },

        // Actualizar estado de comanda (simplificado - solo un campo estado)
        actualizarEstadoComanda: (
          comandaId: string,
          nuevoEstado: 'pendiente' | 'completado' | 'validado' | 'cancelado'
        ) => {
          set((state) => ({
            comandas: state.comandas.map((comanda) =>
              comanda.id === comandaId
                ? { ...comanda, estado: nuevoEstado }
                : comanda
            ),
          }));
        },

        // === OPERACIONES MASIVAS ===
        validarComandasRango: (fechaDesde: Date, fechaHasta: Date) => {
          const { comandas } = get();
          const desde = new Date(fechaDesde);
          const hasta = new Date(fechaHasta);

          const idsAValidar: string[] = [];

          const comandasActualizadas = comandas.map((c) => {
            const f = new Date(c.fecha);
            if (
              f >= desde &&
              f <= hasta &&
              c.estado === 'completado' &&
              c.estadoValidacion !== 'validado'
            ) {
              idsAValidar.push(c.id);
              return { ...c, estadoValidacion: 'validado' as const };
            }
            return c;
          });

          if (idsAValidar.length > 0) {
            set({ comandas: comandasActualizadas });
            logger.success(
              `✅ Validadas ${idsAValidar.length} comandas en rango`
            );
          }

          return idsAValidar.length;
        },

        obtenerResumenRango: (fechaDesde: Date, fechaHasta: Date) => {
          const { comandas } = get();
          const desde = new Date(fechaDesde);
          const hasta = new Date(fechaHasta);

          let totalCompletados = 0;
          let totalPendientes = 0;
          let montoNeto = 0;
          let totalIngresos = 0;
          let totalEgresos = 0;

          comandas.forEach((c) => {
            const f = new Date(c.fecha);
            if (f >= desde && f <= hasta) {
              if (c.estado === 'completado') {
                totalCompletados += 1;
                if (c.tipo === 'ingreso') {
                  totalIngresos += c.totalFinal;
                  montoNeto += c.totalFinal;
                } else {
                  totalEgresos += c.totalFinal;
                  montoNeto -= c.totalFinal;
                }
              } else {
                totalPendientes += 1;
              }
            }
          });

          return {
            totalCompletados,
            totalPendientes,
            montoNeto,
            totalIngresos,
            totalEgresos,
          };
        },

        // === CONSULTA REMOTA DE RESUMEN ===
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
          productosServicios: state.productosServicios,
        }),
      }
    ),
    {
      name: 'ComandaStore',
    }
  )
);

// Ejecutar migración automática al cargar el store
if (typeof window !== 'undefined') {
  // Solo ejecutar en el cliente
  setTimeout(() => {
    useComandaStore.getState().migrarDatosValidacion();
  }, 100);
}

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

export const useDatosReferencia = () => {
  const store = useComandaStore();
  return {
    productosServicios: store.productosServicios,
    buscarProductosServicios: store.buscarProductosServicios,
    // CRUD Productos/Servicios
    agregarProductoServicio: store.agregarProductoServicio,
    actualizarProductoServicio: store.actualizarProductoServicio,
    eliminarProductoServicio: store.eliminarProductoServicio,
    obtenerProductoServicioPorId: store.obtenerProductoServicioPorId,
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
    limpiarError: () =>
      useComandaStore.setState({ error: null, cargando: false }),
  };
};
