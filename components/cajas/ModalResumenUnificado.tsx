'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Calendar,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface ModalResumenUnificadoProps {
  isOpen: boolean;
  onClose: () => void;
  resumen: ResumenData; // Datos del resumen de caja
  resumenDelDia: ResumenDelDia; // Datos calculados del día
}

interface ResumenData {
  saldoUSD?: number;
  saldoARS?: number;
  dualCurrencyDetails?: {
    USD?: { transacciones: number };
    ARS?: { transacciones: number };
  };
}

interface ResumenDelDia {
  saldo: number;
  totalIncoming: number;
  totalOutgoing: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
  clientesAtendidos: number;
  servicioMasVendido: string;
}

export default function ModalResumenUnificado({
  isOpen,
  onClose,
  resumen,
  resumenDelDia,
}: ModalResumenUnificadoProps) {
  const { formatUSD, formatARS } = useCurrencyConverter();

  const formatDualAmount = (usd: number, ars: number) => {
    return (
      <div className="space-y-1">
        <div className="text-lg font-bold text-green-600">
          USD: {formatUSD(usd)}
        </div>
        <div className="text-sm text-gray-600">
          {resumen.dualCurrencyDetails?.USD?.transacciones || 0} transacción(es)
        </div>
        <div className="text-lg font-bold text-blue-600">
          ARS: {formatARS(ars)}
        </div>
        <div className="text-sm text-gray-600">
          {resumen.dualCurrencyDetails?.ARS?.transacciones || 0} transacción(es)
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#4a3540]">
            <BarChart3 className="h-6 w-6 text-[#f9bbc4]" />
            Resumen Completo del Día
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Saldo Actual */}
          <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#4a3540]">
                <DollarSign className="h-5 w-5 text-[#f9bbc4]" />
                💰 Saldo Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resumen.saldoUSD !== undefined &&
              resumen.saldoARS !== undefined ? (
                formatDualAmount(resumen.saldoUSD, resumen.saldoARS)
              ) : (
                <div
                  className={`text-2xl font-bold ${resumenDelDia.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatUSD(resumenDelDia.saldo)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Ingresos */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-white/95 to-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#4a3540]">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Total Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-2xl font-bold text-green-600">
                {formatUSD(resumenDelDia.totalIncoming)}
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {resumenDelDia.cantidadIngresos} transacciones
              </Badge>
            </CardContent>
          </Card>

          {/* Total Egresos */}
          <Card className="border-2 border-red-200 bg-gradient-to-br from-white/95 to-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#4a3540]">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Total Egresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-2xl font-bold text-red-600">
                {formatUSD(resumenDelDia.totalOutgoing)}
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {resumenDelDia.cantidadEgresos} movimientos
              </Badge>
            </CardContent>
          </Card>

          {/* Clientes Atendidos */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-white/95 to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#4a3540]">
                <Users className="h-5 w-5 text-blue-600" />
                Clientes Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold text-blue-600">
                {resumenDelDia.clientesAtendidos}
              </div>
              <p className="text-sm text-gray-600">Clientes atendidos</p>
            </CardContent>
          </Card>

          {/* Total Transacciones */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-white/95 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#4a3540]">
                <Calendar className="h-5 w-5 text-purple-600" />
                Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold text-purple-600">
                {resumenDelDia.cantidadIngresos + resumenDelDia.cantidadEgresos}
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Ingresos: {resumenDelDia.cantidadIngresos}</div>
                <div>Egresos: {resumenDelDia.cantidadEgresos}</div>
              </div>
            </CardContent>
          </Card>

          {/* Servicio Más Vendido */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-white/95 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#4a3540]">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
                Más Vendido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-lg font-bold text-orange-600">
                {resumenDelDia.servicioMasVendido}
              </div>
              <p className="text-sm text-gray-600">Servicio popular del día</p>
            </CardContent>
          </Card>
        </div>

        {/* Resumen Financiero */}
        <Card className="mt-6 border-2 border-[#f9bbc4]/30 bg-gradient-to-br from-[#f9bbc4]/5 to-white/95">
          <CardHeader>
            <CardTitle className="text-xl text-[#4a3540]">
              📊 Resumen Financiero del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <div className="mb-1 text-sm font-medium text-green-700">
                  Ingresos
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatUSD(resumenDelDia.totalIncoming)}
                </div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <div className="mb-1 text-sm font-medium text-red-700">
                  Egresos
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatUSD(resumenDelDia.totalOutgoing)}
                </div>
              </div>
              <div
                className={`rounded-lg border p-4 text-center ${
                  resumenDelDia.saldo >= 0
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div
                  className={`mb-1 text-sm font-medium ${
                    resumenDelDia.saldo >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  Balance Final
                </div>
                <div
                  className={`text-2xl font-bold ${
                    resumenDelDia.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatUSD(resumenDelDia.saldo)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
