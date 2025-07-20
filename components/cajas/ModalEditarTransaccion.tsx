'use client';

import React, { useState, useEffect } from 'react';
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
import {
  X,
  Edit3,
  Plus,
  Trash2,
  Shield,
  CheckCircle,
  Clock,
  User,
  Package,
  CreditCard,
  FileText,
  XCircle,
  DollarSign,
  Save,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Comanda,
  ItemComanda,
  MetodoPago,
  Personal,
  UnidadNegocio,
  EstadoComandaNegocio,
  EstadoValidacion,
} from '@/types/caja';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { usePersonal } from '@/features/personal/hooks/usePersonal';
import { useProductosServicios } from '@/features/productos-servicios/hooks/useProductosServicios';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';

interface ModalEditarTransaccionProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
}

const ESTADOS_CONFIG = {
  pendiente: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  completado: {
    label: 'Completo',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  incompleto: {
    label: 'Incompleto',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
} as const;

const VALIDACION_CONFIG = {
  no_validado: {
    label: 'Sin Validar',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  validado: {
    label: 'Validado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
} as const;

export default function ModalEditarTransaccion({
  isOpen,
  onClose,
  comandaId,
}: ModalEditarTransaccionProps) {
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { descuentosPorMetodo } = useConfiguracion();

  // Estados del formulario
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteCuit, setClienteCuit] = useState('');
  const [items, setItems] = useState<ItemComanda[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [vendedorId, setVendedorId] = useState('');

  const { obtenerComandaPorId, actualizarComanda } = useComandaStore();
  const { personal } = usePersonal();
  const { productosServicios } = useProductosServicios();
  const { formatUSD } = useCurrencyConverter();

  const calcularMontoOriginal = (tipo: string, montoFinal: number) => {
    // Excluir métodos que no tienen descuentos
    if (tipo === 'mixto' || tipo === 'giftcard' || tipo === 'qr') {
      return montoFinal;
    }

    const descuentoPorcentaje =
      descuentosPorMetodo[tipo as keyof typeof descuentosPorMetodo] || 0;
    if (descuentoPorcentaje > 0) {
      return montoFinal / (1 - descuentoPorcentaje / 100);
    }
    return montoFinal;
  };

  useEffect(() => {
    if (isOpen && comandaId) {
      const comandaEncontrada = obtenerComandaPorId(comandaId);
      if (comandaEncontrada) {
        setComanda(comandaEncontrada);
        // Cargar datos en el formulario
        setClienteNombre(comandaEncontrada.cliente.nombre);
        setClienteTelefono(comandaEncontrada.cliente.telefono || '');
        setClienteCuit(comandaEncontrada.cliente.cuit || '');
        setItems([...comandaEncontrada.items]);
        setMetodosPago([...comandaEncontrada.metodosPago]);
        setObservaciones(comandaEncontrada.observaciones || '');
        setVendedorId(comandaEncontrada.mainStaff?.id || '');
      }
    }
  }, [isOpen, comandaId, obtenerComandaPorId]);

  if (!isOpen || !comanda) return null;

  // Obtener configuración de estados
  const estadoNegocio = (comanda.estadoNegocio ||
    'pendiente') as EstadoComandaNegocio;
  const estadoValidacion = (comanda.estadoValidacion ||
    'no_validado') as EstadoValidacion;
  const estadoConfig = ESTADOS_CONFIG[estadoNegocio];
  const validacionConfig = VALIDACION_CONFIG[estadoValidacion];
  const IconoEstado = estadoConfig.icon;

  // Verificar si la comanda está validada (no se puede editar)
  const esComandaValidada = estadoValidacion === 'validado';

  const formatDate = (fecha: Date | string) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(fecha));
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDescuentos = items.reduce(
    (sum, item) => sum + (item.descuento || 0),
    0
  );
  const totalSeña = comanda.totalSeña || 0;
  const totalFinal = subtotal - totalDescuentos - totalSeña;
  const totalPagos = metodosPago.reduce((sum, metodo) => sum + metodo.monto, 0);

  const agregarItem = () => {
    const nuevoItem: ItemComanda = {
      nombre: '',
      tipo: 'servicio',
      cantidad: 1,
      precio: 0,
      precioOriginalUSD: 0,
      subtotal: 0,
      descuento: 0,
      productoServicioId: '',
    };
    setItems([...items, nuevoItem]);
  };

  // Eliminar item
  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Actualizar item
  const actualizarItem = (
    index: number,
    campo: keyof ItemComanda,
    valor: string | number
  ) => {
    const nuevosItems = [...items];
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };

    // Recalcular subtotal si cambia cantidad o precio
    if (campo === 'cantidad' || campo === 'precio') {
      nuevosItems[index].subtotal =
        nuevosItems[index].cantidad * nuevosItems[index].precio;
    }

    setItems(nuevosItems);
  };

  const agregarMetodoPago = () => {
    const nuevoMetodo: MetodoPago = {
      tipo: 'efectivo',
      monto: 0,
      moneda: 'USD', // Valor por defecto
    };
    setMetodosPago([...metodosPago, nuevoMetodo]);
  };

  // Eliminar método de pago
  const eliminarMetodoPago = (index: number) => {
    setMetodosPago(metodosPago.filter((_, i) => i !== index));
  };

  // Actualizar método de pago
  const actualizarMetodoPago = (
    index: number,
    campo: keyof MetodoPago,
    valor: string | number
  ) => {
    const nuevosMetodos = [...metodosPago];
    nuevosMetodos[index] = { ...nuevosMetodos[index], [campo]: valor };
    setMetodosPago(nuevosMetodos);
  };

  // Guardar cambios
  const handleGuardar = async () => {
    try {
      setIsLoading(true);

      // Validaciones básicas
      if (!clienteNombre.trim()) {
        toast.error('El nombre del cliente es requerido');
        return;
      }

      if (items.length === 0) {
        toast.error('Debe agregar al menos un item');
        return;
      }

      if (metodosPago.length === 0) {
        toast.error('Debe agregar al menos un método de pago');
        return;
      }

      if (Math.abs(totalPagos - totalFinal) > 0.01) {
        toast.error(
          `El total de pagos (${formatUSD(totalPagos)}) debe coincidir con el total final (${formatUSD(totalFinal)})`
        );
        return;
      }

      const comandaActualizada: Comanda = {
        ...comanda,
        cliente: {
          ...comanda.cliente,
          nombre: clienteNombre,
          telefono: clienteTelefono,
          cuit: clienteCuit,
        },
        items,
        metodosPago,
        observaciones,
        mainStaff: (() => {
          const personalEncontrado = personal.find(
            (p: { id: string; nombre: string }) => p.id === vendedorId
          );

          if (personalEncontrado) {
            // Convertir PersonalSimple a Personal
            return {
              id: personalEncontrado.id,
              nombre: personalEncontrado.nombre,
              activo: true,
              unidadesDisponibles: [
                'tattoo',
                'estilismo',
                'formacion',
              ] as UnidadNegocio[],
              fechaIngreso: new Date(),
            } as Personal;
          }

          return comanda.mainStaff;
        })(),
        subtotal,
        totalDescuentos,
        totalSeña, // Mantener la seña original
        totalFinal,
      };

      await actualizarComanda(comandaId, comandaActualizada);
      toast.success('Transacción actualizada correctamente');
      onClose();
    } catch (error) {
      console.error('Error al actualizar transacción:', error);
      toast.error('Error al actualizar la transacción');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <Edit3 className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Editar Transacción
                </h2>
                <p className="text-sm text-gray-600">
                  {comanda.numero} -{' '}
                  {comanda.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Estados y Información General */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Estados */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5" />
                      Estados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Estado del Negocio:
                      </span>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${estadoConfig.color}`}
                      >
                        <IconoEstado className="h-3 w-3" />
                        {estadoConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Validación:</span>
                      <Badge
                        variant="outline"
                        className={validacionConfig.color}
                      >
                        <Shield className="h-3 w-3" />
                        {validacionConfig.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Información General */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5" />
                      Información General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Fecha:</span>
                      <span className="font-medium">
                        {formatDate(comanda.fecha)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Unidad:</span>
                      <span className="font-medium capitalize">
                        {comanda.businessUnit}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cliente */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Nombre del cliente"
                      disabled={esComandaValidada}
                      className={
                        esComandaValidada ? 'bg-gray-100 text-gray-500' : ''
                      }
                    />
                    <Input
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      placeholder="Teléfono (opcional)"
                      disabled={esComandaValidada}
                      className={
                        esComandaValidada ? 'bg-gray-100 text-gray-500' : ''
                      }
                    />
                    <Input
                      value={clienteCuit}
                      onChange={(e) => setClienteCuit(e.target.value)}
                      placeholder="CUIT (opcional)"
                      disabled={esComandaValidada}
                      className={
                        esComandaValidada ? 'bg-gray-100 text-gray-500' : ''
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="clienteCuit">CUIT</Label>
                    <Input
                      id="clienteCuit"
                      value={clienteCuit}
                      onChange={(e) => setClienteCuit(e.target.value)}
                      placeholder="CUIT del cliente"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Vendedor */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Personal Principal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={vendedorId} onValueChange={setVendedorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {personal.map((p: { id: string; nombre: string }) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Items/Servicios */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    Items / Servicios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="grid gap-4 md:grid-cols-6">
                          <div className="md:col-span-2">
                            <Label>Producto/Servicio</Label>
                            <Select
                              value={item.productoServicioId}
                              onValueChange={(value) => {
                                const producto = productosServicios.find(
                                  (p: { id: string; nombre: string }) =>
                                    p.id === value
                                );
                                if (producto) {
                                  actualizarItem(
                                    index,
                                    'productoServicioId',
                                    value
                                  );
                                  actualizarItem(
                                    index,
                                    'nombre',
                                    producto.nombre
                                  );
                                  actualizarItem(
                                    index,
                                    'precio',
                                    producto.precio
                                  );
                                  actualizarItem(
                                    index,
                                    'subtotal',
                                    item.cantidad * producto.precio
                                  );
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {productosServicios.map(
                                  (p: {
                                    id: string;
                                    nombre: string;
                                    precio: number;
                                  }) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.nombre} - {formatUSD(p.precio)}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Cantidad</Label>
                            <Input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  'cantidad',
                                  Number(e.target.value)
                                )
                              }
                              min="1"
                            />
                          </div>
                          <div>
                            <Label>Precio</Label>
                            <Input
                              type="number"
                              value={item.precio}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  'precio',
                                  Number(e.target.value)
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label>Descuento</Label>
                            <Input
                              type="number"
                              value={item.descuento || 0}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  'descuento',
                                  Number(e.target.value)
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => eliminarItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="font-bold">
                            Subtotal: {formatUSD(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={agregarItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Item
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Métodos de Pago */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Métodos de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metodosPago.map((metodo, index) => {
                      const montoOriginal = calcularMontoOriginal(
                        metodo.tipo,
                        metodo.monto
                      );
                      const descuentoPorcentaje =
                        descuentosPorMetodo[
                          metodo.tipo as keyof typeof descuentosPorMetodo
                        ] || 0;
                      const tieneDescuento =
                        descuentoPorcentaje > 0 &&
                        metodo.tipo !== 'mixto' &&
                        metodo.tipo !== 'giftcard' &&
                        metodo.tipo !== 'qr';

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 rounded-lg border p-3"
                        >
                          <Select
                            value={metodo.tipo}
                            onValueChange={(value) =>
                              actualizarMetodoPago(index, 'tipo', value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="efectivo">
                                💰 Efectivo
                              </SelectItem>
                              <SelectItem value="tarjeta">
                                💳 Tarjeta
                              </SelectItem>
                              <SelectItem value="transferencia">
                                🏦 Transferencia
                              </SelectItem>
                              <SelectItem value="qr">📱 QR</SelectItem>
                              <SelectItem value="giftcard">
                                🎁 Giftcard
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={
                                tieneDescuento
                                  ? montoOriginal.toFixed(2)
                                  : metodo.monto.toString()
                              }
                              onChange={(e) => {
                                const valor = e.target.value;
                                // Permitir solo números y punto decimal
                                if (!/^\d*\.?\d*$/.test(valor)) return;

                                const numeroValor = parseFloat(valor) || 0;
                                actualizarMetodoPago(
                                  index,
                                  'monto',
                                  tieneDescuento
                                    ? numeroValor *
                                        (1 - descuentoPorcentaje / 100)
                                    : numeroValor
                                );
                              }}
                              placeholder="Monto"
                            />
                            {tieneDescuento && (
                              <p className="mt-1 text-xs text-green-600">
                                Final: {formatUSD(metodo.monto)} (desc.{' '}
                                {descuentoPorcentaje}%)
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => eliminarMetodoPago(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      onClick={agregarMetodoPago}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Método de Pago
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen Financiero */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatUSD(subtotal)}</span>
                    </div>
                    {totalDescuentos > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuentos:</span>
                        <span>-{formatUSD(totalDescuentos)}</span>
                      </div>
                    )}
                    {totalSeña > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Seña aplicada:</span>
                        <span>-{formatUSD(totalSeña)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span>Total Final:</span>
                      <span>{formatUSD(totalFinal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Pagos:</span>
                      <span
                        className={
                          Math.abs(totalPagos - totalFinal) > 0.01
                            ? 'text-red-600'
                            : 'text-green-600'
                        }
                      >
                        {formatUSD(totalPagos)}
                      </span>
                    </div>
                    {Math.abs(totalPagos - totalFinal) > 0.01 && (
                      <div className="flex justify-between font-medium text-red-600">
                        <span>Diferencia:</span>
                        <span>{formatUSD(totalPagos - totalFinal)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Observaciones */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Observaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                    disabled={esComandaValidada}
                    className={
                      esComandaValidada ? 'bg-gray-100 text-gray-500' : ''
                    }
                  />
                  {esComandaValidada && (
                    <p className="mt-2 text-sm text-gray-500">
                      Esta comanda ha sido validada y no se puede editar
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t p-6">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={isLoading || esComandaValidada}
              className={`${esComandaValidada ? 'cursor-not-allowed bg-gray-400' : 'bg-[#f9bbc4] hover:bg-[#e292a3]'}`}
            >
              {isLoading ? (
                <>Guardando...</>
              ) : esComandaValidada ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Validada - No Editable
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
