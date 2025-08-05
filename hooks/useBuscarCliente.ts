import { useState } from 'react';
import { ClienteNew } from '@/services/unidadNegocio.service';

interface UseBuscarClienteReturn {
  isOpen: boolean;
  clienteSeleccionado: ClienteNew | null;
  abrirBusqueda: () => void;
  cerrarBusqueda: () => void;
  seleccionarCliente: (cliente: ClienteNew) => void;
  limpiarSeleccion: () => void;
}

export function useBuscarCliente(): UseBuscarClienteReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteNew | null>(null);

  const abrirBusqueda = () => {
    setIsOpen(true);
  };

  const cerrarBusqueda = () => {
    setIsOpen(false);
  };

  const seleccionarCliente = (cliente: ClienteNew) => {
    setClienteSeleccionado(cliente);
    setIsOpen(false);
  };

  const limpiarSeleccion = () => {
    setClienteSeleccionado(null);
  };

  return {
    isOpen,
    clienteSeleccionado,
    abrirBusqueda,
    cerrarBusqueda,
    seleccionarCliente,
    limpiarSeleccion,
  };
} 