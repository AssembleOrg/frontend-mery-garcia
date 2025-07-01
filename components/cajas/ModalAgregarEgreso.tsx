'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  DollarSign,
  Save,
  X,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { Comanda, ItemComanda, MetodoPago } from '@/types/caja';
import {
  useInitializeComandaStore,
  generateUniqueId,
} from '@/hooks/useInitializeComandaStore';
import { logger } from '@/lib/utils';

interface ModalAgregarEgresoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ItemEgreso {
  id: string;
  productoServicioId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  descripcion?: string;
}

interface MetodoPagoForm {
  tipo: 'efectivo' | 'tarjeta' | 'transferencia';
  monto: number;
  recargoPorcentaje: number;
  montoFinal: number;
}

export default function ModalAgregarEgreso({
  isOpen,
  onClose,
  onSuccess,
}: ModalAgregarEgresoProps) {
  // Store hooks
  const {
    agregarComanda,
    obtenerProximoNumero,
    personalSimple,
    productosServicios,
    configuracionRecargos,
    cargando,
  } = useComandaStore();

  // Ensure the comanda store is initialized (prevents empty selectors)
  useInitializeComandaStore();

  // Form state - SIN unidad de negocio, CON proveedor
  const [proveedor, setProveedor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemEgreso[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPagoForm[]>([
    { tipo: 'efectivo', monto: 0, recargoPorcentaje: 0, montoFinal: 0 },
  ]);

  // UI state
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Bloquear scroll del body cuando el modal está abierto (REGLAS UX)
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

  // Add new item
  const agregarItem = () => {
    const nuevoItem: ItemEgreso = {
      id: `temp-${Date.now()}`,
      productoServicioId: '',
      nombre: '',
      precio: 0,
      cantidad: 1,
      subtotal: 0,
      descripcion: '',
    };
    setItems([...items, nuevoItem]);
  };

  // Remove item
  const eliminarItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Update item
  const actualizarItem = (
    id: string,
    campo: keyof ItemEgreso,
    valor: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [campo]: valor };

          // Recalcular subtotal
          if (campo === 'cantidad' || campo === 'precio') {
            updatedItem.subtotal = updatedItem.precio * updatedItem.cantidad;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const seleccionarProductoServicio = (itemId: string, productoId: string) => {
    const producto = productosServicios.find((p) => p.id === productoId);
    if (producto) {
      actualizarItem(itemId, 'productoServicioId', producto.id);
      actualizarItem(itemId, 'nombre', producto.nombre);
      actualizarItem(itemId, 'precio', producto.precio);
    }
  };

  // Add payment method
  const agregarMetodoPago = () => {
    const nuevoMetodo: MetodoPagoForm = {
      tipo: 'efectivo',
      monto: 0,
      recargoPorcentaje: 0,
      montoFinal: 0,
    };
    setMetodosPago([...metodosPago, nuevoMetodo]);
  };

  // Remove payment method
  const eliminarMetodoPago = (index: number) => {
    if (metodosPago.length > 1) {
      setMetodosPago(metodosPago.filter((_, i) => i !== index));
    }
  };

  // Update payment method
  const actualizarMetodoPago = (
    index: number,
    campo: keyof MetodoPagoForm,
    valor: string | number
  ) => {
    const nuevosMetodos = [...metodosPago];
    nuevosMetodos[index] = { ...nuevosMetodos[index], [campo]: valor };

    // Calcular recargo automáticamente
    if (campo === 'tipo' || campo === 'monto') {
      const metodo = nuevosMetodos[index];
      const configuracion = configuracionRecargos.find(
        (c) => c.metodoPago === metodo.tipo && c.activo
      );

      metodo.recargoPorcentaje = configuracion?.porcentaje || 0;
      metodo.montoFinal =
        metodo.monto + (metodo.monto * metodo.recargoPorcentaje) / 100;
    }

    setMetodosPago(nuevosMetodos);
  };

  // Calculate totals
  const calcularTotales = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalRecargos = metodosPago.reduce(
      (sum, mp) => sum + (mp.montoFinal - mp.monto),
      0
    );
    const totalFinal = subtotal + totalRecargos;
    const totalPagado = metodosPago.reduce((sum, mp) => sum + mp.montoFinal, 0);
    const diferencia = totalFinal - totalPagado;

    return {
      subtotal,
      totalRecargos,
      totalFinal,
      totalPagado,
      diferencia,
    };
  };

  // Validate form
  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!proveedor.trim()) {
      nuevosErrores.proveedor = 'El proveedor es obligatorio';
    }

    if (!responsableId) {
      nuevosErrores.responsable = 'Debe seleccionar un responsable';
    }

    if (items.length === 0) {
      nuevosErrores.items = 'Debe agregar al menos un concepto';
    }

    items.forEach((item, index) => {
      if (!item.nombre.trim()) {
        nuevosErrores[`item-${index}-nombre`] = 'El nombre es obligatorio';
      }
      if (item.precio <= 0) {
        nuevosErrores[`item-${index}-precio`] = 'El precio debe ser mayor a 0';
      }
      if (item.cantidad <= 0) {
        nuevosErrores[`item-${index}-cantidad`] =
          'La cantidad debe ser mayor a 0';
      }
    });

    const totales = calcularTotales();
    if (Math.abs(totales.diferencia) > 0.01) {
      nuevosErrores.pagos =
        'El total de métodos de pago debe coincidir con el total final';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Save form
  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    setGuardando(true);

    try {
      // Preparar items para la comanda
      const itemsComanda: ItemComanda[] = items.map((item) => ({
        productoServicioId:
          item.productoServicioId || generateUniqueId('item', Date.now()),
        nombre: item.nombre,
        tipo: 'producto' as const,
        precio: item.precio,
        cantidad: item.cantidad,
        descuento: 0,
        subtotal: item.subtotal,
        personalId: responsableId,
      }));

      // Preparar métodos de pago
      const metodosPagoComanda: MetodoPago[] = metodosPago.map((mp) => ({
        tipo: mp.tipo,
        monto: mp.monto,
        recargoPorcentaje: mp.recargoPorcentaje,
        montoFinal: mp.montoFinal,
      }));

      // Encontrar el personal responsable
      const responsable = personalSimple.find((p) => p.id === responsableId);

      const nuevaComanda: Comanda = {
        id: generateUniqueId('cmd-egr', Date.now()),
        numero: obtenerProximoNumero('egreso'),
        fecha: new Date(),
        businessUnit: 'estilismo', // Para egresos usamos estilismo por defecto
        cliente: {
          nombre: proveedor,
          telefono: telefono,
        },
        mainStaff: responsable
          ? {
              id: responsable.id,
              nombre: responsable.nombre,
              comisionPorcentaje: responsable.comision,
              activo: true,
              unidadesDisponibles: ['estilismo'],
              fechaIngreso: new Date(),
            }
          : {
              id: 'default',
              nombre: 'Sistema',
              comisionPorcentaje: 0,
              activo: true,
              unidadesDisponibles: ['estilismo'],
              fechaIngreso: new Date(),
            },
        items: itemsComanda,
        metodosPago: metodosPagoComanda,
        subtotal: calcularTotales().subtotal,
        totalDescuentos: 0,
        totalRecargos: calcularTotales().totalRecargos,
        totalSeña: 0,
        totalFinal: calcularTotales().totalFinal,
        comisiones: [],
        estado: 'pendiente', // Los egresos empiezan pendientes como los ingresos
        observaciones: observaciones || undefined,
        tipo: 'egreso',
      };

      // Add to store
      agregarComanda(nuevaComanda);

      logger.success('Egreso agregado exitosamente');

      // Reset form
      resetForm();

      // Close modal and notify success
      onClose();
      onSuccess?.();
    } catch (error) {
      logger.error('Error al guardar el egreso:', error);
    } finally {
      setGuardando(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setProveedor('');
    setTelefono('');
    setResponsableId('');
    setObservaciones('');
    setItems([]);
    setMetodosPago([
      { tipo: 'efectivo', monto: 0, recargoPorcentaje: 0, montoFinal: 0 },
    ]);
    setErrores({});
  };

  // Format currency
  const formatearPesos = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Get payment method icon
  const getPaymentIcon = (tipo: string) => {
    switch (tipo) {
      case 'efectivo':
        return <Banknote className="h-4 w-4" />;
      case 'tarjeta':
        return <CreditCard className="h-4 w-4" />;
      case 'transferencia':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Initialize first item when modal opens

  useEffect(() => {
    if (isOpen && items.length === 0) {
      agregarItem();
    }
  }, [isOpen]);

  // Auto-distribute payment amounts

  useEffect(() => {
    const totales = calcularTotales();
    if (metodosPago.length === 1 && totales.subtotal > 0) {
      actualizarMetodoPago(0, 'monto', totales.subtotal);
    }
  }, [items]);

  const totales = calcularTotales();

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Modal Container */}
      <div
        className="relative z-[10000] mx-4 flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-[#4a3540]">
            <Plus className="h-5 w-5 text-[#f9bbc4]" />
            Agregar Nuevo Egreso
          </h2>
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
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="border border-[#f9bbc4]/20 bg-white/90">
                <CardHeader>
                  <CardTitle className="text-sm text-[#4a3540]">
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="proveedor">Proveedor *</Label>
                      <Input
                        id="proveedor"
                        value={proveedor}
                        onChange={(e) => setProveedor(e.target.value)}
                        placeholder="Nombre del proveedor"
                        className={errores.proveedor ? 'border-red-500' : ''}
                      />
                      {errores.proveedor && (
                        <p className="mt-1 text-sm text-red-600">
                          {errores.proveedor}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Teléfono del proveedor"
                      />
                    </div>

                    <div>
                      <Label htmlFor="responsable">Responsable *</Label>
                      <Select
                        value={responsableId}
                        onValueChange={setResponsableId}
                      >
                        <SelectTrigger
                          className={
                            errores.responsable ? 'border-red-500' : ''
                          }
                        >
                          <SelectValue placeholder="Seleccionar responsable" />
                        </SelectTrigger>
                        <SelectContent className="z-[10001]">
                          {personalSimple.map((persona) => (
                            <SelectItem key={persona.id} value={persona.id}>
                              {persona.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errores.responsable && (
                        <p className="mt-1 text-sm text-red-600">
                          {errores.responsable}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Observaciones adicionales"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="border border-[#f9bbc4]/20 bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm text-[#4a3540]">
                    <span>Conceptos</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={agregarItem}
                      className="border-[#f9bbc4] bg-[#f9bbc4] font-medium text-white hover:bg-[#e292a3]"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Concepto
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Badge variant="outline">Concepto #{index + 1}</Badge>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div>
                          <Label>Concepto *</Label>
                          <Input
                            value={item.nombre}
                            onChange={(e) =>
                              actualizarItem(item.id, 'nombre', e.target.value)
                            }
                            placeholder="Descripción del concepto"
                            className={
                              errores[`item-${index}-nombre`]
                                ? 'border-red-500'
                                : ''
                            }
                          />
                          {errores[`item-${index}-nombre`] && (
                            <p className="mt-1 text-xs text-red-600">
                              {errores[`item-${index}-nombre`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Precio *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio || ''}
                            onChange={(e) =>
                              actualizarItem(
                                item.id,
                                'precio',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className={
                              errores[`item-${index}-precio`]
                                ? 'border-red-500'
                                : ''
                            }
                          />
                          {errores[`item-${index}-precio`] && (
                            <p className="mt-1 text-xs text-red-600">
                              {errores[`item-${index}-precio`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.cantidad || ''}
                            onChange={(e) =>
                              actualizarItem(
                                item.id,
                                'cantidad',
                                parseInt(e.target.value) || 1
                              )
                            }
                            className={
                              errores[`item-${index}-cantidad`]
                                ? 'border-red-500'
                                : ''
                            }
                          />
                          {errores[`item-${index}-cantidad`] && (
                            <p className="mt-1 text-xs text-red-600">
                              {errores[`item-${index}-cantidad`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Subtotal</Label>
                          <div className="flex h-10 items-center rounded-md border bg-gray-50 px-3 text-sm font-medium">
                            {formatearPesos(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {errores.items && (
                    <p className="text-sm text-red-600">{errores.items}</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="border border-[#f9bbc4]/20 bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm text-[#4a3540]">
                    <span>Métodos de Pago</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={agregarMetodoPago}
                      className="border-[#f9bbc4] bg-[#f9bbc4] font-medium text-white hover:bg-[#e292a3]"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Método
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metodosPago.map((metodo, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(metodo.tipo)}
                          <Badge variant="outline">Método #{index + 1}</Badge>
                        </div>
                        {metodosPago.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarMetodoPago(index)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div>
                          <Label>Tipo</Label>
                          <Select
                            value={metodo.tipo}
                            onValueChange={(value) =>
                              actualizarMetodoPago(index, 'tipo', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[10001]">
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="tarjeta">Tarjeta</SelectItem>
                              <SelectItem value="transferencia">
                                Transferencia
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Monto</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={metodo.monto || ''}
                            onChange={(e) =>
                              actualizarMetodoPago(
                                index,
                                'monto',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label>Recargo (%)</Label>
                          <div className="flex h-10 items-center rounded-md border bg-gray-50 px-3 text-sm font-medium">
                            {metodo.recargoPorcentaje}%
                          </div>
                        </div>

                        <div>
                          <Label>Total Final</Label>
                          <div className="flex h-10 items-center rounded-md border bg-gray-50 px-3 text-sm font-medium">
                            {formatearPesos(metodo.montoFinal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {errores.pagos && (
                    <p className="text-sm text-red-600">{errores.pagos}</p>
                  )}
                </CardContent>
              </Card>

              {/* Totals */}
              <Card className="border border-[#f9bbc4]/20 bg-white/90">
                <CardHeader>
                  <CardTitle className="text-sm text-[#4a3540]">
                    Resumen de Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-3 text-center">
                      <div className="text-sm text-blue-600">Subtotal</div>
                      <div className="text-lg font-semibold text-blue-800">
                        {formatearPesos(totales.subtotal)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-orange-50 p-3 text-center">
                      <div className="text-sm text-orange-600">Recargos</div>
                      <div className="text-lg font-semibold text-orange-800">
                        {formatearPesos(totales.totalRecargos)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-green-50 p-3 text-center">
                      <div className="text-sm text-green-600">Total Final</div>
                      <div className="text-lg font-semibold text-green-800">
                        {formatearPesos(totales.totalFinal)}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <div className="text-sm text-gray-600">Diferencia</div>
                      <div
                        className={`text-lg font-semibold ${
                          Math.abs(totales.diferencia) < 0.01
                            ? 'text-green-800'
                            : 'text-red-800'
                        }`}
                      >
                        {Math.abs(totales.diferencia) < 0.01
                          ? '✓'
                          : formatearPesos(totales.diferencia)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t p-6">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>

          <Button
            onClick={handleGuardar}
            disabled={guardando || cargando}
            className="bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] hover:from-[#e292a3] hover:to-[#d4a7ca]"
          >
            {guardando ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Egreso
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
