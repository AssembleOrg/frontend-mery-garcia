import { Comanda, EstadoComandaNegocio, EstadoValidacion } from '@/types/caja';
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

  /**
   * Valida comandas en un rango de fechas
   * Cambia estado de 'completado' a 'validado'
   */
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
  ) {
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
  }
}
