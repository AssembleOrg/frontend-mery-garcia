'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBanner from '@/components/common/PageBanner';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import FiltrosCaja from '@/components/cajas/FiltrosCaja';
import TablaEncomiendas from '@/components/cajas/TablaEncomiendas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, ShoppingBag, Plus } from 'lucide-react';
import { Encomienda, ColumnaCaja } from '@/types/caja';
import ModalAgregarComanda from '@/components/cajas/ModalAgregarComanda';
import { useInitializeComandaStore } from '@/hooks/useInitializeComandaStore';
import {
  useComandas,
  useFiltrosComanda,
  useResumenCaja,
} from '@/stores/comandaStore';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja 1 - Caja Chica', href: '/caja-chica' },
  { label: 'Ingresos' },
];

// Datos mock para los ingresos
const datosIngresos: Encomienda[] = [
  {
    id: '1',
    fecha: new Date('2024-01-15'),
    numero: 'ING-001',
    cliente: 'María González',
    telefono: '099-123-456',
    servicios: [
      {
        productoServicioId: '1',
        servicioId: '1', // legacy
        nombre: 'Corte y Peinado',
        tipo: 'servicio',
        categoria: 'corte', // legacy
        cantidad: 1,
        precio: 25.0,
        descuento: 2.5,
        subtotal: 22.5,
      },
      {
        productoServicioId: '2',
        servicioId: '2', // legacy
        nombre: 'Tratamiento Capilar',
        tipo: 'servicio',
        categoria: 'tratamiento', // legacy
        cantidad: 1,
        precio: 35.0,
        descuento: 0,
        subtotal: 35.0,
      },
    ],
    subtotal: 57.5,
    descuentoTotal: 2.5,
    iva: 7.48,
    total: 64.98,
    metodoPago: 'efectivo',
    observaciones: 'Cliente frecuente',
    vendedor: 'Ana Pérez',
    estado: 'completado',
    tipo: 'ingreso',
  },
  {
    id: '2',
    fecha: new Date('2024-01-15'),
    numero: 'ING-002',
    cliente: 'Carmen López',
    telefono: '098-765-432',
    servicios: [
      {
        productoServicioId: '3',
        servicioId: '3', // legacy
        nombre: 'Manicure Francesa',
        tipo: 'servicio',
        categoria: 'manicure', // legacy
        cantidad: 1,
        precio: 18.0,
        descuento: 0,
        subtotal: 18.0,
      },
    ],
    subtotal: 18.0,
    descuentoTotal: 0,
    iva: 2.34,
    total: 20.34,
    metodoPago: 'tarjeta',
    observaciones: '',
    vendedor: 'María García',
    estado: 'completado',
    tipo: 'ingreso',
  },
  {
    id: '3',
    fecha: new Date('2024-01-15'),
    numero: 'ING-003',
    cliente: 'Ana Rodríguez',
    telefono: '097-111-222',
    servicios: [
      {
        productoServicioId: '4',
        servicioId: '4', // legacy
        nombre: 'Coloración Completa',
        tipo: 'servicio',
        categoria: 'color', // legacy
        cantidad: 1,
        precio: 65.0,
        descuento: 5.0,
        subtotal: 60.0,
      },
      {
        productoServicioId: '1',
        servicioId: '1', // legacy
        nombre: 'Corte y Peinado',
        tipo: 'servicio',
        categoria: 'corte', // legacy
        cantidad: 1,
        precio: 25.0,
        descuento: 0,
        subtotal: 25.0,
      },
      {
        productoServicioId: '5',
        servicioId: '5', // legacy
        nombre: 'Tratamiento Hidratante',
        tipo: 'servicio',
        categoria: 'tratamiento', // legacy
        cantidad: 1,
        precio: 30.0,
        descuento: 0,
        subtotal: 30.0,
      },
    ],
    subtotal: 115.0,
    descuentoTotal: 5.0,
    iva: 14.95,
    total: 129.95,
    metodoPago: 'mixto',
    observaciones: 'Pago: $70 efectivo + $59.95 tarjeta',
    vendedor: 'Carmen López',
    estado: 'en_proceso',
    tipo: 'ingreso',
  },
];

// Configuración de columnas
const columnasIniciales: ColumnaCaja[] = [
  {
    key: 'fecha',
    label: 'Fecha',
    visible: true,
    sortable: true,
    width: '120px',
  },
  {
    key: 'numero',
    label: 'Número',
    visible: true,
    sortable: true,
    width: '100px',
  },
  { key: 'cliente', label: 'Cliente', visible: true, sortable: true },
  {
    key: 'servicios',
    label: 'Servicios',
    visible: true,
    sortable: false,
    width: '150px',
  },
  {
    key: 'subtotal',
    label: 'Subtotal',
    visible: true,
    sortable: true,
    width: '100px',
  },
  {
    key: 'descuentoTotal',
    label: 'Descuento',
    visible: true,
    sortable: true,
    width: '100px',
  },
  { key: 'iva', label: 'IVA', visible: true, sortable: true, width: '80px' },
  {
    key: 'total',
    label: 'Total',
    visible: true,
    sortable: true,
    width: '100px',
  },
  {
    key: 'metodoPago',
    label: 'Método Pago',
    visible: true,
    sortable: true,
    width: '120px',
  },
  {
    key: 'estado',
    label: 'Estado',
    visible: true,
    sortable: true,
    width: '100px',
  },
  {
    key: 'vendedor',
    label: 'Vendedor',
    visible: false,
    sortable: true,
    width: '120px',
  },
];

