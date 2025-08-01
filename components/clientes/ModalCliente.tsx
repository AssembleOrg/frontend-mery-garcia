'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  X,
  Users,
  Phone,
  Mail,
  CreditCard,
  DollarSign,
  Plus,
} from 'lucide-react';
import { Cliente } from '@/types/caja';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface ModalClienteProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
  onSave: (
    cliente: Omit<Cliente, 'id' | 'fechaRegistro' | 'señasDisponibles'>,
    señaInicial?: { ars: number; usd: number },
    señasActuales?: { ars: number; usd: number }
  ) => void;
}

export default function ModalCliente({
  isOpen,
  onClose,
  cliente,
  onSave,
}: ModalClienteProps) {
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [cuit, setCuit] = useState('');

  // Estados para señas
  const [señaArs, setSeñaArs] = useState('0');
  const [señaUsd, setSeñaUsd] = useState('0');

  // Estados de validación
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Hook para conversión de moneda
  const { formatARSFromNative } = useCurrencyConverter();

  const esEdicion = !!cliente;

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        // Modo edición
        setNombre(cliente.nombre);
        setTelefono(cliente.telefono || '');
        setEmail(cliente.email || '');
        setCuit(cliente.cuit || '');
        setSeñaArs(String(cliente.señasDisponibles?.ars || 0));
        setSeñaUsd(String(cliente.señasDisponibles?.usd || 0));
      } else {
        // Modo creación
        clearForm();
      }
      setErrores({});
    }
  }, [isOpen, cliente]);

  const clearForm = () => {
    setNombre('');
    setTelefono('');
    setEmail('');
    setCuit('');
    setSeñaArs('0');
    setSeñaUsd('0');
    setErrores({});
  };

  const validateForm = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevosErrores.email = 'Email inválido';
    }

    if (telefono && !/^\+?[\d\s\-\(\)]+$/.test(telefono)) {
      nuevosErrores.telefono = 'Teléfono inválido';
    }

    if (cuit && !/^\d{2}-\d{8}-\d{1}$/.test(cuit) && !/^\d{11}$/.test(cuit)) {
      nuevosErrores.cuit =
        'CUIT inválido (formato: 20-12345678-9 o 20123456789)';
    }

    if (parseFloat(señaArs) < 0) {
      nuevosErrores.señaArs = 'La seña no puede ser negativa';
    }

    if (parseFloat(señaUsd) < 0) {
      nuevosErrores.señaUsd = 'La seña no puede ser negativa';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const clienteData: Omit<
        Cliente,
        'id' | 'fechaRegistro' | 'señasDisponibles'
      > = {
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        cuit: cuit.trim() || undefined,
      };

      const señas = {
        ars: parseFloat(señaArs) || 0,
        usd: parseFloat(señaUsd) || 0,
      };

      if (esEdicion) {
        onSave(clienteData, undefined, señas);
      } else {
        onSave(clienteData, señas);
      }

      // Simular delay de guardado
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      // Error handling logic preserved
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
        <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-[#f9bbc4]/20 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/5 to-[#e8b4c6]/5 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] p-2.5 shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  {esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <p className="text-sm text-[#6b4c57]">
                  {esEdicion
                    ? 'Modifica los datos del cliente'
                    : 'Completa la información del cliente'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-[#f9bbc4]/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-5">
              {/* Nombre */}
              <div>
                <Label htmlFor="nombre" className="font-medium text-[#4a3540]">
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
                  placeholder="Ej: María González"
                  className={`mt-1 ${errores.nombre ? 'border-red-300' : 'border-[#f9bbc4]/30 focus:border-[#f9bbc4]'}`}
                />
              </div>

              {/* Teléfono */}
              <div>
                <Label
                  htmlFor="telefono"
                  className="font-medium text-[#4a3540]"
                >
                  Teléfono
                  {errores.telefono && (
                    <span className="ml-1 text-xs text-red-500">
                      ({errores.telefono})
                    </span>
                  )}
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
                  <Input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: +54 9 11 1234-5678"
                    className={`pl-10 ${errores.telefono ? 'border-red-300' : 'border-[#f9bbc4]/30 focus:border-[#f9bbc4]'}`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="font-medium text-[#4a3540]">
                  Email
                  {errores.email && (
                    <span className="ml-1 text-xs text-red-500">
                      ({errores.email})
                    </span>
                  )}
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: maria@ejemplo.com"
                    className={`pl-10 ${errores.email ? 'border-red-300' : 'border-[#f9bbc4]/30 focus:border-[#f9bbc4]'}`}
                  />
                </div>
              </div>

              {/* CUIT */}
              <div>
                <Label htmlFor="cuit" className="font-medium text-[#4a3540]">
                  CUIT
                  {errores.cuit && (
                    <span className="ml-1 text-xs text-red-500">
                      ({errores.cuit})
                    </span>
                  )}
                </Label>
                <div className="relative mt-1">
                  <CreditCard className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
                  <Input
                    id="cuit"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    placeholder="Ej: 20-12345678-9"
                    className={`pl-10 ${errores.cuit ? 'border-red-300' : 'border-[#f9bbc4]/30 focus:border-[#f9bbc4]'}`}
                  />
                </div>
              </div>

              {/* Señas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seña-ars" className="font-medium text-[#4a3540]">
                    Seña (ARS)
                    {errores.señaArs && (
                      <span className="ml-1 text-xs text-red-500">
                        ({errores.señaArs})
                      </span>
                    )}
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-[#8b5a6b]">ARS</span>
                    <Input
                      id="seña-ars"
                      type="number"
                      value={señaArs}
                      onChange={(e) => setSeñaArs(e.target.value)}
                      placeholder="0.00"
                      className={`pl-12 ${errores.señaArs ? 'border-red-300' : 'border-[#f9bbc4]/30 focus:border-[#f9bbc4]'}`}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="seña-usd" className="font-medium text-[#4a3540]">
                    Seña (USD)
                    {errores.señaUsd && (
                      <span className="ml-1 text-xs text-red-500">
                        ({errores.señaUsd})
                      </span>
                    )}
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
                    <Input
                      id="seña-usd"
                      type="number"
                      value={señaUsd}
                      onChange={(e) => setSeñaUsd(e.target.value)}
                      placeholder="0.00"
                      className={`pl-10 ${errores.señaUsd ? 'border-red-300' : 'border-[#f9bbc4]/30 focus:border-[#f9bbc4]'}`}
                    />
                  </div>
                </div>
              </div>


            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/5 to-[#e8b4c6]/5 p-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={loading}
              className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white shadow-lg hover:from-[#e292a3] hover:to-[#d4a7ca]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {esEdicion ? (
                    'Actualizar'
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Crear Cliente
                    </>
                  )}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
