'use client';

import React from 'react';
import { useComandaForm } from '@/hooks/useComandaForm';
import { useComandas } from '@/features/comandas/store/comandaStore';
import {
  UnidadNegocio,
  Personal,
  ProductoServicio,
  ItemComanda,
  MetodoPago,
  ConfiguracionRecargo,
} from '@/types/caja';
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
    configuracionRecargos,
    descuentoGlobalPorcentaje,
    aplicarDescuentoGlobal,

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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex h-[90vh] w-full max-w-7xl flex-col rounded-lg bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
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
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Columna Principal - 3/4 */}
                <div className="space-y-6 lg:col-span-3">
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
                          <Label
                            htmlFor="numero"
                            className="text-sm font-medium"
                          >
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
                            <SelectContent>
                              <SelectItem value="estilismo">
                                Estilismo
                              </SelectItem>
                              <SelectItem value="tattoo">Tattoo</SelectItem>
                              <SelectItem value="formacion">
                                Formación
                              </SelectItem>
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
                            <SelectContent>
                              {personalDisponible.map((personal: Personal) => (
                                <SelectItem
                                  key={personal.id}
                                  value={personal.id}
                                >
                                  {personal.nombre} (
                                  {personal.comisionPorcentaje}%)
                                </SelectItem>
                              ))}
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
                          <ShoppingCart className="h-4 w-4" />
                          Productos y Servicios
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setMostrarSelectorItems(true)}
                            disabled={!unidadNegocio}
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Item
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Descuentos Globales */}
                      {items.length > 0 && (
                        <div className="mb-4 rounded-lg border bg-blue-50/50 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Percent className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">
                              Descuentos
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="% desc."
                                value={descuentoGlobalPorcentaje}
                                onChange={(e) =>
                                  setDescuentoGlobalPorcentaje(
                                    Number(e.target.value)
                                  )
                                }
                                className="h-8 w-20"
                              />
                              <span className="text-sm text-gray-600">%</span>
                            </div>
                            <Button
                              onClick={aplicarDescuentoATodos}
                              disabled={descuentoGlobalPorcentaje <= 0}
                              size="sm"
                              variant="outline"
                            >
                              Aplicar a todos
                            </Button>
                            {aplicarDescuentoGlobal && (
                              <Button
                                onClick={limpiarDescuentos}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Limpiar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {items.length === 0 ? (
                        <div className="py-12 text-center">
                          <Plus className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                          <p className="text-sm text-gray-500">
                            No hay items agregados
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Haz clic en &quot;Agregar Item&quot; para comenzar
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {items.map((item: ItemComanda, index: number) => (
                            <div
                              key={index}
                              className="rounded-lg border bg-gray-50/50 p-4"
                            >
                              <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant={
                                      item.tipo === 'servicio'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {item.tipo}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {item.nombre}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarItem(index)}
                                  className="h-8 w-8 p-0 hover:bg-red-100"
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                <div>
                                  <Label className="text-xs font-medium">
                                    Cantidad
                                  </Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.cantidad}
                                    onChange={(e) =>
                                      actualizarItem(
                                        index,
                                        'cantidad',
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs font-medium">
                                    Precio (ARS)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.precio}
                                    onChange={(e) =>
                                      actualizarItem(
                                        index,
                                        'precio',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs font-medium">
                                    Descuento (ARS)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.descuento}
                                    onChange={(e) =>
                                      actualizarItem(
                                        index,
                                        'descuento',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs font-medium">
                                    Personal
                                  </Label>
                                  <Select
                                    value={item.personalId || 'sin-asignar'}
                                    onValueChange={(value) =>
                                      actualizarItem(
                                        index,
                                        'personalId',
                                        value === 'sin-asignar'
                                          ? undefined
                                          : value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="mt-1 h-8 text-sm">
                                      <SelectValue placeholder="Opcional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sin-asignar">
                                        Sin asignar
                                      </SelectItem>
                                      {personalDisponible.map(
                                        (personal: Personal) => (
                                          <SelectItem
                                            key={personal.id}
                                            value={personal.id}
                                          >
                                            {personal.nombre}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-xs font-medium">
                                    Subtotal
                                  </Label>
                                  <div className="mt-1 rounded border bg-white px-2 py-2 text-sm font-semibold">
                                    {formatearMonto(item.subtotal)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Métodos de Pago */}
                  {items.length > 0 && (
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-4 w-4" />
                            Métodos de Pago *
                          </CardTitle>
                          <Button
                            onClick={agregarMetodoPago}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Método
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {metodosPago.length === 0 ? (
                          <div className="py-8 text-center">
                            <CreditCard className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                            <p className="text-sm text-gray-500">
                              Debe agregar al menos un método de pago
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {metodosPago.map(
                              (metodo: MetodoPago, index: number) => (
                                <div
                                  key={index}
                                  className="rounded-lg border bg-green-50/50 p-4"
                                >
                                  <div className="mb-3 flex items-center justify-between">
                                    <span className="font-medium text-green-800">
                                      Método {index + 1}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => eliminarMetodoPago(index)}
                                      className="h-6 w-6 p-0 hover:bg-red-100"
                                    >
                                      <X className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                    <div>
                                      <Label className="text-xs font-medium">
                                        Tipo
                                      </Label>
                                      <Select
                                        value={metodo.tipo}
                                        onValueChange={(value) =>
                                          actualizarMetodoPago(
                                            index,
                                            'tipo',
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="mt-1 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="efectivo">
                                            💵 Efectivo
                                          </SelectItem>
                                          <SelectItem value="tarjeta">
                                            💳 Tarjeta (+
                                            {configuracionRecargos.find(
                                              (c: ConfiguracionRecargo) =>
                                                c.metodoPago === 'tarjeta'
                                            )?.porcentaje || 0}
                                            %)
                                          </SelectItem>
                                          <SelectItem value="transferencia">
                                            🏦 Transferencia (+
                                            {configuracionRecargos.find(
                                              (c: ConfiguracionRecargo) =>
                                                c.metodoPago === 'transferencia'
                                            )?.porcentaje || 0}
                                            %)
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label className="text-xs font-medium">
                                        Monto (ARS)
                                      </Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={metodo.monto}
                                        onChange={(e) =>
                                          actualizarMetodoPago(
                                            index,
                                            'monto',
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="mt-1 h-8 text-sm"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs font-medium">
                                        Recargo
                                      </Label>
                                      <div className="mt-1 rounded border bg-white px-2 py-2 text-xs">
                                        {metodo.recargoPorcentaje > 0
                                          ? `+${metodo.recargoPorcentaje}%`
                                          : 'Sin recargo'}
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-xs font-medium">
                                        Total Final
                                      </Label>
                                      <div className="mt-1 rounded border bg-green-100 px-2 py-2 text-xs font-semibold text-green-800">
                                        {formatearMonto(metodo.montoFinal)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}

                            {/* Validación de montos */}
                            <div className="rounded-lg border-2 border-dashed border-gray-300 p-3">
                              <div className="flex justify-between text-sm">
                                <span>Saldo a pagar:</span>
                                <span className="font-semibold">
                                  {formatearMonto(saldoPendiente)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Total métodos de pago:</span>
                                <span className="font-semibold">
                                  {formatearMonto(
                                    metodosPago.reduce(
                                      (sum: number, mp: MetodoPago) =>
                                        sum + mp.monto,
                                      0
                                    )
                                  )}
                                </span>
                              </div>
                              <div className="mt-2 flex justify-between border-t pt-2 text-sm font-bold">
                                <span>Diferencia:</span>
                                <span
                                  className={
                                    Math.abs(
                                      metodosPago.reduce(
                                        (sum: number, mp: MetodoPago) =>
                                          sum + mp.monto,
                                        0
                                      ) - saldoPendiente
                                    ) < 0.01
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }
                                >
                                  {formatearMonto(
                                    metodosPago.reduce(
                                      (sum: number, mp: MetodoPago) =>
                                        sum + mp.monto,
                                      0
                                    ) - saldoPendiente
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Observaciones */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base">Observaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Observaciones adicionales..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Columna Lateral - Resumen - 1/4 */}
                <div className="space-y-6 lg:col-span-1">
                  {/* Resumen de Totales */}
                  <Card className="sticky top-0">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calculator className="h-4 w-4" />
                        Resumen (ARS)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatearMonto(subtotal)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ≈{' '}
                              {formatearMonto(
                                (subtotalUSD * tipoCambio.valorVenta) /
                                  tipoCambio.valorVenta,
                                false
                              ).replace('$', 'US$')}
                            </div>
                          </div>
                        </div>

                        {totalDescuentos > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Descuentos:</span>
                            <span className="font-medium text-red-600">
                              -{formatearMonto(totalDescuentos)}
                            </span>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Total sin seña:</span>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatearMonto(totalSinSeña)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ≈ US$
                              {(totalSinSeña / tipoCambio.valorVenta).toFixed(
                                2
                              )}
                            </div>
                          </div>
                        </div>

                        {seña && (
                          <div className="flex justify-between text-sm">
                            <span>Seña ({seña.moneda}):</span>
                            <span className="font-medium text-blue-600">
                              -{formatearMonto(montoSeña)}
                            </span>
                          </div>
                        )}

                        {totalRecargos > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Recargos:</span>
                            <span className="font-medium text-orange-600">
                              +{formatearMonto(totalRecargos)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between border-t pt-3 text-base">
                          <span className="font-semibold">Total Final:</span>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {formatearMonto(totalFinal)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ≈ US$
                              {(totalFinal / tipoCambio.valorVenta).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={agregarSeña}
                        className="w-full"
                        size="sm"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        {seña ? 'Editar Seña' : 'Agregar Seña'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Seña */}
                  {seña && (
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <DollarSign className="h-4 w-4" />
                            Seña
                          </CardTitle>
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
                            <Label className="text-sm font-medium">
                              Moneda
                            </Label>
                            <Select
                              value={seña.moneda}
                              onValueChange={(value) =>
                                actualizarSeña('moneda', value)
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
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
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t bg-white px-6 py-4">
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
        </div>
      </div>

      {/* Modal Selector de Items */}
      {mostrarSelectorItems && (
        <>
          <div
            className="fixed inset-0 z-60 bg-black/50"
            onClick={() => setMostrarSelectorItems(false)}
          />

          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="flex max-h-[80vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
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
                        {item.unidadNegocio && (
                          <div className="text-xs text-gray-500">
                            {item.unidadNegocio}
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
        </>
      )}
    </>
  );
}
