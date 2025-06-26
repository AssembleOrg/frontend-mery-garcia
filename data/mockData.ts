// Datos mock para el sistema Mery García
import {
  Personal,
  ProductoServicio,
  UnidadNegocio,
  TipoCambio,
  ConfiguracionRecargo,
} from '@/types/caja';

// Personal del salón
export const personalMock: Personal[] = [
  {
    id: '1',
    nombre: 'Ana Pérez',
    comisionPorcentaje: 15,
    activo: true,
    unidadesDisponibles: ['estilismo', 'tattoo'],
    telefono: '099-111-111',
    fechaIngreso: new Date('2023-01-15'),
  },
  {
    id: '2',
    nombre: 'María García',
    comisionPorcentaje: 20,
    activo: true,
    unidadesDisponibles: ['tattoo', 'formacion'],
    telefono: '099-222-222',
    fechaIngreso: new Date('2022-03-10'),
  },
  {
    id: '3',
    nombre: 'Carmen López',
    comisionPorcentaje: 18,
    activo: true,
    unidadesDisponibles: ['estilismo'],
    telefono: '099-333-333',
    fechaIngreso: new Date('2023-06-20'),
  },
];

// Productos y Servicios por unidad de negocio (PRECIOS EN PESOS ARGENTINOS)
export const productosServiciosMock: ProductoServicio[] = [
  // ESTILISMO
  {
    id: '1',
    nombre: 'Corte y Peinado',
    precio: 25000.0, // $25.000 ARS (≈ $25 USD)
    tipo: 'servicio',
    businessUnit: 'estilismo',
    descripcion: 'Corte según el estilo del cliente',
    activo: true,
    duracion: 45,
  },
  {
    id: '2',
    nombre: 'Coloración Completa',
    precio: 65000.0, // $65.000 ARS (≈ $65 USD)
    tipo: 'servicio',
    businessUnit: 'estilismo',
    descripcion: 'Coloración completa con tinte profesional',
    activo: true,
    duracion: 120,
  },
  {
    id: '3',
    nombre: 'Tratamiento Capilar',
    precio: 35000.0, // $35.000 ARS (≈ $35 USD)
    tipo: 'servicio',
    businessUnit: 'estilismo',
    activo: true,
    duracion: 60,
  },
  {
    id: '4',
    nombre: 'Manicure Francesa',
    precio: 18000.0, // $18.000 ARS (≈ $18 USD)
    tipo: 'servicio',
    businessUnit: 'estilismo',
    activo: true,
    duracion: 45,
  },
  {
    id: '5',
    nombre: 'Champú Premium',
    precio: 12000.0, // $12.000 ARS (≈ $12 USD)
    tipo: 'producto',
    businessUnit: 'estilismo',
    descripcion: 'Champú para cabello teñido',
    activo: true,
    codigoBarras: '7891234567890',
  },

  // TATTOO
  {
    id: '6',
    nombre: 'Microblading Cejas',
    precio: 150000.0, // $150.000 ARS (≈ $150 USD)
    tipo: 'servicio',
    businessUnit: 'tattoo',
    descripcion: 'Técnica de micropigmentación para cejas',
    activo: true,
    duracion: 180,
  },
  {
    id: '7',
    nombre: 'Perfilado de Labios',
    precio: 120000.0, // $120.000 ARS (≈ $120 USD)
    tipo: 'servicio',
    businessUnit: 'tattoo',
    activo: true,
    duracion: 120,
  },
  {
    id: '8',
    nombre: 'Retoque Microblading',
    precio: 80000.0, // $80.000 ARS (≈ $80 USD)
    tipo: 'servicio',
    businessUnit: 'tattoo',
    activo: true,
    duracion: 90,
  },
  {
    id: '9',
    nombre: 'Kit Cuidado Post-Tatuaje',
    precio: 25000.0, // $25.000 ARS (≈ $25 USD)
    tipo: 'producto',
    businessUnit: 'tattoo',
    descripcion: 'Cremas y productos para cuidado posterior',
    activo: true,
  },

  // FORMACIÓN
  {
    id: '10',
    nombre: 'Curso Microblading Básico',
    precio: 500000.0, // $500.000 ARS (≈ $500 USD)
    tipo: 'servicio',
    businessUnit: 'formacion',
    descripcion: 'Curso intensivo de 3 días',
    activo: true,
    duracion: 1440, // 24 horas en minutos
  },
  {
    id: '11',
    nombre: 'Curso Colorimetría',
    precio: 300000.0, // $300.000 ARS (≈ $300 USD)
    tipo: 'servicio',
    businessUnit: 'formacion',
    activo: true,
    duracion: 480, // 8 horas
  },
  {
    id: '12',
    nombre: 'Manual de Técnicas',
    precio: 45000.0, // $45.000 ARS (≈ $45 USD)
    tipo: 'producto',
    businessUnit: 'formacion',
    descripcion: 'Manual impreso con técnicas avanzadas',
    activo: true,
  },
];

// Configuración de recargos por método de pago
export const configuracionRecargosMock: ConfiguracionRecargo[] = [
  {
    metodoPago: 'tarjeta',
    porcentaje: 35, // 35% recargo por tarjeta
    activo: true,
  },
  {
    metodoPago: 'transferencia',
    porcentaje: 20, // 20% recargo por transferencia
    activo: true,
  },
];

// Tipo de cambio (placeholder) - 1 USD = 1000 ARS
export const tipoCambioMock: TipoCambio = {
  valorCompra: 950, // Precio de compra del dólar
  valorVenta: 1000, // Precio de venta del dólar (usado para conversiones)
  fecha: new Date(),
  fuente: 'manual',
};

// Función para obtener personal por unidad de negocio
export const getPersonalPorUnidad = (unidad: UnidadNegocio): Personal[] => {
  return personalMock.filter(
    (p) => p.activo && p.unidadesDisponibles.includes(unidad)
  );
};

// Función para obtener productos/servicios por unidad
export const getProductosServiciosPorUnidad = (
  unidad: UnidadNegocio
): ProductoServicio[] => {
  return productosServiciosMock.filter(
    (ps) => ps.activo && ps.businessUnit === unidad
  );
};

// Función para buscar productos/servicios
export const buscarProductosServicios = (
  termino: string,
  unidad?: UnidadNegocio
): ProductoServicio[] => {
  let productos = productosServiciosMock.filter((ps) => ps.activo);

  if (unidad) {
    productos = productos.filter((ps) => ps.businessUnit === unidad);
  }

  if (termino.trim()) {
    const terminoLower = termino.toLowerCase();
    productos = productos.filter(
      (ps) =>
        ps.nombre.toLowerCase().includes(terminoLower) ||
        ps.descripcion?.toLowerCase().includes(terminoLower)
    );
  }

  return productos;
};
