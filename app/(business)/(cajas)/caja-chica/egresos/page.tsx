'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBanner from '@/components/common/PageBanner';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import FiltrosCaja from '@/components/cajas/FiltrosCaja';
import TablaEncomiendas from '@/components/cajas/TablaEncomiendas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingDown,
  Users,
  ShoppingBag,
  Plus,
} from 'lucide-react';
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
  { label: 'Egresos' },
];

// Configuración de columnas para egresos
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
  {
    key: 'cliente',
    label: 'Proveedor/Concepto',
    visible: true,
    sortable: true,
  },
  {
    key: 'servicios',
    label: 'Detalle',
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
    visible: false,
    sortable: true,
    width: '100px',
  },
  { key: 'iva', label: 'IVA', visible: false, sortable: true, width: '80px' },
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
    key: 'vendedor',
    label: 'Responsable',
    visible: true,
    sortable: true,
    width: '120px',
  },
  {
    key: 'acciones',
    label: 'Acciones',
    visible: true,
    sortable: false,
    width: '120px',
  },
];

export default function EgresosPage() {
  // Inicializar el store
  useInitializeComandaStore();

  // Usar hooks del store
  const { comandas } = useComandas();
  const { filtros, actualizarFiltros } = useFiltrosComanda();
  const { resumen } = useResumenCaja();

  const [columnas, setColumnas] = useState<ColumnaCaja[]>(columnasIniciales);
  const [mostrarModalComanda, setMostrarModalComanda] = useState(false);

  // Filtrar solo egresos
  const egresosData = comandas.filter((comanda) => comanda.tipo === 'egreso');

  // Convertir comandas a formato legacy para compatibilidad con componentes existentes
  const datosEgresosFromStore: Encomienda[] = egresosData.map((comanda) => ({
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

  // Calcular estadísticas desde el store
  const totalEgresos = resumen.totalEgresos;
  const cantidadTransacciones = datosEgresosFromStore.length;
  const proveedoresUnicos = new Set(
    datosEgresosFromStore.map((item) => item.cliente)
  ).size;
  const conceptosMasComunes = datosEgresosFromStore.reduce(
    (acc, item) => {
      item.servicios.forEach((servicio) => {
        acc[servicio.nombre] = (acc[servicio.nombre] || 0) + servicio.cantidad;
      });
      return acc;
    },
    {} as Record<string, number>
  );
  const conceptoTop = Object.entries(conceptosMasComunes).reduce(
    (a, b) => (a[1] > b[1] ? a : b),
    ['Sin datos', 0]
  );

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  const manejarEditar = (id: string) => {
    console.log('Editar egreso:', id);
  };

  const manejarEliminar = (id: string) => {
    console.log('Eliminar egreso:', id);
  };

  const manejarVer = (id: string) => {
    console.log('Ver egreso:', id);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f7a8b8]/15 via-[#e087a3]/12 to-[#d4a7ca]/10">
        <PageBanner
          title="Egresos - Caja Chica"
          imageUrl="/png/imagen2portal.png"
          altText="Banner Egresos"
          heightClass="h-48 md:h-56"
          imagePosition="object-center"
        />

        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f7a8b8]/8" />

        <div className="border-b border-[#f7a8b8]/20 bg-gradient-to-r from-[#f7a8b8]/8 via-[#e087a3]/6 to-[#f7a8b8]/8 backdrop-blur-sm">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="bg-gradient-to-b from-[#f7a8b8]/8 via-[#e087a3]/6 to-[#d4a7ca]/8">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Estadísticas del Día */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card className="border-2 border-[#f7a8b8]/20 bg-gradient-to-br from-white/95 to-[#f7a8b8]/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6b4c57]">
                    Total Egresos
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatearMonto(totalEgresos)}
                  </div>
                  <p className="text-xs text-[#8b6b75]">Gastos del día</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#f7a8b8]/20 bg-gradient-to-br from-white/95 to-[#f7a8b8]/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6b4c57]">
                    Transacciones
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-[#f7a8b8]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#4a3540]">
                    {cantidadTransacciones}
                  </div>
                  <p className="text-xs text-[#8b6b75]">Egresos procesados</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#f7a8b8]/20 bg-gradient-to-br from-white/95 to-[#f7a8b8]/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6b4c57]">
                    Proveedores
                  </CardTitle>
                  <Users className="h-4 w-4 text-[#f7a8b8]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#4a3540]">
                    {proveedoresUnicos}
                  </div>
                  <p className="text-xs text-[#8b6b75]">
                    Diferentes proveedores
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#f7a8b8]/20 bg-gradient-to-br from-white/95 to-[#f7a8b8]/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6b4c57]">
                    Concepto Frecuente
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-[#f7a8b8]" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-[#4a3540]">
                    {conceptoTop[0]}
                  </div>
                  <p className="text-xs text-[#8b6b75]">
                    {conceptoTop[1]} veces
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Header con Nuevo Egreso PROMINENTE */}
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#4a3540]">
                    Gestión de Egresos
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    💰 Tipo de cambio: $1.000 ARS/USD | Montos en pesos
                    argentinos
                  </p>
                </div>
              </div>

              {/* Botón Nuevo Egreso PROMINENTE */}
              <div className="mb-6 flex justify-center">
                <Button
                  onClick={() => setMostrarModalComanda(true)}
                  className="button-glow rounded-xl bg-gradient-to-r from-[#f7a8b8] to-[#e087a3] px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-[#e087a3] hover:to-[#d4a7ca]"
                  size="lg"
                >
                  <Plus className="mr-2 h-6 w-6" />
                  💸 Nuevo Egreso 💸
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
                accentColor="#f7a8b8"
              />
            </div>

            {/* Tabla de Egresos */}
            <TablaEncomiendas
              data={datosEgresosFromStore}
              columnas={columnas}
              onEditar={manejarEditar}
              onEliminar={manejarEliminar}
              onVer={manejarVer}
              titulo="📊 Registro de Egresos"
              accentColor="#f7a8b8"
              tipo="egreso"
            />
          </div>
        </div>
      </div>

      {/* Modal para agregar egreso */}
      <ModalAgregarComanda
        isOpen={mostrarModalComanda}
        onClose={() => setMostrarModalComanda(false)}
      />
    </MainLayout>
  );
}
