'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatUSD } from '@/lib/utils';

interface MovimientoCaja {
  tipo: 'ingreso' | 'egreso';
  monto: number;
  concepto: string;
  metodoPago: string;
  observaciones?: string;
}

interface ModalMovimientoCajaProps {
  abierto: boolean;
  tipo: 'ingreso' | 'egreso';
  onCerrar: () => void;
  onGuardar: (movimiento: MovimientoCaja) => void;
}

export default function ModalMovimientoCaja({
  abierto,
  tipo,
  onCerrar,
  onGuardar,
}: ModalMovimientoCajaProps) {
  const [formData, setFormData] = useState<MovimientoCaja>({
    tipo,
    monto: 0,
    concepto: '',
    metodoPago: 'efectivo',
    observaciones: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.monto > 0 && formData.concepto.trim()) {
      onGuardar(formData);
      setFormData({
        tipo,
        monto: 0,
        concepto: '',
        metodoPago: 'efectivo',
        observaciones: '',
      });
    }
  };

  const conceptosComunes = {
    ingreso: [
      'Depósito bancario',
      'Transferencia recibida',
      'Venta adicional',
      'Ajuste de caja',
      'Otro ingreso',
    ],
    egreso: [
      'Retiro de efectivo',
      'Pago a proveedores',
      'Gastos operativos',
      'Comisiones personal',
      'Ajuste de caja',
      'Otro egreso',
    ],
  };

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar {tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} - Caja Grande
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={formData.monto || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monto: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              required
            />
            {formData.monto > 0 && (
              <p className="text-sm text-gray-600">
                {formatUSD(formData.monto)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto</Label>
            <Select
              value={formData.concepto}
              onValueChange={(value) =>
                setFormData({ ...formData, concepto: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar concepto" />
              </SelectTrigger>
              <SelectContent>
                {conceptosComunes[tipo].map((concepto) => (
                  <SelectItem key={concepto} value={concepto}>
                    {concepto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodoPago">Método de Pago</Label>
            <Select
              value={formData.metodoPago}
              onValueChange={(value) =>
                setFormData({ ...formData, metodoPago: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="giftcard">Gift Card</SelectItem>
                <SelectItem value="qr">QR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCerrar}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${
                tipo === 'ingreso'
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              } text-white`}
              disabled={!formData.monto || !formData.concepto.trim()}
            >
              Registrar {tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
