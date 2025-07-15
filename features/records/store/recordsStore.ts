'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { TraspasoInfo, HistorialCambio } from '@/types/caja';

// Storage helper para evitar acceso a localStorage en SSR
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

// Registro diario completo de Caja 1
export interface RegistroDiario {
  id: string;
  fecha: string; // YYYY-MM-DD
  totalIncoming: number;
  totalOutgoing: number;
  saldo: number;
  cantidadComandas: number;
  unidadMasActiva?: string;
  personalMasVentas?: string;
  comandasIds: string[];
  fechaCreacion: string;
  creadoPor: string;
}

interface RecordsState {
  // Estados principales
  registrosDiarios: RegistroDiario[];
  traspasos: TraspasoInfo[];
  historialCambios: HistorialCambio[];
  cargando: boolean;
  error: string | null;

  // Acciones - Registros Diarios
  guardarRegistroDiario: (
    registro: Omit<RegistroDiario, 'id' | 'fechaCreacion'>
  ) => void;
  obtenerRegistroPorFecha: (fecha: string) => RegistroDiario | undefined;
  obtenerRegistrosRango: (
    fechaDesde: string,
    fechaHasta: string
  ) => RegistroDiario[];

  // Acciones - Traspasos
  registrarTraspaso: (traspaso: Omit<TraspasoInfo, 'id'>) => void;
  obtenerTraspasos: () => TraspasoInfo[];
  obtenerTraspasoPorFecha: (fecha: string) => TraspasoInfo | undefined;

  // Acciones - Historial
  agregarHistorialCambio: (cambio: Omit<HistorialCambio, 'id'>) => void;
  obtenerHistorialComanda: (comandaId: string) => HistorialCambio[];
  obtenerHistorialCompleto: () => HistorialCambio[];

  // Acciones - Estadísticas
  obtenerEstadisticasPeriodo: (
    fechaDesde: string,
    fechaHasta: string
  ) => {
    totalIncoming: number;
    totalOutgoing: number;
    saldoTotal: number;
    promedioComandas: number;
    diasConActividad: number;
  };

  // Acciones - Sistema
  limpiarHistorialAntiguo: (diasAntiguedad: number) => void;
  exportarDatos: (
    fechaDesde: string,
    fechaHasta: string
  ) => Record<string, unknown>;
  reiniciar: () => void;
}

const estadoInicial = {
  registrosDiarios: [],
  traspasos: [],
  historialCambios: [],
  cargando: false,
  error: null,
};

