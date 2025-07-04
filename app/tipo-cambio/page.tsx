'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDatosReferencia } from '@/features/comandas/store/comandaStore';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import SummaryCard from '@/components/common/SummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  getCotizacion,
  getHistorial,
  setManualRate,
  ExchangeRate,
} from '@/services/exchangeRate.service';
import Spinner from '@/components/common/Spinner';

export default function TipoCambioPage() {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [historial, setHistorial] = useState<ExchangeRate[]>([]);
  const [internalRate, setInternalRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtenemos acción para actualizar el tipo de cambio global
  const { actualizarTipoCambio } = useDatosReferencia();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const current = await getCotizacion();
      if (current) {
        setRate(current);
        setInternalRate(current.venta.toString());

        // Sincronizar con el store global
        actualizarTipoCambio({
          valorCompra: current.compra,
          valorVenta: current.venta,
          fecha: new Date(current.fechaActualizacion),
          fuente: 'public',
        });
      }
      const h = await getHistorial(10);
      if (h) setHistorial(h);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo obtener la cotización');
    } finally {
      setLoading(false);
    }
  }, [actualizarTipoCambio]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    const valueNum = parseFloat(internalRate);
    if (isNaN(valueNum) || valueNum <= 0) {
      toast.error('Valor inválido');
      return;
    }

    const actualizar = async () => {
      // 1) Optimistic store update
      actualizarTipoCambio({
        valorCompra: valueNum,
        valorVenta: valueNum,
        fecha: new Date(),
        fuente: 'manual',
      });

      // 2) Persistir en backend
      await setManualRate(valueNum, valueNum);

      // 3) Obtener confirmación y refrescar
      await fetchData();
    };

    setSaving(true);

    await toast.promise(actualizar(), {
      loading: 'Propagando nuevo tipo de cambio...',
      success: 'Tasa actualizada en toda la app',
      error: 'Error al actualizar la tasa',
      dismissible: false,
    });

    setSaving(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-screen items-center justify-center">
          <Spinner size={10} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
        <StandardPageBanner title="Tipo de Cambio" />
        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
        <StandardBreadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tipo de Cambio' },
          ]}
        />
        <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8 py-10">
          <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
            {/* Cotización pública */}
            {rate && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SummaryCard
                  title="Compra (informativa)"
                  value={rate.compra}
                  format="currency"
                />
                <SummaryCard
                  title="Venta (informativa)"
                  value={rate.venta}
                  format="currency"
                />
              </div>
            )}

            {/* Valor interno editable */}
            {rate && (
              <Card className="border border-[#f9bbc4]/30 bg-white/90">
                <CardHeader>
                  <CardTitle>Valor interno ARS/USD</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={internalRate}
                      onChange={(e) => setInternalRate(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white"
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Última actualización:{' '}
                    {new Date(rate.fechaActualizacion).toLocaleString('es-ES')}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historial */}
            {historial.length > 0 && (
              <Card className="border border-[#f9bbc4]/30 bg-white/90">
                <CardHeader>
                  <CardTitle>Historial reciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {historial.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {new Date(h.fechaActualizacion).toLocaleString('es-ES')}
                      </span>
                      <span>
                        Compra: {h.compra} | Venta: {h.venta}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
