'use client';

import { useState } from 'react';
import { DollarSign, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSenas } from '@/features/senas/hooks/useSenas';
import { useCliente } from '@/features/clientes/hooks/useCliente';
import { CrearSenaData } from '@/types/sena';

export default function SeñasTab() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [observaciones, setObservaciones] = useState('');

  const {
    crearSena,
    cargando,
    cargarDatosPrueba,
    limpiarDatos,
    obtenerEstadisticasGenerales,
  } = useSenas();
  const { clientes } = useCliente();

  const estadisticas = obtenerEstadisticasGenerales();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteSeleccionado || !monto) {
      return;
    }

    const senaData: CrearSenaData = {
      clienteId: clienteSeleccionado,
      monto: parseFloat(monto),
      moneda,
      observaciones: observaciones || undefined,
    };

    const resultado = await crearSena(senaData);

    if (resultado.success) {
      // Limpiar formulario
      setClienteSeleccionado('');
      setMonto('');
      setMoneda('ARS');
      setObservaciones('');
    }
  };

  const clienteSeleccionadoNombre = clientes.find(
    (c) => c.id === clienteSeleccionado
  )?.nombre;

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-[#f9bbc4]/20 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4a3540]">
              Señas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4a3540]">
              {estadisticas.totalSenas}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f9bbc4]/20 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4a3540]">
              Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {estadisticas.senasDisponibles}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f9bbc4]/20 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4a3540]">
              ARS Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4a3540]">
              ${estadisticas.montoDisponibleARS.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f9bbc4]/20 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4a3540]">
              USD Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4a3540]">
              ${estadisticas.montoDisponibleUSD.toLocaleString()} USD
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de Asignación de Seña */}
      <Card className="border-[#f9bbc4]/20 bg-white/90 shadow-lg">
        <CardHeader className="border-b border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/5 to-[#e8b4c6]/5">
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] p-2.5 shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#4a3540]">
                Asignar Seña a Cliente
              </h2>
              <p className="text-sm text-[#6b4c57]">
                Registra una nueva seña para un cliente específico
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cliente" className="font-medium text-[#4a3540]">
                  Cliente
                </Label>
                <Select
                  value={clienteSeleccionado}
                  onValueChange={setClienteSeleccionado}
                >
                  <SelectTrigger className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moneda" className="font-medium text-[#4a3540]">
                  Moneda
                </Label>
                <Select
                  value={moneda}
                  onValueChange={(value: 'ARS' | 'USD') => setMoneda(value)}
                >
                  <SelectTrigger className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS (Pesos Argentinos)</SelectItem>
                    <SelectItem value="USD">USD (Dólares)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto" className="font-medium text-[#4a3540]">
                  Monto
                </Label>
                <Input
                  id="monto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej: 50000"
                  className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="observaciones"
                  className="font-medium text-[#4a3540]"
                >
                  Observaciones (opcional)
                </Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Seña para tatuaje brazo completo"
                  className="min-h-[80px] border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                />
              </div>
            </div>

            {/* Preview */}
            {clienteSeleccionado && monto && (
              <div className="rounded-lg border border-[#f9bbc4]/20 bg-[#f9bbc4]/10 p-4">
                <h3 className="mb-2 text-sm font-medium text-[#4a3540]">
                  Vista Previa:
                </h3>
                <p className="text-sm text-[#6b4c57]">
                  <strong>{clienteSeleccionadoNombre}</strong> tendrá una seña
                  de{' '}
                  <strong className="text-[#4a3540]">
                    ${parseFloat(monto || '0').toLocaleString()} {moneda}
                  </strong>
                  {observaciones && ` para: ${observaciones}`}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={cargando || !clienteSeleccionado || !monto}
                className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white shadow-lg hover:from-[#e292a3] hover:to-[#d4a7ca]"
              >
                {cargando ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Asignar Seña
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Botones de testing */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h3 className="mb-3 text-sm font-medium text-yellow-800">
          🧪 Herramientas de Testing
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cargarDatosPrueba()}
            disabled={cargando}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            {cargando ? 'Cargando...' : 'Cargar Datos de Prueba'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => limpiarDatos()}
            disabled={cargando}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            {cargando ? 'Limpiando...' : 'Limpiar Datos'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-yellow-600">
          Estos botones son solo para testing. Los datos se guardan con el
          persist de zustand
        </p>
      </div>
    </div>
  );
}
