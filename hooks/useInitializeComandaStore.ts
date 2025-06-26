import { useEffect, useRef } from 'react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { Comanda, ItemComanda } from '@/types/caja';
import { personalMock } from '@/data/mockData';
import { logger } from '@/lib/utils';

// Función para generar IDs únicos y estables
const generateUniqueId = (prefix: string, index: number) => {
  // Usar una fecha base fija para que los IDs sean consistentes entre servidor y cliente
  const baseTimestamp = new Date('2025-01-01T00:00:00Z').getTime();
  const uniqueId = `${prefix}-${(baseTimestamp + index * 1000).toString(36)}`;
  return uniqueId;
};

// Función para generar fechas aleatorias en enero 2025
const generarFechaAleatoria = (dia: number) =>
  new Date(`2025-01-${dia.toString().padStart(2, '0')}`);

// IDs únicos y estables para las comandas de ejemplo
const COMANDA_IDS = {
  INGRESO_001: generateUniqueId('cmd-ing', 1),
  INGRESO_002: generateUniqueId('cmd-ing', 2),
  INGRESO_003: generateUniqueId('cmd-ing', 3),
  EGRESO_001: generateUniqueId('cmd-egr', 1),
};

// Solo 3 comandas básicas para testing con IDs únicos
const comandasEjemplo: Comanda[] = [
  // INGRESO 1 - Estilismo
  {
    id: COMANDA_IDS.INGRESO_001,
    numero: 'ING-001',
    fecha: generarFechaAleatoria(15),
    businessUnit: 'estilismo',
    cliente: {
      nombre: 'María González',
      telefono: '099-123-456',
    },
    mainStaff: personalMock[0],
    items: [
      {
        productoServicioId: generateUniqueId('srv-corte', 1),
        nombre: 'Corte y Peinado',
        tipo: 'servicio',
        cantidad: 1,
        precio: 25000.0,
        descuento: 0,
        subtotal: 25000.0,
        personalId: personalMock[0].id,
      },
    ] as ItemComanda[],
    seña: undefined,
    metodosPago: [
      {
        tipo: 'efectivo',
        monto: 25000.0,
        recargoPorcentaje: 0,
        montoFinal: 25000.0,
      },
    ],
    subtotal: 25000.0,
    totalDescuentos: 0,
    totalRecargos: 0,
    totalSeña: 0,
    totalFinal: 25000.0,
    comisiones: [],
    estado: 'completado',
    observaciones: '',
    tipo: 'ingreso',
  },

  // INGRESO 2 - Estilismo con tarjeta
  {
    id: COMANDA_IDS.INGRESO_002,
    numero: 'ING-002',
    fecha: generarFechaAleatoria(14),
    businessUnit: 'estilismo',
    cliente: {
      nombre: 'Carmen López',
      telefono: '098-765-432',
    },
    mainStaff: personalMock[1],
    items: [
      {
        productoServicioId: generateUniqueId('srv-manicure', 1),
        nombre: 'Manicure Francesa',
        tipo: 'servicio',
        cantidad: 1,
        precio: 18000.0,
        descuento: 0,
        subtotal: 18000.0,
        personalId: personalMock[1].id,
      },
    ] as ItemComanda[],
    seña: undefined,
    metodosPago: [
      {
        tipo: 'tarjeta',
        monto: 18000.0,
        recargoPorcentaje: 35,
        montoFinal: 24300.0,
      },
    ],
    subtotal: 18000.0,
    totalDescuentos: 0,
    totalRecargos: 6300.0,
    totalSeña: 0,
    totalFinal: 24300.0,
    comisiones: [],
    estado: 'pendiente',
    observaciones: '',
    tipo: 'ingreso',
  },

  // EGRESO 1 - Simple
  {
    id: COMANDA_IDS.EGRESO_001,
    numero: 'EGR-001',
    fecha: generarFechaAleatoria(13),
    businessUnit: 'estilismo',
    cliente: {
      nombre: 'Proveedor ABC',
      telefono: '097-111-222',
    },
    mainStaff: personalMock[0],
    items: [
      {
        productoServicioId: generateUniqueId('prd-champu', 1),
        nombre: 'Champú Premium',
        tipo: 'producto',
        cantidad: 5,
        precio: 12000.0,
        descuento: 0,
        subtotal: 60000.0,
        personalId: personalMock[0].id,
      },
    ] as ItemComanda[],
    seña: undefined,
    metodosPago: [
      {
        tipo: 'efectivo',
        monto: 60000.0,
        recargoPorcentaje: 0,
        montoFinal: 60000.0,
      },
    ],
    subtotal: 60000.0,
    totalDescuentos: 0,
    totalRecargos: 0,
    totalSeña: 0,
    totalFinal: 60000.0,
    comisiones: [],
    estado: 'completado',
    observaciones: 'Compra de productos',
    tipo: 'egreso',
  },

  // INGRESO 3 - Cancelado para testing
  {
    id: COMANDA_IDS.INGRESO_003,
    numero: 'ING-003',
    fecha: generarFechaAleatoria(12),
    businessUnit: 'tattoo',
    cliente: {
      nombre: 'Pedro Martínez',
      telefono: '099-333-444',
    },
    mainStaff: personalMock[2],
    items: [
      {
        productoServicioId: generateUniqueId('srv-tattoo', 1),
        nombre: 'Tatuaje Pequeño',
        tipo: 'servicio',
        cantidad: 1,
        precio: 45000.0,
        descuento: 0,
        subtotal: 45000.0,
        personalId: personalMock[2].id,
      },
    ] as ItemComanda[],
    seña: {
      monto: 15000.0,
      moneda: 'pesos',
      fecha: generarFechaAleatoria(10),
      observaciones: 'Seña para reservar turno',
    },
    metodosPago: [
      {
        tipo: 'efectivo',
        monto: 30000.0,
        recargoPorcentaje: 0,
        montoFinal: 30000.0,
      },
    ],
    subtotal: 45000.0,
    totalDescuentos: 0,
    totalRecargos: 0,
    totalSeña: 15000.0,
    totalFinal: 45000.0,
    comisiones: [],
    estado: 'cancelado',
    observaciones: 'Cliente no se presentó',
    tipo: 'ingreso',
  },
];

