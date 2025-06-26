'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  History,
  Shield,
  Edit,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { HistorialCambio } from '@/types/caja';
import { obtenerHistorialComanda } from '@/services/validacion.service';
import { logger } from '@/lib/utils';

interface ModalVerHistorialProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
}

const ACCIONES_CONFIG = {
  creacion: {
    label: 'Creación',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Plus,
  },
  cambio_estado: {
    label: 'Cambio de Estado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Edit,
  },
  validacion: {
    label: 'Validación',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Shield,
  },
  edicion: {
    label: 'Edición',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Edit,
  },
  eliminacion: {
    label: 'Eliminación',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
};

const ESTADOS_CONFIG = {
  pendiente: { label: 'Pendiente', icon: Clock },
  completo: { label: 'Completo', icon: CheckCircle },
  incompleto: { label: 'Incompleto', icon: XCircle },
  no_validado: { label: 'Sin Validar', icon: Clock },
  validado: { label: 'Validado', icon: Shield },
};

export default function ModalVerHistorial({
  isOpen,
  onClose,
  comandaId,
}: ModalVerHistorialProps) {
  const [historial, setHistorial] = useState<HistorialCambio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const resultado = await obtenerHistorialComanda(comandaId);

      if (resultado.exito && resultado.data?.historial) {
        setHistorial(
          Array.isArray(resultado.data.historial)
            ? resultado.data.historial
            : []
        );
        logger.success('Historial cargado exitosamente');
      } else {
        setError(resultado.mensaje || 'Error al cargar historial');
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setError(mensaje);
      logger.error('Error al cargar historial:', err);
    } finally {
      setCargando(false);
    }
  }, [comandaId]);

  useEffect(() => {
    if (isOpen && comandaId) {
      cargarHistorial();
    }
  }, [isOpen, comandaId, cargarHistorial]);

  const formatDate = (fecha: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(fecha));
  };

  const renderCambio = (cambio: HistorialCambio) => {
    const accionConfig =
      ACCIONES_CONFIG[cambio.accion] || ACCIONES_CONFIG.edicion;
    const IconoAccion = accionConfig.icon;

    return (
      <div key={cambio.id} className="relative">
        {/* Línea de tiempo */}
        <div className="absolute top-12 left-6 h-full w-0.5 bg-gray-200"></div>

        <div className="flex gap-4">
          {/* Icono de acción */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white ${accionConfig.color}`}
          >
            <IconoAccion className="h-5 w-5" />
          </div>

          {/* Contenido del cambio */}
          <div className="flex-1 pb-6">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={accionConfig.color}>
                      {accionConfig.label}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      por {cambio.usuario}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(cambio.fecha)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Cambios de estado */}
                {cambio.estadoAnterior && cambio.estadoNuevo && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Estado anterior:</span>
                      {renderEstado(cambio.estadoAnterior)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Estado nuevo:</span>
                      {renderEstado(cambio.estadoNuevo)}
                    </div>
                  </div>
                )}

                {/* Observaciones */}
                {cambio.observaciones && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600">
                      Observaciones:
                    </span>
                    <p className="mt-1 rounded bg-gray-50 p-2 text-sm text-gray-800">
                      {cambio.observaciones}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderEstado = (estado: Record<string, unknown>) => {
    const estados = [];

    if (estado.estado) {
      const config =
        ESTADOS_CONFIG[estado.estado as keyof typeof ESTADOS_CONFIG];
      if (config) {
        const Icono = config.icon;
        estados.push(
          <Badge
            key="estado"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Icono className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      }
    }

    if (estado.estadoValidacion) {
      const config =
        ESTADOS_CONFIG[estado.estadoValidacion as keyof typeof ESTADOS_CONFIG];
      if (config) {
        const Icono = config.icon;
        estados.push(
          <Badge
            key="validacion"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Icono className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      }
    }

    return estados.length > 0 ? (
      <div className="flex gap-1">{estados}</div>
    ) : (
      <span className="text-gray-500">-</span>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <History className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Historial de Cambios
                </h2>
                <p className="text-sm text-gray-600">
                  Auditoría completa de la comanda #{comandaId}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6">
            {cargando ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#f9bbc4] border-t-transparent"></div>
                  <p className="text-gray-600">Cargando historial...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <XCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
                  <p className="font-medium text-red-600">
                    Error al cargar historial
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cargarHistorial}
                    className="mt-3"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : historial.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <History className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="font-medium text-gray-600">Sin historial</p>
                  <p className="mt-1 text-sm text-gray-500">
                    No hay cambios registrados para esta comanda
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Resumen */}
                <div className="mb-6">
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total de cambios:</span>
                        <span className="font-bold">{historial.length}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Último cambio:</span>
                        <span className="font-medium">
                          {formatDate(historial[0]?.fecha || '')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {historial.map((cambio) => renderCambio(cambio))}
                </div>
              </div>
            )}
          </ScrollArea>

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
