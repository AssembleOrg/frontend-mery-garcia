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
  const { actualizarTipoCambio, tipoCambio } = useDatosReferencia();

  // SIMPLIFICADO: Solo cargar datos informativos de la API una vez
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar cotización pública solo para mostrar (informativa)
      const current = await getCotizacion();
      if (current) {
        setRate(current);
      }

      // Cargar historial
      const h = await getHistorial(10);
      if (h) setHistorial(h);

      // Usar valor del store como valor interno
      setInternalRate(tipoCambio.valorVenta.toString());
    } catch (err) {
      console.error('Error cargando datos informativos:', err);
      // No mostrar error, solo usar valor del store
      setInternalRate(tipoCambio.valorVenta.toString());
    } finally {
      setLoading(false);
    }
  }, [tipoCambio.valorVenta]); // Solo depende del valor del store

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    const valueNum = parseFloat(internalRate);
    if (isNaN(valueNum) || valueNum <= 0) {
      toast.error('Valor inválido. Debe ser un número mayor a 0.');
      return;
    }

    setSaving(true);

    try {
      // 1) Actualizar inmediatamente en el store local
      actualizarTipoCambio({
        valorCompra: rate?.compra ?? valueNum,
        valorVenta: valueNum,
        fecha: new Date(),
        fuente: 'manual',
        modoManual: true,
      });

      // 2) Intentar sincronizar con backend (opcional)
      try {
        await setManualRate({
          compra: rate?.compra,
          venta: valueNum,
        });
        toast.success('Tipo de cambio actualizado correctamente');
      } catch (error) {
        // Si falla el backend, el valor local ya está guardado
        console.warn('Backend no disponible, usando valor local:', error);
        toast.warning('Guardado localmente. Backend no disponible.');
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || 'Error desconocido';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
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
            {/* Cotización pública (solo informativa) */}
            {rate && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SummaryCard
                  title="Compra (informativa)"
                  value={rate.compra}
                  format="currency"
                />
                <SummaryCard
                  title="Venta (informativa)"
                  value={rate.venta ?? rate.compra}
                  format="currency"
                />
              </div>
            )}

            {/* Valor interno actual */}
            <SummaryCard
              title="Valor interno vigente (ARS/USD)"
              value={tipoCambio.valorVenta}
              format="currency"
            />

            {/* Editor de valor interno */}
            <Card className="border border-[#f9bbc4]/30 bg-white/90">
              <CardHeader>
                <CardTitle>Establecer Valor Interno ARS/USD</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={internalRate}
                    onChange={(e) => setInternalRate(e.target.value)}
                    className="max-w-xs"
                    placeholder="Ej: 1200"
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
                  Este valor se usará para todas las conversiones ARS ↔ USD en
                  la aplicación.
                </div>
              </CardContent>
            </Card>

            {/* Historial (solo informativo) */}
            {historial.length > 0 && (
              <Card className="border border-[#f9bbc4]/30 bg-white/90">
                <CardHeader>
                  <CardTitle>Historial de cotizaciones (informativo)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {historial.slice(0, 5).map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {new Date(h.fechaActualizacion).toLocaleString('es-ES')}
                      </span>
                      <span>
                        Compra: {h.compra} | Venta: {h.venta ?? h.compra}
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
