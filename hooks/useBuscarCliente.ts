import { useState } from 'react';
import { Cliente } from '@/types/caja';

interface UseBuscarClienteReturn {
  isOpen: boolean;
  clienteSeleccionado: Cliente | null;
  abrirBusqueda: () => void;
  cerrarBusqueda: () => void;
  seleccionarCliente: (cliente: Cliente) => void;
  limpiarSeleccion: () => void;
}

export function useBuscarCliente(): UseBuscarClienteReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  const abrirBusqueda = () => {
    setIsOpen(true);
  };

  const cerrarBusqueda = () => {
    setIsOpen(false);
  };

  const seleccionarCliente = (cliente: Cliente) => {
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