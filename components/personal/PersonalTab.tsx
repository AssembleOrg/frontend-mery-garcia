'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, MoreHorizontal, Edit, Trash2, Users, RefreshCw } from 'lucide-react';
import { Trabajador, RolTrabajador } from '@/types/trabajador';
import ModalPersonal from '@/components/personal/ModalPersonal';
import useTrabajadoresStore from '@/features/personal/store/trabajadoresStore';
import { toast } from 'sonner';

export default function PersonalTab() {
  const { 
    trabajadores, 
    isLoading,
    error,
    eliminarTrabajador,
    loadTrabajadores
  } = useTrabajadoresStore();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [alertaEliminar, setAlertaEliminar] = useState<Trabajador | null>(null);


  const handleNuevoPersonal = () => {
    setModalAbierto(true);
  };

  const handleEditarPersonal = (trabajador: Trabajador) => {
    setModalAbierto(true);
  };

  const handleEliminarPersonal = (trabajador: Trabajador) => {
    setAlertaEliminar(trabajador);
  };

  const confirmarEliminar = async () => {
    if (alertaEliminar) {
      const exito = await eliminarTrabajador(alertaEliminar.id);
        // if () {
        //   setAlertaEliminar(null);
        // }
    }
  };

  const handleRefresh = async () => {
    await loadTrabajadores();
  };

  const getRolBadgeVariant = (rol: RolTrabajador) => {
    switch (rol) {
      case RolTrabajador.ENCARGADO:
        return 'secondary';
      case RolTrabajador.TRABAJADOR:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRolLabel = (rol: RolTrabajador) => {
    switch (rol) {
      case RolTrabajador.ENCARGADO:
        return 'Encargado';
      case RolTrabajador.TRABAJADOR:
        return 'Trabajador';
      default:
        return rol;
    }
  };

  return (
    <>
      {/* Tabla de personal */}
      <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personal
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{trabajadores.length} personas</Badge>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-[#f9bbc4]/30 hover:bg-[#f9bbc4]/10"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                onClick={handleNuevoPersonal}
                className="bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Personal
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trabajadores.map((trabajador) => (
                  <TableRow key={trabajador.id} className="hover:bg-[#f9bbc4]/5">
                    <TableCell>
                      <div className="font-medium">{trabajador.nombre}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-green-600">
                        {trabajador.comisionPorcentaje}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRolBadgeVariant(trabajador.rol as unknown as RolTrabajador)}
                        className="capitalize"
                      >
                        {getRolLabel(trabajador.rol as unknown as RolTrabajador)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={trabajador.activo ? 'default' : 'secondary'}
                        className={trabajador.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {trabajador.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditarPersonal(trabajador as unknown as Trabajador)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEliminarPersonal(trabajador as unknown as Trabajador)}
                            className="text-red-600"
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

            {isLoading && trabajadores.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#f9bbc4] border-t-transparent"></div>
                <p className="text-lg font-medium text-gray-500">
                  Cargando personal...
                </p>
              </div>
            )}

            {!isLoading && trabajadores.length === 0 && (
              <div className="py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">
                  No hay personal registrado
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Agrega tu primer miembro del equipo
                </p>
                <Button
                  onClick={handleNuevoPersonal}
                  className="mt-4 bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Personal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para crear/editar personal */}
      <ModalPersonal
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false); 
        }}
        trabajador={null}
      />

      {/* Alert Dialog para eliminar */}
      <AlertDialog
        open={!!alertaEliminar}
        onOpenChange={() => setAlertaEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar personal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a &quot;
              {alertaEliminar?.nombre}&quot;. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
