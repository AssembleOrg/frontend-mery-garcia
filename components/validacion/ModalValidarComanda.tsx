'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { validarComanda } from '@/services/validacion.service';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useComandaStore } from '@/features/comandas/store/comandaStore';

interface ModalValidarComandaProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
  onSuccess?: () => void;
}

export default function ModalValidarComanda({
  isOpen,
  onClose,
  comandaId,
  onSuccess,
}: ModalValidarComandaProps) {
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);

  const { user } = useAuthStore();
  const { actualizarComanda } = useComandaStore();

  const handleValidar = async () => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    setCargando(true);

    try {
      const resultado = await validarComanda({
        comandaId,
        observaciones: observaciones.trim(),
        adminId: user.id,
      });

      if (resultado.exito) {
        // Actualizar el estado local de la comanda
        actualizarComanda(comandaId, {
          estadoValidacion: 'validado',
        });

        toast.success('Comanda validada exitosamente');
        onClose();
        onSuccess?.();
      } else {
        toast.error(resultado.mensaje || 'Error al validar comanda');
      }
    } catch (error) {
      console.error('Error al validar comanda:', error);
      toast.error('Error al validar comanda');
    } finally {
      setCargando(false);
    }
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
        <div
          className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Validar Comanda
                </h2>
                <p className="text-sm text-gray-600">Comanda #{comandaId}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Info */}
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Validación de Admin
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed whitespace-normal text-blue-700">
                      Al validar esta comanda, confirmas que todos los datos son
                      correctos y no podrá ser editada posteriormente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <Label htmlFor="observaciones">
                  Observaciones de Validación
                </Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Añade comentarios sobre la validación (opcional)..."
                  className="mt-2"
                  rows={4}
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
              onClick={handleValidar}
              disabled={cargando}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {cargando ? 'Validando...' : 'Validar Comanda'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
