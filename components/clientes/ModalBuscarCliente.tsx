'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Phone, Mail, DollarSign } from 'lucide-react';
import { Cliente } from '@/types/caja';
import { clientesService, FiltrarClientesDto } from '@/services/clientes.service';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { toast } from 'sonner';

interface ModalBuscarClienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCliente: (cliente: Cliente) => void;
  title?: string;
  description?: string;
}

export default function ModalBuscarCliente({
  isOpen,
  onClose,
  onSelectCliente,
  title = 'Buscar Cliente',
  description = 'Selecciona un cliente para continuar'
}: ModalBuscarClienteProps) {
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();

  // Buscar clientes cuando cambie la búsqueda
  useEffect(() => {
    const buscarClientes = async () => {
      if (!busqueda.trim()) {
        setClientes([]);
        return;
      }

      setCargando(true);
      try {
        const filtros: FiltrarClientesDto = {
          nombre: busqueda.trim(),
          page: 1,
          limit: 20,
          orderBy: 'nombre',
          orderDirection: 'ASC'
        };

        const response = await clientesService.obtenerClientesPaginados(filtros);
        setClientes(response.data);
      } catch (error) {
        console.error('Error al buscar clientes:', error);
        toast.error('Error al buscar clientes');
        setClientes([]);
      } finally {
        setCargando(false);
      }
    };

    // Debounce para evitar muchas llamadas
    const timeoutId = setTimeout(buscarClientes, 300);
    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  const handleSeleccionarCliente = (cliente: Cliente) => {
    onSelectCliente(cliente);
    onClose();
    setBusqueda('');
    setClientes([]);
  };

  const handleClose = () => {
    setBusqueda('');
    setClientes([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#4a3540]">
            <Search className="h-5 w-5" />
            {title}
          </DialogTitle>
          <p className="text-sm text-[#6b4c57]">{description}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
            <Input
              placeholder="Escribe el nombre del cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
              autoFocus
            />
          </div>

          {/* Resultados */}
          <div className="max-h-[400px] overflow-y-auto">
            {cargando ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f9bbc4] border-t-transparent"></div>
                  <p className="text-sm text-[#6b4c57]">Buscando clientes...</p>
                </div>
              </div>
            ) : clientes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f9bbc4]/20">
                    <TableHead className="font-semibold text-[#4a3540]">Cliente</TableHead>
                    <TableHead className="font-semibold text-[#4a3540]">Contacto</TableHead>
                    <TableHead className="font-semibold text-[#4a3540]">Señas</TableHead>
                    <TableHead className="text-right font-semibold text-[#4a3540]">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow
                      key={cliente.id}
                      className="border-[#f9bbc4]/10 hover:bg-[#f9bbc4]/5 cursor-pointer"
                      onClick={() => handleSeleccionarCliente(cliente)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-[#4a3540]">
                            {cliente.nombre}
                          </div>
                          {cliente.cuit && (
                            <div className="text-sm text-[#8b5a6b]">
                              CUIT: {cliente.cuit}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cliente.telefono && (
                            <div className="flex items-center gap-2 text-sm text-[#6b4c57]">
                              <Phone className="h-3 w-3" />
                              {cliente.telefono}
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center gap-2 text-sm text-[#6b4c57]">
                              <Mail className="h-3 w-3" />
                              {cliente.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs ${
                              cliente.señasDisponibles?.ars > 0 
                                ? 'border-blue-300 bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {formatARSFromNative(cliente.señasDisponibles?.ars ?? 0)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs ${
                              cliente.señasDisponibles?.usd > 0 
                                ? 'border-green-300 bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {formatUSD(cliente.señasDisponibles?.usd ?? 0)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white hover:from-[#e292a3] hover:to-[#d4a7ca]"
                        >
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : busqueda.trim() ? (
              <div className="py-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20 p-4">
                    <Users className="h-12 w-12 text-[#8b5a6b]" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-medium text-[#4a3540]">
                  No se encontraron clientes
                </h3>
                <p className="text-[#6b4c57]">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20 p-4">
                    <Search className="h-12 w-12 text-[#8b5a6b]" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-medium text-[#4a3540]">
                  Busca un cliente
                </h3>
                <p className="text-[#6b4c57]">
                  Escribe el nombre del cliente para comenzar la búsqueda
                </p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#f9bbc4]/20">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 