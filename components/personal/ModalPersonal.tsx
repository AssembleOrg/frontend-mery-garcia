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
import { X, Users, Percent } from 'lucide-react';
import { RolTrabajadorNew, TrabajadorCreateNew, TrabajadorNew, TrabajadorUpdateNew } from '@/services/unidadNegocio.service';
import useTrabajadoresStore from '@/features/personal/store/trabajadoresStore';

interface ModalPersonalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajador?: TrabajadorNew | null;
}

export default function ModalPersonal({
  isOpen,
  onClose,
  trabajador,
}: ModalPersonalProps) {
  const { crearTrabajador, actualizarTrabajador, isLoading, loadTrabajadores } = useTrabajadoresStore();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [comisionPorcentaje, setComisionPorcentaje] = useState<number>(0);
  const [rol, setRol] = useState<RolTrabajadorNew>(RolTrabajadorNew.TRABAJADOR);
  const [activo, setActivo] = useState(true);

  // Estados de validación
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const esEdicion = !!trabajador;

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (trabajador) {
        // Modo edición
        setNombre(trabajador.nombre);
        setComisionPorcentaje(trabajador.comisionPorcentaje);
        setRol(trabajador.rol);
        setActivo(trabajador.activo);
      } else {
        // Modo creación
        clearForm();
      }
      setErrores({});
    }
  }, [isOpen, trabajador]);

  const clearForm = () => {
    setNombre('');
    setComisionPorcentaje(0);
    setRol(RolTrabajadorNew.TRABAJADOR);
    setActivo(true);
    setErrores({});
  };

  const validateForm = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (nombre.trim().length > 100) {
      nuevosErrores.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (comisionPorcentaje < 0 || comisionPorcentaje > 100) {
      nuevosErrores.comisionPorcentaje = 'La comisión debe estar entre 0% y 100%';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (esEdicion && trabajador) {
        // Actualizar trabajador existente
        const trabajadorData: TrabajadorUpdateNew = {
          nombre: nombre.trim(),
          comisionPorcentaje,
          rol,  
          activo,
        };

        const exito = await actualizarTrabajador(trabajador.id, trabajadorData);
        if (exito) {
          onClose();
        }
      } else {
        // Crear nuevo trabajador
        const trabajadorData: TrabajadorCreateNew = {
          nombre: nombre.trim(),
          comisionPorcentaje,
          rol,
          activo,
        };

        const exito = await crearTrabajador(trabajadorData);
        if (exito) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
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
                  maxLength={100}
                />
              </div>

              {/* Comisión */}
              <div>
                <Label htmlFor="comisionPorcentaje">
                  Comisión (%) *
                  {errores.comisionPorcentaje && (
                    <span className="ml-1 text-xs text-red-500">
                      ({errores.comisionPorcentaje})
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Percent className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="comisionPorcentaje"
                    type="number"
                    value={comisionPorcentaje}
                    onChange={(e) => setComisionPorcentaje(Number(e.target.value))}
                    placeholder="0"
                    className={`pl-10 ${errores.comisionPorcentaje ? 'border-red-300' : ''}`}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <Label htmlFor="rol">Rol *</Label>
                <Select
                  value={rol}
                  onValueChange={(value) => setRol(value as RolTrabajadorNew)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RolTrabajadorNew.TRABAJADOR}>Trabajador</SelectItem>
                    <SelectItem value={RolTrabajadorNew.ENCARGADO}>Encargado</SelectItem>
                    <SelectItem value={RolTrabajadorNew.VENDEDOR}>Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estado Activo */}
              <div>
                <Label htmlFor="activo">Estado</Label>
                <Select
                  value={activo ? 'true' : 'false'}
                  onValueChange={(value) => setActivo(value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t p-6">
            <Button variant="outline" onClick={onClose} disabled={loading || isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={loading || isLoading}
              className="bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
            >
              {loading || isLoading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
