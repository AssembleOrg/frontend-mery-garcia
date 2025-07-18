import {
  Comanda,
  EstadoComandaNegocio,
  EstadoValidacion,
  ResumenConMontoParcial,
  ConfiguracionTraspasoParcial,
} from '@/types/caja';
import { logger } from '@/lib/utils';

export class ComandaValidationService {
  static migrarDatosValidacion(comandas: Comanda[]): {
    comandasActualizadas: Comanda[];
    comandasMigradas: number;
  } {
    if (comandas.length === 0) {
      return { comandasActualizadas: comandas, comandasMigradas: 0 };
    }

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
              ? ('completado' as EstadoComandaNegocio)
              : (comanda.estadoNegocio as EstadoComandaNegocio) || 'pendiente',
          estadoValidacion:
            (comanda.estadoValidacion as EstadoValidacion) || 'no_validado',
        };
      }
      return comanda;
    });

    if (comandasMigradas > 0) {
      logger.info(`✅ Migradas ${comandasMigradas} comandas`);
    }

    return { comandasActualizadas, comandasMigradas };
  }

  /**
   * Limpia comandas duplicadas basándose en ID
   */
  static limpiarDuplicados(comandas: Comanda[]): {
    comandasLimpias: Comanda[];
    duplicadosEliminados: number;
  } {
    const comandasMap = new Map<string, Comanda>();
    const duplicadosEncontrados: string[] = [];

    comandas.forEach((comanda) => {
      if (comandasMap.has(comanda.id)) {
        duplicadosEncontrados.push(comanda.id);
      } else {
        comandasMap.set(comanda.id, comanda);
      }
    });

    const comandasLimpias = Array.from(comandasMap.values());

    if (duplicadosEncontrados.length > 0) {
      logger.info(
        `🧹 Limpiadas ${duplicadosEncontrados.length} comandas duplicadas`
      );
    }

    return {
      comandasLimpias,
      duplicadosEliminados: duplicadosEncontrados.length,
    };
  }

  static validarComandasRango(
    comandas: Comanda[],
    fechaDesde: Date,
    fechaHasta: Date
  ): {
    comandasActualizadas: Comanda[];
    idsValidados: string[];
  } {
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
      logger.success(`✅ Validadas ${idsAValidar.length} comandas en rango`);
    }

    return {
      comandasActualizadas,
      idsValidados: idsAValidar,
    };
  }

  /**
   * Calcula resumen de comandas en un rango de fechas
   */
  static obtenerResumenRango(
    comandas: Comanda[],
    fechaDesde: Date,
    fechaHasta: Date
  ): ResumenConMontoParcial {
    // Filtrar comandas en el rango de fechas y que NO estén validadas
    const comandasEnRango = comandas.filter((comanda) => {
      const fechaComanda = new Date(comanda.fecha);
      const enRango = fechaComanda >= fechaDesde && fechaComanda <= fechaHasta;
      const noValidada = comanda.estadoValidacion !== 'validado';
      return enRango && noValidada;
    });

    // Separar por tipo
    const ingresos = comandasEnRango.filter((c) => c.tipo === 'ingreso');
    const egresos = comandasEnRango.filter((c) => c.tipo === 'egreso');

    // Calcular totales
    const totalIngresos = ingresos.reduce((sum, c) => sum + c.totalFinal, 0);
    const totalEgresos = egresos.reduce((sum, c) => sum + c.totalFinal, 0);
    const balanceNeto = totalIngresos - totalEgresos;

    // Separar por estado
    const completados = comandasEnRango.filter(
      (c) => c.estado === 'completado'
    );
    const pendientes = comandasEnRango.filter((c) => c.estado === 'pendiente');

    return {
      totalCompletados: completados.reduce((sum, c) => sum + c.totalFinal, 0),
      totalPendientes: pendientes.reduce((sum, c) => sum + c.totalFinal, 0),
      montoNeto: balanceNeto,
      totalIngresos,
      totalEgresos,
      montoDisponibleParaTraslado: balanceNeto > 0 ? balanceNeto : 0,
    };
  }

  static obtenerResumenConMontoParcial(
    comandas: Comanda[],
    fechaDesde: Date,
    fechaHasta: Date
  ): ResumenConMontoParcial {
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);

    let totalCompletados = 0;
    let totalPendientes = 0;
    let totalIngresos = 0;
    let totalEgresos = 0;

    comandas.forEach((c) => {
      const f = new Date(c.fecha);
      if (f >= desde && f <= hasta && c.estadoValidacion !== 'validado') {
        if (c.estado === 'completado') {
          totalCompletados += 1;
          if (c.tipo === 'ingreso') {
            totalIngresos += c.totalFinal;
          } else {
            totalEgresos += c.totalFinal;
          }
        } else {
          totalPendientes += 1;
        }
      }
    });

    const montoNeto = totalIngresos - totalEgresos;

    return {
      totalCompletados,
      totalPendientes,
      montoNeto,
      totalIngresos,
      totalEgresos,
      montoDisponibleParaTraslado: Math.max(0, montoNeto),
      montoParcialSeleccionado: undefined,
      montoResidual: undefined,
    };
  }

  static calcularConfiguracionTraspasoParcial(
    montoMaximo: number,
    montoParcial: number
  ): ConfiguracionTraspasoParcial {
    const montoValidado = Math.max(0, Math.min(montoParcial, montoMaximo));
    const montoResidual = montoMaximo - montoValidado;
    const porcentajeSeleccionado =
      montoMaximo > 0 ? (montoValidado / montoMaximo) * 100 : 0;

    return {
      montoMaximo,
      montoParcial: montoValidado,
      montoResidual,
      porcentajeSeleccionado,
    };
  }

  static validarComandasParaTraspasoParcial(
    comandas: Comanda[],
    fechaDesde: Date,
    fechaHasta: Date,
    montoParcial: number
  ): {
    comandasActualizadas: Comanda[];
    idsValidados: string[];
    montoTrasladado: number;
    montoResidual: number;
  } {
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);

    // Obtener comandas completadas en el rango
    const comandasCompletadas = comandas.filter((c) => {
      const f = new Date(c.fecha);
      return (
        f >= desde &&
        f <= hasta &&
        c.estado === 'completado' &&
        c.estadoValidacion !== 'validado'
      );
    });

    // Calcular monto total disponible
    let montoTotalDisponible = 0;
    comandasCompletadas.forEach((c) => {
      if (c.tipo === 'ingreso') {
        montoTotalDisponible += c.totalFinal;
      } else {
        montoTotalDisponible -= c.totalFinal;
      }
    });

    // Validar monto parcial
    const montoTrasladado = Math.max(
      0,
      Math.min(montoParcial, montoTotalDisponible)
    );
    const montoResidual = montoTotalDisponible - montoTrasladado;

    // Marcar comandas como validadas
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
      logger.success(
        `✅ Validadas ${idsAValidar.length} comandas para traspaso parcial de ${montoTrasladado}`
      );
    }

    return {
      comandasActualizadas,
      idsValidados: idsAValidar,
      montoTrasladado,
      montoResidual,
    };
  }

  static obtenerComandasValidadas(
    comandas: Comanda[],
    fechaDesde: Date,
    fechaHasta: Date
  ): Comanda[] {
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);

    return comandas.filter((c) => {
      const f = new Date(c.fecha);
      return (
        f >= desde &&
        f <= hasta &&
        c.estado === 'completado' &&
        c.estadoValidacion === 'validado'
      );
    });
  }

  static calcularMontoNetoPorTraslado(
    comandas: Comanda[],
    fechaDesde: Date,
    fechaHasta: Date
  ): {
    montoTotal: number;
    totalIngresos: number;
    totalEgresos: number;
    comandasCompletadas: Comanda[];
  } {
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);

    const comandasCompletadas = comandas.filter((c) => {
      const f = new Date(c.fecha);
      return (
        f >= desde &&
        f <= hasta &&
        c.estado === 'completado' &&
        c.estadoValidacion === 'no_validado' // Solo las no validadas
      );
    });

    let totalIngresos = 0;
    let totalEgresos = 0;

    comandasCompletadas.forEach((c) => {
      if (c.tipo === 'ingreso') {
        totalIngresos += c.totalFinal;
      } else {
        totalEgresos += c.totalFinal;
      }
    });

    const montoTotal = totalIngresos - totalEgresos;

    return {
      montoTotal,
      totalIngresos,
      totalEgresos,
      comandasCompletadas,
    };
  }
}
