'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  X,
  User,
  Calendar,
  DollarSign,
  Package,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
} from 'lucide-react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Comanda, EstadoComandaNegocio, EstadoValidacion } from '@/types/caja';

interface ModalVerDetallesProps {
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
};

const VALIDACION_CONFIG = {
  no_validado: {
    label: 'Sin Validar',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  validado: {
    label: 'Validado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

export default function ModalVerDetalles({
  isOpen,
  onClose,
  comandaId,
}: ModalVerDetallesProps) {
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const { obtenerComandaPorId } = useComandaStore();
  const { descuentosPorMetodo } = useConfiguracion();
  const {
    formatDual,
    formatUSD,
    formatARS,
    formatARSFromNative,
    isExchangeRateValid,
  } = useCurrencyConverter();

  useEffect(() => {
    if (isOpen && comandaId) {
      const comandaEncontrada = obtenerComandaPorId(comandaId);
      setComanda(comandaEncontrada || null);
    }
  }, [isOpen, comandaId, obtenerComandaPorId]);

  if (!isOpen || !comanda) return null;

  // Obtener configuración de estados
  const estadoNegocio =
    (comanda as Comanda & { estadoNegocio?: EstadoComandaNegocio })
      .estadoNegocio || 'pendiente';
  const estadoValidacion =
    (comanda as Comanda & { estadoValidacion?: EstadoValidacion })
      .estadoValidacion || 'no_validado';

  const estadoConfig = ESTADOS_CONFIG[estadoNegocio as EstadoComandaNegocio];
  const validacionConfig =
    VALIDACION_CONFIG[estadoValidacion as EstadoValidacion];
  const IconoEstado = estadoConfig.icon;

  const formatAmount = (monto: number) => {
    return isExchangeRateValid ? formatDual(monto) : formatUSD(monto);
  };

  const formatDate = (fecha: Date | string) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(fecha));
  };

  // Función para calcular el descuento por método de pago
  const calcularDescuentoMetodo = (tipo: string, monto: number) => {
    const porcentajeDescuento =
      descuentosPorMetodo[tipo as keyof typeof descuentosPorMetodo] || 0;
    if (porcentajeDescuento > 0) {
      const montoOriginal = monto / (1 - porcentajeDescuento / 100);
      const descuentoAplicado = montoOriginal - monto;
      return { montoOriginal, descuentoAplicado };
    }
    return { montoOriginal: monto, descuentoAplicado: 0 };
  };

  // Calcular el total de descuentos por método de pago
  const totalDescuentosMetodo = comanda.metodosPago.reduce((sum, metodo) => {
    const { descuentoAplicado } = calcularDescuentoMetodo(
      metodo.tipo,
      metodo.monto
    );
    return sum + descuentoAplicado;
  }, 0);

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
          className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <FileText className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Detalles de Comanda
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

              {/* Cliente y Personal */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Cliente */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Nombre:</span>
                        <p className="font-medium">{comanda.cliente.nombre}</p>
                      </div>
                      {comanda.cliente.telefono && (
                        <div>
                          <span className="text-sm text-gray-600">
                            Teléfono:
                          </span>
                          <p className="font-medium">
                            {comanda.cliente.telefono}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Personal */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5" />
                      Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">Unidad:</span>
                      <p className="font-medium capitalize">
                        {comanda.businessUnit}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                    {comanda.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.nombre}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.cantidad} | Precio:{' '}
                            {formatAmount(item.precio)}
                          </p>
                          {item.descuento > 0 && (
                            <p className="text-sm text-red-600">
                              Descuento: {formatAmount(item.descuento)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatAmount(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Métodos de Pago */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Detalle de Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comanda.metodosPago.map((metodo, index) => {
                      const { montoOriginal, descuentoAplicado } =
                        calcularDescuentoMetodo(metodo.tipo, metodo.monto);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {metodo.tipo === 'efectivo'
                                ? '💰 Efectivo'
                                : metodo.tipo === 'tarjeta'
                                  ? '💳 Tarjeta'
                                  : metodo.tipo === 'transferencia'
                                    ? '🏦 Transferencia'
                                    : metodo.tipo === 'giftcard'
                                      ? '🎁 Giftcard'
                                      : metodo.tipo === 'qr'
                                        ? '📱 QR'
                                        : '🔄 Mixto'}
                            </span>
                            {/* Mostrar moneda */}
                            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              {metodo.moneda || 'USD'}
                            </span>
                            {metodo.tipo === 'giftcard' && metodo.giftcard && (
                              <div className="text-xs text-gray-600">
                                <div>Nombre: {metodo.giftcard.nombre}</div>
                                <div>Código: {metodo.giftcard.codigo}</div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {/* Mostrar monto original si hay descuento */}
                            {descuentoAplicado > 0 && (
                              <p className="text-xs text-gray-500 line-through">
                                {metodo.moneda === 'ARS'
                                  ? formatARSFromNative(montoOriginal)
                                  : formatAmount(montoOriginal)}
                              </p>
                            )}
                            <p className="font-bold">
                              {metodo.moneda === 'ARS'
                                ? formatARSFromNative(metodo.monto)
                                : formatAmount(metodo.monto)}
                            </p>
                            {/* Mostrar equivalente en la otra moneda */}
                            <p className="text-xs text-gray-500">
                              {metodo.moneda === 'ARS'
                                ? `≈ ${formatAmount(metodo.monto)}`
                                : `≈ ${formatARSFromNative(metodo.monto)}`}
                            </p>
                            {/* Mostrar descuento aplicado */}
                            {descuentoAplicado > 0 && (
                              <p className="text-xs text-green-600">
                                Descuento: -
                                {metodo.moneda === 'ARS'
                                  ? formatARSFromNative(descuentoAplicado)
                                  : formatAmount(descuentoAplicado)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                    {/* Mostrar subtotal antes de descuentos */}
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>{formatAmount(comanda.subtotal)}</span>
                    </div>

                    {/* Mostrar descuentos en items */}
                    {comanda.totalDescuentos > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuentos en items:</span>
                        <span>-{formatAmount(comanda.totalDescuentos)}</span>
                      </div>
                    )}

                    {/* Mostrar descuentos por método de pago */}
                    {totalDescuentosMetodo > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento por efectivo:</span>
                        <span>-{formatAmount(totalDescuentosMetodo)}</span>
                      </div>
                    )}

                    {/* Mostrar seña aplicada */}
                    {(comanda.totalSeña || 0) > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Seña:</span>
                        <span>-{formatAmount(comanda.totalSeña)}</span>
                      </div>
                    )}

                    {/* Total final */}
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total:</span>
                      <span>{formatAmount(comanda.totalFinal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Observaciones */}
              {comanda.observaciones && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5" />
                      Observaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{comanda.observaciones}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t p-6">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
