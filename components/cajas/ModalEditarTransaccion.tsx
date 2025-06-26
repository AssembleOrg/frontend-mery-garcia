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
} from 'lucide-react';
import { toast } from 'sonner';

interface ModalEditarTransaccionProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
}

export default function ModalEditarTransaccion({
  isOpen,
  onClose,
  transactionId,
}: ModalEditarTransaccionProps) {
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
    'pendiente' | 'completado' | 'cancelado'
  >('pendiente');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  // Obtener la transacción original
  const transaccion = useMemo(() => {
    if (!transactionId) return null;
    return obtenerComandaPorId(transactionId);
  }, [transactionId, obtenerComandaPorId]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
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

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen && transaccion) {
      setCliente(transaccion.cliente.nombre);
      setTelefono(transaccion.cliente.telefono || '');
      setServicios(transaccion.items);
      setMetodoPago(transaccion.metodosPago[0]?.tipo || 'efectivo');
      setVendedor(transaccion.mainStaff?.nombre || '');
      setEstado(transaccion.estado);
      setObservaciones(transaccion.observaciones || '');
    }
  }, [isOpen, transaccion]);

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

  // Formatear montos
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Agregar nuevo servicio
  const agregarServicio = () => {
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

  // Actualizar servicio
  const actualizarServicio = (
    index: number,
    campo: keyof ItemComanda,
    valor: string | number
  ) => {
    const nuevosServicios = [...servicios];
    nuevosServicios[index] = {
      ...nuevosServicios[index],
      [campo]: valor,
    };

    // Recalcular subtotal si cambia precio o cantidad
    if (campo === 'precio' || campo === 'cantidad') {
      nuevosServicios[index].subtotal =
        nuevosServicios[index].precio * nuevosServicios[index].cantidad;
    }

    setServicios(nuevosServicios);
  };

  // Eliminar servicio
  const eliminarServicio = (index: number) => {
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

  // Guardar cambios
  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // Crear los datos actualizados - solo campos básicos para evitar errores de tipos
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

      // Actualizar en el store
      actualizarComanda(transactionId, datosActualizados);

      toast.success('Transacción actualizada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Error al actualizar la transacción');
    } finally {
      setLoading(false);
    }
  };

  // Manejar click en overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !transaccion) return null;

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
        className="relative z-[10000] mx-4 flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b p-6">
          <div className="flex items-center gap-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[#4a3540]">
              <Edit className="h-5 w-5" />
              Editar Transacción
            </h2>
            <Badge variant="outline" className="text-xs">
              #{transaccion.numero}
            </Badge>
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
                        <Input
                          id="cliente"
                          value={cliente}
                          onChange={(e) => setCliente(e.target.value)}
                          placeholder="Nombre completo"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="telefono"
                          className="text-sm font-medium"
                        >
                          Teléfono
                        </Label>
                        <Input
                          id="telefono"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          placeholder="099-123-456"
                          className="mt-1"
                        />
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
                      <Button
                        onClick={agregarServicio}
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
                      {servicios.map((servicio, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="grid flex-1 gap-2 md:grid-cols-4">
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
                          </div>
                          <Button
                            onClick={() => eliminarServicio(index)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {servicios.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                          No hay servicios agregados
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
                    <Textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Observaciones adicionales..."
                      rows={3}
                    />
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
                          <SelectItem value="efectivo">💰 Efectivo</SelectItem>
                          <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                          <SelectItem value="transferencia">
                            🏦 Transferencia
                          </SelectItem>
                          <SelectItem value="mixto">🔄 Mixto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Vendedor/Responsable
                      </Label>
                      <Select value={vendedor} onValueChange={setVendedor}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar vendedor" />
                        </SelectTrigger>
                        <SelectContent className="z-[10001]">
                          {personalSimple.map((persona) => (
                            <SelectItem key={persona.id} value={persona.nombre}>
                              {persona.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t p-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={loading}
            className="bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
