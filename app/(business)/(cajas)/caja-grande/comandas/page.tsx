'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ClientOnly from '@/components/common/ClientOnly';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useRecordsStore } from '@/features/records/store/recordsStore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatDate, resolverMetodoPagoPrincipal } from '@/lib/utils';
import {
  Search,
  Eye,
  Calendar,
  DollarSign,
  Filter,
  ArrowUpRight,
  Shield,
} from 'lucide-react';

import ModalVerDetalles from '@/components/validacion/ModalVerDetalles';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Grande', href: '/caja-grande' },
  { label: 'Comandas Traspasadas' },
];

export default function ComandasTraspasadasPage() {
  const { comandas } = useComandaStore();
  const { traspasos } = useRecordsStore();
  const { formatUSD } = useCurrencyConverter();

  // Estados locales
  const [busqueda, setBusqueda] = useState('');
  const [traspasoSeleccionado, setTraspasoSeleccionado] =
    useState<string>('todos');
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [comandaSeleccionada, setComandaSeleccionada] = useState<string | null>(
    null
  );

  // Filtrar comandas validadas (traspasadas)
  const comandasValidadas = comandas.filter(
    (c) => c.estadoValidacion === 'validado'
  );

  // Filtrar por búsqueda y traspaso
  const comandasFiltradas = comandasValidadas.filter((comanda) => {
    const coincideBusqueda =
      comanda.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      comanda.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      comanda.mainStaff.nombre.toLowerCase().includes(busqueda.toLowerCase());

    if (traspasoSeleccionado === 'todos') {
      return coincideBusqueda;
    }

    // Verificar si la comanda pertenece al traspaso seleccionado
    const traspaso = traspasos.find((t) => t.id === traspasoSeleccionado);
    const perteneceAlTraspaso = traspaso?.comandasTraspasadas.includes(
      comanda.id
    );

    return coincideBusqueda && perteneceAlTraspaso;
  });

  // Estadísticas
  const estadisticas = {
    totalComandas: comandasValidadas.length,
    montoTotal: comandasValidadas.reduce((sum, c) => sum + c.totalFinal, 0),
    totalTraspasos: traspasos.length,
    ultimoTraspaso: traspasos[0]?.fechaTraspaso || null,
  };

  const handleVerDetalles = (comandaId: string) => {
    setComandaSeleccionada(comandaId);
    setShowModalDetalles(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetodoPagoColor = (metodo: string) => {
    switch (metodo.toLowerCase()) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'tarjeta':
        return 'bg-blue-100 text-blue-800';
      case 'transferencia':
        return 'bg-purple-100 text-purple-800';
      case 'mixto':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#fef7f0] to-[#fdf2f8]">
        <StandardPageBanner title="Comandas Traspasadas" />

        <ManagerOrAdminOnly>
          <ClientOnly>
            <div className="container mx-auto px-4 py-6">
              <div className="mx-auto max-w-7xl">
                <StandardBreadcrumbs items={breadcrumbItems} />

                {/* Estadísticas */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="border border-[#f9bbc4]/20 bg-white/80">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Total Comandas
                          </p>
                          <p className="text-xl font-bold text-[#6b4c57]">
                            {estadisticas.totalComandas}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-[#f9bbc4]/20 bg-white/80">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-100 p-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Monto Total</p>
                          <p className="text-xl font-bold text-[#6b4c57]">
                            {formatUSD(estadisticas.montoTotal)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-[#f9bbc4]/20 bg-white/80">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-100 p-2">
                          <ArrowUpRight className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Total Traspasos
                          </p>
                          <p className="text-xl font-bold text-[#6b4c57]">
                            {estadisticas.totalTraspasos}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-[#f9bbc4]/20 bg-white/80">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-orange-100 p-2">
                          <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Último Traspaso
                          </p>
                          <p className="text-sm font-medium text-[#6b4c57]">
                            {estadisticas.ultimoTraspaso
                              ? formatDate(estadisticas.ultimoTraspaso)
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtros */}
                <Card className="mb-6 border border-[#f9bbc4]/20 bg-white/80">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Búsqueda */}
                      <div className="relative max-w-md flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Buscar por número, cliente o vendedor..."
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Filtro por traspaso */}
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <Select
                          value={traspasoSeleccionado}
                          onValueChange={setTraspasoSeleccionado}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrar por traspaso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">
                              Todos los traspasos
                            </SelectItem>
                            {traspasos.map((traspaso) => (
                              <SelectItem key={traspaso.id} value={traspaso.id}>
                                {formatDate(traspaso.fechaTraspaso)} -{' '}
                                {traspaso.comandasTraspasadas.length} comandas
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabla de comandas */}
                <Card className="border border-[#f9bbc4]/20 bg-white/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#6b4c57]">
                      <Shield className="h-5 w-5" />
                      Comandas Traspasadas ({comandasFiltradas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Vendedor</TableHead>
                            <TableHead>Servicios</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Método Pago</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comandasFiltradas.map((comanda) => {
                            const metodoPrincipal =
                              comanda.metodosPago?.length > 0
                                ? resolverMetodoPagoPrincipal(
                                    comanda.metodosPago.map((m) => ({
                                      tipo: m.tipo,
                                      monto: m.monto,
                                    }))
                                  )
                                : 'efectivo';

                            return (
                              <TableRow
                                key={comanda.id}
                                className="hover:bg-gray-50/50"
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-3 w-3 text-blue-500" />
                                    {comanda.numero}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatDate(comanda.fecha)}
                                </TableCell>
                                <TableCell>{comanda.cliente.nombre}</TableCell>
                                <TableCell>
                                  {comanda.mainStaff.nombre}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600">
                                    {comanda.items.length}{' '}
                                    {comanda.items.length === 1
                                      ? 'item'
                                      : 'items'}
                                  </span>
                                </TableCell>
                                <TableCell className="font-medium text-green-600">
                                  {formatUSD(comanda.totalFinal)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getMetodoPagoColor(
                                      metodoPrincipal
                                    )}
                                  >
                                    {metodoPrincipal}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getEstadoColor(comanda.estado)}
                                  >
                                    {comanda.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleVerDetalles(comanda.id)
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>

                      {comandasFiltradas.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                          <Shield className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                          <p>No se encontraron comandas traspasadas</p>
                          <p className="text-sm">
                            {busqueda || traspasoSeleccionado !== 'todos'
                              ? 'Intenta ajustar los filtros de búsqueda'
                              : 'Aún no se han realizado traspasos a Caja Grande'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ClientOnly>
        </ManagerOrAdminOnly>

        {/* Modal de detalles */}
        {showModalDetalles && comandaSeleccionada && (
          <ModalVerDetalles
            isOpen={showModalDetalles}
            onClose={() => {
              setShowModalDetalles(false);
              setComandaSeleccionada(null);
            }}
            comandaId={comandaSeleccionada}
          />
        )}
      </div>
    </MainLayout>
  );
}
