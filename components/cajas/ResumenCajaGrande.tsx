'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Comanda, TraspasoInfo } from '@/types/caja';
import { Calendar, Users, TrendingUp } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface ResumenCajaGrandeProps {
  comandasValidadas: Comanda[];
  traspasos: TraspasoInfo[];
}

export default function ResumenCajaGrande({
  comandasValidadas,
  traspasos,
}: ResumenCajaGrandeProps) {
  const { formatUSD, formatDual, isExchangeRateValid } = useCurrencyConverter();

  // Función helper para formatear montos con visualización dual
  const formatAmount = (amount: number) => {
    return isExchangeRateValid ? formatDual(amount) : formatUSD(amount);
  };

  // Estadísticas por unidad de negocio
  const estadisticasPorUnidad = comandasValidadas.reduce(
    (acc, comanda) => {
      const unidad = comanda.businessUnit;
      if (!acc[unidad]) {
        acc[unidad] = { ingresos: 0, egresos: 0, cantidad: 0 };
      }

      acc[unidad].cantidad++;
      if (comanda.tipo === 'ingreso') {
        acc[unidad].ingresos += comanda.totalFinal;
      } else {
        acc[unidad].egresos += comanda.totalFinal;
      }

      return acc;
    },
    {} as Record<
      string,
      { ingresos: number; egresos: number; cantidad: number }
    >
  );

  // Personal más activo
  const personalStats = comandasValidadas.reduce(
    (acc, comanda) => {
      const personal = comanda.mainStaff.nombre;
      if (!acc[personal]) {
        acc[personal] = { cantidad: 0, total: 0 };
      }
      acc[personal].cantidad++;
      acc[personal].total += comanda.totalFinal;
      return acc;
    },
    {} as Record<string, { cantidad: number; total: number }>
  );

  const personalMasActivo = Object.entries(personalStats).sort(
    (a, b) => b[1].cantidad - a[1].cantidad
  )[0];

  return (
    <div className="space-y-6">
      {/* Resumen de Traspasos */}
      <Card className="border border-[#f9bbc4]/30 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Traspasos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {traspasos.length === 0 ? (
            <p className="py-4 text-center text-gray-500">
              No hay traspasos registrados
            </p>
          ) : (
            <div className="space-y-3">
              {traspasos.slice(0, 5).map((traspaso) => (
                <div
                  key={traspaso.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(traspaso.fechaTraspaso).toLocaleDateString(
                        'es-AR'
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {traspaso.comandasTraspasadas.length} comandas •{' '}
                      {traspaso.adminQueTraspaso}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatAmount(traspaso.montoTotal)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {traspaso.rangoFechas.desde} -{' '}
                      {traspaso.rangoFechas.hasta}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas por Unidad */}
      <Card className="border border-[#f9bbc4]/30 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estadísticas por Unidad de Negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(estadisticasPorUnidad).map(([unidad, stats]) => (
              <div key={unidad} className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-medium capitalize">{unidad}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Comandas:</span>
                    <span className="font-medium">{stats.cantidad}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Ingresos:</span>
                    <span className="font-medium">
                      {formatAmount(stats.ingresos)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Egresos:</span>
                    <span className="font-medium">
                      {formatAmount(stats.egresos)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Neto:</span>
                    <span
                      className={`font-medium ${
                        stats.ingresos - stats.egresos >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatAmount(stats.ingresos - stats.egresos)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Más Activo */}
      {personalMasActivo && (
        <Card className="border border-[#f9bbc4]/30 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personal Destacado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20 p-4">
              <div>
                <h4 className="font-medium">{personalMasActivo[0]}</h4>
                <p className="text-sm text-gray-600">Personal más activo</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {personalMasActivo[1].cantidad} comandas
                </p>
                <p className="text-sm text-gray-600">
                  {formatAmount(personalMasActivo[1].total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
