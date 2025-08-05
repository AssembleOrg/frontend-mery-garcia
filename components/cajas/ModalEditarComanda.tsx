'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Save,
  Edit,
} from 'lucide-react';
import useComandaStore from '@/features/comandas/store/comandaStore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { toast } from 'sonner';
import { ComandaNew, EstadoDeComandaNew } from '@/services/unidadNegocio.service';
import EditarComandaForm from './EditarComandaForm';
import EditarComandaResumen from './EditarComandaResumen';

interface ModalEditarComandaProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
}

export default function ModalEditarComanda({
  isOpen,
  onClose,
  comandaId,
}: ModalEditarComandaProps) {
  const { obtenerComandaPorId, actualizarComanda, cargando } = useComandaStore();
  const { handleError } = useErrorHandler();
  const { user } = useAuth();
  const { formatDual, isExchangeRateValid } = useCurrencyConverter();
  const { lastDolar } = useExchangeRateStore();

  // Estados
  const [comanda, setComanda] = useState<ComandaNew | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar datos de la comanda al abrir el modal
  useEffect(() => {
    if (isOpen && comandaId) {
      cargarComanda();
    }
  }, [isOpen, comandaId]);

  const cargarComanda = async () => {
    try {
      const comandaData = await obtenerComandaPorId(comandaId);
      setComanda(comandaData);
    } catch (error) {
      handleError(error, 'cargar comanda');
      onClose();
    }
  };

  const handleSave = async () => {
    if (!comanda || !user) return;

    setGuardando(true);
    try {
      // Preparar datos para actualizar
      const comandaUpdate = {
        clienteId: comanda.cliente?.id,
        observaciones: comanda.observaciones,
        items: comanda.items.map(item => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          descuento: item.descuento,
          subtotal: item.subtotal,
          trabajadorId: item.trabajadorId,
        })),
        metodosPago: comanda.metodosPago.map(metodo => ({
          id: metodo.id,
          tipo: metodo.tipo,
          monto: metodo.monto,
          montoFinal: metodo.montoFinal,
          moneda: metodo.moneda,
          descuentoGlobalPorcentaje: metodo.descuentoGlobalPorcentaje,
          recargoPorcentaje: metodo.recargoPorcentaje,
        })),
      };

      await actualizarComanda(comanda.id, comandaUpdate);
      toast.success('Comanda actualizada exitosamente');
      onClose();
    } catch (error) {
      handleError(error, 'actualizar comanda');
    } finally {
      setGuardando(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useModalScrollLock(isOpen);

  if (!isOpen || !comanda) return null;

  const tipo = comanda.tipoDeComanda === 'INGRESO' ? 'ingreso' : 'egreso';
  const esPendiente = comanda.estadoDeComanda === EstadoDeComandaNew.PENDIENTE;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] shadow-sm">
                {tipo === 'ingreso' ? (
                  <ArrowUpCircle className="h-5 w-5 text-white" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Editar {tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </h2>
                <p className="text-sm text-gray-600">
                  Comanda #{comanda.numero} - {comanda.estadoDeComanda}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isExchangeRateValid && (
                <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-100 to-gray-150 px-3 py-2 shadow-sm">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    USD: {formatDual(0, false)}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-gray-100/50 to-gray-50/30 p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Form */}
            <div className="space-y-6 lg:col-span-2">
              <EditarComandaForm 
                comanda={comanda}
                setComanda={setComanda}
                errores={errores}
                setErrores={setErrores}
                esPendiente={esPendiente}
              />
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <EditarComandaResumen 
                  comanda={comanda}
                  tipo={tipo}
                />

                {/* Actions */}
                <Card className="border border-gray-300 bg-white shadow-md">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Button
                        onClick={handleSave}
                        disabled={guardando || cargando || !esPendiente}
                        className="w-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] font-medium text-white hover:from-[#e292a3] hover:to-[#d4a7ca]"
                      >
                        {guardando ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </Button>
                    </div>

                    {errores.general && (
                      <p className="mt-3 text-center text-sm text-red-600">
                        {errores.general}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 