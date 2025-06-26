'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Users, Percent } from 'lucide-react';
import { PersonalSimple } from '@/types/caja';

interface ModalPersonalProps {
  isOpen: boolean;
  onClose: () => void;
  personal?: PersonalSimple | null;
  onSave: (personal: Omit<PersonalSimple, 'id'>) => void;
}

export default function ModalPersonal({
  isOpen,
  onClose,
  personal,
  onSave,
}: ModalPersonalProps) {
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [comision, setComision] = useState<number>(10);
  const [rol, setRol] = useState<'admin' | 'vendedor'>('vendedor');

  // Estados de validación
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  const esEdicion = !!personal;

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (personal) {
        // Modo edición
        setNombre(personal.nombre);
        setComision(personal.comision);
        setRol(personal.rol);
      } else {
        // Modo creación
        clearForm();
      }
      setErrores({});
    }
  }, [isOpen, personal]);

  const clearForm = () => {
    setNombre('');
    setComision(10);
    setRol('vendedor');
    setErrores({});
  };

  const validateForm = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (comision < 0 || comision > 100) {
      nuevosErrores.comision = 'La comisión debe estar entre 0% y 100%';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    setGuardando(true);

    try {
      const personalData: Omit<PersonalSimple, 'id'> = {
        nombre: nombre.trim(),
        comision,
        rol,
      };

      onSave(personalData);

      // Simular delay de guardado
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <Users className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  {esEdicion ? 'Editar Personal' : 'Nuevo Personal'}
                </h2>
                <p className="text-sm text-gray-600">
                  {esEdicion ? 'Modifica los datos' : 'Completa la información'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <Label htmlFor="nombre">
                  Nombre *
                  {errores.nombre && (
                    <span className="ml-1 text-xs text-red-500">
                      ({errores.nombre})
                    </span>
                  )}
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Ana Pérez"
                  className={errores.nombre ? 'border-red-300' : ''}
                />
              </div>

              {/* Comisión */}
              <div>
                <Label htmlFor="comision">
                  Comisión (%) *
                  {errores.comision && (
                    <span className="ml-1 text-xs text-red-500">
                      ({errores.comision})
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Percent className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="comision"
                    type="number"
                    value={comision}
                    onChange={(e) => setComision(Number(e.target.value))}
                    placeholder="10"
                    className={`pl-10 ${errores.comision ? 'border-red-300' : ''}`}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <Label htmlFor="rol">Rol *</Label>
                <Select
                  value={rol}
                  onValueChange={(value) =>
                    setRol(value as 'admin' | 'vendedor')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vista previa */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vista Previa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {nombre || 'Nombre del personal'}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant={rol === 'admin' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {rol}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-green-600">
                          {comision}%
                        </div>
                        <div className="text-sm text-gray-500">comisión</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t p-6">
            <Button variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={guardando}
              className="bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