export default function IngresosPage() {
  // Inicializar el store
  useInitializeComandaStore();

  // Usar hooks del store
  const { comandas } = useComandas();
  const { filtros, actualizarFiltros } = useFiltrosComanda();
  const { resumen } = useResumenCaja();

  const [columnas, setColumnas] = useState<ColumnaCaja[]>(columnasIniciales);
  const [mostrarModalComanda, setMostrarModalComanda] = useState(false);

  // Filtrar solo ingresos
  const ingresosData = comandas.filter((comanda) => comanda.tipo === 'ingreso');

  // Convertir comandas a formato legacy para compatibilidad con componentes existentes
  const datosIngresosFromStore: Encomienda[] = ingresosData.map((comanda) => ({
    id: comanda.id,
    fecha: comanda.fecha,
    numero: comanda.numero,
    cliente: comanda.cliente.nombre,
    telefono: comanda.cliente.telefono,
    servicios: comanda.items,
    subtotal: comanda.subtotal,
    descuentoTotal: comanda.totalDescuentos,
    iva: comanda.totalFinal * 0.13, // Cálculo aproximado del IVA
    total: comanda.totalFinal,
    metodoPago:
      comanda.metodosPago.length === 1 ? comanda.metodosPago[0].tipo : 'mixto',
    observaciones: comanda.observaciones || '',
    vendedor: comanda.personalPrincipal.nombre,
    estado: comanda.estado,
    tipo: comanda.tipo,
  }));

  // Usar datos del store o fallback a datos mock
  const datosParaMostrar =
    datosIngresosFromStore.length > 0 ? datosIngresosFromStore : datosIngresos;

  // Calcular estadísticas desde el store
  const totalIngresos = resumen.totalIngresos;
  const cantidadTransacciones = datosParaMostrar.length;
  const cantidadClientes = new Set(datosParaMostrar.map((item) => item.cliente))
    .size;
  const serviciosMasVendidos = datosParaMostrar.reduce(
    (acc, item) => {
      item.servicios.forEach((servicio) => {
        acc[servicio.nombre] = (acc[servicio.nombre] || 0) + servicio.cantidad;
      });
      return acc;
    },
    {} as Record<string, number>
  );
  const servicioTop = Object.entries(serviciosMasVendidos).reduce(
    (a, b) => (a[1] > b[1] ? a : b),
    ['', 0]
  );

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  const manejarEditar = (id: string) => {
    console.log('Editar encomienda:', id);
  };

  const manejarEliminar = (id: string) => {
    console.log('Eliminar encomienda:', id);
  };

  const manejarVer = (id: string) => {
    console.log('Ver encomienda:', id);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
        <PageBanner
          title="Ingresos - Caja Chica"
          imageUrl="/png/imagen2portal.png"
          altText="Banner Ingresos"
          heightClass="h-48 md:h-56"
          imagePosition="object-center"
        />

        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

        <div className="border-b border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/8 via-[#f0b7c8]/6 to-[#f9bbc4]/8 backdrop-blur-sm">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Estadísticas del Día */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6b4c57]">
                    Total Ingresos
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatearMonto(totalIngresos)}
                  </div>
                  <p className="text-xs text-[#8b6b75]">Ventas del día</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6b4c57]">
                    Transacciones
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#f9bbc4]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#4a3540]">
                    {cantidadTransacciones}
                  </div>
                  <p className="text-xs text-[#8b6b75]">
                    Encomiendas procesadas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6b4c57]">
                    Clientes
                  </CardTitle>
                  <Users className="h-4 w-4 text-[#f9bbc4]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#4a3540]">
                    {cantidadClientes}
                  </div>
                  <p className="text-xs text-[#8b6b75]">Personas atendidas</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6b4c57]">
                    Servicio Top
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-[#f9bbc4]" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-[#4a3540]">
                    {servicioTop[0]}
                  </div>
                  <p className="text-xs text-[#8b6b75]">
                    {servicioTop[1]} veces
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Header con Nueva Comanda PROMINENTE */}
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#4a3540]">
                    Gestión de Ingresos
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    💰 Tipo de cambio: $1.000 ARS/USD | Montos en pesos
                    argentinos
                  </p>
                </div>
              </div>

              {/* Botón Nueva Comanda PROMINENTE */}
              <div className="mb-6 flex justify-center">
                <Button
                  onClick={() => setMostrarModalComanda(true)}
                  className="button-glow rounded-xl bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-[#e292a3] hover:to-[#d4a7ca]"
                  size="lg"
                >
                  <Plus className="mr-2 h-6 w-6" />✨ Nueva Comanda ✨
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="mb-8">
              <FiltrosCaja
                filtros={filtros}
                onFiltrosChange={actualizarFiltros}
                columnas={columnas}
                onColumnasChange={setColumnas}
                accentColor="#f9bbc4"
              />
            </div>

            {/* Tabla de Ingresos */}
            <TablaEncomiendas
              data={datosParaMostrar}
              columnas={columnas}
              onEditar={manejarEditar}
              onEliminar={manejarEliminar}
              onVer={manejarVer}
              titulo="📊 Registro de Ingresos"
              accentColor="#f9bbc4"
              tipo="ingreso"
            />
          </div>
        </div>
      </div>

      {/* Modal para agregar comanda */}
      <ModalAgregarComanda
        isOpen={mostrarModalComanda}
        onClose={() => setMostrarModalComanda(false)}
      />
    </MainLayout>
  );
}
