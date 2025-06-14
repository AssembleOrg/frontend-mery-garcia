'use client';
import MainLayout from '@/components/layout/MainLayout';
import PageBanner from '@/components/common/PageBanner';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import DashboardCard from '@/components/dashboard/DashboardCard';
import {
  CreditCard,
  BarChart3,
  Users2,
  DollarSign,
  ListOrdered,
  Cog,
} from 'lucide-react';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard' },
];

const menuItems = [
  {
    title: 'Caja 1',
    description: 'Registra servicios, gestiona ingresos y egresos diarios.',
    href: '/caja-chica',
    icon: <CreditCard size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#f9bbc4]',
    gradientTo: 'to-[#e292a3]',
    accentColor: '#f9bbc4',
  },
  {
    title: 'Caja 2',
    description: 'Administra la caja central y movimientos financieros.',
    href: '/caja-grande',
    icon: <BarChart3 size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#f7a8b8]',
    gradientTo: 'to-[#e087a3]',
    accentColor: '#f7a8b8',
  },
  {
    title: 'Tipo de Cambio',
    description: 'Actualiza y consulta el valor del dólar.',
    href: '/tipo-cambio',
    icon: <DollarSign size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#d4a7ca]',
    gradientTo: 'to-[#b8869e]',
    accentColor: '#d4a7ca',
  },
  {
    title: 'Personal',
    description: 'Gestiona tu equipo y calcula comisiones.',
    href: '/personal',
    icon: <Users2 size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#f0b7c8]',
    gradientTo: 'to-[#d691a8]',
    accentColor: '#f0b7c8',
  },
  {
    title: 'Lista de Precios',
    description: 'Define y actualiza tus servicios y productos.',
    href: '/precio-lista',
    icon: <ListOrdered size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#e8b4c6]',
    gradientTo: 'to-[#cc8fa8]',
    accentColor: '#e8b4c6',
  },
  {
    title: 'Configuración',
    description: 'Ajustes generales y personalización.',
    href: '/configuracion',
    icon: <Cog size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#deb2c4]',
    gradientTo: 'to-[#c48ba6]',
    accentColor: '#deb2c4',
  },
];

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
        <PageBanner
          title="Portal de Gestión"
          imageUrl="/png/imagen2portal.png"
          altText="Banner principal del portal Mery García"
          heightClass="h-72 md:h-80 lg:h-96"
          imagePosition="object-[90%_10%] lg:object-[85%_15%]"
        />

        <div className="relative -mt-16 h-16 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

        <div className="border-b border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/8 via-[#f0b7c8]/6 to-[#f9bbc4]/8 backdrop-blur-sm">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-[#f9bbc4]/30 bg-gradient-to-r from-[#f9bbc4]/10 via-white/80 to-[#f9bbc4]/10 px-8 py-4 shadow-lg backdrop-blur-sm">
                <span className="bg-gradient-to-r from-[#8b5a6b] to-[#a66b7a] bg-clip-text text-lg font-semibold text-transparent">
                  Dashboard Portal de Gestión
                </span>
              </div>
              <p className="mx-auto max-w-2xl text-lg font-medium text-[#6b4c57]">
                Administra tu negocio de manera eficiente con nuestras
                herramientas integradas
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems.map((item) => (
                <DashboardCard
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  href={item.href}
                  icon={item.icon}
                  gradientFrom={item.gradientFrom}
                  gradientTo={item.gradientTo}
                  accentColor={item.accentColor}
                />
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#10b981]/30 bg-gradient-to-r from-emerald-50/90 via-green-50/80 to-emerald-50/90 px-6 py-3 shadow-lg backdrop-blur-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-emerald-800">
                  Sistema actualizado y funcionando correctamente
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