// Global flag con timestamp para evitar race conditions
const initializationState = {
  isInitialized: false,
  isInitializing: false,
  timestamp: 0,
};

export function useInitializeComandaStore() {
  const store = useComandaStore();
  const initRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Verificar si el componente sigue montado
    if (!mountedRef.current) return;

    // Prevenir múltiples inicializaciones
    if (
      initializationState.isInitialized ||
      initRef.current ||
      initializationState.isInitializing
    ) {
      return;
    }

    // Marcar como inicializando con timestamp
    initializationState.isInitializing = true;
    initializationState.timestamp = Date.now();

    const currentTimestamp = initializationState.timestamp;

    // Limpiar duplicados primero
    store.limpiarDuplicados();

    // Verificar si ya existen comandas de ejemplo
    const existingIds = store.comandas.map((c) => c.id);
    const sampleIds = Object.values(COMANDA_IDS);
    const hasAllSamples = sampleIds.every((id) => existingIds.includes(id));

    // Verificar si el componente sigue montado y es la misma inicialización
    if (
      !mountedRef.current ||
      currentTimestamp !== initializationState.timestamp
    ) {
      initializationState.isInitializing = false;
      return;
    }

    if (!hasAllSamples) {
      logger.info('🚀 Inicializando store con comandas de ejemplo...');

      // Marcar como inicializado ANTES de agregar comandas
      initializationState.isInitialized = true;
      initRef.current = true;

      // Solo agregar comandas que no existen
      let comandasAgregadas = 0;
      comandasEjemplo.forEach((comanda) => {
        if (!existingIds.includes(comanda.id)) {
          store.agregarComanda(comanda);
          comandasAgregadas++;
          logger.info(`✅ Comanda agregada: ${comanda.id}`);
        } else {
          logger.info(`⚠️ Comanda ya existe: ${comanda.id}`);
        }
      });

      logger.info(
        `✅ Store inicializado correctamente. ${comandasAgregadas} comandas agregadas.`
      );
    } else {
      // Si ya existen, solo marcar como inicializado
      initializationState.isInitialized = true;
      initRef.current = true;
      logger.info(
        'ℹ️ Store ya tiene comandas de ejemplo, omitiendo inicialización'
      );
    }

    // Limpiar flag de inicialización
    initializationState.isInitializing = false;

    // Verificación final de duplicados
    setTimeout(() => {
      if (mountedRef.current) {
        store.limpiarDuplicados();
      }
    }, 100);
  }, [store]);

  return {
    isInitialized: store.comandas.length > 0,
    isInitializing: initializationState.isInitializing,
  };
}
