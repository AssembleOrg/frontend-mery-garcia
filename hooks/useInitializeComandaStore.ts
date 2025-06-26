import { useEffect, useRef } from 'react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { Comanda, ItemComanda } from '@/types/caja';
import { personalMock } from '@/data/mockData';
import { logger } from '@/lib/utils';

// Función para generar fechas aleatorias en enero 2025
const generarFechaAleatoria = (dia: number) =>
  new Date(`2025-01-${dia.toString().padStart(2, '0')}`);

// Solo 3 comandas básicas para testing
const comandasEjemplo: Comanda[] = [
  // INGRESO 1 - Estilismo
  {
    id: 'cmd-ingreso-001',
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
        productoServicioId: 'srv-corte-001',
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
    id: 'cmd-ingreso-002',
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
        productoServicioId: 'srv-manicure-001',
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
    id: 'cmd-egreso-001',
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
        productoServicioId: 'prd-champu-001',
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
    id: 'cmd-ingreso-003',
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
        productoServicioId: 'srv-tattoo-001',
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

// Global flag to prevent multiple initializations
let isInitialized = false;
let isInitializing = false; // Prevent race conditions

export function useInitializeComandaStore() {
  const store = useComandaStore();
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations both globally and per component
    if (isInitialized || initRef.current || isInitializing) {
      return;
    }

    // Set initializing flag to prevent race conditions
    isInitializing = true;

    // First, clean any duplicates that might exist from persistence
    store.limpiarDuplicados();

    // Check if sample comandas already exist (by ID)
    const existingIds = store.comandas.map((c) => c.id);
    const sampleIds = comandasEjemplo.map((c) => c.id);
    const hasAllSamples = sampleIds.every((id) => existingIds.includes(id));

    if (!hasAllSamples) {
      logger.info('🚀 Inicializando store con comandas de ejemplo...');

      // Mark as initialized before adding comandas
      isInitialized = true;
      initRef.current = true;

      // Only add comandas that don't exist yet
      comandasEjemplo.forEach((comanda) => {
        if (!existingIds.includes(comanda.id)) {
          store.agregarComanda(comanda);
          logger.info(`✅ Comanda agregada: ${comanda.id}`);
        } else {
          logger.info(`⚠️ Comanda ya existe: ${comanda.id}`);
        }
      });

      logger.info('✅ Store inicializado correctamente');
    } else {
      // If comandas already exist, just mark as initialized
      isInitialized = true;
      initRef.current = true;
      logger.info(
        'ℹ️ Store ya tiene comandas de ejemplo, omitiendo inicialización'
      );
    }

    // Clear initializing flag
    isInitializing = false;
  }, [store]);

  return {
    isInitialized: store.comandas.length > 0,
  };
}
