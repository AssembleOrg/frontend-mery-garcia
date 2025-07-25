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
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useLogActivity } from '@/features/activity/store/activityStore';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Comanda, MetodoPago, UnidadNegocio } from '@/types/caja';
import { toast } from 'sonner';

interface MovimientoSimple {
  tipoOperacion: 'ingreso' | 'egreso' | 'transferencia';
  montoUSD: number;
  montoARS: number;
  detalle: string;
  cajaOrigen?: 'caja_1' | 'caja_2';
  cajaDestino?: 'caja_1' | 'caja_2';
}

interface ModalMovimientoSimpleProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito?: () => void;
  cajaActual: 'caja_1' | 'caja_2'; // Para saber en qué caja estamos
}

export default function ModalMovimientoSimple({
  abierto,
  onCerrar,
  onExito,
  cajaActual,
}: ModalMovimientoSimpleProps) {
  const { formatUSD, formatDual, isExchangeRateValid } = useCurrencyConverter();
  const logActivity = useLogActivity();
  const { agregarComanda, obtenerProximoNumero } = useComandaStore();
  const { tipoCambio } = useExchangeRateStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<MovimientoSimple>({
    tipoOperacion: 'ingreso',
    montoUSD: 0,
    montoARS: 0,
    detalle: '',
    cajaOrigen: cajaActual,
    cajaDestino: cajaActual === 'caja_1' ? 'caja_2' : 'caja_1',
  });

  // Helper function for dual currency display
  const formatAmount = (amount: number) => {
    return isExchangeRateValid ? formatDual(amount) : formatUSD(amount);
  };

  // Helper function to create manual comandas
  const crearComandaManual = (
    tipo: 'ingreso' | 'egreso',
    monto: number,
    detalle: string,
    moneda: 'USD' | 'ARS' = 'USD',
    cajaDestino?: string
  ): Comanda => {
    const numeroComanda = obtenerProximoNumero(tipo);
    const fechaActual = new Date();

    // Cliente genérico para movimientos manuales
    const clienteManual = {
      id: 'manual-movement',
      nombre: 'Movimiento Manual',
      señasDisponibles: { ars: 0, usd: 0 },
      fechaRegistro: fechaActual,
    };

    // Personal genérico para movimientos manuales - usar localStorage como logActivity
    let usuarioActual = { id: 'admin-manual', nombre: 'Sistema' };
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const userData = JSON.parse(userStr);
        usuarioActual = {
          id: userData.id || 'admin-manual',
          nombre: userData.nombre || 'Sistema'
        };
      }
    } catch (error) {
      console.warn('Error al obtener usuario del localStorage:', error);
    }

    const personalManual = {
      id: usuarioActual.id,
      nombre: usuarioActual.nombre,
      activo: true,
      unidadesDisponibles: [
        'tattoo',
        'estilismo',
        'formacion',
      ] as UnidadNegocio[],
      fechaIngreso: fechaActual,
    };

    // Método de pago por defecto (efectivo)
    const metodoPago: MetodoPago = {
      tipo: 'efectivo',
      monto: monto,
      moneda: moneda,
    };

    const comanda: Comanda = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      numero: numeroComanda,
      fecha: fechaActual,
      businessUnit: 'tattoo',
      cliente: clienteManual,
      mainStaff: personalManual,
      items: [
        {
          productoServicioId: 'manual-movement',
          nombre: detalle,
          tipo: 'servicio',
          precio: monto,
          precioOriginalUSD: monto,
          cantidad: 1,
          descuento: 0,
          subtotal: monto,
          categoria: 'Movimiento Manual',
        },
      ],
      metodosPago: [metodoPago],
      subtotal: monto,
      totalDescuentos: 0,
      totalSeña: 0,
      totalSeñaUSD: 0,
      totalSeñaARS: 0,
      totalFinal: monto,
      moneda: moneda,
      estado: 'completado',
      tipo: tipo,
      estadoNegocio: 'completado',
      estadoValidacion: 'validado', // ¡IMPORTANTE! Siempre validado para movimientos manuales
      observaciones: `Movimiento manual: ${detalle}`,
      tipoCambioAlCrear: tipoCambio.valorVenta > 0 ? tipoCambio : undefined,
      // Metadata para identificar caja destino de movimientos manuales
      metadata: {
        movimientoManual: true,
        cajaOrigen: cajaActual,
        cajaDestino: cajaDestino || cajaActual,
        tipoMovimiento: tipo,
      },
    };

    return comanda;
  };

  const resetForm = () => {
    setFormData({
      tipoOperacion: 'ingreso',
      montoUSD: 0,
      montoARS: 0,
      detalle: '',
      cajaOrigen: cajaActual,
      cajaDestino: cajaActual === 'caja_1' ? 'caja_2' : 'caja_1',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((formData.montoUSD <= 0 && formData.montoARS <= 0) || !formData.detalle.trim()) {
      toast.error('Por favor ingrese al menos un monto y complete el detalle');
      return;
    }

    setLoading(true);

    try {
      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (formData.tipoOperacion === 'transferencia') {
        // Para transferencias, creamos dos comandas: un egreso en la caja origen y un ingreso en la caja destino
        // Crear comandas separadas por moneda para transferencias
        const comandasCreadas = [];
        
        if (formData.montoUSD > 0) {
          const egresoUSD = crearComandaManual(
            'egreso',
            formData.montoUSD,
            `Transferencia hacia ${getCajaLabel(formData.cajaDestino!)}: ${formData.detalle} (USD)`,
            'USD',
            formData.cajaOrigen // El egreso va de la caja origen
          );
          const ingresoUSD = crearComandaManual(
            'ingreso',
            formData.montoUSD,
            `Transferencia desde ${getCajaLabel(formData.cajaOrigen!)}: ${formData.detalle} (USD)`,
            'USD',
            formData.cajaDestino // El ingreso va a la caja destino
          );
          comandasCreadas.push(egresoUSD, ingresoUSD);
        }

        if (formData.montoARS > 0) {
          const egresoARS = crearComandaManual(
            'egreso',
            formData.montoARS,
            `Transferencia hacia ${getCajaLabel(formData.cajaDestino!)}: ${formData.detalle} (ARS)`,
            'ARS',
            formData.cajaOrigen // El egreso va de la caja origen
          );
          const ingresoARS = crearComandaManual(
            'ingreso',
            formData.montoARS,
            `Transferencia desde ${getCajaLabel(formData.cajaOrigen!)}: ${formData.detalle} (ARS)`,
            'ARS',
            formData.cajaDestino // El ingreso va a la caja destino
          );
          comandasCreadas.push(egresoARS, ingresoARS);
        }

        // Agregar todas las comandas al store
        comandasCreadas.forEach(comanda => agregarComanda(comanda));

        // Log de auditoría para transferencia
        const montoTexto = [];
        if (formData.montoUSD > 0) montoTexto.push(`USD: $${formData.montoUSD.toFixed(2)}`);
        if (formData.montoARS > 0) montoTexto.push(`ARS: $${formData.montoARS.toFixed(2)}`);
        
        logActivity(
          'Transferencia Manual',
          cajaActual === 'caja_1' ? 'Caja Chica' : 'Caja Grande',
          `Transferencia de ${montoTexto.join(' + ')} desde ${
            formData.cajaOrigen === 'caja_1' ? 'Caja Chica' : 'Caja Grande'
          } hacia ${
            formData.cajaDestino === 'caja_1' ? 'Caja Chica' : 'Caja Grande'
          }. Detalle: ${formData.detalle}`,
          {
            tipoOperacion: 'transferencia',
            montoUSD: formData.montoUSD,
            montoARS: formData.montoARS,
            cajaOrigen: formData.cajaOrigen,
            cajaDestino: formData.cajaDestino,
            detalle: formData.detalle,
            comandasCreadas: comandasCreadas.length,
          }
        );

        toast.success('Transferencia registrada exitosamente');
      } else {
        // Para ingresos y egresos, crear comandas separadas por moneda
        const comandasCreadas = [];
        
        if (formData.montoUSD > 0) {
          const comandaUSD = crearComandaManual(
            formData.tipoOperacion,
            formData.montoUSD,
            `${formData.detalle} (USD)`,
            'USD',
            cajaActual // Para ingresos/egresos simples, la caja destino es la caja actual
          );
          comandasCreadas.push(comandaUSD);
        }

        if (formData.montoARS > 0) {
          const comandaARS = crearComandaManual(
            formData.tipoOperacion,
            formData.montoARS,
            `${formData.detalle} (ARS)`,
            'ARS',
            cajaActual // Para ingresos/egresos simples, la caja destino es la caja actual
          );
          comandasCreadas.push(comandaARS);
        }

        // Agregar todas las comandas al store
        comandasCreadas.forEach(comanda => agregarComanda(comanda));

        // Log de auditoría para ingreso/egreso
        const montoTexto = [];
        if (formData.montoUSD > 0) montoTexto.push(`USD: $${formData.montoUSD.toFixed(2)}`);
        if (formData.montoARS > 0) montoTexto.push(`ARS: $${formData.montoARS.toFixed(2)}`);
        
        logActivity(
          `${formData.tipoOperacion === 'ingreso' ? 'Ingreso' : 'Egreso'} Manual`,
          cajaActual === 'caja_1' ? 'Caja Chica' : 'Caja Grande',
          `${formData.tipoOperacion === 'ingreso' ? 'Ingreso' : 'Egreso'} manual de ${montoTexto.join(' + ')}. Detalle: ${formData.detalle}`,
          {
            tipoOperacion: formData.tipoOperacion,
            montoUSD: formData.montoUSD,
            montoARS: formData.montoARS,
            caja: cajaActual,
            detalle: formData.detalle,
            comandasCreadas: comandasCreadas.length,
          }
        );

        toast.success(
          `${formData.tipoOperacion === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado exitosamente`
        );
      }

      resetForm();
      onCerrar();
      onExito?.();
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      toast.error('Error al registrar el movimiento. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getTitulo = () => {
    switch (formData.tipoOperacion) {
      case 'ingreso':
        return 'Registrar Ingreso Manual';
      case 'egreso':
        return 'Registrar Egreso Manual';
      case 'transferencia':
        return 'Transferir Entre Cajas';
      default:
        return 'Movimiento de Caja';
    }
  };

  const getButtonColor = () => {
    switch (formData.tipoOperacion) {
      case 'ingreso':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'egreso':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'transferencia':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getCajaLabel = (caja: 'caja_1' | 'caja_2') => {
    return caja === 'caja_1' ? 'Caja Chica' : 'Caja Grande';
  };

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl z-50">
        <DialogHeader>
          <DialogTitle>{getTitulo()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Operación */}
          <div className="space-y-2">
            <Label htmlFor="tipoOperacion">Tipo de Operación</Label>
            <Select
              value={formData.tipoOperacion}
              onValueChange={(
                value: 'ingreso' | 'egreso' | 'transferencia'
              ) => {
                setFormData({
                  ...formData,
                  tipoOperacion: value,
                  // Reset origen/destino cuando cambia el tipo
                  cajaOrigen: cajaActual,
                  cajaDestino: cajaActual === 'caja_1' ? 'caja_2' : 'caja_1',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingreso">💰 Ingreso de Dinero</SelectItem>
                <SelectItem value="egreso">💸 Egreso de Dinero</SelectItem>
                <SelectItem value="transferencia">
                  🔄 Transferencia Entre Cajas
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos específicos para transferencia */}
          {formData.tipoOperacion === 'transferencia' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cajaOrigen">Desde</Label>
                <Select
                  value={formData.cajaOrigen}
                  onValueChange={(value: 'caja_1' | 'caja_2') =>
                    setFormData({
                      ...formData,
                      cajaOrigen: value,
                      cajaDestino: value === 'caja_1' ? 'caja_2' : 'caja_1',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caja_1">🏪 Caja Chica</SelectItem>
                    <SelectItem value="caja_2">🏢 Caja Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cajaDestino">Hacia</Label>
                <Select
                  value={formData.cajaDestino}
                  onValueChange={(value: 'caja_1' | 'caja_2') =>
                    setFormData({ ...formData, cajaDestino: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caja_1">🏪 Caja Chica</SelectItem>
                    <SelectItem value="caja_2">🏢 Caja Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Montos Duales */}
          <div className="space-y-4">
            <Label>Montos (al menos uno debe ser mayor a 0)</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="montoUSD" className="text-sm font-medium text-blue-700">
                  💵 USD
                </Label>
                <Input
                  id="montoUSD"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.montoUSD || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      montoUSD: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="montoARS" className="text-sm font-medium text-green-700">
                  💰 ARS
                </Label>
                <Input
                  id="montoARS"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.montoARS || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      montoARS: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="border-green-200 focus:border-green-400"
                />
              </div>
            </div>
          </div>

          {/* Detalle */}
          <div className="space-y-2">
            <Label htmlFor="detalle">Detalle</Label>
            <Textarea
              id="detalle"
              value={formData.detalle}
              onChange={(e) =>
                setFormData({ ...formData, detalle: e.target.value })
              }
              placeholder="Descripción del movimiento..."
              rows={3}
              required
            />
          </div>

          {/* Resumen para transferencias */}
          {formData.tipoOperacion === 'transferencia' && (formData.montoUSD > 0 || formData.montoARS > 0) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                <strong>Resumen:</strong> Transferir{' '}
                {(() => {
                  const montos = [];
                  if (formData.montoUSD > 0) montos.push(`USD: $${formData.montoUSD.toFixed(2)}`);
                  if (formData.montoARS > 0) montos.push(`ARS: $${formData.montoARS.toFixed(2)}`);
                  return montos.join(' + ');
                })()} desde{' '}
                <strong>{getCajaLabel(formData.cajaOrigen!)}</strong> hacia{' '}
                <strong>{getCajaLabel(formData.cajaDestino!)}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCerrar}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${getButtonColor()} text-white`}
              disabled={(formData.montoUSD <= 0 && formData.montoARS <= 0) || !formData.detalle.trim() || loading}
            >
              {loading ? 'Procesando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
