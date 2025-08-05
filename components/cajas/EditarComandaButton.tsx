'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { ComandaNew, EstadoDeComandaNew } from '@/services/unidadNegocio.service';
import ModalEditarComanda from './ModalEditarComanda';

interface EditarComandaButtonProps {
  comanda: ComandaNew;
  className?: string;
}

export default function EditarComandaButton({
  comanda,
  className = '',
}: EditarComandaButtonProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  // Solo mostrar el botón para comandas pendientes
  const esPendiente = comanda.estadoDeComanda === EstadoDeComandaNew.PENDIENTE;

  if (!esPendiente) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowEditModal(true)}
        className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${className}`}
        title="Editar comanda"
      >
        <Edit className="h-4 w-4" />
      </Button>

      <ModalEditarComanda
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        comandaId={comanda.id}
      />
    </>
  );
} 