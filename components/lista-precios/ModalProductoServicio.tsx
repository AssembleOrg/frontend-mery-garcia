'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Package,
  Scissors,
  Edit,
  GraduationCap,
  Clock,
  DollarSign,
} from 'lucide-react';
import { UnidadNegocio, ProductoServicio } from '@/types/caja';
import { useDatosReferencia } from '@/features/comandas/store/comandaStore';

interface ModalProductoServicioProps {
  isOpen: boolean;
  onClose: () => void;
  producto?: ProductoServicio | null;
}

const unidadesNegocio: {
  value: UnidadNegocio;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'estilismo',
    label: 'Estilismo',
    icon: <Scissors className="h-4 w-4" />,
  },
  { value: 'tattoo', label: 'Tattoo', icon: <Edit className="h-4 w-4" /> },
  {
    value: 'formacion',
    label: 'Formación',
    icon: <GraduationCap className="h-4 w-4" />,
  },
];

export default function ModalProductoServicio({
  isOpen,
  onClose,
  producto,
}: ModalProductoServicioProps) {
  const { tipoCambio, agregarProductoServicio, actualizarProductoServicio } =
    useDatosReferencia();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [tipo, setTipo] = useState<'producto' | 'servicio'>('servicio');
  const [businessUnit, setBusinessUnit] = useState<UnidadNegocio>('estilismo');
  const [duracion, setDuracion] = useState<number>(0);

  // Estados de validación
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  const esEdicion = !!producto;

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (producto) {
        // Modo edición
        setNombre(producto.nombre);
        setDescripcion(producto.descripcion || '');
        setPrecio(producto.precio);
        setTipo(producto.tipo);
        setBusinessUnit(producto.businessUnit);
        setDuracion(producto.duracion || 0);
      } else {
        // Modo creación
        clearForm();
      }
      setErrores({});
    }
  }, [isOpen, producto]);

  const clearForm = () => {
    setNombre('');
    setDescripcion('');
    setPrecio(0);
    setTipo('servicio');
    setBusinessUnit('estilismo');
    setDuracion(0);
    setErrores({});
  };

  const validateForm = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (precio <= 0) {
      nuevosErrores.precio = 'El precio debe ser mayor a 0';
    }

    if (tipo === 'servicio' && duracion <= 0) {
      nuevosErrores.duracion = 'La duración es obligatoria para servicios';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    setGuardando(true);

    try {
      const productoData: Omit<ProductoServicio, 'id'> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio,
        tipo,
        businessUnit,
        activo: true, // Siempre activo para salón de belleza
        ...(tipo === 'servicio' && duracion > 0 && { duracion }),
      };

      if (esEdicion) {
        actualizarProductoServicio(producto.id, productoData);
      } else {
        agregarProductoServicio(productoData);
      }

      // Simular delay de guardado
      await new Promise((resolve) => setTimeout(resolve, 500));

      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setGuardando(false);
    }
  };

  const formatAmount = (monto: number) => {
    if (monto === 0) return { ars: '$0', usd: '$0' };

    const montoARS = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);

    const montoUSD = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(monto / tipoCambio.valorVenta);

    return { ars: montoARS, usd: montoUSD };
  };

  const obtenerIconoUnidad = (unidad: UnidadNegocio) => {
    switch (unidad) {
      case 'estilismo':
        return <Scissors className="h-4 w-4" />;
      case 'tattoo':
        return <Edit className="h-4 w-4" />;
      case 'formacion':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  const precios = formatAmount(precio);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <Package className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  {esEdicion
                    ? 'Editar Producto/Servicio'
                    : 'Nuevo Producto/Servicio'}
                </h2>
                <p className="text-sm text-gray-600">
                  {esEdicion
                    ? 'Modifica los datos del elemento'
                    : 'Completa la información del nuevo elemento'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        placeholder="Ej: Corte y Peinado"
                        className={errores.nombre ? 'border-red-300' : ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select
                        value={tipo}
                        onValueChange={(value) =>
                          setTipo(value as 'producto' | 'servicio')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="servicio">
                            <div className="flex items-center gap-2">
                              <Scissors className="h-4 w-4" />
                              Servicio
                            </div>
                          </SelectItem>
                          <SelectItem value="producto">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Producto
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Descripción del producto o servicio"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessUnit">Unidad de Negocio *</Label>
                    <Select
                      value={businessUnit}
                      onValueChange={(value) =>
                        setBusinessUnit(value as UnidadNegocio)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesNegocio.map((unidad) => (
                          <SelectItem key={unidad.value} value={unidad.value}>
                            <div className="flex items-center gap-2">
                              {unidad.icon}
                              {unidad.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Precios */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Precios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="precio">
                      Precio (ARS) *
                      {errores.precio && (
                        <span className="ml-1 text-xs text-red-500">
                          ({errores.precio})
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="precio"
                        type="number"
                        value={precio || ''}
                        onChange={(e) => setPrecio(Number(e.target.value))}
                        placeholder="0"
                        className={`pl-10 ${errores.precio ? 'border-red-300' : ''}`}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {precio > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        Equivalente: {precios.usd}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detalles específicos */}
              {tipo === 'servicio' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Detalles del Servicio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="duracion">
                        Duración (minutos) *
                        {errores.duracion && (
                          <span className="ml-1 text-xs text-red-500">
                            ({errores.duracion})
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <Clock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="duracion"
                          type="number"
                          value={duracion || ''}
                          onChange={(e) => setDuracion(Number(e.target.value))}
                          placeholder="0"
                          className={`pl-10 ${errores.duracion ? 'border-red-300' : ''}`}
                          min="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vista previa */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vista Previa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {obtenerIconoUnidad(businessUnit)}
                        <div>
                          <h3 className="font-medium">
                            {nombre || 'Nombre del elemento'}
                          </h3>
                          {descripcion && (
                            <p className="text-sm text-gray-600">
                              {descripcion}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <Badge
                              variant={
                                tipo === 'servicio' ? 'default' : 'secondary'
                              }
                              className="capitalize"
                            >
                              {tipo}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {businessUnit}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {precios.ars}
                        </div>
                        <div className="text-sm text-gray-500">
                          {precios.usd}
                        </div>
                      </div>
                    </div>
                    {tipo === 'servicio' && duracion > 0 && (
                      <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {duracion} minutos
                      </div>
                    )}
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
