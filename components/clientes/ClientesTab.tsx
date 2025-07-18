'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  DollarSign,
} from 'lucide-react';
import { Cliente } from '@/types/caja';
import { useCliente } from '@/features/clientes/hooks/useCliente';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import ModalCliente from './ModalCliente';

export default function ClientesTab() {
  const {
    clientes,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    buscarCliente,
  } = useCliente();
  const { formatUSD, formatARS } = useCurrencyConverter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [alertaEliminar, setAlertaEliminar] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Filtrar clientes según búsqueda
  const clientesFiltrados = busqueda ? buscarCliente(busqueda) : clientes;

  const handleNuevoCliente = () => {
    setClienteEditando(null);
    setModalAbierto(true);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalAbierto(true);
  };

  const handleEliminarCliente = (cliente: Cliente) => {
    setAlertaEliminar(cliente);
  };

  const confirmarEliminar = () => {
    if (alertaEliminar) {
      eliminarCliente(alertaEliminar.id);
      setAlertaEliminar(null);
    }
  };

  const handleGuardarCliente = (
    clienteData: Omit<Cliente, 'id' | 'fechaRegistro' | 'señasDisponibles'>,
    señaInicial?: number,
    señasActuales?: number
  ) => {
    if (clienteEditando) {
      // Modo edición
      actualizarCliente(clienteEditando.id, clienteData, señasActuales);
    } else {
      // Modo creación
      agregarCliente(clienteData, señaInicial);
    }
    setModalAbierto(false);
    setClienteEditando(null);
  };

  // Estadísticas
  const totalClientes = clientes.length;
  const clientesConSeñas = clientes.filter(
    (c) => c.señasDisponibles > 0
  ).length;
  const totalSeñas = clientes.reduce((sum, c) => sum + c.señasDisponibles, 0);

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-[#f9bbc4]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20 p-3">
                <Users className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <p className="text-sm text-[#6b4c57]">Total Clientes</p>
                <p className="text-2xl font-bold text-[#4a3540]">
                  {totalClientes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f9bbc4]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-green-100 to-emerald-100 p-3">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[#6b4c57]">Con Señas</p>
                <p className="text-2xl font-bold text-green-700">
                  {clientesConSeñas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f9bbc4]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-green-100 to-emerald-100 p-3">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[#6b4c57]">Total Señas</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-green-700">
                    {formatUSD(totalSeñas)}
                  </p>
                  <p className="text-xs text-green-600">
                    {formatARS(totalSeñas)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de clientes */}
      <Card className="border-[#f9bbc4]/20 bg-white/90 shadow-lg">
        <CardHeader className="border-b border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/5 to-[#e8b4c6]/5">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] p-2.5 shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Gestión de Clientes
                </h2>
                <p className="text-sm text-[#6b4c57]">
                  Gestiona tu base de clientes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
                <Input
                  placeholder="Buscar clientes..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-64 border-[#f9bbc4]/30 pl-10 focus:border-[#f9bbc4]"
                />
              </div>
              <Badge
                variant="secondary"
                className="bg-[#f9bbc4]/20 text-[#6b4c57]"
              >
                {clientesFiltrados.length} clientes
              </Badge>
              <Button
                onClick={handleNuevoCliente}
                className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white shadow-lg hover:from-[#e292a3] hover:to-[#d4a7ca]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Cliente
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#f9bbc4]/20">
                  <TableHead className="font-semibold text-[#4a3540]">
                    Cliente
                  </TableHead>
                  <TableHead className="font-semibold text-[#4a3540]">
                    Contacto
                  </TableHead>
                  <TableHead className="font-semibold text-[#4a3540]">
                    Señas
                  </TableHead>
                  <TableHead className="font-semibold text-[#4a3540]">
                    Registro
                  </TableHead>
                  <TableHead className="text-right font-semibold text-[#4a3540]">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente: Cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="border-[#f9bbc4]/10 hover:bg-[#f9bbc4]/5"
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
                      <div className="space-y-1">
                        <Badge
                          variant={
                            cliente.señasDisponibles > 0
                              ? 'default'
                              : 'secondary'
                          }
                          className={`font-mono ${
                            cliente.señasDisponibles > 0
                              ? 'border-green-300 bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {formatUSD(cliente.señasDisponibles)}
                        </Badge>
                        {cliente.señasDisponibles > 0 && (
                          <div className="text-xs text-green-600">
                            {formatARS(cliente.señasDisponibles)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-[#8b5a6b]">
                        {new Date(cliente.fechaRegistro).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-[#f9bbc4]/10"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-[#f9bbc4]/20"
                        >
                          <DropdownMenuItem
                            onClick={() => handleEditarCliente(cliente)}
                            className="hover:bg-[#f9bbc4]/10"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEliminarCliente(cliente)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {clientesFiltrados.length === 0 && (
              <div className="py-16 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20 p-4">
                    <Users className="h-12 w-12 text-[#8b5a6b]" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-medium text-[#4a3540]">
                  {busqueda
                    ? 'No se encontraron clientes'
                    : 'No hay clientes registrados'}
                </h3>
                <p className="mb-6 text-[#6b4c57]">
                  {busqueda
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza agregando tu primer cliente para gestionar señas y comandas'}
                </p>
                {!busqueda && (
                  <Button
                    onClick={handleNuevoCliente}
                    className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white shadow-lg hover:from-[#e292a3] hover:to-[#d4a7ca]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Primer Cliente
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para crear/editar cliente */}
      <ModalCliente
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        cliente={clienteEditando}
        onSave={handleGuardarCliente}
      />

      {/* Alert Dialog para eliminar */}
      <AlertDialog
        open={!!alertaEliminar}
        onOpenChange={() => setAlertaEliminar(null)}
      >
        <AlertDialogContent className="border-[#f9bbc4]/20 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#4a3540]">
              ¿Eliminar cliente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#6b4c57]">
              Esta acción eliminará permanentemente a &quot;
              {alertaEliminar?.nombre}&quot; y todas sus señas asociadas. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
