'use client';

import React from 'react';
import { useComandaForm } from '@/hooks/useComandaForm';
import { useComandas } from '@/features/comandas/store/comandaStore';
import { UnidadNegocio, Personal, ProductoServicio } from '@/types/caja';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Building,
  User,
  Plus,
  X,
  Calculator,
  DollarSign,
  Search,
  CreditCard,
  Percent,
  Trash2,
} from 'lucide-react';

interface ModalAgregarComandaProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalAgregarComanda({
  isOpen,
  onClose,
}: ModalAgregarComandaProps) {
  const { agregarComanda } = useComandas();
  const {
    // Estados
    numeroComanda,
    unidadNegocio,
    personalPrincipal,
    cliente,
    items,
    seña,
    metodosPago,
    observaciones,
    mostrarSelectorItems,
    busquedaItems,
    itemsDisponibles,
    personalDisponible,
    tipoCambio,
    descuentoGlobalPorcentaje,

    // Cálculos en PESOS
    subtotal,
    totalDescuentos,
    totalSinSeña,
    montoSeña,
    saldoPendiente,
    totalRecargos,
    totalFinal,

    // Equivalentes en USD
    subtotalUSD,

    // Setters
    setNumeroComanda,
    setUnidadNegocio,
    setPersonalPrincipal,
    setCliente,
    setObservaciones,
    setMostrarSelectorItems,
    setBusquedaItems,
    setDescuentoGlobalPorcentaje,

    // Acciones
    agregarItem,
    actualizarItem,
    eliminarItem,
    agregarSeña,
    eliminarSeña,
    actualizarSeña,
    agregarMetodoPago,
    actualizarMetodoPago,
    eliminarMetodoPago,
    aplicarDescuentoATodos,
    limpiarDescuentos,
    validarFormulario,
    crearComanda,
    limpiarFormulario,
    formatearMonto,
  } = useComandaForm();

  const handleGuardar = () => {
    if (validarFormulario()) {
      const nuevaComanda = crearComanda();
      agregarComanda(nuevaComanda);
      limpiarFormulario();
      onClose();
    }
  };

  // Bloquear scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;

      // Bloquear scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restaurar scroll cuando se cierre
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Manejar ESC para cerrar modal
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // Manejar click en overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay con mejor z-index y prevención de eventos */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleOverlayClick}
        style={{ zIndex: 9999 }}
      />

      {/* Modal Container con z-index superior */}
      <div
        className="relative z-[10000] mx-4 flex h-[90vh] w-full max-w-7xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b p-6">
          <div className="flex items-center gap-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <ShoppingCart className="h-5 w-5" />
              Nueva Comanda
            </h2>
            <div className="text-sm text-gray-500">
              💰 Tipo de cambio: ${tipoCambio.valorVenta} ARS/USD
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-4">
              {/* Columna Principal - 3/4 */}
              <div className="max-h-full space-y-6 overflow-y-auto pr-3 lg:col-span-3">
                {/* Información Básica */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building className="h-4 w-4" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor="numero" className="text-sm font-medium">
                          Número de Comanda *
                        </Label>
                        <Input
                          id="numero"
                          placeholder="ej: 1234"
                          value={numeroComanda}
                          onChange={(e) => setNumeroComanda(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Unidad de Negocio *
                        </Label>
                        <Select
                          value={unidadNegocio}
                          onValueChange={(value) =>
                            setUnidadNegocio(value as UnidadNegocio)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            <SelectItem value="estilismo">Estilismo</SelectItem>
                            <SelectItem value="tattoo">Tattoo</SelectItem>
                            <SelectItem value="formacion">Formación</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Personal Principal *
                        </Label>
                        <Select
                          value={personalPrincipal?.id || ''}
                          onValueChange={(value) => {
                            const personal = personalDisponible.find(
                              (p: Personal) => p.id === value
                            );
                            setPersonalPrincipal(personal || null);
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccionar personal" />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            {personalDisponible.length === 0 ? (
                              <div className="p-4 text-sm text-gray-500">
                                No hay personal disponible.
                              </div>
                            ) : (
                              personalDisponible.map((personal: Personal) => (
                                <SelectItem
                                  key={personal.id}
                                  value={personal.id}
                                >
                                  {personal.nombre} (
                                  {personal.comisionPorcentaje}% )
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cliente */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <Label
                          htmlFor="clienteNombre"
                          className="text-sm font-medium"
                        >
                          Nombre *
                        </Label>
                        <Input
                          id="clienteNombre"
                          placeholder="Nombre del cliente"
                          value={cliente.nombre}
                          onChange={(e) =>
                            setCliente({ ...cliente, nombre: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="clienteCuit"
                          className="text-sm font-medium"
                        >
                          CUIT/CI
                        </Label>
                        <Input
                          id="clienteCuit"
                          placeholder="12345678-9"
                          value={cliente.cuit || ''}
                          onChange={(e) =>
                            setCliente({ ...cliente, cuit: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="clienteTelefono"
                          className="text-sm font-medium"
                        >
                          Teléfono
                        </Label>
                        <Input
                          id="clienteTelefono"
                          placeholder="099-123-456"
                          value={cliente.telefono || ''}
                          onChange={(e) =>
                            setCliente({
                              ...cliente,
                              telefono: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Items */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calculator className="h-4 w-4" />
                        Items
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setMostrarSelectorItems(true)}
                          size="sm"
                          variant="outline"
                          className="h-8"
                        >
                          <Search className="mr-1 h-3 w-3" />
                          Buscar
                        </Button>
                        <Button
                          onClick={() =>
                            agregarItem({
                              id: `item-${Date.now()}`,
                              nombre: '',
                              tipo: 'servicio',
                              precio: 0,
                              businessUnit: unidadNegocio,
                            } as ProductoServicio)
                          }
                          size="sm"
                          className="h-8 border-[#f9bbc4] bg-[#f9bbc4] font-medium text-white hover:bg-[#e292a3]"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="grid flex-1 gap-2 md:grid-cols-6">
                            <Input
                              placeholder="Nombre del item"
                              value={item.nombre}
                              onChange={(e) =>
                                actualizarItem(index, 'nombre', e.target.value)
                              }
                              className="md:col-span-2"
                            />
                            <Input
                              type="number"
                              placeholder="Precio"
                              value={item.precio || ''}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  'precio',
                                  Number(e.target.value)
                                )
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Cant."
                              value={item.cantidad === 0 ? '' : item.cantidad}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  'cantidad',
                                  e.target.value === ''
                                    ? 0
                                    : Number(e.target.value)
                                )
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Desc. %"
                              value={
                                item.descuentoPorcentaje === undefined ||
                                item.descuentoPorcentaje === 0
                                  ? ''
                                  : item.descuentoPorcentaje
                              }
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  'descuentoPorcentaje',
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value)
                                )
                              }
                              min="0"
                              max="100"
                            />
                            <div className="flex items-center justify-center rounded border bg-gray-50 px-2 py-1 text-sm font-medium">
                              {formatearMonto(item.subtotal)}
                            </div>
                          </div>
                          <Button
                            onClick={() => eliminarItem(index)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {items.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                          No hay items agregados
                          <div className="mt-2 text-sm">
                            Usa el botón &quot;Buscar&quot; para seleccionar
                            productos/servicios o &quot;Agregar&quot; para crear
                            uno nuevo
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Descuento Global */}
                    <Card className="border border-orange-200 bg-orange-50/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-orange-800">
                          <Percent className="h-4 w-4" />
                          Descuento Global
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label
                              htmlFor="descuento-global"
                              className="text-xs text-orange-700"
                            >
                              Porcentaje de descuento (%)
                            </Label>
                            <Input
                              id="descuento-global"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={descuentoGlobalPorcentaje || ''}
                              onChange={(e) =>
                                setDescuentoGlobalPorcentaje(
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Ej: 10 para 10%"
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={aplicarDescuentoATodos}
                            disabled={
                              !descuentoGlobalPorcentaje ||
                              descuentoGlobalPorcentaje <= 0
                            }
                            className="mt-4 bg-orange-600 hover:bg-orange-700"
                          >
                            <Calculator className="mr-1 h-3 w-3" />
                            Aplicar
                          </Button>
                        </div>

                        <div className="rounded-md bg-orange-100 p-2">
                          <p className="text-xs text-orange-800">
                            💡 <strong>Cómo funciona:</strong> Ingresa el
                            porcentaje de descuento (ej: 10 para 10%) y presiona
                            &quot;Aplicar&quot; para aplicarlo a todos los
                            servicios.
                          </p>
                          {descuentoGlobalPorcentaje > 0 && (
                            <p className="mt-1 text-xs font-medium text-orange-900">
                              Se aplicará {descuentoGlobalPorcentaje}% de
                              descuento a cada servicio
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={limpiarDescuentos}
                          className="w-full border-orange-300 text-xs text-orange-700 hover:bg-orange-100"
                        >
                          Limpiar Descuentos
                        </Button>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                {/* Observaciones */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Observaciones adicionales..."
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Columna Lateral */}
              <div className="max-h-[80vh] w-full space-y-6 self-start overflow-y-auto lg:col-span-1 lg:max-w-sm">
                {/* Resumen */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="h-4 w-4" />
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <div className="text-right">
                        <div>{formatearMonto(subtotal)}</div>
                        <div className="text-xs text-gray-500">
                          ≈ US${subtotalUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {totalDescuentos > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Descuentos:</span>
                        <span>-{formatearMonto(totalDescuentos)}</span>
                      </div>
                    )}

                    {totalRecargos > 0 && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Recargos:</span>
                        <span>+{formatearMonto(totalRecargos)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-sm font-medium">
                      <span>Total sin seña:</span>
                      <span>{formatearMonto(totalSinSeña)}</span>
                    </div>

                    {montoSeña > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-blue-600">
                          <span>Seña:</span>
                          <span>-{formatearMonto(montoSeña)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Saldo pendiente:</span>
                          <span>{formatearMonto(saldoPendiente)}</span>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Final:</span>
                      <span className="text-green-600">
                        {formatearMonto(totalFinal)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Métodos de Pago */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="h-4 w-4" />
                        Métodos de Pago
                      </CardTitle>
                      <Button
                        onClick={agregarMetodoPago}
                        size="sm"
                        variant="outline"
                        className="h-8"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Agregar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metodosPago.map((metodo, index) => (
                        <div
                          key={index}
                          className="space-y-3 rounded-lg border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <Select
                              value={metodo.tipo}
                              onValueChange={(value) =>
                                actualizarMetodoPago(index, 'tipo', value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[10001]">
                                <SelectItem value="efectivo">
                                  💰 Efectivo
                                </SelectItem>
                                <SelectItem value="tarjeta_debito">
                                  💳 Tarjeta Débito
                                </SelectItem>
                                <SelectItem value="tarjeta_credito">
                                  💳 Tarjeta Crédito
                                </SelectItem>
                                <SelectItem value="transferencia">
                                  🏦 Transferencia
                                </SelectItem>
                                <SelectItem value="cheque">
                                  📄 Cheque
                                </SelectItem>
                                <SelectItem value="otro">🔄 Otro</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => eliminarMetodoPago(index)}
                              size="sm"
                              variant="ghost"
                              className="ml-2 h-8 w-8 p-0 text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Monto</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={metodo.monto || ''}
                                onChange={(e) =>
                                  actualizarMetodoPago(
                                    index,
                                    'monto',
                                    Number(e.target.value)
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Recargo %</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={metodo.recargoPorcentaje || ''}
                                onChange={(e) =>
                                  actualizarMetodoPago(
                                    index,
                                    'recargoPorcentaje',
                                    Number(e.target.value)
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                            <div className="flex flex-col">
                              <Label className="text-xs">Recargo ARS</Label>
                              <div className="mt-1 rounded border bg-gray-100 px-2 py-1 text-xs">
                                {formatearMonto(
                                  Math.max(metodo.montoFinal - metodo.monto, 0)
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-gray-600">
                            Monto final: {formatearMonto(metodo.montoFinal)}
                          </div>
                        </div>
                      ))}

                      {metodosPago.length === 0 && (
                        <div className="py-4 text-center text-sm text-gray-500">
                          No hay métodos de pago configurados
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Seña */}
                {seña && (
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">💰 Seña</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={eliminarSeña}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Monto</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={seña.monto}
                            onChange={(e) =>
                              actualizarSeña(
                                'monto',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Moneda</Label>
                          <Select
                            value={seña.moneda}
                            onValueChange={(value) =>
                              actualizarSeña('moneda', value)
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[10001]">
                              <SelectItem value="pesos">💰 Pesos</SelectItem>
                              <SelectItem value="dolares">
                                💵 Dólares
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Equivalente en pesos
                          </Label>
                          <div className="mt-1 rounded border bg-gray-100 px-3 py-2 text-sm font-semibold">
                            {formatearMonto(montoSeña)}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Observaciones
                          </Label>
                          <Input
                            placeholder="Observaciones sobre la seña"
                            value={seña.observaciones || ''}
                            onChange={(e) =>
                              actualizarSeña('observaciones', e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Agregar Seña */}
                {!seña && (
                  <Button
                    onClick={agregarSeña}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Seña
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t bg-white px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={!validarFormulario()}
            className="bg-green-600 hover:bg-green-700"
          >
            💰 Guardar Comanda
          </Button>
        </div>

        {/* Modal Selector de Items */}
        {mostrarSelectorItems && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMostrarSelectorItems(false)}
            />

            <div className="relative z-[10002] mx-4 flex max-h-[80vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
              <div className="border-b p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Search className="h-4 w-4" />
                  Seleccionar Producto o Servicio
                </h3>

                <div className="relative mt-4">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar productos o servicios..."
                    value={busquedaItems}
                    onChange={(e) => setBusquedaItems(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  {itemsDisponibles.map((item: ProductoServicio) => (
                    <div
                      key={item.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                      onClick={() => {
                        agregarItem(item);
                        setMostrarSelectorItems(false);
                      }}
                    >
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <Badge
                            variant={
                              item.tipo === 'servicio' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {item.tipo}
                          </Badge>
                          <span className="font-medium">{item.nombre}</span>
                        </div>
                        {item.descripcion && (
                          <p className="text-sm text-gray-600">
                            {item.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-semibold text-green-600">
                          {formatearMonto(item.precio)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ≈ US$
                          {(item.precio / tipoCambio.valorVenta).toFixed(2)}
                        </div>
                        {item.businessUnit && (
                          <div className="text-xs text-gray-500">
                            {item.businessUnit}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {itemsDisponibles.length === 0 && (
                    <div className="py-12 text-center">
                      <Search className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                      <p className="text-gray-500">
                        No se encontraron resultados
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Intenta con otros términos de búsqueda
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t p-4">
                <Button
                  variant="outline"
                  onClick={() => setMostrarSelectorItems(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
