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
    señaInicial?: number,
    señasActuales?: number
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
  const [señaInicial, setSeñaInicial] = useState('');
  const [señasActuales, setSeñasActuales] = useState('');

  // Estados de validación
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Hook para conversión de moneda
  const { formatARS } = useCurrencyConverter();

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
        setSeñaInicial('');
        setSeñasActuales(cliente.señasDisponibles.toString());
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
    setSeñaInicial('');
    setSeñasActuales('');
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

    // Validar seña inicial solo si se ingresó un valor
    if (señaInicial && parseFloat(señaInicial) < 0) {
      nuevosErrores.señaInicial = 'La seña no puede ser negativa';
    }

    // Validar señas actuales en modo edición
    if (esEdicion && señasActuales && parseFloat(señasActuales) < 0) {
      nuevosErrores.señasActuales = 'Las señas no pueden ser negativas';
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

      if (esEdicion) {
        // En modo edición, pasar las señas actuales
        const señasActualesMonto = señasActuales
          ? parseFloat(señasActuales)
          : 0;
        onSave(clienteData, undefined, señasActualesMonto);
      } else {
        // En modo creación, pasar la seña inicial
        const señaInicialMonto =
          señaInicial && parseFloat(señaInicial) > 0
            ? parseFloat(señaInicial)
            : undefined;
        onSave(clienteData, señaInicialMonto);
      }

      // Simular delay de guardado
      await new Promise((resolve) => setTimeout(resolve, 300));
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

              {/* Seña inicial (solo en creación) */}
              {!esEdicion && (
                <div>
                  <Label
                    htmlFor="señaInicial"
                    className="font-medium text-[#4a3540]"
                  >
                    Seña Inicial (USD)
                    {errores.señaInicial && (
                      <span className="ml-1 text-xs text-red-500">
                        ({errores.señaInicial})
                      </span>
                    )}
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-green-600" />
                    <Input
                      id="señaInicial"
                      value={señaInicial}
                      onChange={(e) => setSeñaInicial(e.target.value)}
                      placeholder="0"
                      className={`pl-10 ${errores.señaInicial ? 'border-red-300' : 'border-[#f9bbc4]/30 focus:border-[#f9bbc4]'}`}
                    />
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-[#8b5a6b]">
                      Monto disponible para descontar en futuras compras
                      (opcional)
                    </p>
                    {señaInicial && parseFloat(señaInicial) > 0 && (
                      <p className="text-xs text-green-600">
                        Equivale a: {formatARS(parseFloat(señaInicial))}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Señas actuales (solo en edición) */}
              {esEdicion && (
                <div>
                  <Label
                    htmlFor="señasActuales"
                    className="font-medium text-[#4a3540]"
                  >
                    Señas Disponibles (USD)
                    {errores.señasActuales && (
                      <span className="ml-1 text-xs text-red-500">
                        ({errores.señasActuales})
                      </span>
                    )}
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-green-600" />
                    <Input
                      id="señasActuales"
                      value={señasActuales}
                      onChange={(e) => setSeñasActuales(e.target.value)}
                      placeholder="0"
                      className={`pl-10 ${errores.señasActuales ? 'border-red-300' : 'border-[#f9bbc4]/30 focus:border-[#f9bbc4]'}`}
                    />
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-[#8b5a6b]">
                      Monto disponible para descontar en futuras compras
                    </p>
                    {señasActuales && parseFloat(señasActuales) > 0 && (
                      <p className="text-xs text-green-600">
                        Equivale a: {formatARS(parseFloat(señasActuales))}
                      </p>
                    )}
                  </div>
                </div>
              )}
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
