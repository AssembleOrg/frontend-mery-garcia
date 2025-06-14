import { useEffect } from 'react';
import { useComandaStore } from '@/stores/comandaStore';
import { Comanda, ItemComanda } from '@/types/caja';
import { personalMock } from '@/data/mockData';

// Datos de ejemplo para inicializar el store
const comandasEjemplo: Comanda[] = [
  {
    id: '1',
    numero: 'ING-001',
    fecha: new Date('2024-01-15'),
    unidadNegocio: 'estilismo',
    cliente: {
      nombre: 'María González',
      telefono: '099-123-456',
    },
    personalPrincipal: personalMock[0], // Ana Pérez
    items: [
      {
        productoServicioId: '1',
        nombre: 'Corte y Peinado',
        tipo: 'servicio',
        cantidad: 1,
        precio: 25.0,
        descuento: 2.5,
        subtotal: 22.5,
        personalId: personalMock[0].id,
      },
      {
        productoServicioId: '3',
        nombre: 'Tratamiento Capilar',
        tipo: 'servicio',
        cantidad: 1,
        precio: 35.0,
        descuento: 0,
        subtotal: 35.0,
        personalId: personalMock[0].id,
      },
    ] as ItemComanda[],
    seña: undefined,
    metodosPago: [
      {
        tipo: 'efectivo',
        monto: 57.5,
        recargoPorcentaje: 0,
        montoFinal: 57.5,
      },
    ],
    subtotal: 57.5,
    totalDescuentos: 2.5,
    totalRecargos: 0,
    totalSeña: 0,
    totalFinal: 57.5,
    comisiones: [
      {
        personalId: personalMock[0].id,
        personalNombre: personalMock[0].nombre,
        itemComandaId: 'item-0',
        montoBase: 22.5,
        porcentaje: personalMock[0].comisionPorcentaje,
        montoComision: 22.5 * (personalMock[0].comisionPorcentaje / 100),
      },
      {
        personalId: personalMock[0].id,
        personalNombre: personalMock[0].nombre,
        itemComandaId: 'item-1',
        montoBase: 35.0,
        porcentaje: personalMock[0].comisionPorcentaje,
        montoComision: 35.0 * (personalMock[0].comisionPorcentaje / 100),
      },
    ],
    estado: 'completado',
    observaciones: 'Cliente frecuente',
    tipo: 'ingreso',
  },
  {
    id: '2',
    numero: 'ING-002',
    fecha: new Date('2024-01-15'),
    unidadNegocio: 'estilismo',
    cliente: {
      nombre: 'Carmen López',
      telefono: '098-765-432',
    },
    personalPrincipal: personalMock[1], // María García
    items: [
      {
        productoServicioId: '4',
        nombre: 'Manicure Francesa',
        tipo: 'servicio',
        cantidad: 1,
        precio: 18.0,
        descuento: 0,
        subtotal: 18.0,
        personalId: personalMock[1].id,
      },
    ] as ItemComanda[],
    seña: undefined,
    metodosPago: [
      {
        tipo: 'tarjeta',
        monto: 18.0,
        recargoPorcentaje: 35,
        montoFinal: 24.3,
      },
    ],
    subtotal: 18.0,
    totalDescuentos: 0,
    totalRecargos: 6.3,
    totalSeña: 0,
    totalFinal: 24.3,
    comisiones: [
      {
        personalId: personalMock[1].id,
        personalNombre: personalMock[1].nombre,
        itemComandaId: 'item-0',
        montoBase: 18.0,
        porcentaje: personalMock[1].comisionPorcentaje,
        montoComision: 18.0 * (personalMock[1].comisionPorcentaje / 100),
      },
    ],
    estado: 'completado',
    observaciones: '',
    tipo: 'ingreso',
  },
  {
    id: '3',
    numero: 'ING-003',
    fecha: new Date('2024-01-15'),
    unidadNegocio: 'estilismo',
    cliente: {
      nombre: 'Ana Rodríguez',
      telefono: '097-111-222',
    },
    personalPrincipal: personalMock[2], // Carmen López
    items: [
      {
        productoServicioId: '2',
        nombre: 'Coloración Completa',
        tipo: 'servicio',
        cantidad: 1,
        precio: 65.0,
        descuento: 5.0,
        subtotal: 60.0,
        personalId: personalMock[2].id,
      },
      {
        productoServicioId: '1',
        nombre: 'Corte y Peinado',
        tipo: 'servicio',
        cantidad: 1,
        precio: 25.0,
        descuento: 0,
        subtotal: 25.0,
        personalId: personalMock[2].id,
      },
      {
        productoServicioId: '3',
        nombre: 'Tratamiento Hidratante',
        tipo: 'servicio',
        cantidad: 1,
        precio: 30.0,
        descuento: 0,
        subtotal: 30.0,
        personalId: personalMock[2].id,
      },
    ] as ItemComanda[],
    seña: {
      monto: 50.0,
      moneda: 'pesos',
      fecha: new Date('2024-01-10'),
      observaciones: 'Seña para reservar turno',
    },
    metodosPago: [
      {
        tipo: 'efectivo',
        monto: 45.0,
        recargoPorcentaje: 0,
        montoFinal: 45.0,
      },
      {
        tipo: 'tarjeta',
        monto: 20.0,
        recargoPorcentaje: 35,
        montoFinal: 27.0,
      },
    ],
    subtotal: 115.0,
    totalDescuentos: 5.0,
    totalRecargos: 7.0,
    totalSeña: 50.0,
    totalFinal: 72.0, // (115 - 5 - 50) + 7 = 67
    comisiones: [
      {
        personalId: personalMock[2].id,
        personalNombre: personalMock[2].nombre,
        itemComandaId: 'item-0',
        montoBase: 60.0,
        porcentaje: personalMock[2].comisionPorcentaje,
        montoComision: 60.0 * (personalMock[2].comisionPorcentaje / 100),
      },
      {
        personalId: personalMock[2].id,
        personalNombre: personalMock[2].nombre,
        itemComandaId: 'item-1',
        montoBase: 25.0,
        porcentaje: personalMock[2].comisionPorcentaje,
        montoComision: 25.0 * (personalMock[2].comisionPorcentaje / 100),
      },
      {
        personalId: personalMock[2].id,
        personalNombre: personalMock[2].nombre,
        itemComandaId: 'item-2',
        montoBase: 30.0,
        porcentaje: personalMock[2].comisionPorcentaje,
        montoComision: 30.0 * (personalMock[2].comisionPorcentaje / 100),
      },
    ],
    estado: 'en_proceso',
    observaciones: 'Pago mixto: efectivo + tarjeta',
    tipo: 'ingreso',
  },
  // Ejemplos de egresos
  {
    id: '4',
    numero: 'EGR-001',
    fecha: new Date('2024-01-15'),
    unidadNegocio: 'estilismo',
    cliente: {
      nombre: 'Proveedor - Productos Capilares SRL',
    },
    personalPrincipal: personalMock[0],
    items: [
      {
        productoServicioId: '5',
        nombre: 'Compra productos capilares',
        tipo: 'producto',
        cantidad: 10,
        precio: 12.0,
        descuento: 0,
        subtotal: 120.0,
      },
    ] as ItemComanda[],
    seña: undefined,
    metodosPago: [
      {
        tipo: 'transferencia',
        monto: 120.0,
        recargoPorcentaje: 0,
        montoFinal: 120.0,
      },
    ],
    subtotal: 120.0,
    totalDescuentos: 0,
    totalRecargos: 0,
    totalSeña: 0,
    totalFinal: 120.0,
    comisiones: [],
    estado: 'completado',
    observaciones: 'Compra mensual de productos',
    tipo: 'egreso',
  },
];

export const useInitializeComandaStore = () => {
  const comandas = useComandaStore((state) => state.comandas);
  const agregarComanda = useComandaStore((state) => state.agregarComanda);

  useEffect(() => {
    // Solo inicializar si no hay comandas ya cargadas
    if (comandas.length === 0) {
      comandasEjemplo.forEach((comanda) => {
        agregarComanda(comanda);
      });
    }
  }, [comandas.length, agregarComanda]);

  return { comandasInicializadas: comandas.length > 0 };
};
