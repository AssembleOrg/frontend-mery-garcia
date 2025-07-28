'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, X } from 'lucide-react';
import { Cliente } from '@/types/caja';
import { useBuscarCliente } from '@/hooks/useBuscarCliente';
import ModalBuscarCliente from '@/components/clientes/ModalBuscarCliente';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface ClienteSelectorProps {
  clienteSeleccionado: Cliente | null;
  onClienteChange: (cliente: Cliente | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function ClienteSelector({
  clienteSeleccionado,
  onClienteChange,
  disabled = false,
  required = false
}: ClienteSelectorProps) {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();
  const {
    isOpen,
    abrirBusqueda,
    cerrarBusqueda,
    seleccionarCliente
  } = useBuscarCliente();

  const handleSeleccionarCliente = (cliente: Cliente) => {
    seleccionarCliente(cliente);
    onClienteChange(cliente);
  };

  const handleLimpiarCliente = () => {
    onClienteChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#4a3540] flex items-center gap-2">
          <Users className="h-4 w-4" />
          Cliente {required && <span className="text-red-500">*</span>}
        </label>
        {clienteSeleccionado && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLimpiarCliente}
            disabled={disabled}
            className="text-[#8b5a6b] hover:text-[#6b4c57]"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {clienteSeleccionado ? (
        <Card className="border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/5 to-[#e8b4c6]/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-[#4a3540]">
                    {clienteSeleccionado.nombre}
                  </h4>
                  {clienteSeleccionado.cuit && (
                    <p className="text-sm text-[#8b5a6b]">
                      CUIT: {clienteSeleccionado.cuit}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {clienteSeleccionado.telefono && (
                    <Badge variant="outline" className="text-xs">
                      📞 {clienteSeleccionado.telefono}
                    </Badge>
                  )}
                  {clienteSeleccionado.email && (
                    <Badge variant="outline" className="text-xs">
                      📧 {clienteSeleccionado.email}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      clienteSeleccionado.señasDisponibles?.ars > 0 
                        ? 'border-blue-300 bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    💰 {formatARSFromNative(clienteSeleccionado.señasDisponibles?.ars ?? 0)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      clienteSeleccionado.señasDisponibles?.usd > 0 
                        ? 'border-green-300 bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    💵 {formatUSD(clienteSeleccionado.señasDisponibles?.usd ?? 0)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={abrirBusqueda}
          disabled={disabled}
          variant="outline"
          className="w-full h-12 border-[#f9bbc4]/30 hover:bg-[#f9bbc4]/10 text-[#6b4c57] border-dashed"
        >
          <Search className="mr-2 h-4 w-4" />
          {required ? 'Seleccionar cliente *' : 'Seleccionar cliente (opcional)'}
        </Button>
      )}

      {/* Modal de búsqueda */}
      <ModalBuscarCliente
        isOpen={isOpen}
        onClose={cerrarBusqueda}
        onSelectCliente={handleSeleccionarCliente}
        title="Buscar Cliente"
        description="Selecciona un cliente para la comanda"
      />
    </div>
  );
} 