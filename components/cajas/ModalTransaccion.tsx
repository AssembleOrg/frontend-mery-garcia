'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { ItemComanda } from '@/types/caja';
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
  Edit,
  X,
  Calculator,
  DollarSign,
  Plus,
  Trash2,
  User,
  CreditCard,
  Eye,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

type ModalMode = 'view' | 'edit' | 'create';

interface ModalTransaccionProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId?: string; // undefined para create
  mode: ModalMode;
  onModeChange?: (mode: ModalMode) => void; // Para cambiar entre view/edit
}

export default function ModalTransaccion({
  isOpen,
  onClose,
  transactionId,
  mode,
  onModeChange,
}: ModalTransaccionProps) {
  const { actualizarComanda, obtenerComandaPorId, personalSimple } =
    useComandaStore();

  // Estados del formulario
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [servicios, setServicios] = useState<ItemComanda[]>([]);
  const [metodoPago, setMetodoPago] = useState<
    'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  >('efectivo');
  const [vendedor, setVendedor] = useState('');
  const [estado, setEstado] = useState<
    'pendiente' | 'completado' | 'validado' | 'cancelado'
  >('pendiente');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  // Obtener la transacción original (para view/edit)
  const transaccion = useMemo(() => {
    if (!transactionId || mode === 'create') return null;
    return obtenerComandaPorId(transactionId);
  }, [transactionId, obtenerComandaPorId, mode]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen && transaccion && (mode === 'view' || mode === 'edit')) {
      setCliente(transaccion.cliente.nombre);
      setTelefono(transaccion.cliente.telefono || '');
      setServicios(transaccion.items);
      setMetodoPago(transaccion.metodosPago[0]?.tipo || 'efectivo');
      setVendedor(transaccion.mainStaff?.nombre || '');
      setEstado(transaccion.estado);
      setObservaciones(transaccion.observaciones || '');
    } else if (mode === 'create') {
      // Limpiar formulario para crear nueva
      setCliente('');
      setTelefono('');
      setServicios([]);
      setMetodoPago('efectivo');
      setVendedor('');
      setEstado('pendiente');
      setObservaciones('');
    }
  }, [isOpen, transaccion, mode]);

  // Manejar ESC para cerrar modal
  useEffect(() => {
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

  // Cálculos
  const subtotal = useMemo(() => {
    return servicios.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0
    );
  }, [servicios]);

  const descuentoTotal = useMemo(() => {
    return servicios.reduce((sum, item) => sum + item.descuento, 0);
  }, [servicios]);

  const total = useMemo(() => {
    return subtotal - descuentoTotal;
  }, [subtotal, descuentoTotal]);

  // Detalle de métodos de pago (para mostrar en view)
  const metodosPagoDetalle = transaccion?.metodosPago || [];

  // Formatear montos
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Agregar nuevo servicio (solo en edit/create)
  const agregarServicio = () => {
    if (mode === 'view') return;

    const nuevoServicio: ItemComanda = {
      productoServicioId: `srv-${Date.now()}`,
      nombre: '',
      tipo: 'servicio',
      precio: 0,
      cantidad: 1,
      descuento: 0,
      subtotal: 0,
    };
    setServicios([...servicios, nuevoServicio]);
  };

  // Actualizar servicio (solo en edit/create)
  const actualizarServicio = (
    index: number,
    campo: keyof ItemComanda,
    valor: string | number
  ) => {
    if (mode === 'view') return;

    const nuevosServicios = [...servicios];
    nuevosServicios[index] = {
      ...nuevosServicios[index],
      [campo]: valor,
    };

    if (campo === 'precio' || campo === 'cantidad') {
      nuevosServicios[index].subtotal =
        nuevosServicios[index].precio * nuevosServicios[index].cantidad;
    }

    setServicios(nuevosServicios);
  };

  // Eliminar servicio (solo en edit/create)
  const eliminarServicio = (index: number) => {
    if (mode === 'view') return;
    setServicios(servicios.filter((_, i) => i !== index));
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!cliente.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return false;
    }

    if (servicios.length === 0) {
      toast.error('Debe agregar al menos un servicio');
      return false;
    }

    if (servicios.some((s) => !s.nombre.trim() || s.precio <= 0)) {
      toast.error('Todos los servicios deben tener nombre y precio válido');
      return false;
    }

    return true;
  };

  // Guardar cambios (edit/create)
  const handleGuardar = async () => {
    if (mode === 'view') return;
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      if (mode === 'edit' && transactionId) {
        // Actualizar transacción existente
        const datosActualizados = {
          cliente: {
            nombre: cliente.trim(),
            telefono: telefono.trim() || undefined,
          },
          items: servicios,
          subtotal,
          totalDescuentos: descuentoTotal,
          totalFinal: metodoPago === 'tarjeta' ? total * 1.35 : total,
          estado,
          observaciones: observaciones.trim() || undefined,
        };

        actualizarComanda(transactionId, datosActualizados);
        toast.success('Transacción actualizada exitosamente');
      } else if (mode === 'create') {
        // Crear nueva transacción
        // TODO: Implementar creación con useComandaForm
        toast.success('Transacción creada exitosamente');
      }

      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Error al guardar la transacción');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar a modo edición
  const handleEditMode = () => {
    if (onModeChange) {
      onModeChange('edit');
    }
  };

  // Volver a modo vista
  const handleViewMode = () => {
    if (onModeChange) {
      onModeChange('view');
    }
  };

  // Manejar click en overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Configuración según el modo
  const config = {
    view: {
      title: 'Ver Detalles',
      icon: Eye,
      showActions: false,
      readonly: true,
    },
    edit: {
      title: 'Editar Transacción',
      icon: Edit,
      showActions: true,
      readonly: false,
    },
    create: {
      title: 'Nueva Transacción',
      icon: Plus,
      showActions: true,
      readonly: false,
    },
  }[mode];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleOverlayClick}
        style={{ zIndex: 9999 }}
      />

      {/* Modal Container */}
      <div
        className="relative z-[10000] mx-4 flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b p-6">
          <div className="flex items-center gap-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[#4a3540]">
              <config.icon className="h-5 w-5" />
              {config.title}
            </h2>
            {transaccion && (
              <Badge variant="outline" className="text-xs">
                #{transaccion.numero}
              </Badge>
            )}
            {mode === 'view' && (
              <Badge
                className={`text-xs ${
                  estado === 'completado'
                    ? 'bg-green-100 text-green-700'
                    : estado === 'pendiente'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {estado === 'completado'
                  ? '✅ Completado'
                  : estado === 'pendiente'
                    ? '⏳ Pendiente'
                    : '❌ Cancelado'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botón para cambiar a edición (solo en view) */}
            {mode === 'view' && onModeChange && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditMode}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}

            {/* Botón para volver a vista (solo en edit) */}
            {mode === 'edit' && onModeChange && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewMode}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Ver
              </Button>
            )}

            {/* Botón cerrar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Columna Principal - 2/3 */}
              <div className="space-y-6 lg:col-span-2">
                {/* Información del Cliente */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label
                          htmlFor="cliente"
                          className="text-sm font-medium"
                        >
                          Nombre del Cliente *
                        </Label>
                        {config.readonly ? (
                          <div className="mt-1 rounded border bg-gray-50 px-3 py-2 text-sm">
                            {cliente || 'Sin especificar'}
                          </div>
                        ) : (
                          <Input
                            id="cliente"
                            value={cliente}
                            onChange={(e) => setCliente(e.target.value)}
                            placeholder="Nombre completo"
                            className="mt-1"
                          />
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="telefono"
                          className="text-sm font-medium"
                        >
                          Teléfono
                        </Label>
                        {config.readonly ? (
                          <div className="mt-1 rounded border bg-gray-50 px-3 py-2 text-sm">
                            {telefono || 'Sin especificar'}
                          </div>
                        ) : (
                          <Input
                            id="telefono"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            placeholder="099-123-456"
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Servicios */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calculator className="h-4 w-4" />
                        Servicios
                      </CardTitle>
                      {!config.readonly && (
                        <Button
                          onClick={agregarServicio}
                          size="sm"
                          variant="outline"
                          className="h-8"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Agregar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {servicios.map((servicio, index) => (
                        <div
                          key={`${mode}-service-${index}-${servicio.productoServicioId}`}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="grid flex-1 gap-2 md:grid-cols-4">
                            {config.readonly ? (
                              <>
                                <div className="rounded border bg-gray-50 px-3 py-2 text-sm md:col-span-2">
                                  {servicio.nombre}
                                </div>
                                <div className="rounded border bg-gray-50 px-3 py-2 text-sm">
                                  {formatAmount(servicio.precio)}
                                </div>
                                <div className="rounded border bg-gray-50 px-3 py-2 text-sm">
                                  {servicio.cantidad}
                                </div>
                              </>
                            ) : (
                              <>
                                <Input
                                  placeholder="Nombre del servicio"
                                  value={servicio.nombre}
                                  onChange={(e) =>
                                    actualizarServicio(
                                      index,
                                      'nombre',
                                      e.target.value
                                    )
                                  }
                                  className="md:col-span-2"
                                />
                                <Input
                                  type="number"
                                  placeholder="Precio"
                                  value={servicio.precio || ''}
                                  onChange={(e) =>
                                    actualizarServicio(
                                      index,
                                      'precio',
                                      Number(e.target.value)
                                    )
                                  }
                                />
                                <Input
                                  type="number"
                                  placeholder="Cant."
                                  value={servicio.cantidad || 1}
                                  onChange={(e) =>
                                    actualizarServicio(
                                      index,
                                      'cantidad',
                                      Number(e.target.value)
                                    )
                                  }
                                  min="1"
                                />
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {formatAmount(servicio.subtotal)}
                              </div>
                            </div>

                            {!config.readonly && (
                              <Button
                                onClick={() => eliminarServicio(index)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {servicios.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                          No hay servicios{' '}
                          {mode === 'create' ? 'agregados' : 'registrados'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Observaciones */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {config.readonly ? (
                      <div className="min-h-[80px] rounded border bg-gray-50 px-3 py-2 text-sm">
                        {observaciones || 'Sin observaciones'}
                      </div>
                    ) : (
                      <Textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Observaciones adicionales..."
                        rows={3}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Columna Lateral - 1/3 */}
              <div className="space-y-6">
                {/* Configuración */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="h-4 w-4" />
                      Configuración
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Método de Pago
                      </Label>
                      {config.readonly ? (
                        <div className="mt-1 rounded border bg-gray-50 px-3 py-2 text-sm">
                          {metodoPago === 'efectivo'
                            ? '💰 Efectivo'
                            : metodoPago === 'tarjeta'
                              ? '💳 Tarjeta'
                              : metodoPago === 'transferencia'
                                ? '🏦 Transferencia'
                                : '🔄 Mixto'}
                        </div>
                      ) : (
                        <Select
                          value={metodoPago}
                          onValueChange={(value) =>
                            setMetodoPago(value as typeof metodoPago)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            <SelectItem value="efectivo">
                              💰 Efectivo
                            </SelectItem>
                            <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                            <SelectItem value="transferencia">
                              🏦 Transferencia
                            </SelectItem>
                            <SelectItem value="mixto">🔄 Mixto</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Vendedor/Responsable
                      </Label>
                      {config.readonly ? (
                        <div className="mt-1 rounded border bg-gray-50 px-3 py-2 text-sm">
                          {vendedor || 'Sin asignar'}
                        </div>
                      ) : (
                        <Select value={vendedor} onValueChange={setVendedor}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccionar vendedor" />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            {personalSimple.map((persona) => (
                              <SelectItem
                                key={persona.id}
                                value={persona.nombre}
                              >
                                {persona.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {!config.readonly && (
                      <div>
                        <Label className="text-sm font-medium">Estado</Label>
                        <Select
                          value={estado}
                          onValueChange={(value) =>
                            setEstado(value as typeof estado)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            <SelectItem value="pendiente">
                              ⏳ Pendiente
                            </SelectItem>
                            <SelectItem value="completado">
                              ✅ Completado
                            </SelectItem>
                            <SelectItem value="cancelado">
                              ❌ Cancelado
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                      <span>{formatAmount(subtotal)}</span>
                    </div>

                    {descuentoTotal > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Descuentos:</span>
                        <span>-{formatAmount(descuentoTotal)}</span>
                      </div>
                    )}

                    {metodoPago === 'tarjeta' && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Recargo (35%):</span>
                        <span>+{formatAmount(total * 0.35)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-[#4a3540]">
                        {formatAmount(
                          metodoPago === 'tarjeta' ? total * 1.35 : total
                        )}
                      </span>
                    </div>

                    {/* Detalle de pagos cuando es mixto */}
                    {metodosPagoDetalle.length > 1 && (
                      <div className="space-y-2 text-sm">
                        <Separator />
                        <span className="font-medium">Detalle de Pagos:</span>
                        {metodosPagoDetalle.map((mp, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between rounded-md bg-gray-50 px-3 py-1"
                          >
                            <span>
                              {mp.tipo === 'efectivo'
                                ? '💰 Efectivo'
                                : mp.tipo === 'tarjeta'
                                  ? '💳 Tarjeta'
                                  : '🏦 Transferencia'}
                            </span>
                            <span>
                              {formatAmount(mp.montoFinal || mp.monto)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t p-6">
          <Button variant="outline" onClick={onClose}>
            {mode === 'view' ? 'Cerrar' : 'Cancelar'}
          </Button>

          {config.showActions && (
            <Button
              onClick={handleGuardar}
              disabled={loading}
              className="flex items-center gap-2 bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
            >
              <Save className="h-4 w-4" />
              {loading
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear Transacción'
                  : 'Guardar Cambios'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
