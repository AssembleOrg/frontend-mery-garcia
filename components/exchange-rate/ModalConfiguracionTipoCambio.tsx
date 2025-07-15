'use client';

import { useState } from 'react';
import { useExchangeRate } from '@/features/exchange-rate/hooks/useExchangeRate';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { getPublicRate } from '@/services/exchangeRate.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface ModalConfiguracionTipoCambioProps {
  isForced?: boolean;
  onSuccess?: () => void;
}

export function ModalConfiguracionTipoCambio({
  isForced = false,
  onSuccess,
}: ModalConfiguracionTipoCambioProps) {
  const { needsManualSetup } = useCurrencyConverter();
  const { guardarManual, cargando, error } = useExchangeRate();

  const [isOpen, setIsOpen] = useState(isForced || needsManualSetup);
  const [valorOperativo, setValorOperativo] = useState('');
  const [cotizacionPublica, setCotizacionPublica] = useState<number | null>(
    null
  );
  const [cargandoPublica, setCargandoPublica] = useState(false);

  const cargarCotizacionPublica = async () => {
    setCargandoPublica(true);
    try {
      const publicRate = await getPublicRate();
      if (publicRate?.venta) {
        setCotizacionPublica(publicRate.venta);
      }
    } catch (error) {
      console.error('Error cargando cotización pública:', error);
    } finally {
      setCargandoPublica(false);
    }
  };

  // Usar cotización pública como base
  const usarCotizacionPublica = () => {
    if (cotizacionPublica) {
      setValorOperativo(cotizacionPublica.toString());
    }
  };

  // Guardar valor operativo
  const handleGuardar = async () => {
    const valor = parseFloat(valorOperativo);

    if (!valor || valor <= 0) {
      toast.error('Ingrese un valor válido mayor a 0');
      return;
    }

    if (valor < 100 || valor > 10000) {
      toast.error('El valor debe estar entre 100 y 10,000 ARS/USD');
      return;
    }

    const success = await guardarManual(valor);
    if (success) {
      setIsOpen(false);
      onSuccess?.();
      toast.success('Tipo de cambio operativo configurado correctamente');
    }
  };

  // Modal forzado no se puede cerrar
  const handleOpenChange = (open: boolean) => {
    if (!isForced) {
      setIsOpen(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={!isForced}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Configuración Requerida
          </DialogTitle>
          <DialogDescription>
            {isForced
              ? 'Debe configurar un tipo de cambio operativo para continuar usando la aplicación.'
              : 'Configure el tipo de cambio operativo que se usará en toda la aplicación.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error del sistema */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Cotización pública de referencia */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Cotización Pública (Referencia)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cotizacionPublica ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Valor de venta:</span>
                  <span className="font-medium">
                    ${cotizacionPublica} ARS/USD
                  </span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cargarCotizacionPublica}
                  disabled={cargandoPublica}
                  className="w-full"
                >
                  {cargandoPublica
                    ? 'Cargando...'
                    : 'Cargar Cotización Pública'}
                </Button>
              )}

              {cotizacionPublica && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={usarCotizacionPublica}
                  className="w-full"
                >
                  Usar como Base
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Configuración del valor operativo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" />
                Valor Operativo (ARS/USD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="valor-operativo">
                  Tipo de cambio a usar en la aplicación
                </Label>
                <Input
                  id="valor-operativo"
                  type="number"
                  placeholder="Ej: 1250"
                  value={valorOperativo}
                  onChange={(e) => setValorOperativo(e.target.value)}
                  min="100"
                  max="10000"
                  step="0.01"
                />
              </div>

              <p className="text-xs text-gray-500">
                Este valor se usará para todas las conversiones y cálculos en la
                aplicación.
              </p>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex gap-2">
            {!isForced && (
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              onClick={handleGuardar}
              disabled={cargando || !valorOperativo}
              className="flex-1"
            >
              {cargando ? 'Guardando...' : 'Configurar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
