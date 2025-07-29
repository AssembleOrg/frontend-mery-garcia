'use client';

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/lib/utils';
import { MockSenaApiService } from '@/services/mockSenaApi';
import {
  SenaIndependiente,
  CrearSenaData,
  FiltrosSena,
  EstadoSena,
  ResumenSenasPorCliente,
  EstadisticasSenas,
} from '@/types/sena';

interface SenaState {
  // Estado
  senas: SenaIndependiente[];
  cargando: boolean;
  error: string | null;

  // CRUD Operations
  crearSena: (data: CrearSenaData) => Promise<string>;
  obtenerSenas: (filtros?: FiltrosSena) => Promise<SenaIndependiente[]>;
  obtenerSenaPorId: (id: string) => SenaIndependiente | undefined;
  usarSena: (senaId: string, comandaId: string) => Promise<boolean>;
  cancelarSena: (senaId: string, motivo?: string) => boolean;
  actualizarSena: (id: string, datos: Partial<SenaIndependiente>) => boolean;

  // Consultas específicas
  obtenerSenasDisponiblesPorCliente: (clienteId: string) => Promise<SenaIndependiente[]>;
  obtenerResumenPorCliente: (clienteId: string) => ResumenSenasPorCliente | null;
  obtenerEstadisticasGenerales: () => EstadisticasSenas;
  
  // Validaciones
  validarSenaDisponible: (senaId: string) => boolean;
  calcularMontoDisponible: (clienteId: string, moneda: 'USD' | 'ARS') => number;

  // Sistema
  limpiarError: () => void;
  reiniciar: () => void;
  
  // Testing utilities
  cargarDatosPrueba: () => Promise<void>;
  limpiarDatos: () => Promise<void>;
}

const estadoInicial = {
  senas: [],
  cargando: false,
  error: null,
};

