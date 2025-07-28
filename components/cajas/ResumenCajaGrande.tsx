'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Comanda, TraspasoInfo, getComandaBusinessUnits } from '@/types/caja';
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
  const { formatUSD, formatARS, formatARSFromNative } = useCurrencyConverter();
  // Estadísticas por unidad de negocio separadas por moneda
  const estadisticasPorUnidad = comandasValidadas.reduce(
    (acc, comanda) => {
      const unidades = getComandaBusinessUnits(comanda);
      unidades.forEach(unidad => {
        if (!acc[unidad]) {
          acc[unidad] = {
            ingresosUSD: 0,
            egresosUSD: 0,
            ingresosARS: 0,
            egresosARS: 0,
            cantidad: 0,
          };
        }

        acc[unidad].cantidad++;
        
        // Calcular valores reales basándose en los métodos de pago
        const metodosUSD = comanda.metodosPago.filter(mp => mp.moneda === 'USD');
        const metodosARS = comanda.metodosPago.filter(mp => mp.moneda === 'ARS');
        
        const totalUSDComanda = metodosUSD.reduce((sum, mp) => sum + mp.monto, 0);
        const totalARSComanda = metodosARS.reduce((sum, mp) => sum + mp.monto, 0);
        
        if (comanda.tipo === 'ingreso') {
          acc[unidad].ingresosUSD += totalUSDComanda;
          acc[unidad].ingresosARS += totalARSComanda;
        } else {
          acc[unidad].egresosUSD += totalUSDComanda;
          acc[unidad].egresosARS += totalARSComanda;
        }
      });

      return acc;
    },
    {} as Record<
      string,
      {
        ingresosUSD: number;
        egresosUSD: number;
        ingresosARS: number;
        egresosARS: number;
        cantidad: number;
      }
    >
  );

  // Personal más activo
  const personalStats = comandasValidadas.reduce(
    (acc, comanda) => {
      const personal = comanda.mainStaff.nombre;
      if (!acc[personal]) {
        acc[personal] = { cantidad: 0, totalUSD: 0, totalARS: 0 };
      }
      acc[personal].cantidad++;
      
      // Calcular valores reales basándose en los métodos de pago
      const metodosUSD = comanda.metodosPago.filter(mp => mp.moneda === 'USD');
      const metodosARS = comanda.metodosPago.filter(mp => mp.moneda === 'ARS');
      
      const totalUSDComanda = metodosUSD.reduce((sum, mp) => sum + mp.monto, 0);
      const totalARSComanda = metodosARS.reduce((sum, mp) => sum + mp.monto, 0);
      
      acc[personal].totalUSD += totalUSDComanda;
      acc[personal].totalARS += totalARSComanda;
      
      return acc;
    },
    {} as Record<
      string,
      { cantidad: number; totalUSD: number; totalARS: number }
    >
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
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        USD: {formatUSD(traspaso.montoTotalUSD || 0)}
                      </p>
                      <p className="text-sm font-medium">
                        ARS: {formatARSFromNative(traspaso.montoTotalARS || 0)}
                      </p>
                    </div>
                    <Badge variant="outline" className="mt-1 text-xs">
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
                <h4 className="mb-3 font-medium capitalize">{unidad}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Comandas:</span>
                    <span className="font-medium">{stats.cantidad}</span>
                  </div>

                  {/* Ingresos */}
                  <div className="border-t pt-2">
                    <p className="mb-1 text-xs text-gray-500">Ingresos:</p>
                    <div className="flex justify-between text-green-600">
                      <span>USD:</span>
                      <span className="font-medium">
                        {formatUSD(stats.ingresosUSD)}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>ARS:</span>
                      <span className="font-medium">
                        {formatARSFromNative(stats.ingresosARS)}
                      </span>
                    </div>
                  </div>

                  {/* Egresos */}
                  <div className="border-t pt-2">
                    <p className="mb-1 text-xs text-gray-500">Egresos:</p>
                    <div className="flex justify-between text-red-600">
                      <span>USD:</span>
                      <span className="font-medium">
                        {formatUSD(stats.egresosUSD)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>ARS:</span>
                      <span className="font-medium">
                        {formatARSFromNative(stats.egresosARS)}
                      </span>
                    </div>
                  </div>

                  {/* Neto */}
                  <div className="border-t pt-2">
                    <p className="mb-1 text-xs text-gray-500">Neto:</p>
                    <div className="flex justify-between">
                      <span>USD:</span>
                      <span
                        className={`font-medium ${
                          stats.ingresosUSD - stats.egresosUSD >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatUSD(stats.ingresosUSD - stats.egresosUSD)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ARS:</span>
                      <span
                        className={`font-medium ${
                          stats.ingresosARS - stats.egresosARS >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatARSFromNative(stats.ingresosARS - stats.egresosARS)}
                      </span>
                    </div>
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
                <div className="space-y-1 text-sm text-gray-600">
                  <p>USD: {formatUSD(personalMasActivo[1].totalUSD)}</p>
                  <p>ARS: {formatARSFromNative(personalMasActivo[1].totalARS)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
