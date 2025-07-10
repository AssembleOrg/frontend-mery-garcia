'use client';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { TrendingUp, TrendingDown, BarChart3, ArrowRight } from 'lucide-react';
import { useInitializeComandaStore } from '@/hooks/useInitializeComandaStore';
import {
  useResumenCaja,
  useComandaStore,
} from '@/features/comandas/store/comandaStore';
import SummaryCard from '@/components/common/SummaryCard';
import ClientOnly from '@/components/common/ClientOnly';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja 1 - Caja Chica' },
];

// menuOptions se definirá dentro del componente

export default function CajaChicaMenuPage() {
  // Inicializa el store de comandas una única vez
  useInitializeComandaStore();
  // Obtener resumen del store y todas las comandas
  const { resumen } = useResumenCaja();
  const { comandas } = useComandaStore();

  const formatAmount = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  // Calcular servicio más vendido del día
  const today = new Date().toISOString().split('T')[0];
  const ventasPorServicio: Record<
    string,
    { nombre: string; cantidad: number }
  > = {};
  comandas.forEach((c) => {
    if (c.tipo !== 'ingreso') return;
    const fechaObj =
      typeof c.fecha === 'string' ? new Date(c.fecha) : (c.fecha as Date);
    const fechaStr = fechaObj.toISOString().split('T')[0];
    if (fechaStr !== today) return;
    c.items.forEach((item) => {
      if (!ventasPorServicio[item.nombre])
        ventasPorServicio[item.nombre] = { nombre: item.nombre, cantidad: 0 };
      ventasPorServicio[item.nombre].cantidad += item.cantidad;
    });
  });
  const servicioMasVendido = Object.values(ventasPorServicio).sort(
    (a, b) => b.cantidad - a.cantidad
  )[0]?.nombre;

  const cantidadEgresos = comandas.filter((c) => {
    if (c.tipo !== 'egreso') return false;
    const fechaObj =
      typeof c.fecha === 'string' ? new Date(c.fecha) : (c.fecha as Date);
    return fechaObj.toISOString().split('T')[0] === today;
  }).length;

  const resumenDelDia = {
    totalIncoming: resumen.totalIncoming,
    totalOutgoing: resumen.totalOutgoing,
    saldo: resumen.saldo,
    cantidadIngresos: resumen.cantidadComandas,
    cantidadEgresos,
    clientesAtendidos: Math.floor(resumen.cantidadComandas * 0.8),
    servicioMasVendido: servicioMasVendido || 'N/A',
  };

  const menuOptions = [
    {
      title: 'Ingresos',
      description: 'Registra servicios y ventas del salón',
      href: '/caja-chica/ingresos',
      icon: <TrendingUp size={40} strokeWidth={1.5} />,
      gradientFrom: 'from-[#f9bbc4]',
      gradientTo: 'to-[#e292a3]',
      accentColor: '#f9bbc4',
      stats: `${resumenDelDia.cantidadIngresos} encomiendas hoy`,
      amount: resumenDelDia.totalIncoming,
    },
    {
      title: 'Egresos',
      description: 'Control de gastos y salidas de caja',
      href: '/caja-chica/egresos',
      icon: <TrendingDown size={40} strokeWidth={1.5} />,
      gradientFrom: 'from-[#f7a8b8]',
      gradientTo: 'to-[#e087a3]',
      accentColor: '#f7a8b8',
      stats: `${resumenDelDia.cantidadEgresos} movimientos hoy`,
      amount: resumenDelDia.totalOutgoing,
    },
    {
      title: 'Resumen del Día',
      description: 'Estado actual y estadísticas',
      href: '/caja-chica/resumen',
      icon: <BarChart3 size={40} strokeWidth={1.5} />,
      gradientFrom: 'from-[#d4a7ca]',
      gradientTo: 'to-[#b8869e]',
      accentColor: '#d4a7ca',
      stats: `${resumenDelDia.clientesAtendidos} clientes atendidos`,
      amount: resumenDelDia.saldo,
      isBalance: true,
    },
  ];

  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Caja 1 - Caja Chica" />

          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-[#f9bbc4]/30 bg-gradient-to-r from-[#f9bbc4]/10 via-white/80 to-[#f9bbc4]/10 px-8 py-4 shadow-lg backdrop-blur-sm">
                  <span className="bg-gradient-to-r from-[#8b5a6b] to-[#a66b7a] bg-clip-text text-lg font-semibold text-transparent">
                    Gestión de Caja Chica
                  </span>
                </div>
                <p className="mx-auto max-w-2xl text-lg font-medium text-[#6b4c57]">
                  Administra los ingresos, egresos y resumen diario de tu caja
                  chica
                </p>
              </div>

              {/* Resumen Rápido del Día */}
              <ClientOnly>
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                  {/* Saldo Actual */}
                  <SummaryCard
                    title="Saldo Actual"
                    value={resumenDelDia.saldo}
                    format="currency"
                    valueClassName={
                      resumenDelDia.saldo >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  />

                  {/* Clientes Hoy */}
                  <SummaryCard
                    title="Clientes Hoy"
                    value={resumenDelDia.clientesAtendidos}
                    format="number"
                  />

                  {/* Transacciones */}
                  <SummaryCard
                    title="Transacciones"
                    value={
                      resumenDelDia.cantidadIngresos +
                      resumenDelDia.cantidadEgresos
                    }
                    format="number"
                  />

                  <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-[#6b4c57]">
                        Más Vendido
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-[#4a3540]">
                        {resumenDelDia.servicioMasVendido}
                      </div>
                      <p className="text-xs text-[#8b6b75]">Servicio popular</p>
                    </CardContent>
                  </Card>
                </div>
              </ClientOnly>

              {/* Opciones del Menú Principal */}
              <ClientOnly>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  {menuOptions.map((option) => (
                    <Link key={option.title} href={option.href}>
                      <Card
                        className="group h-full cursor-pointer border-2 bg-gradient-to-br from-white/95 via-[#f9bbc4]/5 to-white/90 shadow-xl shadow-[#f9bbc4]/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                        style={{
                          borderColor: `${option.accentColor}80`,
                          boxShadow: `0 8px 30px -6px ${option.accentColor}35, 0 4px 15px -3px rgba(0,0,0,0.15)`,
                        }}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div
                              className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${option.gradientFrom} ${option.gradientTo} p-4 text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                              style={{
                                boxShadow: `0 12px 35px -10px ${option.accentColor}60, 0 6px 20px -5px ${option.accentColor}40`,
                              }}
                            >
                              {option.icon}
                            </div>
                            <ArrowRight
                              className="h-6 w-6 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110"
                              style={{ color: option.accentColor }}
                            />
                          </div>
                          <CardTitle className="text-xl font-bold text-[#4a3540] transition-colors group-hover:text-[#3d2b35]">
                            {option.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="mb-4 text-[#5a4550] transition-colors group-hover:text-[#4a3540]">
                            {option.description}
                          </p>
                          <div className="space-y-2">
                            <div
                              className={`text-2xl font-bold ${option.isBalance && option.amount >= 0 ? 'text-green-600' : option.isBalance && option.amount < 0 ? 'text-red-600' : 'text-[#4a3540]'}`}
                            >
                              {formatAmount(option.amount)}
                            </div>
                            <p className="text-sm text-[#8b6b75]">
                              {option.stats}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </ClientOnly>
            </div>
          </div>
        </div>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
