'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { X, DollarSign, PiggyBank } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface MovimientoManual {
  tipo: 'ingreso' | 'egreso';
  montoUSD: number;
  montoARS: number;
  comentario: string;
}

interface ModalMovimientosManualProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (movimiento: MovimientoManual) => Promise<void>;
}

export default function ModalMovimientosManual({
  abierto,
  onCerrar,
  onGuardar,
}: ModalMovimientosManualProps) {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<{
    tipo?: string;
    montos?: string;
    comentario?: string;
    general?: string;
  }>({});

  const [formData, setFormData] = useState<MovimientoManual>({
    tipo: 'ingreso',
    montoUSD: 0,
    montoARS: 0,
    comentario: '',
  });

  const formatearNumero = (valor: string): string => {
    // Eliminar todo lo que no sea número o punto decimal
    const soloNumeros = valor.replace(/[^\d.]/g, '');
    
    // Permitir solo un punto decimal
    const partes = soloNumeros.split('.');
    if (partes.length > 2) {
      return `${partes[0]}.${partes.slice(1).join('')}`;
    }
    
    // Limitar a 2 decimales
    if (partes[1] && partes[1].length > 2) {
      return `${partes[0]}.${partes[1].substring(0, 2)}`;
    }
    
    return soloNumeros;
  };

  const manejarCambioMontoUSD = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormateado = formatearNumero(e.target.value);
    setFormData(prev => ({
      ...prev,
      montoUSD: parseFloat(valorFormateado) || 0
    }));
    
    // Limpiar error de montos si se ingresa algún valor
    if (parseFloat(valorFormateado) > 0 && errores.montos) {
      setErrores(prev => ({ ...prev, montos: undefined }));
    }
  };

  const manejarCambioMontoARS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormateado = formatearNumero(e.target.value);
    setFormData(prev => ({
      ...prev,
      montoARS: parseFloat(valorFormateado) || 0
    }));
    
    // Limpiar error de montos si se ingresa algún valor
    if (parseFloat(valorFormateado) > 0 && errores.montos) {
      setErrores(prev => ({ ...prev, montos: undefined }));
    }
  };

  const manejarCambioComentario = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      comentario: e.target.value
    }));
    
    // Limpiar error de comentario si se ingresa texto
    if (e.target.value.trim() && errores.comentario) {
      setErrores(prev => ({ ...prev, comentario: undefined }));
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: typeof errores = {};

    // Validar que al menos un monto sea mayor a 0
    if (formData.montoUSD <= 0 && formData.montoARS <= 0) {
      nuevosErrores.montos = 'Debe ingresar al menos un monto mayor a 0';
    }

    // Validar comentario obligatorio
    if (!formData.comentario.trim()) {
      nuevosErrores.comentario = 'El comentario es obligatorio';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setCargando(true);
    setErrores({});

    try {
      const movimientoLimpio = {
        ...formData,
        comentario: formData.comentario.trim()
      };
      
      await onGuardar(movimientoLimpio);
      
      // Resetear formulario
      setFormData({
        tipo: 'ingreso',
        montoUSD: 0,
        montoARS: 0,
        comentario: '',
      });
      
      onCerrar();
    } catch (error) {
      console.error('Error al guardar movimiento:', error);
      setErrores(prev => ({
        ...prev,
        general: 'Error al guardar el movimiento. Intente nuevamente.'
      }));
    } finally {
      setCargando(false);
    }
  };

  const manejarCancelar = () => {
    setFormData({
      tipo: 'ingreso',
      montoUSD: 0,
      montoARS: 0,
      comentario: '',
    });
    setErrores({});
    onCerrar();
  };

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border border-[#f9bbc4]/20">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl text-[#6b4c57]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] shadow-sm">
                <PiggyBank className="h-4 w-4 text-white" />
              </div>
              Movimiento Manual
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600">
            Registre un movimiento manual de caja
          </p>
        </DialogHeader>

        <form onSubmit={manejarEnvio} className="space-y-4">
          {/* Tipo de Movimiento */}
          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-sm font-medium text-gray-700">
              Tipo de Movimiento
            </Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: 'ingreso' | 'egreso') =>
                setFormData(prev => ({ ...prev, tipo: value }))
              }
            >
              <SelectTrigger className="border-[#f9bbc4]/30 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingreso">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    💰 Ingreso
                  </div>
                </SelectItem>
                <SelectItem value="egreso">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    💸 Egreso
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errores.tipo && (
              <p className="text-xs text-red-600">{errores.tipo}</p>
            )}
          </div>

          {/* Montos */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Montos (al menos uno debe ser mayor a 0)
            </Label>
            
            {/* Monto USD */}
            <div className="space-y-1">
              <Label htmlFor="montoUSD" className="text-xs font-medium text-blue-700 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Dólares (USD)
              </Label>
              <Input
                id="montoUSD"
                type="text"
                value={formData.montoUSD > 0 ? formData.montoUSD.toString() : ''}
                onChange={manejarCambioMontoUSD}
                placeholder="0.00"
                className={`border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 ${
                  errores.montos ? 'border-red-300' : ''
                }`}
              />
              {formData.montoUSD > 0 && (
                <p className="text-xs text-blue-600">
                  Formato: {formatUSD(formData.montoUSD)}
                </p>
              )}
            </div>

            {/* Monto ARS */}
            <div className="space-y-1">
              <Label htmlFor="montoARS" className="text-xs font-medium text-green-700 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Pesos Argentinos (ARS)
              </Label>
              <Input
                id="montoARS"
                type="text"
                value={formData.montoARS > 0 ? formData.montoARS.toString() : ''}
                onChange={manejarCambioMontoARS}
                placeholder="0.00"
                className={`border-green-200 focus:border-green-400 focus:ring-green-400/20 ${
                  errores.montos ? 'border-red-300' : ''
                }`}
              />
              {formData.montoARS > 0 && (
                <p className="text-xs text-green-600">
                  Formato: {formatARSFromNative(formData.montoARS)}
                </p>
              )}
            </div>
            
            {errores.montos && (
              <p className="text-xs text-red-600">{errores.montos}</p>
            )}
          </div>

          {/* Comentario */}
          <div className="space-y-2">
            <Label htmlFor="comentario" className="text-sm font-medium text-gray-700">
              Concepto / Comentario <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comentario"
              value={formData.comentario}
              onChange={manejarCambioComentario}
              placeholder="Ingrese el motivo o detalle del movimiento..."
              rows={3}
              className={`border-[#f9bbc4]/30 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20 resize-none ${
                errores.comentario ? 'border-red-300' : ''
              }`}
            />
            {errores.comentario && (
              <p className="text-xs text-red-600">{errores.comentario}</p>
            )}
            <p className="text-xs text-gray-500">
              Caracteres: {formData.comentario.length}
            </p>
          </div>

          {/* Error general */}
          {errores.general && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{errores.general}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-[#f9bbc4]/20">
            <Button
              type="button"
              variant="outline"
              onClick={manejarCancelar}
              disabled={cargando}
              className="flex-1 border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={cargando || (formData.montoUSD <= 0 && formData.montoARS <= 0) || !formData.comentario.trim()}
              className={`flex-1 bg-gradient-to-r text-white shadow-lg ${
                formData.tipo === 'ingreso'
                  ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {cargando ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Procesando...
                </div>
              ) : (
                `Registrar ${formData.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}