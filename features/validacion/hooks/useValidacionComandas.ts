import { useState, useCallback } from 'react';
import {
  ComandaConValidacion,
  AccionesComanda,
  CambiarEstadoPayload,
  ValidarComandaPayload,
  RespuestaValidacion,
} from '../types';

export function useValidacionComandas() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener usuario actual (mock por ahora)
  const usuarioActual = {
    id: 'user-1',
    nombre: 'Usuario Demo',
    rol: 'admin' as 'admin' | 'vendedor',
  };

  // Determinar acciones disponibles para una comanda
  const obtenerAccionesComanda = useCallback(
    (comanda: ComandaConValidacion): AccionesComanda => {
      const esAdmin = usuarioActual.rol === 'admin';
      const estaValidado = comanda.estadoValidacion === 'validado';

      return {
        puedeEditar: !estaValidado, // No se puede editar si está validado
        puedeEliminar: !estaValidado && esAdmin, // Solo admin puede eliminar si no está validado
        puedeCambiarEstado: !estaValidado, // No se puede cambiar estado si está validado
        puedeValidar: esAdmin && !estaValidado, // Solo admin puede validar si no está validado
        puedeVerHistorial: true, // Todos pueden ver historial
      };
    },
    [usuarioActual.rol]
  );

  // Cambiar estado de comanda (vendedor)
  const cambiarEstadoComanda = useCallback(
    async (payload: CambiarEstadoPayload): Promise<RespuestaValidacion> => {
      setCargando(true);
      setError(null);

      try {
        // Simular validación de negocio
        if (payload.nuevoEstado === 'completado' && !payload.observaciones) {
          return {
            exito: false,
            mensaje: 'Se requieren observaciones para marcar como completo',
            errores: ['Observaciones requeridas'],
          };
        }

        // Simular llamada API
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log('🔄 Cambiar estado comanda:', payload);

        // Simular respuesta exitosa
        return {
          exito: true,
          mensaje: `Estado cambiado a ${payload.nuevoEstado} exitosamente`,
        };
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al cambiar estado';
        setError(mensaje);
        return {
          exito: false,
          mensaje,
          errores: [mensaje],
        };
      } finally {
        setCargando(false);
      }
    },
    []
  );

  // Validar comanda (admin)
  const validarComanda = useCallback(
    async (payload: ValidarComandaPayload): Promise<RespuestaValidacion> => {
      setCargando(true);
      setError(null);

      try {
        if (usuarioActual.rol !== 'admin') {
          throw new Error('Solo los administradores pueden validar comandas');
        }

        // Simular llamada API
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log('✅ Validar comanda:', payload);

        return {
          exito: true,
          mensaje: 'Comanda validada exitosamente',
        };
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al validar comanda';
        setError(mensaje);
        return {
          exito: false,
          mensaje,
          errores: [mensaje],
        };
      } finally {
        setCargando(false);
      }
    },
    [usuarioActual.rol]
  );

  // Obtener comandas que pueden ser traspasadas a Caja 2
  const obtenerComandasParaTraspaso = useCallback(
    (fechaDesde: string, fechaHasta: string): ComandaConValidacion[] => {
      // Mock: obtener comandas validadas en el rango de fechas
      const comandasValidadas: ComandaConValidacion[] = []; // Esto vendría del store

      return comandasValidadas.filter(
        (comanda) =>
          comanda.estadoValidacion === 'validado' &&
          new Date(comanda.fecha).getTime() >= new Date(fechaDesde).getTime() &&
          new Date(comanda.fecha).getTime() <= new Date(fechaHasta).getTime()
      );
    },
    []
  );

  // Realizar traspaso a Caja 2
  const realizarTraspaso = useCallback(
    async (comandaIds: string[], observaciones?: string) => {
      setCargando(true);
      setError(null);

      try {
        if (usuarioActual.rol !== 'admin') {
          throw new Error('Solo los administradores pueden realizar traspasos');
        }

        // Simular llamada API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('📦 Realizar traspaso:', { comandaIds, observaciones });

        return {
          exito: true,
          mensaje: `${comandaIds.length} comandas traspasadas exitosamente a Caja 2`,
        };
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al realizar traspaso';
        setError(mensaje);
        return {
          exito: false,
          mensaje,
          errores: [mensaje],
        };
      } finally {
        setCargando(false);
      }
    },
    [usuarioActual.rol]
  );

  // Función para obtener permisos de una comanda por ID (compatibilidad)
  const obtenerPermisosComanda = useCallback(
    (comandaId: string) => {
      // Mock: obtener comanda por ID y calcular permisos
      const comandaMock: ComandaConValidacion = {
        id: comandaId,
        numero: 'CMD-001',
        fecha: new Date(),
        businessUnit: 'estilismo',
        cliente: { nombre: 'Cliente Test' },
        mainStaff: {
          id: '1',
          nombre: 'Personal Test',
          activo: true,
          unidadesDisponibles: ['estilismo'],
          fechaIngreso: new Date(),
        },
        items: [],
        seña: undefined,
        metodosPago: [],
        subtotal: 0,
        totalDescuentos: 0,
        totalSeña: 0,
        totalFinal: 0,
        observaciones: '',
        tipo: 'ingreso',
        estadoNegocio: 'pendiente',
        estadoValidacion: 'no_validado',
        trazabilidad: {
          creadoPor: 'user-1',
          fechaCreacion: new Date().toISOString(),
        },
        puedeEditar: true,
        puedeValidar: true,
      };

      return obtenerAccionesComanda(comandaMock);
    },
    [obtenerAccionesComanda]
  );

  return {
    // Estado
    cargando,
    error,
    usuarioActual,

    // Funciones
    obtenerAccionesComanda,
    obtenerPermisosComanda,
    cambiarEstadoComanda,
    validarComanda,
    obtenerComandasParaTraspaso,
    realizarTraspaso,

    // Utilidades
    limpiarError: () => setError(null),
  };
}
