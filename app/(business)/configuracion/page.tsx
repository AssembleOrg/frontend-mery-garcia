'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';
import { METODO_PAGO_LABELS } from '@/lib/constants';
import { Percent, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Configuración' },
];

export default function ConfiguracionPage() {
  const {
    descuentosPorMetodo,
    actualizarDescuentoMetodo,
    resetearConfiguracion,
  } = useConfiguracion();

  const [tempValues, setTempValues] = useState(() => {
    const stringValues: Record<string, string> = {};
    Object.entries(descuentosPorMetodo).forEach(([key, value]) => {
      stringValues[key] = value.toString();
    });
    return stringValues;
  });

  const handleSave = () => {
    Object.entries(tempValues).forEach(([metodo, valor]) => {
      const valorNumerico = parseFloat(valor.replace(/,/g, '.')) || 0;
      const valorLimitado = Math.max(0, Math.min(100, valorNumerico));
      const valorRedondeado = Math.round(valorLimitado * 100) / 100;

      actualizarDescuentoMetodo(
        metodo as keyof typeof descuentosPorMetodo,
        valorRedondeado
      );
    });
    toast.success('Configuración guardada correctamente');
  };

  const handleReset = () => {
    resetearConfiguracion();
    setTempValues({
      efectivo: '10',
      transferencia: '5',
      tarjeta: '0',
      giftcard: '0',
      qr: '0',
    });
    toast.success('Configuración restablecida a valores por defecto');
  };

  const todosLosMetodos = [
    'efectivo',
    'transferencia',
    'tarjeta',
    'giftcard',
    'qr',
  ] as const;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
        <StandardPageBanner title="Configuración de Descuentos" />
        <StandardBreadcrumbs items={breadcrumbItems} />

        <div className="mx-auto max-w-3xl px-4 py-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-white">
              <CardTitle className="mt-6 flex items-center gap-3 text-xl text-gray-800">
                <Percent className="h-6 w-6 text-pink-600" />
                Descuentos por Método de Pago
              </CardTitle>
              <p className="mt-2 text-sm text-gray-600">
                Configura el porcentaje de descuento para cada método de pago.
              </p>
            </CardHeader>

            <CardContent className="bg-white p-6">
              <div className="space-y-6">
                <div className="grid gap-4">
                  {todosLosMetodos.map((metodo) => {
                    const valorString = tempValues[metodo] || '0';
                    const valorNumerico =
                      parseFloat(valorString.replace(/,/g, '.')) || 0;
                    const tieneDescuento = valorNumerico > 0;

                    return (
                      <div
                        key={metodo}
                        className={`rounded-lg border-2 p-4 transition-all ${
                          tieneDescuento
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label
                              htmlFor={metodo}
                              className="mb-1 block text-base font-semibold text-gray-800"
                            >
                              {METODO_PAGO_LABELS[metodo]}
                            </Label>
                            {tieneDescuento && (
                              <p className="text-sm font-medium text-green-700">
                                ✓ Descuento del {valorNumerico}% aplicado
                                automáticamente
                              </p>
                            )}
                            {!tieneDescuento && (
                              <p className="text-sm text-gray-500">
                                Sin descuento automático
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Input
                                id={metodo}
                                type="text"
                                value={valorString}
                                onChange={(e) => {
                                  const valor = e.target.value;

                                  const valorLimpio = valor
                                    .replace(/,/g, '.')
                                    .replace(/[^0-9.]/g, '');

                                  const partesDecimal = valorLimpio.split('.');
                                  let valorFinal = partesDecimal[0] || '';
                                  if (partesDecimal.length > 1) {
                                    valorFinal +=
                                      '.' + partesDecimal.slice(1).join('');
                                  }
                                  setTempValues((prev) => ({
                                    ...prev,
                                    [metodo]: valorFinal,
                                  }));
                                }}
                                onBlur={(e) => {
                                  const valor = e.target.value;
                                  if (valor === '' || valor === '.') {
                                    setTempValues((prev) => ({
                                      ...prev,
                                      [metodo]: '0',
                                    }));
                                    return;
                                  }

                                  let valorNumerico =
                                    parseFloat(valor.replace(/,/g, '.')) || 0;
                                  valorNumerico = Math.max(
                                    0,
                                    Math.min(100, valorNumerico)
                                  );
                                  valorNumerico =
                                    Math.round(valorNumerico * 100) / 100;

                                  setTempValues((prev) => ({
                                    ...prev,
                                    [metodo]: valorNumerico.toString(),
                                  }));
                                }}
                                className="w-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-center font-mono text-sm focus:border-pink-600 focus:ring-1 focus:ring-pink-600 focus:outline-none"
                              />
                            </div>
                            <span className="font-medium text-gray-600">%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 border-t pt-6">
                  <Button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-pink-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-pink-700"
                  >
                    <Save className="h-5 w-5" />
                    Guardar Cambios
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex items-center gap-2 border-2 border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:border-gray-400"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Restablecer
                  </Button>
                </div>

                {/* Información simplificada */}
                <div className="rounded-r-lg border-l-4 border-blue-400 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">
                    💡 Los descuentos se aplicarán automáticamente al
                    seleccionar cada método de pago en las transacciones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
