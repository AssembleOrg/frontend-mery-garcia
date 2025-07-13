'use client';
import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
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

  // Datos de referencia
  personal: Personal[];
  personalSimple: PersonalSimple[]; // Lista simple para gestión de personal
  productosServicios: ProductoServicio[];
  tipoCambio: TipoCambio;
  configuracionRecargos: ConfiguracionRecargo[];
  tipoCambioInicializado: boolean; // Flag para evitar cargas múltiples

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
  obtenerPersonalPorUnidad: (unidad?: UnidadNegocio) => Personal[];
  buscarProductosServicios: (
    query?: string,
    unidad?: UnidadNegocio
  ) => ProductoServicio[];
  cargarTipoCambioInicial: () => Promise<void>;

  // Acciones - Productos/Servicios CRUD
  agregarProductoServicio: (producto: Omit<ProductoServicio, 'id'>) => void;
  actualizarProductoServicio: (
    id: string,
    producto: Partial<ProductoServicio>
  ) => void;
  eliminarProductoServicio: (id: string) => void;
  obtenerProductoServicioPorId: () => ProductoServicio | undefined;

  // Acciones - Personal Simple CRUD
  agregarPersonalSimple: (personal: Omit<PersonalSimple, 'id'>) => void;
  actualizarPersonalSimple: (
    id: string,
    personal: Partial<PersonalSimple>
  ) => void;
  eliminarPersonalSimple: (id: string) => void;
  obtenerPersonalSimplePorId: () => PersonalSimple | undefined;

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
  personal: [],
  personalSimple: [],
  productosServicios: [],
  tipoCambio: {
    valorCompra: 0,
    valorVenta: 0,
    fecha: new Date(),
    fuente: 'manual',
    modoManual: false, // Por defecto, permite sobrescribir con API
  } as TipoCambio,
  configuracionRecargos: [],
  tipoCambioInicializado: false,
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

        // === DATOS DE REFERENCIA ===
        actualizarTipoCambio: (tipoCambio: TipoCambio) => {
          set({ tipoCambio });
        },

        /**
         * Devuelve la lista de personal filtrada por unidad de negocio.
         * Si no se pasa unidad, devuelve todo el personal.
         */
        obtenerPersonalPorUnidad: (unidad?: UnidadNegocio) => {
          // Ahora todos los miembros del personal son globales; la variable se mantiene para compatibilidad.

          void unidad; // Marcar como usada para evitar advertencia de lint

          const { personal, personalSimple } = get();

          // Si la lista completa está vacía pero existe simple, convertirla
          if (personal.length === 0 && personalSimple.length > 0) {
            return personalSimple.map((ps) => ({
              id: ps.id,
              nombre: ps.nombre,
              comisionPorcentaje: ps.comision,
              activo: true,
              unidadesDisponibles: ['tattoo', 'estilismo', 'formacion'],
              fechaIngreso: new Date(),
            }));
          }

          return personal;
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

        // === PERSONAL SIMPLE CRUD ===
        agregarPersonalSimple: (personal: Omit<PersonalSimple, 'id'>) => {
          const idGenerado = `personal-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Versión simplificada
          const nuevoPersonalSimple: PersonalSimple = {
            ...personal,
            id: idGenerado,
          };

          // Versión completa para otras partes de la app
          const nuevoPersonalCompleto: Personal = {
            id: idGenerado,
            nombre: personal.nombre,
            comisionPorcentaje: personal.comision,
            activo: true,
            unidadesDisponibles: ['tattoo', 'estilismo', 'formacion'],
            fechaIngreso: new Date(),
          };

          set((state) => ({
            personalSimple: [...state.personalSimple, nuevoPersonalSimple],
            personal: [...state.personal, nuevoPersonalCompleto],
          }));

          console.log('✅ Personal creado:', nuevoPersonalSimple);
        },

        actualizarPersonalSimple: (
          id: string,
          personalActualizado: Partial<PersonalSimple>
        ) => {
          set((state) => {
            // Actualizar arrays simples y completos
            const personalSimpleActualizado = state.personalSimple.map((p) =>
              p.id === id ? { ...p, ...personalActualizado } : p
            );

            const personalActualizadoCompleto = state.personal.map((p) =>
              p.id === id
                ? {
                    ...p,
                    nombre: personalActualizado.nombre || p.nombre,
                    comisionPorcentaje:
                      personalActualizado.comision ?? p.comisionPorcentaje,
                  }
                : p
            );

            return {
              personalSimple: personalSimpleActualizado,
              personal: personalActualizadoCompleto,
            };
          });

          console.log('✅ Personal actualizado:', {
            id,
            ...personalActualizado,
          });
        },

        eliminarPersonalSimple: (id: string) => {
          set((state) => ({
            personalSimple: state.personalSimple.filter((p) => p.id !== id),
            personal: state.personal.filter((p) => p.id !== id),
          }));

          console.log('✅ Personal eliminado:', id);
        },

        obtenerPersonalSimplePorId: () => undefined,

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

        // === CARGAR TIPO DE CAMBIO INICIAL ===
        cargarTipoCambioInicial: async () => {
          const { tipoCambioInicializado } = get();

          // Evitar cargas múltiples
          if (tipoCambioInicializado) return;

          try {
            // Importar dinámicamente para evitar dependencias circulares
            const { getManualRate } = await import(
              '@/services/exchangeRate.service'
            );
            const manualRate = await getManualRate();

            if (manualRate) {
              set({
                tipoCambio: {
                  valorCompra: manualRate.compra || 0,
                  valorVenta: manualRate.venta || 0,
                  fecha: new Date(manualRate.fechaActualizacion),
                  fuente: 'manual',
                  modoManual: true,
                },
                tipoCambioInicializado: true,
              });
              console.log(
                '✅ Tipo de cambio cargado desde backend:',
                manualRate
              );
            } else {
              // Solo marcar como inicializado sin cambiar valores por defecto
              set({ tipoCambioInicializado: true });
              console.log('ℹ️ No hay tipo de cambio manual previo');
            }
          } catch (error) {
            console.error('Error cargando tipo de cambio inicial:', error);
            set({ tipoCambioInicializado: true }); // Marcar como inicializado para evitar reintentos
          }
        },
      }),
      {
        name: 'comanda-store',
        storage: safeJSONStorage,
        partialize: (state) => ({
          comandas: state.comandas,
          tipoCambio: state.tipoCambio,
          configuracionRecargos: state.configuracionRecargos,
          personal: state.personal,
          personalSimple: state.personalSimple,
          productosServicios: state.productosServicios,
          tipoCambioInicializado: state.tipoCambioInicializado,
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
    cargarTipoCambioInicial: store.cargarTipoCambioInicial,
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
    limpiarError: () =>
      useComandaStore.setState({ error: null, cargando: false }),
  };
};
