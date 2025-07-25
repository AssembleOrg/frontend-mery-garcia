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
      // Campos separados por moneda (valores por defecto para compatibilidad)
      totalIngresosUSD: totalIngresos,
      totalEgresosUSD: totalEgresos,
      totalIngresosARS: 0,
      totalEgresosARS: 0,
      montoNetoUSD: balanceNeto,
      montoNetoARS: 0,
      montoDisponibleTrasladoUSD: balanceNeto > 0 ? balanceNeto : 0,
      montoDisponibleTrasladoARS: 0,
      montoParcialSeleccionado: undefined,
      montoParcialSeleccionadoUSD: undefined,
      montoParcialSeleccionadoARS: undefined,
      montoResidual: undefined,
      montoResidualUSD: undefined,
      montoResidualARS: undefined,
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
    let totalIngresosUSD = 0;
    let totalEgresosUSD = 0;
    let totalIngresosARS = 0;
    let totalEgresosARS = 0;

    comandas.forEach((c) => {
      const f = new Date(c.fecha);
      if (f >= desde && f <= hasta && c.estadoValidacion !== 'validado') {
        if (c.estado === 'completado') {
          totalCompletados += 1;

          // Calcular montos por moneda basado en métodos de pago
          if (c.metodosPago && c.metodosPago.length > 0) {
            c.metodosPago.forEach((metodo) => {
              const moneda = metodo.moneda || 'USD';
              
              // SOLUCIÓN DEFINITIVA: Aplicar misma lógica restrictiva que useTransactions
              let montoNativo = metodo.monto;
              const isLegacyUSDData = moneda === 'ARS' && metodo.monto > 0 && metodo.monto < 100;
              
              if (isLegacyUSDData) {
                // Migrar datos antiguos (USD almacenado como ARS) usando mismo tipo de cambio que useTransactions
                montoNativo = metodo.monto * 2640; // Usar tipo de cambio fijo para consistencia
              }
              
              if (c.tipo === 'ingreso') {
                if (moneda === 'USD') {
                  totalIngresosUSD += montoNativo;
                } else {
                  totalIngresosARS += montoNativo;
                }
              } else {
                if (moneda === 'USD') {
                  totalEgresosUSD += montoNativo;
                } else {
                  totalEgresosARS += montoNativo;
                }
              }
            });
          } else {
            // Fallback: asumir USD si no hay métodos de pago definidos
            if (c.tipo === 'ingreso') {
              totalIngresosUSD += c.totalFinal;
            } else {
              totalEgresosUSD += c.totalFinal;
            }
          }
        } else {
          totalPendientes += 1;
        }
      }
    });

    const montoNetoUSD = totalIngresosUSD - totalEgresosUSD;
    const montoNetoARS = totalIngresosARS - totalEgresosARS;
    const montoDisponibleTrasladoUSD = montoNetoUSD > 0 ? montoNetoUSD : 0;
    const montoDisponibleTrasladoARS = montoNetoARS > 0 ? montoNetoARS : 0;

    return {
      totalCompletados,
      totalPendientes,
      montoNeto: montoNetoUSD, // Para compatibilidad
      totalIngresos: totalIngresosUSD, // Para compatibilidad
      totalEgresos: totalEgresosUSD, // Para compatibilidad
      // Campos separados por moneda
      totalIngresosUSD,
      totalEgresosUSD,
      totalIngresosARS,
      totalEgresosARS,
      montoNetoUSD,
      montoNetoARS,
      montoDisponibleParaTraslado:
        montoDisponibleTrasladoUSD + montoDisponibleTrasladoARS,
      montoDisponibleTrasladoUSD,
      montoDisponibleTrasladoARS,
      montoParcialSeleccionado: undefined,
      montoParcialSeleccionadoUSD: undefined,
      montoParcialSeleccionadoARS: undefined,
      montoResidual: undefined,
      montoResidualUSD: undefined,
      montoResidualARS: undefined,
    };
  }

  static calcularConfiguracionTraspasoParcial(
    resumen: ResumenConMontoParcial,
    montoUSD: number,
    montoARS: number
  ): ConfiguracionTraspasoParcial {
    const montoDisponibleUSD = resumen.montoDisponibleTrasladoUSD || 0;
    const montoDisponibleARS = resumen.montoDisponibleTrasladoARS || 0;

    const montoValidadoUSD = Math.min(montoUSD, montoDisponibleUSD);
    const montoValidadoARS = Math.min(montoARS, montoDisponibleARS);

    const montoResidualUSD = montoDisponibleUSD - montoValidadoUSD;
    const montoResidualARS = montoDisponibleARS - montoValidadoARS;

    const porcentajeSeleccionadoUSD =
      montoDisponibleUSD > 0
        ? (montoValidadoUSD / montoDisponibleUSD) * 100
        : 0;
    const porcentajeSeleccionadoARS =
      montoDisponibleARS > 0
        ? (montoValidadoARS / montoDisponibleARS) * 100
        : 0;

    return {
      montoMaximo: montoDisponibleUSD + montoDisponibleARS,
      montoParcial: montoValidadoUSD + montoValidadoARS,
      montoResidual: montoResidualUSD + montoResidualARS,
      porcentajeSeleccionado:
        (porcentajeSeleccionadoUSD + porcentajeSeleccionadoARS) / 2,
      montoMaximoUSD: montoDisponibleUSD,
      montoMaximoARS: montoDisponibleARS,
      montoParcialUSD: montoValidadoUSD,
      montoParcialARS: montoValidadoARS,
      montoResidualUSD,
      montoResidualARS,
      porcentajeSeleccionadoUSD,
      porcentajeSeleccionadoARS,
    };
  }

  static validarComandasParaTraspasoParcial(
    comandas: Comanda[],
    fechaDesde: Date,
    fechaHasta: Date,
    montoParcialUSD: number,
    montoParcialARS: number
  ): {
    comandasActualizadas: Comanda[];
    idsValidados: string[];
    montoTrasladadoUSD: number;
    montoTrasladadoARS: number;
    montoResidualUSD: number;
    montoResidualARS: number;
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

    // Calcular montos totales disponibles por moneda
    let montoTotalDisponibleUSD = 0;
    let montoTotalDisponibleARS = 0;

    comandasCompletadas.forEach((c) => {
      if (c.metodosPago && c.metodosPago.length > 0) {
        c.metodosPago.forEach((metodo) => {
          const moneda = metodo.moneda || 'USD';
          if (c.tipo === 'ingreso') {
            if (moneda === 'USD') {
              montoTotalDisponibleUSD += metodo.monto;
            } else {
              montoTotalDisponibleARS += metodo.monto;
            }
          } else {
            if (moneda === 'USD') {
              montoTotalDisponibleUSD -= metodo.monto;
            } else {
              montoTotalDisponibleARS -= metodo.monto;
            }
          }
        });
      } else {
        // Fallback: asumir USD si no hay métodos de pago definidos
        if (c.tipo === 'ingreso') {
          montoTotalDisponibleUSD += c.totalFinal;
        } else {
          montoTotalDisponibleUSD -= c.totalFinal;
        }
      }
    });

    // Validar montos parciales por moneda
    const montoTrasladadoUSD = Math.min(
      montoParcialUSD,
      montoTotalDisponibleUSD
    );
    const montoTrasladadoARS = Math.min(
      montoParcialARS,
      montoTotalDisponibleARS
    );
    const montoResidualUSD = montoTotalDisponibleUSD - montoTrasladadoUSD;
    const montoResidualARS = montoTotalDisponibleARS - montoTrasladadoARS;

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
        `✅ Validadas ${idsAValidar.length} comandas para traspaso parcial de USD ${montoTrasladadoUSD.toFixed(2)}, ARS ${montoTrasladadoARS.toFixed(2)}`
      );
    }

    return {
      comandasActualizadas,
      idsValidados: idsAValidar,
      montoTrasladadoUSD,
      montoTrasladadoARS,
      montoResidualUSD,
      montoResidualARS,
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
