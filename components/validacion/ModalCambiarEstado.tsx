'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { toast } from 'sonner';

// Tipo simplificado para estados de tabla
type EstadoSimple = 'pendiente' | 'completado' | 'cancelado';

interface ModalCambiarEstadoProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
  estadoActual: EstadoSimple;
  onSuccess?: () => void;
}

const ESTADOS_OPCIONES = [
  {
    value: 'pendiente' as EstadoSimple,
    label: 'Pendiente',
    description: 'Transacción pendiente de completar',
    icon: Clock,
    color: 'text-yellow-600',
    emoji: '⏳',
  },
  {
    value: 'completado' as EstadoSimple,
    label: 'Completado',
    description: 'Transacción completada exitosamente',
    icon: CheckCircle,
    color: 'text-green-600',
    emoji: '✅',
  },
  {
    value: 'cancelado' as EstadoSimple,
    label: 'Cancelado',
    description: 'Transacción cancelada',
    icon: XCircle,
    color: 'text-red-600',
    emoji: '❌',
  },
];

export default function ModalCambiarEstado({
  isOpen,
  onClose,
  comandaId,
  estadoActual,
  onSuccess,
}: ModalCambiarEstadoProps) {
  const [nuevoEstado, setNuevoEstado] = useState<EstadoSimple>(estadoActual);
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);

  const { actualizarComanda } = useComandaStore();

  const handleGuardar = async () => {
    if (nuevoEstado === estadoActual) {
      toast.error('Selecciona un estado diferente al actual');
      return;
    }

    setCargando(true);

    try {
      // Actualizar el estado directamente en el store
      actualizarComanda(comandaId, {
        estado: nuevoEstado,
        observaciones: observaciones.trim() || undefined,
      });

      toast.success(`Estado cambiado a "${nuevoEstado}" exitosamente`);
      onClose();
      onSuccess?.();
      // Reset form
      setObservaciones('');
      setNuevoEstado(estadoActual);
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Error al cambiar estado');
    } finally {
      setCargando(false);
    }
  };

  const estadoSeleccionado = ESTADOS_OPCIONES.find(
    (e) => e.value === nuevoEstado
  );

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
        <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <Clock className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Cambiar Estado
                </h2>
                <p className="text-sm text-gray-600">
                  Transacción #{comandaId}
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
              {/* Estado Actual */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Estado Actual
                </Label>
                <div className="mt-2">
                  {ESTADOS_OPCIONES.map((estado) => {
                    if (estado.value !== estadoActual) return null;
                    const IconoEstado = estado.icon;
                    return (
                      <div
                        key={estado.value}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <span className="text-lg">{estado.emoji}</span>
                        <IconoEstado className={`h-5 w-5 ${estado.color}`} />
                        <div>
                          <div className="font-medium">{estado.label}</div>
                          <div className="text-sm text-gray-500">
                            {estado.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nuevo Estado */}
              <div>
                <Label htmlFor="nuevoEstado">Nuevo Estado *</Label>
                <Select
                  value={nuevoEstado}
                  onValueChange={(value) =>
                    setNuevoEstado(value as EstadoSimple)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_OPCIONES.map((estado) => {
                      const IconoEstado = estado.icon;
                      return (
                        <SelectItem key={estado.value} value={estado.value}>
                          <div className="flex items-center gap-2">
                            <span>{estado.emoji}</span>
                            <IconoEstado
                              className={`h-4 w-4 ${estado.color}`}
                            />
                            <div>
                              <div className="font-medium">{estado.label}</div>
                              <div className="text-xs text-gray-500">
                                {estado.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Observaciones */}
              <div>
                <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder={
                    nuevoEstado === 'completado'
                      ? 'Describe qué se completó...'
                      : 'Observaciones opcionales...'
                  }
                  className="mt-2"
                  rows={3}
                />
              </div>


            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t p-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={cargando}
              className="flex-1 bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
            >
              {cargando ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
