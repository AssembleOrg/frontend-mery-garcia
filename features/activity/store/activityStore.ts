import { create } from 'zustand';
import { toast } from 'sonner';
import { logger } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Enums actualizados para coincidir con el backend
export enum TipoAccion {
  // Usuarios
  USUARIO_CREADO = 'usuario_creado',
  USUARIO_MODIFICADO = 'usuario_modificado',
  USUARIO_ELIMINADO = 'usuario_eliminado',
  USUARIO_LOGIN = 'usuario_login',
  USUARIO_LOGOUT = 'usuario_logout',
  USUARIO_RESTAURADO = 'usuario_restaurado',

  // Cajas
  CAJA_MOVIMIENTO = 'caja_movimiento',
  CAJA_TRANSFERENCIA = 'caja_transferencia',
  CAJA_BALANCE_CONSULTADO = 'caja_balance_consultado',

  // Comandas
  COMANDA_CREADA = 'comanda_creada',
  COMANDA_MODIFICADA = 'comanda_modificada',
  COMANDA_ELIMINADA = 'comanda_eliminada',
  COMANDA_COMPLETADA = 'comanda_completada',
  COMANDA_RESTAURADA = 'comanda_restaurada',
  COMANDA_ESTADO_CAMBIADO = 'comanda_estado_cambiado',

  // Clientes
  CLIENTE_CREADO = 'cliente_creado',
  CLIENTE_MODIFICADO = 'cliente_modificado',
  CLIENTE_ELIMINADO = 'cliente_eliminado',
  CLIENTE_RESTAURADO = 'cliente_restaurado',

  // Prepagos
  PREPAGO_CREADO = 'prepago_creado',
  PREPAGO_MODIFICADO = 'prepago_modificado',
  PREPAGO_ELIMINADO = 'prepago_eliminado',
  PREPAGO_RESTAURADO = 'prepago_restaurado',
  PREPAGO_GUARDADO_CREADO = 'prepago_guardado_creado',
  PREPAGO_GUARDADO_MODIFICADO = 'prepago_guardado_modificado',
  PREPAGO_GUARDADO_ELIMINADO = 'prepago_guardado_eliminado',
  PREPAGO_GUARDADO_RESTAURADO = 'prepago_guardado_restaurado',

  // Comisiones
  COMISION_CREADA = 'comision_creada',
  COMISION_MODIFICADA = 'comision_modificada',
  COMISION_ELIMINADA = 'comision_eliminada',
  COMISION_RESTAURADA = 'comision_restaurada',

  // Personal/Trabajadores
  PERSONAL_CREADO = 'personal_creado',
  PERSONAL_MODIFICADO = 'personal_modificado',
  PERSONAL_ELIMINADO = 'personal_eliminado',
  PERSONAL_RESTAURADO = 'personal_restaurado',
  TRABAJADOR_CREADO = 'trabajador_creado',
  TRABAJADOR_MODIFICADO = 'trabajador_modificado',
  TRABAJADOR_ELIMINADO = 'trabajador_eliminado',
  TRABAJADOR_RESTAURADO = 'trabajador_restaurado',

  // Items de Comanda
  ITEM_COMANDA_CREADO = 'item_comanda_creado',
  ITEM_COMANDA_MODIFICADO = 'item_comanda_modificado',
  ITEM_COMANDA_ELIMINADO = 'item_comanda_eliminado',
  ITEM_COMANDA_RESTAURADO = 'item_comanda_restaurado',

  // Movimientos
  MOVIMIENTO_CREADO = 'movimiento_creado',
  MOVIMIENTO_MODIFICADO = 'movimiento_modificado',
  MOVIMIENTO_ELIMINADO = 'movimiento_eliminado',
  MOVIMIENTO_RESTAURADO = 'movimiento_restaurado',

  // Productos/Servicios
  PRODUCTO_SERVICIO_CREADO = 'producto_servicio_creado',
  PRODUCTO_SERVICIO_MODIFICADO = 'producto_servicio_modificado',
  PRODUCTO_SERVICIO_ELIMINADO = 'producto_servicio_eliminado',
  PRODUCTO_SERVICIO_RESTAURADO = 'producto_servicio_restaurado',

