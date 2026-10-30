import {
  EstadoPrepagoNew,
  MonedaNew,
  PrepagoGuardadoNew,
} from '@/services/unidadNegocio.service';

/**
 * Seña que se descuenta en una comanda: la activa más vieja de esa moneda.
 * Una comanda consume una sola seña por moneda, así que si la clienta dejó
 * otra para el próximo turno, esa tiene que seguir disponible.
 */
export function señaMasVieja(
  prepagos: PrepagoGuardadoNew[] | undefined,
  moneda: MonedaNew,
): PrepagoGuardadoNew | undefined {
  return (prepagos ?? [])
    .filter((p) => p.moneda === moneda && p.estado === EstadoPrepagoNew.ACTIVA)
    .sort(
      (a, b) =>
        new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime(),
    )[0];
}

/**
 * Seña a mandar al guardar una comanda existente: si ya tenía una de la misma
 * clienta, se conserva (si no, editar la cambiaba por otra seña activa).
 */
export function señaAConsumir(
  prepagos: PrepagoGuardadoNew[] | undefined,
  moneda: MonedaNew,
  actualId?: string | null,
): string | undefined {
  if (actualId && (prepagos ?? []).some((p) => p.id === actualId)) return actualId;
  return señaMasVieja(prepagos, moneda)?.id;
}

/** Monto disponible para descontar: el de la seña que se va a consumir. */
export function montoSeñaDisponible(
  prepagos: PrepagoGuardadoNew[] | undefined,
  moneda: MonedaNew,
): number {
  return Number(señaMasVieja(prepagos, moneda)?.monto ?? 0);
}
