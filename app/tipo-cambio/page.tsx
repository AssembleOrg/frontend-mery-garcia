'use client';

import { useEffect, useState, useCallback } from 'react';
import { useExchangeRate } from '@/features/exchange-rate/hooks/useExchangeRate';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import SummaryCard from '@/components/common/SummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  getHistorial,
  setManualRate,
  getPublicRate,
  ExchangeRate,
} from '@/services/exchangeRate.service';
import { historialTipoCambioService } from '@/services/historialTipoCambio.service';
import { HistorialTipoCambio } from '@/types/caja';
import Spinner from '@/components/common/Spinner';
import { RefreshCw, History, Trash2 } from 'lucide-react';

const REFRESH_COOLDOWN = 60 * 60 * 1000; // 1 hora
const LAST_REFRESH_KEY = 'last_exchange_rate_refresh';

export default function TipoCambioPage() {
  const [apiRate, setApiRate] = useState<ExchangeRate | null>(null);
  const [historialInterno, setHistorialInterno] = useState<
    HistorialTipoCambio[]
  >([]);

  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(true);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);
  const [showHistorialInterno, setShowHistorialInterno] = useState(false);
  const [loading, setLoading] = useState(true);

  const { tipoCambio, actualizar, cargarTipoCambioInicial } = useExchangeRate();

  const checkRefreshCooldown = useCallback(() => {
    const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
    if (!lastRefresh) {
      setCanRefresh(true);
      setNextRefreshTime(null);
      return;
    }

    const lastRefreshTime = new Date(lastRefresh);
    const now = new Date();
    const timeDiff = now.getTime() - lastRefreshTime.getTime();

    if (timeDiff >= REFRESH_COOLDOWN) {
      setCanRefresh(true);
      setNextRefreshTime(null);
    } else {
      setCanRefresh(false);
      const nextRefresh = new Date(
        lastRefreshTime.getTime() + REFRESH_COOLDOWN
      );
      setNextRefreshTime(nextRefresh);
    }
  }, []);

  const loadApiData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);

      try {
        const [current] = await Promise.all([
          getPublicRate(),
          getHistorial(10),
        ]);

        if (current) {
          setApiRate(current);
          console.log('Valores informativos API cargados:', current);
        }

        if (isManualRefresh) {
          localStorage.setItem(LAST_REFRESH_KEY, new Date().toISOString());
          checkRefreshCooldown();
          toast.success('Valores informativos API actualizados');
        }
      } catch (error) {
        console.error('Error cargando datos informativos API:', error);
        if (isManualRefresh) {
          toast.error('Error al actualizar valores informativos API');
        }
      } finally {
        setRefreshing(false);
      }
    },
    [checkRefreshCooldown]
  );

  const loadHistorialInterno = useCallback(() => {
    const historial = historialTipoCambioService.getHistorial();
    setHistorialInterno(historial);
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await cargarTipoCambioInicial();
        await loadApiData(); // Cargar valores informativos
        loadHistorialInterno();
        checkRefreshCooldown();
      } catch (error) {
        console.error('Error en carga inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [
    cargarTipoCambioInicial,
    loadApiData,
    loadHistorialInterno,
    checkRefreshCooldown,
  ]);

  useEffect(() => {
    setInputValue(tipoCambio.valorVenta.toString());
  }, [tipoCambio.valorVenta]);

  useEffect(() => {
    if (!canRefresh && nextRefreshTime) {
      const interval = setInterval(checkRefreshCooldown, 60000);
      return () => clearInterval(interval);
    }
  }, [canRefresh, nextRefreshTime, checkRefreshCooldown]);

  const handleRefresh = () => {
    if (!canRefresh) {
      const timeLeft = nextRefreshTime
        ? Math.ceil(
            (nextRefreshTime.getTime() - new Date().getTime()) / (1000 * 60)
          )
        : 0;
      toast.warning(
        `Debes esperar ${timeLeft} minutos antes del próximo refresh`
      );
      return;
    }
    loadApiData(true); // ✅ Esto ahora carga valores informativos correctamente
  };

  const handleSave = async () => {
    const valueNum = parseFloat(inputValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      toast.error('Valor inválido. Debe ser un número mayor a 0.');
      return;
    }

    setSaving(true);

    try {
      // Actualizar store local
      actualizar({
        valorCompra: valueNum,
        valorVenta: valueNum,
        fecha: new Date(),
        fuente: 'manual',
        modoManual: true,
      });

      // Guardar en historial interno
      historialTipoCambioService.agregarRegistro({
        valorCompra: valueNum,
        valorVenta: valueNum,
      });
      loadHistorialInterno();

      try {
        await setManualRate({
          venta: valueNum,
        });
        toast.success('Tipo de cambio operativo actualizado correctamente');
      } catch (error) {
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

  const handleClearHistorial = () => {
    historialTipoCambioService.limpiarHistorial();
    loadHistorialInterno();
    toast.success('Historial interno limpiado');
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
            {/* Header con botón de refresh */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#4a3540]">
                Cotizaciones
              </h2>
              <Button
                onClick={handleRefresh}
                disabled={!canRefresh || refreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Actualizando...' : 'Actualizar API'}
              </Button>
            </div>

            {/* Mensaje de cooldown */}
            {!canRefresh && nextRefreshTime && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                Próximo refresh disponible:{' '}
                {nextRefreshTime.toLocaleString('es-ES')}
              </div>
            )}

            {/* 🎯 Valor operativo actual (source of truth) */}
            <SummaryCard
              title="Valor Operativo Vigente (ARS/USD)"
              totalUSD={tipoCambio.valorVenta}
              subtitle="Valor usado para conversiones en la aplicación"
            />

            {/* 🎯 Cotización API (solo informativa) */}
            {apiRate && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SummaryCard
                  title="Compra (API - Informativo)"
                  totalUSD={apiRate.compra}
                  subtitle="Valor de referencia de la API"
                />
                <SummaryCard
                  title="Venta (API - Informativo)"
                  totalUSD={apiRate.venta ?? apiRate.compra}
                  subtitle="Valor de referencia de la API"
                />
              </div>
            )}

            {/* Editor de valor operativo */}
            <Card className="border border-[#f9bbc4]/30 bg-white/90">
              <CardHeader>
                <CardTitle>Establecer Valor Operativo ARS/USD</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
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

            {/* Historial interno */}
            <Card className="border border-[#f9bbc4]/30 bg-white/90">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historial de Cambios Internos
                    {historialInterno.length > 0 && (
                      <span className="text-sm font-normal text-gray-500">
                        ({historialInterno.length} registros)
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        setShowHistorialInterno(!showHistorialInterno)
                      }
                      variant="outline"
                      size="sm"
                    >
                      {showHistorialInterno ? 'Ocultar' : 'Ver Todo'}
                    </Button>
                    {historialInterno.length > 0 && (
                      <Button
                        onClick={handleClearHistorial}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {historialInterno.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    No hay cambios registrados aún
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(showHistorialInterno
                      ? historialInterno
                      : historialInterno.slice(0, 5)
                    ).map((registro) => (
                      <div
                        key={registro.id}
                        className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0"
                      >
                        <span className="text-gray-600">
                          {new Date(registro.fechaCreacion).toLocaleString(
                            'es-ES'
                          )}
                        </span>
                        <span className="font-medium">
                          Valor operativo: $
                          {registro.valorVenta.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {!showHistorialInterno && historialInterno.length > 5 && (
                      <div className="pt-2 text-center text-xs text-gray-500">
                        ... y {historialInterno.length - 5} registros más
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