  // Tipos de Item
  TIPO_ITEM_CREADO = 'tipo_item_creado',
  TIPO_ITEM_MODIFICADO = 'tipo_item_modificado',
  TIPO_ITEM_ELIMINADO = 'tipo_item_eliminado',
  TIPO_ITEM_RESTAURADO = 'tipo_item_restaurado',

  // Unidades de Negocio
  UNIDAD_NEGOCIO_CREADA = 'unidad_negocio_creada',
  UNIDAD_NEGOCIO_MODIFICADA = 'unidad_negocio_modificada',
  UNIDAD_NEGOCIO_ELIMINADA = 'unidad_negocio_eliminada',
  UNIDAD_NEGOCIO_RESTAURADA = 'unidad_negocio_restaurada',

  // Configuración
  CONFIG_MODIFICADA = 'config_modificada',
  DOLAR_ACTUALIZADO = 'dolar_actualizado',

  // Sistema
  DATABASE_CLEANUP = 'database_cleanup',
  SISTEMA_BACKUP = 'sistema_backup',
  SISTEMA_RESTORE = 'sistema_restore',
}

export enum ModuloSistema {
  AUTH = 'auth',
  PERSONAL = 'personal',
  CAJA = 'caja',
  COMANDA = 'comanda',
  CLIENTE = 'cliente',
  PREPAGO = 'prepago',
  COMISION = 'comision',
  SISTEMA = 'sistema',
  AUDITORIA = 'auditoria',
  CONFIG = 'config',
  DATABASE_CLEANUP = 'database_cleanup',
  DOLAR = 'dolar',
  ITEM_COMANDA = 'item_comanda',
  MOVIMIENTO = 'movimiento',
  PRODUCTO_SERVICIO = 'producto_servicio',
  TIPO_ITEM = 'tipo_item',
  UNIDAD_NEGOCIO = 'unidad_negocio',
  TRABAJADOR = 'trabajador',
  PREPAGO_GUARDADO = 'prepago_guardado',
}

// Interface para datos de usuario en auditoría
export interface UsuarioAuditoria {
  id: string;
  nombre?: string;
  email?: string;
}

// Interface principal para registros de auditoría
export interface RegistroAuditoria {
  id: string;
  tipoAccion: TipoAccion;
  modulo: ModuloSistema;
  descripcion: string;
  datosAnteriores?: Record<string, any>;
  datosNuevos?: Record<string, any>;
  observaciones?: string;
  ipAddress?: string;
  userAgent?: string;
  usuario: UsuarioAuditoria;
  entidadId?: string;
  createdAt: string;
}

