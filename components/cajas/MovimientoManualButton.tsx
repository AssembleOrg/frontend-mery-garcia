'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, DollarSign } from 'lucide-react';
import { useCrearComandaManual } from '@/hooks/useCrearComandaManual';
import { TipoMoneda } from '@/services/comandas.service';

interface MovimientoManualButtonProps {
  cajaDestino?: string;
  className?: string;
}

export default function MovimientoManualButton({ 
  cajaDestino, 
  className = '' 
}: MovimientoManualButtonProps) {
  const { crearComandaManual, isCreating } = useCrearComandaManual();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'ingreso' as 'ingreso' | 'egreso',
    monto: '',
    detalle: '',
    moneda: TipoMoneda.USD,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const monto = parseFloat(formData.monto);
    if (isNaN(monto) || monto <= 0) {
      return;
    }

    const success = await crearComandaManual({
      tipo: formData.tipo,
      monto,
      detalle: formData.detalle.trim(),
      moneda: formData.moneda,
      cajaDestino,
    });

    if (success) {
      setIsOpen(false);
      setFormData({
        tipo: 'ingreso',
        monto: '',
        detalle: '',
        moneda: TipoMoneda.USD,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex items-center gap-2 ${className}`}
        >
          <Plus className="h-4 w-4" />
          Movimiento Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Crear Movimiento Manual
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Movimiento */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimiento</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: 'ingreso' | 'egreso') =>
                setFormData(prev => ({ ...prev, tipo: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingreso">📈 Ingreso</SelectItem>
                <SelectItem value="egreso">📉 Egreso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Moneda */}
          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda</Label>
            <Select
              value={formData.moneda}
              onValueChange={(value: TipoMoneda) =>
                setFormData(prev => ({ ...prev, moneda: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TipoMoneda.USD}>USD</SelectItem>
                <SelectItem value={TipoMoneda.ARS}>ARS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Detalle */}
          <div className="space-y-2">
            <Label htmlFor="detalle">Detalle</Label>
            <Input
              id="detalle"
              value={formData.detalle}
              onChange={(e) => setFormData(prev => ({ ...prev, detalle: e.target.value }))}
              placeholder="Descripción del movimiento..."
              required
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.monto || !formData.detalle.trim()}
            >
              {isCreating ? 'Creando...' : 'Crear Movimiento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 