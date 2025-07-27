'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  X,
  Package,
  Scissors,
  Edit,
  GraduationCap,
  DollarSign,
} from 'lucide-react';
import { UnidadNegocio, ProductoServicio } from '@/types/caja';
import { useDatosReferencia } from '@/features/productos-servicios/store/productosServiciosStore';
import { useExchangeRate } from '@/features/exchange-rate/hooks/useExchangeRate';

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
  const { agregarProductoServicio, actualizarProductoServicio } =
    useDatosReferencia();
  const { tipoCambio } = useExchangeRate();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [tipo, setTipo] = useState<'producto' | 'servicio'>('servicio');
  const [businessUnit, setBusinessUnit] = useState<UnidadNegocio>('estilismo');
  
  // Estados para precio congelado
  const [esPrecioCongelado, setEsPrecioCongelado] = useState(false);
  const [precioARS, setPrecioARS] = useState<number>(0);

  // Estados de validación
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
        setEsPrecioCongelado(producto.esPrecioCongelado || false);
        setPrecioARS(producto.precioFijoARS || 0);
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
    setEsPrecioCongelado(false);
    setPrecioARS(0);
    setErrores({});
  };

  // Convertir precio ARS a USD usando dólar interno
  const convertirARSaUSD = (montoARS: number): number => {
    if (tipoCambio.valorVenta <= 0) return 0;
    return montoARS / tipoCambio.valorVenta;
  };

  // Manejar cambio en precio congelado
  const handlePrecioCongeladoChange = (checked: boolean) => {
    setEsPrecioCongelado(checked);
    if (checked && precioARS > 0) {
      // Convertir ARS a USD automáticamente
      const precioConvertido = convertirARSaUSD(precioARS);
      setPrecio(Number(precioConvertido.toFixed(2)));
    }
  };

  // Manejar cambio en precio ARS
  const handlePrecioARSChange = (nuevoARS: number) => {
    setPrecioARS(nuevoARS);
    if (esPrecioCongelado && nuevoARS > 0) {
      // Convertir automáticamente a USD
      const precioConvertido = convertirARSaUSD(nuevoARS);
      setPrecio(Number(precioConvertido.toFixed(2)));
    }
  };

  const validateForm = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (precio <= 0) {
      nuevosErrores.precio = 'El precio debe ser mayor a 0';
    }

    if (esPrecioCongelado && precioARS <= 0) {
      nuevosErrores.precioARS = 'El precio ARS debe ser mayor a 0';
    }

    if (esPrecioCongelado && tipoCambio.valorVenta <= 0) {
      nuevosErrores.tipoCambio = 'Debe configurar un tipo de cambio válido';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const productoData: Omit<ProductoServicio, 'id'> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio,
        tipo,
        businessUnit,
        activo: true,
        esPrecioCongelado,
        precioFijoARS: esPrecioCongelado ? precioARS : undefined,
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
      setLoading(false);
    }
  };

  const formatAmount = (monto: number) => {
    if (monto === 0) return { ars: '$0', usd: '$0' };

    const montoUSD = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(monto);

    let montoARSFormatted = '—';
    if (tipoCambio.valorVenta > 0) {
      montoARSFormatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(monto * tipoCambio.valorVenta);
    }

    return { ars: montoARSFormatted, usd: montoUSD };
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
                      Precio (USD) *
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
                    {precio > 0 && !esPrecioCongelado && (
                      <p className="mt-1 text-sm text-gray-500">
                        Equivalente: {precios.ars}
                      </p>
                    )}
                  </div>

                  {/* Checkbox para congelar precio */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="precioCongelado"
                      checked={esPrecioCongelado}
                      onCheckedChange={handlePrecioCongeladoChange}
                    />
                    <Label htmlFor="precioCongelado" className="text-sm font-medium">
                      🔒 Congelar precio en ARS
                    </Label>
                  </div>

                  {/* Input para precio ARS (solo visible cuando está congelado) */}
                  {esPrecioCongelado && (
                    <div>
                      <Label htmlFor="precioARS">
                        Precio fijo en ARS *
                        {errores.precioARS && (
                          <span className="ml-1 text-xs text-red-500">
                            ({errores.precioARS})
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                          $
                        </span>
                        <Input
                          id="precioARS"
                          type="number"
                          value={precioARS || ''}
                          onChange={(e) => handlePrecioARSChange(Number(e.target.value))}
                          placeholder="30000"
                          className={`pl-8 ${errores.precioARS ? 'border-red-300' : ''}`}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {precioARS > 0 && (
                        <p className="mt-1 text-sm text-gray-500">
                          Equivalente USD: ${convertirARSaUSD(precioARS).toFixed(2)}
                        </p>
                      )}
                      {errores.tipoCambio && (
                        <p className="mt-1 text-xs text-red-500">
                          {errores.tipoCambio}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t p-6">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={loading}
              className="bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
            >
              {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
