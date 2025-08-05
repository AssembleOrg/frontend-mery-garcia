'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Search,
  Hash,
  Calculator,
  User,
  Lock,
} from 'lucide-react';
import { ComandaNew, EstadoDeComandaNew, TipoDeComandaNew } from '@/services/unidadNegocio.service';
import { usePersonal } from '@/features/personal/hooks/usePersonal';
import useProductosServiciosStore from '@/features/productos-servicios/store/productosServiciosStore';
import { useClientesStore } from '@/features/clientes/store/clientesStore';
import ClienteSelector from '@/components/comandas/ClienteSelector';
// Componentes que se crearán después
// import { EditarComandaItems } from './EditarComandaItems';
// import { EditarComandaMetodosPago } from './EditarComandaMetodosPago';

interface EditarComandaFormProps {
  comanda: ComandaNew;
  setComanda: React.Dispatch<React.SetStateAction<ComandaNew | null>>;
  errores: Record<string, string>;
  setErrores: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  esPendiente: boolean;
}

export default function EditarComandaForm({
  comanda,
  setComanda,
  errores,
  setErrores,
  esPendiente,
}: EditarComandaFormProps) {
  const { personal } = usePersonal();
  const { productosServicios, loadProductosServicios } = useProductosServiciosStore();
  const { cargarClientes } = useClientesStore();

  // Estados locales
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(comanda.cliente);

  const tipo = comanda.tipoDeComanda === TipoDeComandaNew.INGRESO ? 'ingreso' : 'egreso';

  // Cargar datos necesarios
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        // loadTrabajadores(),
        cargarClientes(),
        loadProductosServicios()
      ]);
    };
    loadData();
  }, [cargarClientes, loadProductosServicios]);

  const handleClienteChange = (cliente: any) => {
    setClienteSeleccionado(cliente);
    setComanda(prev => prev ? {
      ...prev,
      cliente: cliente,
      clienteId: cliente?.id
    } : null);
  };

  const handleObservacionesChange = (observaciones: string) => {
    setComanda(prev => prev ? {
      ...prev,
      observaciones
    } : null);
  };

  return (
    <>
      {/* Información Básica */}
      <Card className="border border-gray-300 bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg text-gray-900">
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Número de comanda (solo lectura) */}
            <div className="md:col-span-2">
              <Label className="mb-2 block font-medium text-gray-700">
                Número de Comanda
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border bg-gray-100 px-3 py-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {comanda.numero}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {comanda.estadoDeComanda}
                </Badge>
              </div>
            </div>

            {/* Selector de cliente - Solo para ingresos */}
            {tipo === 'ingreso' && (
              <div className="md:col-span-2">
                {/* TODO: Arreglar tipo de cliente */}
                <div className="text-sm text-gray-600">
                  Cliente: {clienteSeleccionado?.nombre || 'No seleccionado'}
                </div>
                {errores.clienteProveedor && (
                  <p className="mt-1 text-xs text-red-600">
                    {errores.clienteProveedor}
                  </p>
                )}
              </div>
            )}

            {/* Observaciones */}
            <div className="md:col-span-2">
              <Label className="text-gray-700">Observaciones</Label>
              <Textarea
                value={comanda.observaciones || ''}
                onChange={(e) => handleObservacionesChange(e.target.value)}
                placeholder="Observaciones adicionales"
                rows={3}
                className="border-gray-300"
                readOnly={!esPendiente}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border border-gray-300 bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center justify-between text-lg text-gray-900">
            <span>
              {tipo === 'ingreso'
                ? 'Servicios y Productos'
                : 'Conceptos del Egreso'}
            </span>
            <div className="flex gap-2">
              {tipo === 'ingreso' && esPendiente && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarBuscador(true)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              )}
              {esPendiente && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Agregar item */}}
                  className="border-[#f9bbc4] bg-[#f9bbc4] font-medium text-white hover:bg-[#e292a3]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* TODO: Implementar EditarComandaItems */}
          <div className="text-center py-8 text-gray-500">
            <Calculator className="mx-auto h-12 w-12 text-gray-300" />
            <p>Componente de items en desarrollo...</p>
          </div>
        </CardContent>
      </Card>

      {/* Métodos de Pago - Solo para ingresos */}
      {tipo === 'ingreso' && (
        <div className="text-center py-8 text-gray-500">
          <p>Componente de métodos de pago en desarrollo...</p>
        </div>
      )}
    </>
  );
} 