export const useSenaStore = create<SenaState>()(
  persist(
    devtools(
      (set, get) => ({
      ...estadoInicial,

      // === CRUD OPERATIONS ===
      crearSena: async (data: CrearSenaData) => {
        set({ cargando: true, error: null });
        
        try {
          const response = await MockSenaApiService.createSena(data);
          
          if (response.success) {
            set((state) => ({
              senas: [...state.senas, response.data],
              cargando: false,
              error: null,
            }));
            return response.data.id;
          } else {
            set({ error: response.message || 'Error al crear seña', cargando: false });
            return '';
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMsg, cargando: false });
          logger.error('Error al crear seña:', error);
          return '';
        }
      },

      obtenerSenas: async (filtros?: FiltrosSena) => {
        set({ cargando: true, error: null });
        
        try {
          const response = await MockSenaApiService.getAllSenas(filtros);
          
          if (response.success) {
            set({
              senas: response.data,
              cargando: false,
              error: null,
            });
            return response.data;
          } else {
            set({ error: response.message || 'Error al obtener señas', cargando: false });
            return [];
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMsg, cargando: false });
          logger.error('Error al obtener señas:', error);
          return [];
        }
      },

      obtenerSenaPorId: (id: string) => {
        const { senas } = get();
        return senas.find((sena) => sena.id === id);
      },

      usarSena: async (senaId: string, comandaId: string) => {
        set({ cargando: true, error: null });
        
        try {
          const response = await MockSenaApiService.usarSena(senaId, comandaId);
          
          if (response.success && response.data) {
            set((state) => ({
              senas: state.senas.map((s) =>
                s.id === senaId ? response.data! : s
              ),
              cargando: false,
              error: null,
            }));
            return true;
          } else {
            set({ error: response.message || 'Error al usar seña', cargando: false });
            return false;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMsg, cargando: false });
          logger.error('Error al usar seña:', error);
          return false;
        }
      },

      cancelarSena: (senaId: string, motivo?: string) => {
        const { senas } = get();
        const sena = senas.find((s) => s.id === senaId);

        if (!sena || sena.estado !== 'disponible') {
          set({ error: 'Solo se pueden cancelar señas disponibles' });
          return false;
        }

        set((state) => ({
          senas: state.senas.map((s) =>
            s.id === senaId
              ? {
                  ...s,
                  estado: 'cancelada' as EstadoSena,
                  observaciones: motivo ? `${s.observaciones || ''} - Cancelada: ${motivo}` : s.observaciones,
                }
              : s
          ),
          error: null,
        }));

        logger.info('Seña cancelada:', { senaId, motivo });
        return true;
      },

      actualizarSena: (id: string, datos: Partial<SenaIndependiente>) => {
        const { senas } = get();
        const sena = senas.find((s) => s.id === id);

        if (!sena) {
          set({ error: 'Seña no encontrada' });
          return false;
        }

        set((state) => ({
          senas: state.senas.map((s) =>
            s.id === id ? { ...s, ...datos } : s
          ),
          error: null,
        }));

        logger.info('Seña actualizada:', { id, datos });
        return true;
      },

      // === CONSULTAS ESPECÍFICAS ===
      obtenerSenasDisponiblesPorCliente: async (clienteId: string) => {
        try {
          const response = await MockSenaApiService.getSenasDisponiblesPorCliente(clienteId);
          
          if (response.success) {
            return response.data;
          } else {
            set({ error: response.message || 'Error al obtener señas del cliente' });
            return [];
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMsg });
          logger.error('Error al obtener señas del cliente:', error);
          return [];
        }
      },

      obtenerResumenPorCliente: (clienteId: string) => {
        const { senas } = get();
        const senasCliente = senas.filter((sena) => sena.clienteId === clienteId);
        const senasDisponibles = senasCliente.filter((sena) => sena.estado === 'disponible');

        if (senasCliente.length === 0) return null;

        return {
          clienteId,
          clienteNombre: '', // Se llenará desde el componente
          senasDisponibles,
          totalARS: senasDisponibles.filter((s) => s.moneda === 'ARS').reduce((sum, s) => sum + s.monto, 0),
          totalUSD: senasDisponibles.filter((s) => s.moneda === 'USD').reduce((sum, s) => sum + s.monto, 0),
          cantidadSenas: senasDisponibles.length,
        };
      },

      obtenerEstadisticasGenerales: () => {
        const { senas } = get();
        
        return {
          totalSenas: senas.length,
          senasDisponibles: senas.filter((s) => s.estado === 'disponible').length,
          senasUsadas: senas.filter((s) => s.estado === 'usada').length,
          senasExpiradas: senas.filter((s) => s.estado === 'expirada').length,
          montoTotalARS: senas.filter((s) => s.moneda === 'ARS').reduce((sum, s) => sum + s.monto, 0),
          montoTotalUSD: senas.filter((s) => s.moneda === 'USD').reduce((sum, s) => sum + s.monto, 0),
          montoDisponibleARS: senas.filter((s) => s.moneda === 'ARS' && s.estado === 'disponible').reduce((sum, s) => sum + s.monto, 0),
          montoDisponibleUSD: senas.filter((s) => s.moneda === 'USD' && s.estado === 'disponible').reduce((sum, s) => sum + s.monto, 0),
        };
      },

      // === VALIDACIONES ===
      validarSenaDisponible: (senaId: string) => {
        const { senas } = get();
        const sena = senas.find((s) => s.id === senaId);
        return sena?.estado === 'disponible';
      },

      calcularMontoDisponible: (clienteId: string, moneda: 'USD' | 'ARS') => {
        const { senas } = get();
        return senas
          .filter((sena) => 
            sena.clienteId === clienteId && 
            sena.estado === 'disponible' && 
            sena.moneda === moneda
          )
          .reduce((sum, sena) => sum + sena.monto, 0);
      },

      // === SISTEMA ===
      limpiarError: () => {
        set({ error: null });
      },

      reiniciar: () => {
        set(estadoInicial);
        logger.info('Seña store reiniciado');
      },

      // === TESTING UTILITIES ===
      cargarDatosPrueba: async () => {
        set({ cargando: true, error: null });
        
        try {
          const response = await MockSenaApiService.seedTestData();
          
          if (response.success) {
            set({
              senas: response.data,
              cargando: false,
              error: null,
            });
            logger.info('Datos de prueba cargados exitosamente');
          } else {
            set({ error: response.message || 'Error al cargar datos de prueba', cargando: false });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMsg, cargando: false });
          logger.error('Error al cargar datos de prueba:', error);
        }
      },

      limpiarDatos: async () => {
        set({ cargando: true, error: null });
        
        try {
          const response = await MockSenaApiService.clearAllSenas();
          
          if (response.success) {
            set({
              senas: [],
              cargando: false,
              error: null,
            });
            logger.info('Datos limpiados exitosamente');
          } else {
            set({ error: response.message || 'Error al limpiar datos', cargando: false });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMsg, cargando: false });
          logger.error('Error al limpiar datos:', error);
        }
      },
      }),
      {
        name: 'sena-store',
      }
    ),
    {
      name: 'sena-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);