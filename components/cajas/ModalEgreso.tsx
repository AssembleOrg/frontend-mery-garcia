'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Save,
  X,
  TrendingUp,
  Calculator,
  ArrowDownCircle,
  Search,
  Hash,
  Package,
} from 'lucide-react';
import useComandaStore from '@/features/comandas/store/comandaStore';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { logger } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { comandasService } from '@/services/comandas.service';
import {
  ComandaCreateNew,
  EstadoDeComandaNew,
  TipoDeComandaNew,
  ProductoServicioNew,
  CajaNew,
  ComandaNew,
} from '@/services/unidadNegocio.service';
import useProductosServiciosStore from '@/features/productos-servicios/store/productosServiciosStore';
import { toast } from 'sonner';

interface ModalEgresoProps {
  isOpen: boolean;
  onClose: () => void;
  egresoParaEditar?: ComandaNew | null;
}

interface ItemEgreso {
  id: string;
  productoServicioId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  descripcion?: string;
  moneda: 'USD' | 'ARS';
}

export default function ModalEgreso({
  isOpen,
  onClose,
  egresoParaEditar,
}: ModalEgresoProps) {
  const modoEdicion = !!egresoParaEditar;
  // Store hooks
  const {
    agregarComandaEgreso,
    existeComanda,
    getUltimaComandaEgreso,
    obtenerMaximoARSUSD,
  } = useComandaStore();

  const { productosServicios, loadProductosServicios } =
    useProductosServiciosStore();

  const {
    exchangeRate,
    isExchangeRateValid,
    formatARS,
    formatUSD,
    formatDual,
  } = useCurrencyConverter();

  const {lastDolar, cotizarDolar } = useExchangeRateStore();
  const { user } = useAuth();

  const [maximoARSUSD, setMaximoARSUSD] = useState<{
    ars: number;
    usd: number;
  }>({ ars: 0, usd: 0 });

  // Form state
  const [observaciones, setObservaciones] = useState('');
  const [itemsEgreso, setItemsEgreso] = useState<Array<{
    id: string;
    nombre: string;
    monto: number;
    moneda: 'USD' | 'ARS';
  }>>([]);

  const [numeroManual, setNumeroManual] = useState('');
  const [numeroUltimaComanda, setNumeroUltimaComanda] = useState('');
  const [cajaSeleccionada, setCajaSeleccionada] = useState<CajaNew>(CajaNew.CAJA_1);

  // UI state
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [dolar, setDolar] = useState(0);

  useModalScrollLock(isOpen);

  const calculateTotal = () => {
    const preTotalUSD = itemsEgreso.reduce((sum, item) => item.moneda === 'USD' ? sum + item.monto : sum, 0);
    const preTotalARS = itemsEgreso.reduce((sum, item) => item.moneda === 'ARS' ? sum + item.monto : sum, 0);
    const arsToUsd = preTotalARS / exchangeRate;
    const usdToArs = preTotalUSD * exchangeRate;
    const totalUSD = preTotalUSD + arsToUsd;
    const totalARS = preTotalARS + usdToArs;

    return { totalUSD: totalUSD, totalARS: totalARS };
  }

  const validarNumeroManual = (numero: string): boolean => {
    if (!numero.trim()) return false;
    if (!/^\d+$/.test(numero)) return false;
    return true;
  };

  const resetForm = () => {
    setObservaciones('');
    setItemsEgreso([]);
    setNumeroManual('');
    setNumeroUltimaComanda('');
    setCajaSeleccionada(CajaNew.CAJA_1);
    setGuardando(false);
    setErrores({});
    setMostrarBuscador(false);
    setDolar(0);
    setBusqueda('');
  };

  // Manejar ESC para cerrar modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (mostrarBuscador) {
          setMostrarBuscador(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      obtenerMaximoARSUSD().then((maximo) => {
        console.log(maximo);
        setMaximoARSUSD(maximo);
      });
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose, mostrarBuscador]);

  const siguienteNumeroComanda = (actual: string): string => {
    const [prefijo, correlativo] = actual.split('-');
    const siguiente = (parseInt(correlativo, 10) || 0) + 1;
    const nuevoCorrelativo = String(siguiente).padStart(
      correlativo.length,
      '0'
    );
    return `${prefijo}-${nuevoCorrelativo}`;
  };

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (!isOpen) {
      // Resetear cuando se cierra
      resetForm();
      return;
    }

    // Obtener dólar si no está configurado
    if (dolar === 0) {
      lastDolar()
        .then((dolarR) => setDolar(dolarR.venta))
        .catch(() => {
          cotizarDolar()
            .then((dolarR) => dolarR && setDolar(dolarR.venta))
            .catch(() => toast.error('Error al obtener el último dólar'));
        });
    }

    // MODO EDICIÓN: Cargar datos del egreso
    if (modoEdicion && egresoParaEditar) {
      setNumeroUltimaComanda(egresoParaEditar.numero);
      setObservaciones(egresoParaEditar.observaciones || '');
      
      if (egresoParaEditar.egresos?.[0]) {
        const egreso = egresoParaEditar.egresos[0];
        setItemsEgreso([{
          id: egreso.id!,
          nombre: '',
          monto: Number(egreso.total),
          moneda: egreso.moneda as 'USD' | 'ARS',
        }]);
        if (egreso.caja) {
          setCajaSeleccionada(egreso.caja as CajaNew);
        }
      }
      
      if (egresoParaEditar.valorDolar) {
        setDolar(egresoParaEditar.valorDolar);
      }
    } 
    // MODO CREACIÓN: Obtener siguiente número
    else if (!modoEdicion) {
      getUltimaComandaEgreso().then((comanda) => {
        setNumeroUltimaComanda(
          comanda ? siguienteNumeroComanda(comanda.numero) : '02-0001'
        );
      });
    }
  }, [isOpen, modoEdicion, egresoParaEditar]);

  const agregarDesdeProducto = (producto: ProductoServicioNew) => {
    const nuevoItem: ItemEgreso = {
      id: `temp-${Date.now()}`,
      productoServicioId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      subtotal: producto.precio,
      descripcion: producto.descripcion || '',
      moneda: 'USD',
    };
    setMostrarBuscador(false);
    setBusqueda('');
  };

  const agregarItemEgreso = () => {
    const nuevoItem = {
      id: `item-${Date.now()}`,
      nombre: '',
      monto: 0,
      moneda: 'USD' as 'USD' | 'ARS',
    };
    setItemsEgreso([...itemsEgreso, nuevoItem]);
  };

  const eliminarItemEgreso = (index: number) => {
    setItemsEgreso(itemsEgreso.filter((_, i) => i !== index));
  };

  const actualizarItemEgreso = (index: number, campo: string, valor: any) => {
    setItemsEgreso(
      itemsEgreso.map((item, i) => 
        i === index ? { ...item, [campo]: valor } : item
      )
    );
  };

  // Form validation
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    // Solo validar el número manual en modo creación
    if (!modoEdicion && numeroManual.trim()) {
      if (!/^\d+$/.test(numeroManual)) {
        nuevosErrores.numeroManual = 'Solo se permiten números';
      } else if (!validarNumeroManual(numeroManual)) {
        const numeroCompleto = `02-${numeroManual.padStart(4, '0')}`;
        nuevosErrores.numeroManual = `El número ${numeroCompleto} ya existe`;
      }
    }

    // Validar items
    if (itemsEgreso.length === 0) {
      nuevosErrores.itemsEgreso = 'Debe agregar al menos un item';
      toast.error('Debe agregar al menos un item');
    } else {
      itemsEgreso.forEach((item, index) => {
        if (item.monto <= 0) {
          toast.error('El monto debe ser mayor a 0');
          nuevosErrores[`item-${index}-monto`] = 'El monto debe ser mayor a 0';
        }
        if (item.moneda !== 'USD' && item.moneda !== 'ARS') {
          nuevosErrores[`item-${index}-moneda`] = 'Moneda inválida';
        }
      });
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Save transaction
  const handleSave = async () => {
    if (!validarFormulario()) return;
    setGuardando(true);

    try {
      if (modoEdicion && egresoParaEditar?.egresos?.[0]) {
        // MODO EDICIÓN
        const egresoId = egresoParaEditar.egresos[0].id!;
        const item = itemsEgreso[0];
        
        await comandasService.actualizarEgreso(egresoId, {
          total: item.monto,
          totalDolar: item.moneda === 'USD' ? item.monto : parseFloat((item.monto / dolar).toFixed(2)),
          totalPesos: item.moneda === 'ARS' ? item.monto : parseFloat((item.monto * dolar).toFixed(2)),
          valorDolar: dolar,
          moneda: item.moneda,
          observaciones: observaciones,
        });
        
        toast.success('Egreso actualizado correctamente');
        onClose();
      } else {
        // MODO CREACIÓN
        const numeroTransaccion = numeroManual.trim()
          ? `02-${numeroManual.padStart(4, '0')}`
          : numeroUltimaComanda;

        const existe = await existeComanda(numeroTransaccion);
        if (existe) {
          toast.error('El número de comanda ya existe');
          setGuardando(false);
          return;
        }

        const nuevaComanda: ComandaCreateNew = {
          creadoPorId: user?.id,
          tipoDeComanda: TipoDeComandaNew.EGRESO,
          numero: numeroTransaccion,
          estadoDeComanda: EstadoDeComandaNew.VALIDADO,
          valorDolar: dolar,
          caja: CajaNew.CAJA_1,
          descuentosAplicados: [],
          observaciones: observaciones,
          precioDolar: itemsEgreso
            .filter(i => i.moneda === 'USD')
            .reduce((sum, i) => sum + i.monto, 0),
          precioPesos: itemsEgreso
            .filter(i => i.moneda === 'ARS')
            .reduce((sum, i) => sum + i.monto, 0),
          egresos: itemsEgreso.map((item) => ({
            total: item.monto,
            totalDolar: item.moneda === 'USD' ? item.monto : parseFloat((item.monto / dolar).toFixed(2)),
            totalPesos: item.moneda === 'ARS' ? item.monto : parseFloat((item.monto * dolar).toFixed(2)),
            valorDolar: dolar,
            moneda: item.moneda,
            caja: cajaSeleccionada,
          })),
        };

        await agregarComandaEgreso(nuevaComanda);
        toast.success('Egreso guardado correctamente');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el egreso');
      logger.error('Error al guardar egreso:', error);
    } finally {
      setGuardando(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-red-400 to-red-500 shadow-sm">
                <ArrowDownCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {modoEdicion ? 'Editar Egreso' : 'Nuevo Egreso'}
                </h2>
                <p className="text-sm text-gray-600">
                  {modoEdicion ? 'Modificar gasto o salida de dinero' : 'Registrar gasto o salida de dinero'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isExchangeRateValid && (
                <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-100 to-gray-150 px-3 py-2 shadow-sm">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    USD: {formatDual(exchangeRate, false)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-100 to-gray-150 px-3 py-2 shadow-sm">
                <span className="text-sm font-medium text-gray-800">
                  Maximo Retirable Pesos: {formatUSD(maximoARSUSD.ars)}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-100 to-gray-150 px-3 py-2 shadow-sm">
                <span className="text-sm font-medium text-gray-800">
                  Maximo Retirable USD: {formatUSD(maximoARSUSD.usd)}
                </span>
              </div>
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
              {/* Basic Info */}
              <Card className="border border-gray-300 bg-white shadow-md">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="text-lg text-gray-900">
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Campo de numeración manual */}
                    <div className="md:col-span-2">
                      <div className="mb-4">
                        <Label className="mb-2 block font-medium text-gray-700">
                          Numeración Manual
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Automático: {numeroUltimaComanda}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-md border bg-gray-100 px-3 py-2">
                            <Hash className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              02-
                            </span>
                          </div>
                          <Input
                            value={numeroManual}
                            onChange={(e) => {
                              const valor = e.target.value.replace(/\D/g, '');
                              setNumeroManual(valor);
                              if (errores.numeroManual) {
                                setErrores((prev) => {
                                  return prev;
                                });
                              }
                            }}
                            placeholder="0001"
                            maxLength={4}
                            className={`text-center ${
                              errores.numeroManual
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          {numeroManual && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                Número completo:
                              </span>
                              <Badge
                                variant={
                                  validarNumeroManual(numeroManual)
                                    ? 'default'
                                    : 'destructive'
                                }
                                className="text-xs"
                              >
                                02-{numeroManual.padStart(4, '0')}
                              </Badge>
                            </div>
                          )}
                          {errores.numeroManual && (
                            <p className="mt-1 text-xs text-red-600">
                              {errores.numeroManual}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selector de Caja - Solo visible en modo creación */}
                    {!modoEdicion && (
                      <div className="md:col-span-2">
                        <Label className="mb-2 block font-medium text-gray-700">
                          Caja de Egreso
                        </Label>
                        <select
                          value={cajaSeleccionada}
                          onChange={(e) => setCajaSeleccionada(e.target.value as CajaNew)}
                          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                          <option value={CajaNew.CAJA_1}>Caja 1 - Caja Chica</option>
                          <option value={CajaNew.CAJA_2}>Caja 2 - Caja Grande</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          {cajaSeleccionada === CajaNew.CAJA_1 
                            ? 'El egreso se restará del Neto de Efectivo en la Caja Chica' 
                            : 'El egreso se restará del Neto de Efectivo en la Caja Grande'}
                        </p>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <Label className="text-gray-700">Observaciones</Label>
                      <Textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Observaciones adicionales"
                        rows={3}
                        className="border-gray-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Métodos de Pago */}
              <Card className="border border-gray-300 bg-white shadow-md">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="flex items-center justify-between text-lg text-gray-900">
                    <span>Item Egreso</span>
                    {!modoEdicion && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={agregarItemEgreso}
                        className="border-red-400 text-red-600 hover:bg-red-50"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Item
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itemsEgreso.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-r from-gray-100 to-gray-150 p-6 text-center">
                      <p className="text-sm text-gray-600">
                        No hay items agregados
                      </p>
                      <p className="text-xs text-gray-500">
                        Haga clic en &quot;Agregar Item&quot; para comenzar
                      </p>
                    </div>
                  ) : (
                    itemsEgreso.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
                      >
                        {/* <div className="flex-1">
                          <Input
                            type="text"
                            value={item.nombre || ''}
                            onChange={(e) =>
                              actualizarItemEgreso(index, 'nombre', e.target.value)
                            }
                            placeholder="Nombre del item"
                            className="border-gray-300"
                          />
                        </div> */}
                        <div className="flex-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.monto || ''}
                            onChange={(e) =>
                              actualizarItemEgreso(
                                index,
                                'monto',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="border-gray-300"
                          />
                        </div>
                        <div className="flex-1">
                          <select
                            value={item.moneda}
                            onChange={(e) =>
                              actualizarItemEgreso(
                                index,
                                'moneda',
                                e.target.value as 'USD' | 'ARS'
                              )
                            }
                            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          >
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                          </select>
                        </div>
                        {!modoEdicion && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarItemEgreso(index)}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <Card className="border border-gray-300 bg-white shadow-md">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className="text-lg text-gray-900">
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {/* Total de items */}
                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-3 shadow-sm">
                        <div className="text-sm text-gray-700">
                          Total de items
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {itemsEgreso.length} {itemsEgreso.length === 1 ? 'item' : 'items'}
                          </div>
                        </div>
                      </div>

                      {/* Total pagado */}
                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-green-100 to-green-200 p-3 shadow-sm">
                        <div className="text-sm text-green-700">
                          Monto retirado en USD
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-700">
                            {formatUSD(calculateTotal().totalUSD)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-green-100 to-green-200 p-3 shadow-sm">
                        <div className="text-sm text-green-700">
                          Monto retirado en ARS
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-700">
                            {formatARS(calculateTotal().totalUSD)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="border border-gray-300 bg-white shadow-md">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Button
                        onClick={handleSave}
                        disabled={guardando}
                        className="w-full bg-gradient-to-r from-red-400 to-red-500 font-medium text-white hover:from-red-500 hover:to-red-600"
                      >
                        {guardando ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {modoEdicion ? 'Actualizando...' : 'Guardando...'}
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {modoEdicion ? 'Actualizar Egreso' : 'Guardar Egreso'}
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

      {/* Product Search Modal */}
      {mostrarBuscador && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-gray-100 bg-white shadow-2xl">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Buscar Productos/Servicios
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarBuscador(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-4">
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="border-gray-300"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              <div className="space-y-2">
                {productosServicios
                  .filter(
                    (producto) =>
                      producto.nombre
                        .toLowerCase()
                        .includes(busqueda.toLowerCase()) && producto.activo
                  )
                  .map((producto) => (
                    <div
                      key={producto.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                      onClick={() => agregarDesdeProducto(producto)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {producto.nombre}
                        </div>
                        <div className="text-sm text-gray-600">
                          {producto.tipo} - {producto.precio} USD
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300"
                      >
                        Agregar
                      </Button>
                    </div>
                  ))}

                {productosServicios.filter(
                  (producto) =>
                    producto.nombre
                      .toLowerCase()
                      .includes(busqueda.toLowerCase()) && producto.activo
                ).length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p>No se encontraron productos/servicios</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Intenta con otros términos de búsqueda
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 