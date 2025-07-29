'use client';

import {
  SenaIndependiente,
  CrearSenaData,
  FiltrosSena,
  EstadoSena,
  EstadisticasSenas,
  ResumenSenasPorCliente,
} from '@/types/sena';
import { logger } from '@/lib/utils';

/**
 * mockup api
 *
 */

export class MockSenaApiService {
  private static readonly STORAGE_KEY = 'mock-senas-api'; //cambiar
  private static readonly DELAY_MS = 100; // Simula latencia de red

  private static delay = () =>
    new Promise((resolve) => setTimeout(resolve, this.DELAY_MS));

  // Simula respuesta del servidor
  private static createResponse<T>(
    data: T,
    success: boolean = true
  ): Promise<{
    data: T;
    success: boolean;
    message?: string;
  }> {
    return this.delay().then(() => ({
      data,
      success,
      message: success ? 'Operación exitosa' : 'Error en la operación',
    }));
  }

  // Obtener todas las señas del "servidor" (localStorage)
  private static getSenasFromStorage(): SenaIndependiente[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const senas = JSON.parse(data);
      // Convertir strings de fecha de vuelta a Date objects
      return senas.map((sena: any) => ({
        ...sena,
        fechaCreacion: new Date(sena.fechaCreacion),
        fechaUso: sena.fechaUso ? new Date(sena.fechaUso) : undefined,
        fechaExpiracion: sena.fechaExpiracion
          ? new Date(sena.fechaExpiracion)
          : undefined,
      }));
    } catch (error) {
      logger.error('Error al leer señas del storage:', error);
      return [];
    }
  }

  // Guardar señas en el "servidor" (localStorage)
  private static saveSenasToStorage(senas: SenaIndependiente[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(senas));
    } catch (error) {
      logger.error('Error al guardar señas en storage:', error);
    }
  }

  // === API ENDPOINTS ===

  /**
   * GET /api/senas
   */
  static async getAllSenas(filtros?: FiltrosSena): Promise<{
    data: SenaIndependiente[];
    success: boolean;
    message?: string;
  }> {
    let senas = this.getSenasFromStorage();

    // Aplicar filtros si existen
    if (filtros) {
      senas = senas.filter((sena) => {
        if (filtros.clienteId && sena.clienteId !== filtros.clienteId)
          return false;
        if (filtros.estado && sena.estado !== filtros.estado) return false;
        if (filtros.moneda && sena.moneda !== filtros.moneda) return false;
        if (filtros.fechaDesde && sena.fechaCreacion < filtros.fechaDesde)
          return false;
        if (filtros.fechaHasta && sena.fechaCreacion > filtros.fechaHasta)
          return false;
        return true;
      });
    }

    logger.info(
      `Mock API: Obteniendo ${senas.length} señas con filtros:`,
      filtros
    );
    return this.createResponse(senas);
  }

  /**
   * GET /api/senas/:id
   */
  static async getSenaById(id: string): Promise<{
    data: SenaIndependiente | null;
    success: boolean;
    message?: string;
  }> {
    const senas = this.getSenasFromStorage();
    const sena = senas.find((s) => s.id === id);

    logger.info(
      `Mock API: Obteniendo seña por ID ${id}:`,
      sena ? 'encontrada' : 'no encontrada'
    );
    return this.createResponse(sena || null, !!sena);
  }

  /**
   * POST /api/senas
   */
  static async createSena(data: CrearSenaData): Promise<{
    data: SenaIndependiente;
    success: boolean;
    message?: string;
  }> {
    const senas = this.getSenasFromStorage();

    const nuevaSena: SenaIndependiente = {
      id: `sena-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      fechaCreacion: new Date(),
      estado: 'disponible',
    };

    senas.push(nuevaSena);
    this.saveSenasToStorage(senas);

    logger.info('Mock API: Seña creada exitosamente:', nuevaSena);
    return this.createResponse(nuevaSena);
  }

  /**
   * PUT /api/senas/:id/usar
   */
  static async usarSena(
    senaId: string,
    comandaId: string
  ): Promise<{
    data: SenaIndependiente | null;
    success: boolean;
    message?: string;
  }> {
    const senas = this.getSenasFromStorage();
    const senaIndex = senas.findIndex((s) => s.id === senaId);

    if (senaIndex === -1) {
      logger.error(`Mock API: Seña ${senaId} no encontrada`);
      return this.createResponse(null, false);
    }

    const sena = senas[senaIndex];
    if (sena.estado !== 'disponible') {
      logger.error(
        `Mock API: Seña ${senaId} no está disponible (estado: ${sena.estado})`
      );
      return this.createResponse(null, false);
    }

    // Marcar como usada
    const senaActualizada: SenaIndependiente = {
      ...sena,
      estado: 'usada' as EstadoSena,
      comandaId,
      fechaUso: new Date(),
    };

    senas[senaIndex] = senaActualizada;
    this.saveSenasToStorage(senas);

    logger.info('Mock API: Seña usada exitosamente:', { senaId, comandaId });
    return this.createResponse(senaActualizada);
  }

  /**
   * PUT /api/senas/:id/cancelar
   */
  static async cancelarSena(
    senaId: string,
    motivo?: string
  ): Promise<{
    data: SenaIndependiente | null;
    success: boolean;
    message?: string;
  }> {
    const senas = this.getSenasFromStorage();
    const senaIndex = senas.findIndex((s) => s.id === senaId);

    if (senaIndex === -1) {
      logger.error(`Mock API: Seña ${senaId} no encontrada`);
      return this.createResponse(null, false);
    }

    const sena = senas[senaIndex];
    if (sena.estado !== 'disponible') {
      logger.error(`Mock API: Solo se pueden cancelar señas disponibles`);
      return this.createResponse(null, false);
    }

    // Marcar como cancelada
    const senaActualizada: SenaIndependiente = {
      ...sena,
      estado: 'cancelada' as EstadoSena,
      observaciones: motivo
        ? `${sena.observaciones || ''} - Cancelada: ${motivo}`
        : sena.observaciones,
    };

    senas[senaIndex] = senaActualizada;
    this.saveSenasToStorage(senas);

    logger.info('Mock API: Seña cancelada:', { senaId, motivo });
    return this.createResponse(senaActualizada);
  }

  /**
   * PUT /api/senas/:id
   */
  static async updateSena(
    id: string,
    datos: Partial<SenaIndependiente>
  ): Promise<{
    data: SenaIndependiente | null;
    success: boolean;
    message?: string;
  }> {
    const senas = this.getSenasFromStorage();
    const senaIndex = senas.findIndex((s) => s.id === id);

    if (senaIndex === -1) {
      logger.error(`Mock API: Seña ${id} no encontrada`);
      return this.createResponse(null, false);
    }

    const senaActualizada = { ...senas[senaIndex], ...datos };
    senas[senaIndex] = senaActualizada;
    this.saveSenasToStorage(senas);

    logger.info('Mock API: Seña actualizada:', { id, datos });
    return this.createResponse(senaActualizada);
  }

  /**
   * GET /api/senas/cliente/:clienteId/disponibles
   */
  static async getSenasDisponiblesPorCliente(clienteId: string): Promise<{
    data: SenaIndependiente[];
    success: boolean;
    message?: string;
  }> {
    const senas = this.getSenasFromStorage();
    const senasDisponibles = senas
      .filter(
        (sena) => sena.clienteId === clienteId && sena.estado === 'disponible'
      )
      .sort((a, b) => a.fechaCreacion.getTime() - b.fechaCreacion.getTime()); // FIFO

    logger.info(
      `Mock API: Obteniendo señas disponibles para cliente ${clienteId}:`,
      senasDisponibles.length
    );
    return this.createResponse(senasDisponibles);
  }

  /**
   * GET /api/senas/estadisticas
   */
  static async getEstadisticasGenerales(): Promise<{
    data: EstadisticasSenas;
    success: boolean;
    message?: string;
  }> {
    const senas = this.getSenasFromStorage();

    const estadisticas: EstadisticasSenas = {
      totalSenas: senas.length,
      senasDisponibles: senas.filter((s) => s.estado === 'disponible').length,
      senasUsadas: senas.filter((s) => s.estado === 'usada').length,
      senasExpiradas: senas.filter((s) => s.estado === 'expirada').length,
      montoTotalARS: senas
        .filter((s) => s.moneda === 'ARS')
        .reduce((sum, s) => sum + s.monto, 0),
      montoTotalUSD: senas
        .filter((s) => s.moneda === 'USD')
        .reduce((sum, s) => sum + s.monto, 0),
      montoDisponibleARS: senas
        .filter((s) => s.moneda === 'ARS' && s.estado === 'disponible')
        .reduce((sum, s) => sum + s.monto, 0),
      montoDisponibleUSD: senas
        .filter((s) => s.moneda === 'USD' && s.estado === 'disponible')
        .reduce((sum, s) => sum + s.monto, 0),
    };

    logger.info('Mock API: Estadísticas generales:', estadisticas);
    return this.createResponse(estadisticas);
  }

  /**
   * DELETE /api/senas (solo para testing)
   */
  static async clearAllSenas(): Promise<{
    data: boolean;
    success: boolean;
    message?: string;
  }> {
    localStorage.removeItem(this.STORAGE_KEY);
    logger.info('Mock API: Todas las señas eliminadas');
    return this.createResponse(true);
  }

  /**
   * POST /api/senas/seed (solo para testing)
   */
  static async seedTestData(): Promise<{
    data: SenaIndependiente[];
    success: boolean;
    message?: string;
  }> {
    // Limpiar datos existentes
    await this.clearAllSenas();

    // Primero, necesitamos crear algunos clientes de prueba si no existen
    // (esto normalmente vendría del clienteStore, pero por simplicidad los definimos aquí)

    // Crear señas de prueba
    const senasTest: SenaIndependiente[] = [
      {
        id: 'test-sena-1',
        clienteId: 'test-cliente-maria',
        monto: 50000,
        moneda: 'ARS',
        fechaCreacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
        estado: 'disponible',
        observaciones: 'Seña para tatuaje brazo completo',
      },
      {
        id: 'test-sena-2',
        clienteId: 'test-cliente-maria',
        monto: 200,
        moneda: 'USD',
        fechaCreacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
        estado: 'disponible',
        observaciones: 'Anticipo curso de formación',
      },
      {
        id: 'test-sena-3',
        clienteId: 'test-cliente-juan',
        monto: 25000,
        moneda: 'ARS',
        fechaCreacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
        estado: 'usada',
        comandaId: 'comanda-123',
        fechaUso: new Date(),
        observaciones: 'Seña para corte y peinado',
      },
      {
        id: 'test-sena-4',
        clienteId: 'test-cliente-ana',
        monto: 15000,
        moneda: 'ARS',
        fechaCreacion: new Date(),
        estado: 'disponible',
        observaciones: 'Anticipo para sesión estilismo',
      },
      {
        id: 'test-sena-5',
        clienteId: 'test-cliente-ana',
        monto: 100,
        moneda: 'USD',
        fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
        estado: 'disponible',
        observaciones: 'Seña para curso estilismo avanzado',
      },
    ];

    this.saveSenasToStorage(senasTest);
    logger.info(
      'Mock API: Datos de prueba cargados:',
      senasTest.length,
      'señas'
    );
    return this.createResponse(senasTest);
  }
}
