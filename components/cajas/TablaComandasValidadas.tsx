'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Comanda, getComandaBusinessUnits } from '@/types/caja';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Eye, Search } from 'lucide-react';

interface TablaComandasValidadasProps {
  comandas: Comanda[];
}

export default function TablaComandasValidadas({
  comandas,
}: TablaComandasValidadasProps) {
  const { formatUSD, formatDual, isExchangeRateValid } = useCurrencyConverter();
  const [filtro, setFiltro] = useState('');
  // const [comandaSeleccionada, setComandaSeleccionada] = useState<string | null>(null);

  // Helper function for dual currency display
  const formatAmount = (amount: number) => {
    return isExchangeRateValid ? formatDual(amount) : formatUSD(amount);
  };

  const comandasFiltradas = comandas.filter(
    (comanda) =>
      comanda.numero.toLowerCase().includes(filtro.toLowerCase()) ||
      comanda.cliente.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      comanda.mainStaff.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'ingreso':
        return 'bg-green-100 text-green-800';
      case 'egreso':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUnidadColor = (unidad: string) => {
    switch (unidad) {
      case 'tattoo':
        return 'bg-purple-100 text-purple-800';
      case 'estilismo':
        return 'bg-pink-100 text-pink-800';
      case 'formacion':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border border-[#f9bbc4]/30 bg-white/90">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Comandas Validadas ({comandasFiltradas.length})</span>
          <div className="relative w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente o personal..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comandasFiltradas.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {filtro
              ? 'No se encontraron comandas con ese filtro'
              : 'No hay comandas validadas'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Personal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comandasFiltradas.map((comanda) => (
                  <TableRow key={comanda.id}>
                    <TableCell className="font-medium">
                      {comanda.numero}
                    </TableCell>
                    <TableCell>
                      {new Date(comanda.fecha).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getBadgeColor(comanda.tipo)}>
                        {comanda.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getComandaBusinessUnits(comanda).map(unidad => (
                          <Badge key={unidad} className={getUnidadColor(unidad)}>
                            {unidad}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{comanda.cliente.nombre}</TableCell>
                    <TableCell>{comanda.mainStaff.nombre}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(comanda.totalFinal)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Validado
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implementar modal de detalles
                          console.log('Ver detalles de comanda:', comanda.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
