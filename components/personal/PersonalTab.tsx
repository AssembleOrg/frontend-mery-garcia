'use client';

import { useState } from 'react';
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
import { Plus, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import { PersonalSimple } from '@/types/caja';
import ModalPersonal from '@/components/personal/ModalPersonal';
import { usePersonal } from '@/features/personal/hooks/usePersonal';

export default function PersonalTab() {
  const { personal, agregar, actualizar, eliminar } = usePersonal();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [personalEditando, setPersonalEditando] =
    useState<PersonalSimple | null>(null);
  const [alertaEliminar, setAlertaEliminar] = useState<PersonalSimple | null>(
    null
  );

  const handleNuevoPersonal = () => {
    setPersonalEditando(null);
    setModalAbierto(true);
  };

  const handleEditarPersonal = (persona: PersonalSimple) => {
    setPersonalEditando(persona);
    setModalAbierto(true);
  };

  const handleEliminarPersonal = (persona: PersonalSimple) => {
    setAlertaEliminar(persona);
  };

  const confirmarEliminar = () => {
    if (alertaEliminar) {
      eliminar(alertaEliminar.id);
      setAlertaEliminar(null);
    }
  };

  const handleGuardarPersonal = (personaData: Omit<PersonalSimple, 'id'>) => {
    if (personalEditando) {
      // Editar
      actualizar(personalEditando.id, personaData);
    } else {
      // Crear
      agregar(personaData);
    }
    setModalAbierto(false);
    setPersonalEditando(null);
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
              <Badge variant="secondary">{personal.length} personas</Badge>
              <Button
                onClick={handleNuevoPersonal}
                className="bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Personal
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personal.map((persona) => (
                  <TableRow key={persona.id} className="hover:bg-[#f9bbc4]/5">
                    <TableCell>
                      <div className="font-medium">{persona.nombre}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-green-600">
                        {persona.comision}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          persona.rol === 'admin' ? 'default' : 'secondary'
                        }
                        className="capitalize"
                      >
                        {persona.rol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditarPersonal(persona)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEliminarPersonal(persona)}
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

            {personal.length === 0 && (
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
        onClose={() => setModalAbierto(false)}
        personal={personalEditando}
        onSave={handleGuardarPersonal}
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
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
