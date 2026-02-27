'use client';

import { useState, useEffect, useCallback } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Wallet, Trash2, DollarSign, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  comandasService,
  AjusteEfectivoCaja2,
  SaldoEfectivoCaja2,
} from '@/services/comandas.service';
import { formatDate } from '@/lib/utils';

interface ModalAjusteEfectivoCaja2Props {
  abierto: boolean;
  onCerrar: () => void;
  onAjusteRealizado?: () => void;
}

export default function ModalAjusteEfectivoCaja2({
  abierto,
  onCerrar,
  onAjusteRealizado,
}: ModalAjusteEfectivoCaja2Props) {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();
  const { hasRole, isAdmin } = useAuth();

  const [saldo, setSaldo] = useState<SaldoEfectivoCaja2>({
    totalARS: 0,
    totalUSD: 0,
    ajustes: [],
  });
  const [cargandoSaldo, setCargandoSaldo] = useState(false);

  const [tipo, setTipo] = useState<'sumar' | 'restar'>('sumar');
  const [montoARS, setMontoARS] = useState('');
  const [montoUSD, setMontoUSD] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cargandoForm, setCargandoForm] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const [ajusteAEliminar, setAjusteAEliminar] = useState<AjusteEfectivoCaja2 | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);

  const cargarSaldo = useCallback(async () => {
    setCargandoSaldo(true);
    try {
      const data = await comandasService.obtenerSaldoEfectivoCaja2();
      setSaldo(data);
    } catch (error) {
      console.error('Error al cargar saldo:', error);
      toast.error('Error al cargar el saldo de efectivo');
    } finally {
      setCargandoSaldo(false);
    }
  }, []);

  useEffect(() => {
    if (abierto) cargarSaldo();
  }, [abierto, cargarSaldo]);

  const formatearNumero = (valor: string): string => {
    const soloNumeros = valor.replace(/[^\d.]/g, '');
    const partes = soloNumeros.split('.');
    if (partes.length > 2) return `${partes[0]}.${partes.slice(1).join('')}`;
    if (partes[1] && partes[1].length > 2) return `${partes[0]}.${partes[1].substring(0, 2)}`;
    return soloNumeros;
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    const numARS = parseFloat(montoARS) || 0;
    const numUSD = parseFloat(montoUSD) || 0;
    if (numARS === 0 && numUSD === 0) {
      nuevosErrores.montos = 'Al menos un monto debe ser mayor a 0';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const signo = tipo === 'restar' ? -1 : 1;

    setCargandoForm(true);
    setErrores({});
    try {
      await comandasService.crearAjusteEfectivoCaja2({
        montoARS: (parseFloat(montoARS) || 0) * signo,
        montoUSD: (parseFloat(montoUSD) || 0) * signo,
        observaciones: observaciones.trim() || undefined,
      });
      toast.success(tipo === 'sumar' ? 'Efectivo sumado correctamente' : 'Efectivo restado correctamente');
      setMontoARS('');
      setMontoUSD('');
      setObservaciones('');
      await cargarSaldo();
      onAjusteRealizado?.();
    } catch (error) {
      console.error('Error al crear ajuste:', error);
      toast.error('Error al registrar el ajuste');
    } finally {
      setCargandoForm(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!ajusteAEliminar) return;
    setCargandoEliminar(true);
    try {
      await comandasService.eliminarAjusteEfectivoCaja2(ajusteAEliminar.id);
      toast.success('Ajuste eliminado');
      setAjusteAEliminar(null);
      await cargarSaldo();
      onAjusteRealizado?.();
    } catch (error) {
      console.error('Error al eliminar ajuste:', error);
      toast.error('Error al eliminar el ajuste');
    } finally {
      setCargandoEliminar(false);
    }
  };

  const manejarCerrar = () => {
    setMontoARS('');
    setMontoUSD('');
    setObservaciones('');
    setErrores({});
    setTipo('sumar');
    onCerrar();
  };

  const puedeEliminar = isAdmin || hasRole('encargado');

  const esSumar = tipo === 'sumar';

  return (
    <>
      <Dialog open={abierto} onOpenChange={manejarCerrar}>
        <DialogContent className="max-w-md border border-[#f9bbc4]/20 bg-white/95 backdrop-blur-sm">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-lg text-[#6b4c57]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] shadow-sm">
                <Wallet className="h-3.5 w-3.5 text-white" />
              </div>
              Ajuste de Efectivo
            </DialogTitle>
            <p className="text-xs text-gray-500">Sumar o restar efectivo de Caja 2</p>
          </DialogHeader>

          {/* Saldo actual compacto */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-md border border-green-100 bg-green-50/60 px-3 py-2 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-green-600">ARS</p>
              <p className={`text-sm font-semibold ${saldo.totalARS >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatARSFromNative(saldo.totalARS)}
              </p>
            </div>
            <div className="flex-1 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600">USD</p>
              <p className={`text-sm font-semibold ${saldo.totalUSD >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                {formatUSD(saldo.totalUSD)}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={manejarEnvio} className="space-y-3">
            {/* Toggle Sumar / Restar */}
            <div className="flex rounded-lg border border-[#f9bbc4]/20 p-0.5">
              <button
                type="button"
                onClick={() => setTipo('sumar')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
                  esSumar
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Plus className="h-3 w-3" />
                Sumar
              </button>
              <button
                type="button"
                onClick={() => setTipo('restar')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
                  !esSumar
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Minus className="h-3 w-3" />
                Restar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ajuste-ars" className="flex items-center gap-1 text-[11px] font-medium text-gray-600">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  Monto ARS
                </Label>
                <Input
                  id="ajuste-ars"
                  type="text"
                  value={montoARS}
                  onChange={(e) => {
                    setMontoARS(formatearNumero(e.target.value));
                    if (errores.montos) setErrores((prev) => ({ ...prev, montos: '' }));
                  }}
                  placeholder="0.00"
                  className={`h-8 text-sm border-[#f9bbc4]/20 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20 ${errores.montos ? 'border-red-300' : ''}`}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ajuste-usd" className="flex items-center gap-1 text-[11px] font-medium text-gray-600">
                  <DollarSign className="h-3 w-3 text-blue-600" />
                  Monto USD
                </Label>
                <Input
                  id="ajuste-usd"
                  type="text"
                  value={montoUSD}
                  onChange={(e) => {
                    setMontoUSD(formatearNumero(e.target.value));
                    if (errores.montos) setErrores((prev) => ({ ...prev, montos: '' }));
                  }}
                  placeholder="0.00"
                  className={`h-8 text-sm border-[#f9bbc4]/20 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20 ${errores.montos ? 'border-red-300' : ''}`}
                />
              </div>
            </div>
            {errores.montos && <p className="text-[11px] text-red-500">{errores.montos}</p>}

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-gray-600">Observaciones (opcional)</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Motivo del ajuste..."
                rows={2}
                className="resize-none text-sm border-[#f9bbc4]/20 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#f9bbc4]/15">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={manejarCerrar}
                disabled={cargandoForm}
                className="flex-1 border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={cargandoForm}
                className={`flex-1 text-white ${
                  esSumar
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {cargandoForm ? (
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Procesando...
                  </div>
                ) : esSumar ? (
                  'Sumar Efectivo'
                ) : (
                  'Restar Efectivo'
                )}
              </Button>
            </div>
          </form>

          {/* Historial compacto - últimos 15 */}
          {saldo.ajustes.length > 0 && (
            <div className="space-y-2 border-t border-[#f9bbc4]/15 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Últimos ajustes ({Math.min(saldo.ajustes.length, 15)} de {saldo.ajustes.length})
              </p>
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {saldo.ajustes.slice(0, 15).map((ajuste) => (
                  <div
                    key={ajuste.id}
                    className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50/50 px-2.5 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        {ajuste.montoARS !== 0 && (
                          <span className={ajuste.montoARS > 0 ? 'font-medium text-green-600' : 'font-medium text-red-500'}>
                            {ajuste.montoARS > 0 ? '+' : ''}{formatARSFromNative(ajuste.montoARS)}
                          </span>
                        )}
                        {ajuste.montoUSD !== 0 && (
                          <span className={ajuste.montoUSD > 0 ? 'font-medium text-blue-600' : 'font-medium text-red-500'}>
                            {ajuste.montoUSD > 0 ? '+' : ''}{formatUSD(ajuste.montoUSD)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span>{formatDate(ajuste.createdAt)}</span>
                        {ajuste.personal?.nombre && (
                          <>
                            <span>·</span>
                            <span>{ajuste.personal.nombre}</span>
                          </>
                        )}
                        {ajuste.observaciones && (
                          <>
                            <span>·</span>
                            <span className="truncate">{ajuste.observaciones}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {puedeEliminar && (
                      <button
                        type="button"
                        onClick={() => setAjusteAEliminar(ajuste)}
                        className="shrink-0 rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmación eliminar */}
      <AlertDialog open={!!ajusteAEliminar} onOpenChange={() => setAjusteAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ajuste</AlertDialogTitle>
            <AlertDialogDescription>
              Este ajuste dejara de contar en el saldo de la caja.
              {ajusteAEliminar && (
                <span className="mt-1 block text-xs">
                  {ajusteAEliminar.montoARS !== 0 && `ARS: ${formatARSFromNative(ajusteAEliminar.montoARS)}`}
                  {ajusteAEliminar.montoARS !== 0 && ajusteAEliminar.montoUSD !== 0 && ' | '}
                  {ajusteAEliminar.montoUSD !== 0 && `USD: ${formatUSD(ajusteAEliminar.montoUSD)}`}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cargandoEliminar}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
              className="bg-red-600 hover:bg-red-700"
              disabled={cargandoEliminar}
            >
              {cargandoEliminar ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
