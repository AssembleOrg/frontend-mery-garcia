'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import Spinner from '@/components/common/Spinner';
import ClientOnly from '@/components/common/ClientOnly';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Resumen' },
];

export default function ResumenCajaChicaPage() {
  const { validarComandasRango, obtenerResumenRango } = useComandaStore();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: 'success' | 'info';
    texto: string;
  } | null>(null);

  const handleTrasladar = () => {
    if (!dateRange?.from) return;

    setLoading(true);
    setTimeout(() => {
      const count = validarComandasRango(
        dateRange.from!,
        dateRange.to ?? dateRange.from!
      );
      setMensaje({
        tipo: 'success',
        texto: `Trasladadas ${count} comandas completadas a Caja 2`,
      });
      setLoading(false);
    }, 300); // simulamos espera
  };

  const resumen = dateRange?.from
    ? obtenerResumenRango(dateRange.from, dateRange.to ?? dateRange.from)
    : null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
        <StandardPageBanner title="Resumen Caja 1" />
        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
        <ClientOnly>
          <StandardBreadcrumbs items={breadcrumbItems} />
          <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
              <Card className="border border-[#f9bbc4]/30 bg-white/90">
                <CardHeader>
                  <CardTitle>Seleccionar rango de fechas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    accentColor="#f9bbc4"
                  />
                  {resumen && (
                    <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
                      <div>
                        <p className="text-sm text-[#6b4c57]">Completadas</p>
                        <p className="text-2xl font-bold text-green-700">
                          {resumen.totalCompletados}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6b4c57]">Pendientes</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {resumen.totalPendientes}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6b4c57]">Monto Neto ARS</p>
                        <p className="text-2xl font-bold text-[#4a3540]">
                          {new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: 'ARS',
                          }).format(resumen.montoNeto)}
                        </p>
                      </div>
                    </div>
                  )}
                  <Button
                    disabled={!dateRange?.from || loading}
                    onClick={handleTrasladar}
                    className="bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white"
                  >
                    {loading ? (
                      <Spinner size={4} />
                    ) : (
                      'Trasladar comandas completadas'
                    )}
                  </Button>
                  {mensaje && (
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      {mensaje.tipo === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>{mensaje.texto}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </ClientOnly>
      </div>
    </MainLayout>
  );
}
