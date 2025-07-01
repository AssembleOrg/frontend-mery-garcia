'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  Shield,
  History,
  Eye,
} from 'lucide-react';
import { EstadoComandaNegocio, EstadoValidacion } from '@/types/caja';
import ModalCambiarEstado from './ModalCambiarEstado';
import ModalValidarComanda from './ModalValidarComanda';
import ModalVerDetalles from './ModalVerDetalles';
import ModalVerHistorial from './ModalVerHistorial';

interface AccionesComandaProps {
  comandaId: string;
  estadoNegocio: EstadoComandaNegocio;
  estadoValidacion: EstadoValidacion;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeCambiarEstado: boolean;
  puedeValidar: boolean;
  puedeVerHistorial: boolean;
  onEditar?: (id: string) => void;
  onEliminar?: (id: string) => void;
}

// Configuraciones removidas después de simplificar la UI

export default function AccionesComanda({
  comandaId,
  estadoNegocio,
  puedeEditar,
  puedeEliminar,
  puedeCambiarEstado,
  puedeValidar,
  puedeVerHistorial,
  onEditar,
  onEliminar,
}: AccionesComandaProps) {
  const [modalCambiarEstado, setModalCambiarEstado] = useState(false);
  const [modalValidar, setModalValidar] = useState(false);
  const [modalVerDetalles, setModalVerDetalles] = useState(false);
  const [modalVerHistorial, setModalVerHistorial] = useState(false);
  const [alertaEliminar, setAlertaEliminar] = useState(false);

  // Convert business state to simple state for the modal
  const mapEstadoNegocioToSimple = (
    estado: EstadoComandaNegocio
  ): 'pendiente' | 'completado' | 'cancelado' => {
    switch (estado) {
      case 'completado':
        return 'completado';
      case 'incompleto':
        return 'cancelado';
      case 'pendiente':
      default:
        return 'pendiente';
    }
  };

  // Variables no utilizadas después de simplificar la UI

  const handleEliminar = () => {
    setAlertaEliminar(false);
    onEliminar?.(comandaId);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Menú de Acciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 cursor-pointer p-0 transition-colors hover:bg-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {/* Ver Detalles */}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setModalVerDetalles(true);
              }}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </DropdownMenuItem>

            {/* Ver Historial */}
            {puedeVerHistorial && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setModalVerHistorial(true);
                }}
                className="cursor-pointer"
              >
                <History className="mr-2 h-4 w-4" />
                Ver Historial
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Cambiar Estado */}
            {puedeCambiarEstado && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setModalCambiarEstado(true);
                }}
                className="cursor-pointer"
              >
                <Clock className="mr-2 h-4 w-4" />
                Cambiar Estado
              </DropdownMenuItem>
            )}

            {/* Validar (Solo Admin) */}
            {puedeValidar && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setModalValidar(true);
                }}
                className="cursor-pointer text-blue-600"
              >
                <Shield className="mr-2 h-4 w-4" />
                Validar Comanda
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Editar */}
            {puedeEditar && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEditar?.(comandaId);
                }}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}

            {/* Eliminar */}
            {puedeEliminar && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setAlertaEliminar(true);
                }}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal Cambiar Estado */}
      <ModalCambiarEstado
        isOpen={modalCambiarEstado}
        onClose={() => setModalCambiarEstado(false)}
        comandaId={comandaId}
        estadoActual={mapEstadoNegocioToSimple(estadoNegocio)}
      />

      {/* Modal Validar */}
      <ModalValidarComanda
        isOpen={modalValidar}
        onClose={() => setModalValidar(false)}
        comandaId={comandaId}
      />

      {/* Modal Ver Detalles */}
      <ModalVerDetalles
        isOpen={modalVerDetalles}
        onClose={() => setModalVerDetalles(false)}
        comandaId={comandaId}
      />

      {/* Modal Ver Historial */}
      <ModalVerHistorial
        isOpen={modalVerHistorial}
        onClose={() => setModalVerHistorial(false)}
        comandaId={comandaId}
      />

      {/* Alert Dialog Eliminar */}
      <AlertDialog open={alertaEliminar} onOpenChange={setAlertaEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comanda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la comanda #{comandaId}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