// Interface para filtros de auditoría (coincide con FiltrarAuditoriaDto)
export interface FiltrosAuditoria {
  page?: number;
  limit?: number;
  search?: string;
  modulo?: ModuloSistema;
  tipoAccion?: TipoAccion;
  usuarioId?: string;
  entidadId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

// Interface para respuesta paginada
export interface RespuestaAuditoria {
  data: RegistroAuditoria[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Interface para estadísticas de auditoría
export interface EstadisticasAuditoria {
  totalRegistros: number;
  registrosHoy: number;
  usuariosActivos: number;
  moduloMasActivo: string;
  accionesMasComunes: string[];
}

interface AuditoriaState {
  registros: RegistroAuditoria[];
  registrosPaginados: RegistroAuditoria[];
  filtros: FiltrosAuditoria;
  estadisticas: EstadisticasAuditoria;
  isLoading: boolean;
  error: string | null;
  paginacion: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
}

interface AuditoriaActions {
  // Cargar datos
  cargarAuditoria: (filtros?: Partial<FiltrosAuditoria>) => Promise<void>;
  cargarAuditoriaPaginada: (filtros?: Partial<FiltrosAuditoria>) => Promise<void>;
  cargarAuditoriaPorUsuario: (usuarioId: string, limit?: number) => Promise<void>;
  cargarAuditoriaPorModulo: (modulo: ModuloSistema, limit?: number) => Promise<void>;
  
  // Filtros
  actualizarFiltros: (nuevosFiltros: Partial<FiltrosAuditoria>) => void;
  limpiarFiltros: () => void;
  
  // Utilidades
  obtenerEstadisticas: () => EstadisticasAuditoria;
  exportarAuditoria: () => void;
  exportarAuditoriaPDF: () => void;
  limpiarAuditoria: () => void;
  
  // Estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type AuditoriaStore = AuditoriaState & AuditoriaActions;

const estadoInicial: AuditoriaState = {
  registros: [],
  registrosPaginados: [],
  filtros: {
    page: 1,
    limit: 50,
    orderBy: 'createdAt',
    orderDirection: 'DESC',
  },
  estadisticas: {
    totalRegistros: 0,
    registrosHoy: 0,
    usuariosActivos: 0,
    moduloMasActivo: '',
    accionesMasComunes: [],
  },
  isLoading: false,
  error: null,
  paginacion: null,
};

export const useAuditoriaStore = create<AuditoriaStore>((set, get) => ({
  ...estadoInicial,

  // Cargar auditoría general con filtros
  cargarAuditoria: async (filtros = {}) => {
    const { actualizarFiltros, setLoading, setError } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      // Actualizar filtros si se proporcionaron nuevos
      if (Object.keys(filtros).length > 0) {
        actualizarFiltros(filtros);
      }

      const { auditoriaService } = await import('@/services/auditoria.service');
      const data = await auditoriaService.obtenerAuditoria(filtros);
      
      set({
        registros: data.data,
        isLoading: false,
      });

      logger.info('✅ Auditoría cargada exitosamente:', data.data.length, 'registros');
      toast.success(`Auditoría cargada: ${data.data.length} registros`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      set({ isLoading: false });
      
      logger.error('❌ Error cargando auditoría:', error);
      toast.error(`Error cargando auditoría: ${errorMessage}`);
    }
  },

  // Cargar auditoría paginada
  cargarAuditoriaPaginada: async (filtros = {}) => {
    const { actualizarFiltros, setLoading, setError, filtros: filtrosActuales } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      // Combinar filtros actuales con los nuevos filtros proporcionados
      const filtrosCombinados = { ...filtrosActuales, ...filtros };
      
      // Actualizar filtros si se proporcionaron nuevos
      if (Object.keys(filtros).length > 0) {
        actualizarFiltros(filtros);
      }

      const { auditoriaService } = await import('@/services/auditoria.service');
      console.warn('filtros combinados', filtrosCombinados);
      const data = await auditoriaService.obtenerAuditoriaPaginada(filtrosCombinados);
      
      set({
        registrosPaginados: data.data || [],
        paginacion: data.meta,
        isLoading: false,
      });

      logger.info('✅ Auditoría paginada cargada exitosamente:', data.data.length, 'registros');
      // toast.success(`Auditoría paginada cargada: ${data.data.length} registros`);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      set({ isLoading: false });
      
      logger.error('❌ Error cargando auditoría paginada:', error);
      toast.error(`Error cargando auditoría paginada: ${errorMessage}`);
    }
  },

  // Cargar auditoría por usuario específico
  cargarAuditoriaPorUsuario: async (usuarioId: string, limit = 50) => {
    const { setLoading, setError } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const { auditoriaService } = await import('@/services/auditoria.service');
      const data = await auditoriaService.obtenerAuditoriaPorUsuario(usuarioId, limit);
      
      set({
        registros: data.data,
        isLoading: false,
      });

      logger.info('✅ Auditoría por usuario cargada:', data.data.length, 'registros');
      toast.success(`Auditoría del usuario cargada: ${data.data.length} registros`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      set({ isLoading: false });
      
      logger.error('❌ Error cargando auditoría por usuario:', error);
      toast.error(`Error cargando auditoría del usuario: ${errorMessage}`);
    }
  },

  // Cargar auditoría por módulo específico
  cargarAuditoriaPorModulo: async (modulo: ModuloSistema, limit = 50) => {
    const { setLoading, setError } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const { auditoriaService } = await import('@/services/auditoria.service');
      const data = await auditoriaService.obtenerAuditoriaPorModulo(modulo, limit);
      
      set({
        registros: data.data,
        isLoading: false,
      });

      logger.info('✅ Auditoría por módulo cargada:', data.data.length, 'registros');
      toast.success(`Auditoría del módulo cargada: ${data.data.length} registros`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      set({ isLoading: false });
      
      logger.error('❌ Error cargando auditoría por módulo:', error);
      toast.error(`Error cargando auditoría del módulo: ${errorMessage}`);
    }
  },

  // Actualizar filtros
  actualizarFiltros: (nuevosFiltros) => {
    set((state) => ({
      filtros: { ...state.filtros, ...nuevosFiltros },
    }));
  },

  // Limpiar filtros
  limpiarFiltros: () => {
    set({
      filtros: {
        page: 1,
        limit: 10,
        orderBy: 'createdAt',
        orderDirection: 'DESC',
      },
    });
  },

  // Obtener estadísticas
  obtenerEstadisticas: () => {
    const { registros } = get();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registrosHoy = registros.filter((registro) => {
      const registroDate = new Date(registro.createdAt);
      registroDate.setHours(0, 0, 0, 0);
      return registroDate.getTime() === hoy.getTime();
    }).length;

    const usuariosUnicos = new Set(registros.map((registro) => registro.usuario.id));

    // Contar actividades por módulo
    const moduloCount: Record<string, number> = {};
    registros.forEach((registro) => {
      moduloCount[registro.modulo] = (moduloCount[registro.modulo] || 0) + 1;
    });

    const moduloMasActivo = Object.entries(moduloCount).reduce(
      (max, [modulo, count]) =>
        count > max.count ? { modulo, count } : max,
      { modulo: 'N/A', count: 0 }
    ).modulo;

    // Contar acciones más comunes
    const accionCount: Record<string, number> = {};
    registros.forEach((registro) => {
      accionCount[registro.tipoAccion] = (accionCount[registro.tipoAccion] || 0) + 1;
    });

    const accionesMasComunes = Object.entries(accionCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([accion]) => accion);

    const estadisticas: EstadisticasAuditoria = {
      totalRegistros: registros.length,
      registrosHoy,
      usuariosActivos: usuariosUnicos.size,
      moduloMasActivo,
      accionesMasComunes,
    };

    set({ estadisticas });
    return estadisticas;
  },

  // Exportar auditoría a CSV
  exportarAuditoria: () => {
    const { registrosPaginados } = get();
    
    if (!Array.isArray(registrosPaginados) || registrosPaginados.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      // Crear headers del CSV
      const headers = [
        'ID',
        'Fecha y Hora',
        'Usuario',
        'Tipo de Acción',
        'Módulo',
        'Descripción',
        'Observaciones',
        'IP Address',
        'User Agent',
        'Entidad ID'
      ];

      // Crear filas de datos
      const rows = registrosPaginados.map(registro => [
        registro.id,
        format(new Date(registro.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        registro.usuario?.nombre || registro.usuario?.email || registro.usuario?.id || '',
        registro.tipoAccion,
        registro.modulo,
        registro.descripcion,
        registro.observaciones || '',
        registro.ipAddress || '',
        registro.userAgent || '',
        registro.entidadId || ''
      ]);

      // Combinar headers y datos
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `auditoria_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Auditoría exportada a CSV exitosamente');
      logger.info('✅ Auditoría exportada a CSV:', registrosPaginados.length, 'registros');
    } catch (error) {
      logger.error('❌ Error exportando auditoría a CSV:', error);
      toast.error('Error al exportar auditoría a CSV');
    }
  },

  // Exportar auditoría a PDF
  exportarAuditoriaPDF: () => {
    const { registrosPaginados, filtros } = get();
    
    if (!Array.isArray(registrosPaginados) || registrosPaginados.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      // Importar jsPDF dinámicamente
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF();
          
          // Título del documento
          doc.setFontSize(20);
          doc.text('Reporte de Auditoría del Sistema', 20, 20);
          
          // Subtítulo con fecha
          doc.setFontSize(12);
          doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}`, 20, 30);
          
          // Información de filtros aplicados
          doc.setFontSize(10);
          let yPosition = 45;
          
          const filtrosAplicados = [];
          if (filtros.fechaInicio) filtrosAplicados.push(`Desde: ${filtros.fechaInicio}`);
          if (filtros.fechaFin) filtrosAplicados.push(`Hasta: ${filtros.fechaFin}`);
          if (filtros.modulo) filtrosAplicados.push(`Módulo: ${filtros.modulo}`);
          if (filtros.tipoAccion) filtrosAplicados.push(`Acción: ${filtros.tipoAccion}`);
          if (filtros.usuarioId) filtrosAplicados.push(`Usuario: ${filtros.usuarioId}`);
          
          if (filtrosAplicados.length > 0) {
            doc.text('Filtros aplicados:', 20, yPosition);
            yPosition += 5;
            filtrosAplicados.forEach(filtro => {
              doc.text(`• ${filtro}`, 25, yPosition);
              yPosition += 4;
            });
            yPosition += 5;
          }
          
          // Estadísticas
          doc.setFontSize(12);
          doc.text(`Total de registros: ${registrosPaginados.length}`, 20, yPosition);
          yPosition += 10;
          
          // Tabla de datos
          const tableData = registrosPaginados.map(registro => [
            registro.id,
            format(new Date(registro.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
            registro.usuario?.nombre || registro.usuario?.email || registro.usuario?.id || '',
            registro.tipoAccion,
            registro.modulo,
            registro.descripcion.substring(0, 50) + (registro.descripcion.length > 50 ? '...' : ''),
            registro.ipAddress || '-'
          ]);
          
          autoTable(doc, {
            head: [['ID', 'Fecha', 'Usuario', 'Acción', 'Módulo', 'Descripción', 'IP']],
            body: tableData,
            startY: yPosition,
            styles: {
              fontSize: 8,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [249, 187, 196],
              textColor: [74, 53, 64],
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [255, 255, 255],
            },
            columnStyles: {
              0: { cellWidth: 15 }, // ID
              1: { cellWidth: 25 }, // Fecha
              2: { cellWidth: 30 }, // Usuario
              3: { cellWidth: 25 }, // Acción
              4: { cellWidth: 20 }, // Módulo
              5: { cellWidth: 50 }, // Descripción
              6: { cellWidth: 20 }, // IP
            },
            margin: { top: 10 },
          });
          
          // Guardar el PDF
          const fileName = `auditoria_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`;
          doc.save(fileName);
          
          toast.success('Auditoría exportada a PDF exitosamente');
          logger.info('✅ Auditoría exportada a PDF:', registrosPaginados.length, 'registros');
        });
      });
    } catch (error) {
      logger.error('❌ Error exportando auditoría a PDF:', error);
      toast.error('Error al exportar auditoría a PDF');
    }
  },

  // Limpiar auditoría
  limpiarAuditoria: () => {
    set({
      registros: [],
      registrosPaginados: [],
      paginacion: null,
      error: null,
    });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set error state
  setError: (error: string | null) => {
    set({ error });
  },
}));

// Hook de conveniencia para usar auditoría
export const useAuditoria = () => {
  const {
    registros,
    registrosPaginados,
    filtros,
    estadisticas,
    isLoading,
    error,
    paginacion,
    cargarAuditoria,
    cargarAuditoriaPaginada,
    cargarAuditoriaPorUsuario,
    cargarAuditoriaPorModulo,
    actualizarFiltros,
    limpiarFiltros,
    obtenerEstadisticas,
    exportarAuditoria,
    exportarAuditoriaPDF,
    limpiarAuditoria,
  } = useAuditoriaStore();

  return {
    registros,
    registrosPaginados,
    filtros,
    estadisticas,
    isLoading,
    error,
    paginacion,
    cargarAuditoria,
    cargarAuditoriaPaginada,
    cargarAuditoriaPorUsuario,
    cargarAuditoriaPorModulo,
    actualizarFiltros,
    limpiarFiltros,
    obtenerEstadisticas,
    exportarAuditoria,
    exportarAuditoriaPDF,
    limpiarAuditoria,
  };
};