export const useRecordsStore = create<RecordsState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // === REGISTROS DIARIOS ===
        guardarRegistroDiario: (
          registro: Omit<RegistroDiario, 'id' | 'fechaCreacion'>
        ) => {
          const nuevoRegistro: RegistroDiario = {
            ...registro,
            id: `registro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fechaCreacion: new Date().toISOString(),
          };

          set((state) => {
            // Reemplazar si ya existe un registro para la misma fecha
            const registrosActualizados = state.registrosDiarios.filter(
              (r) => r.fecha !== registro.fecha
            );

            return {
              registrosDiarios: [...registrosActualizados, nuevoRegistro].sort(
                (a, b) =>
                  new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              ),
            };
          });

          console.log('📊 [RECORDS] Registro diario guardado:', nuevoRegistro);
        },

        obtenerRegistroPorFecha: (fecha: string) => {
          return get().registrosDiarios.find((r) => r.fecha === fecha);
        },

        obtenerRegistrosRango: (fechaDesde: string, fechaHasta: string) => {
          return get().registrosDiarios.filter(
            (r) => r.fecha >= fechaDesde && r.fecha <= fechaHasta
          );
        },

        // === TRASPASOS ===
        registrarTraspaso: (traspaso: Omit<TraspasoInfo, 'id'>) => {
          const nuevoTraspaso: TraspasoInfo = {
            ...traspaso,
            id: `traspaso-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };

          set((state) => ({
            traspasos: [...state.traspasos, nuevoTraspaso].sort(
              (a, b) =>
                new Date(b.fechaTraspaso).getTime() -
                new Date(a.fechaTraspaso).getTime()
            ),
          }));

          console.log('🚚 [RECORDS] Traspaso registrado:', nuevoTraspaso);
        },

        obtenerTraspasos: () => {
          return get().traspasos;
        },

        obtenerTraspasoPorFecha: (fecha: string) => {
          return get().traspasos.find((t) => t.fechaTraspaso.startsWith(fecha));
        },

        // === HISTORIAL ===
        agregarHistorialCambio: (cambio: Omit<HistorialCambio, 'id'>) => {
          const nuevoCambio: HistorialCambio = {
            ...cambio,
            id: `historial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };

          set((state) => ({
            historialCambios: [...state.historialCambios, nuevoCambio].sort(
              (a, b) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            ),
          }));

          console.log('📝 [RECORDS] Historial agregado:', nuevoCambio);
        },

        obtenerHistorialComanda: (comandaId: string) => {
          return get().historialCambios.filter(
            (h) => h.comandaId === comandaId
          );
        },

        obtenerHistorialCompleto: () => {
          return get().historialCambios;
        },

        // === ESTADÍSTICAS ===
        obtenerEstadisticasPeriodo: (
          fechaDesde: string,
          fechaHasta: string
        ) => {
          const registros = get().obtenerRegistrosRango(fechaDesde, fechaHasta);

          if (registros.length === 0) {
            return {
              totalIncoming: 0,
              totalOutgoing: 0,
              saldoTotal: 0,
              promedioComandas: 0,
              diasConActividad: 0,
            };
          }

          const totalIncoming = registros.reduce(
            (sum, r) => sum + r.totalIncoming,
            0
          );
          const totalOutgoing = registros.reduce(
            (sum, r) => sum + r.totalOutgoing,
            0
          );
          const totalComandas = registros.reduce(
            (sum, r) => sum + r.cantidadComandas,
            0
          );

          return {
            totalIncoming,
            totalOutgoing,
            saldoTotal: totalIncoming - totalOutgoing,
            promedioComandas: Math.round(totalComandas / registros.length),
            diasConActividad: registros.length,
          };
        },

        // === SISTEMA ===
        limpiarHistorialAntiguo: (diasAntiguedad: number) => {
          const fechaLimite = new Date();
          fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
          const fechaLimiteStr = fechaLimite.toISOString();

          set((state) => ({
            historialCambios: state.historialCambios.filter(
              (h) => new Date(h.fecha).getTime() >= fechaLimite.getTime()
            ),
            registrosDiarios: state.registrosDiarios.filter(
              (r) =>
                new Date(r.fechaCreacion).getTime() >= fechaLimite.getTime()
            ),
          }));

          console.log(
            `🧹 [RECORDS] Historial anterior a ${fechaLimiteStr} limpiado`
          );
        },

        exportarDatos: (fechaDesde: string, fechaHasta: string) => {
          const registros = get().obtenerRegistrosRango(fechaDesde, fechaHasta);
          const traspasos = get().traspasos.filter(
            (t) =>
              t.fechaTraspaso >= fechaDesde && t.fechaTraspaso <= fechaHasta
          );
          const statistics = get().obtenerEstadisticasPeriodo(
            fechaDesde,
            fechaHasta
          );

          const exportData = {
            periodo: { fechaDesde, fechaHasta },
            statistics,
            registrosDiarios: registros,
            traspasos,
            fechaExportacion: new Date().toISOString(),
          };

          console.log('📁 [RECORDS] Datos exportados:', exportData);
          return exportData;
        },

        reiniciar: () => {
          set(estadoInicial);
          console.log('🔄 [RECORDS] Store reiniciado');
        },
      }),
      {
        name: 'records-store',
        storage: safeJSONStorage,
      }
    ),
    {
      name: 'RecordsStore',
    }
  )
);

// Hooks especializados
export const useRegistrosDiarios = () => {
  const store = useRecordsStore();
  return {
    registros: store.registrosDiarios,
    guardarRegistro: store.guardarRegistroDiario,
    obtenerPorFecha: store.obtenerRegistroPorFecha,
    obtenerRango: store.obtenerRegistrosRango,
    cargando: store.cargando,
    error: store.error,
  };
};

export const useTraspasos = () => {
  const store = useRecordsStore();
  return {
    traspasos: store.traspasos,
    registrarTraspaso: store.registrarTraspaso,
    obtenerTraspasos: store.obtenerTraspasos,
    obtenerPorFecha: store.obtenerTraspasoPorFecha,
    cargando: store.cargando,
    error: store.error,
  };
};

export const useHistorialAuditoria = () => {
  const store = useRecordsStore();
  return {
    historialCompleto: store.historialCambios,
    agregarCambio: store.agregarHistorialCambio,
    obtenerHistorialComanda: store.obtenerHistorialComanda,
    limpiarAntiguo: store.limpiarHistorialAntiguo,
    cargando: store.cargando,
    error: store.error,
  };
};

export const useEstadisticasRecords = () => {
  const store = useRecordsStore();
  return {
    obtenerEstadisticas: store.obtenerEstadisticasPeriodo,
    exportarDatos: store.exportarDatos,
    cargando: store.cargando,
    error: store.error,
  };
};
