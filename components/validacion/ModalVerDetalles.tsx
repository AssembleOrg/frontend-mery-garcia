'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  completo: {
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
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
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
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Nombre:</span>
                      <p className="font-medium">{comanda.cliente.nombre}</p>
                    </div>
                    {comanda.cliente.telefono && (
                      <div>
                        <span className="text-sm text-gray-600">Teléfono:</span>
                        <p className="font-medium">
                          {comanda.cliente.telefono}
                        </p>
                      </div>
                    )}
                    {comanda.cliente.cuit && (
                      <div>
                        <span className="text-sm text-gray-600">CUIT:</span>
                        <p className="font-medium">{comanda.cliente.cuit}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Personal */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5" />
                      Personal Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <span className="text-sm text-gray-600">Nombre:</span>
                      <p className="font-medium">
                        {comanda.mainStaff?.nombre || 'Sin asignar'}
                      </p>
                    </div>
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
                    Métodos de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comanda.metodosPago.map((metodo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {metodo.tipo}
                          </p>
                          {metodo.recargoPorcentaje > 0 && (
                            <p className="text-sm text-orange-600">
                              Recargo: {metodo.recargoPorcentaje}%
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Base: {formatAmount(metodo.monto)}
                          </p>
                          <p className="font-bold">
                            Total: {formatAmount(metodo.montoFinal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen Financiero */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    Resumen Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatAmount(comanda.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Descuentos:</span>
                      <span>-{formatAmount(comanda.totalDescuentos)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Recargos:</span>
                      <span>+{formatAmount(comanda.totalRecargos)}</span>
                    </div>
                    {comanda.seña && (
                      <div className="flex justify-between text-blue-600">
                        <span>Seña:</span>
                        <span>-{formatAmount(comanda.totalSeña)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Final:</span>
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
