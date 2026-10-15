'use client';

import { AlertTriangle, CheckCircle2, Clock, Package, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EsquemaBaseDto } from '@/services/comisiones.service';
import { formatARSNative, formatDiaISO, formatMes, formatUSD } from '@/lib/utils';

const pct = (n: number) => `${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;

/** "30–35%" o "30%" si no hay rango. */
export function rangoPorcentaje(min: number, max: number | null) {
  return max != null && max !== min ? `${pct(min).replace('%', '')}–${pct(max)}` : pct(min);
}

/**
 * Aviso de porcentaje pendiente: el total se muestra al mínimo del rango y se
 * informa cuánto daría al máximo. Va en el encabezado de la trabajadora.
 */
export function BadgePorcentajePendiente({ esquema }: { esquema: EsquemaBaseDto }) {
  if (!esquema.porcentajePendiente) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-semibold">% a confirmar:</span> se muestra al mínimo
        ({pct(esquema.porcentajeMin)}); al máximo daría{' '}
        <span className="font-semibold">{formatARSNative(esquema.totalARSAlMaximo)}</span>.
      </span>
    </div>
  );
}

/**
 * Desglose del esquema por base fija: cada servicio comisiona sobre el monto
 * base de su categoría (no sobre lo cobrado) y los productos sobre el precio
 * en efectivo.
 */
export default function EsquemaBaseDetalle({ esquema }: { esquema: EsquemaBaseDto }) {
  const variosMeses = new Set(esquema.servicios.map((s) => s.mes)).size > 1;
  const totalAlMaximo = esquema.servicios.reduce((a, s) => a + s.comisionMax, 0);
  const pendiente = esquema.porcentajePendiente;
  const hayProductos = esquema.productosEfectivoARS > 0 || esquema.productosEfectivoUSD > 0;

  return (
    <div className="mt-4 space-y-3 rounded-md border border-[#f9bbc4]/40 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs font-medium text-[#6b4c57]">
          <Scale className="h-3 w-3" />
          <span>Comisión por base fija</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Badge variant="outline" className="border-[#f9bbc4] text-[#8b5a6b]">
            Desde {formatDiaISO(esquema.desde)}
          </Badge>
          <Badge variant="outline" className="border-[#f9bbc4] text-[#8b5a6b]">
            Servicios {rangoPorcentaje(esquema.porcentajeMin, esquema.porcentajeMax)}
          </Badge>
          <Badge variant="outline" className="border-[#f9bbc4] text-[#8b5a6b]">
            Productos {pct(esquema.productosPorcentaje)}
          </Badge>
        </div>
      </div>

      {esquema.servicios.length === 0 ? (
        <p className="text-xs text-gray-500">Sin servicios con base en el período.</p>
      ) : (
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-[#8b5a6b]">Categoría</TableHead>
              <TableHead className="h-8 text-[#8b5a6b]">Cálculo</TableHead>
              <TableHead className="h-8 text-right text-[#8b5a6b]">Comisión</TableHead>
              {pendiente && <TableHead className="h-8 text-right text-[#8b5a6b]">Al máximo</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {esquema.servicios.map((s) => (
              <TableRow key={`${s.categoriaId}|${s.mes}`}>
                <TableCell className="py-1.5">
                  <div className="font-medium text-[#4a3540]">{s.categoria}</div>
                  {variosMeses && <div className="text-[11px] text-gray-500">{formatMes(s.mes)}</div>}
                </TableCell>
                <TableCell className="py-1.5 whitespace-nowrap text-[#4a3540]">
                  {s.cantidad} × {formatARSNative(s.montoBase)} ×{' '}
                  <span className={s.confirmado ? 'font-semibold text-green-700' : 'font-semibold text-amber-700'}>
                    {pct(s.porcentaje)}
                  </span>
                  {s.confirmado ? (
                    <CheckCircle2
                      className="ml-1 inline h-3 w-3 text-green-600"
                      aria-label="Porcentaje confirmado"
                    />
                  ) : (
                    <Clock className="ml-1 inline h-3 w-3 text-amber-600" aria-label="Porcentaje a confirmar" />
                  )}
                </TableCell>
                <TableCell className="py-1.5 text-right font-semibold whitespace-nowrap text-green-700">
                  {formatARSNative(s.comision)}
                </TableCell>
                {pendiente && (
                  <TableCell className="py-1.5 text-right whitespace-nowrap text-gray-500">
                    {s.confirmado ? '—' : formatARSNative(s.comisionMax)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-[#f9bbc4]/10">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="py-1.5 font-medium text-[#6b4c57]">
                Total servicios
              </TableCell>
              <TableCell className="py-1.5 text-right font-bold whitespace-nowrap text-green-700">
                {formatARSNative(esquema.comisionServiciosARS)}
              </TableCell>
              {pendiente && (
                <TableCell className="py-1.5 text-right whitespace-nowrap text-gray-500">
                  {formatARSNative(totalAlMaximo)}
                </TableCell>
              )}
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {hayProductos && (
        <div className="rounded-md bg-[#e8b4c6]/10 p-2 text-xs text-[#4a3540]">
          <div className="mb-1 flex items-center gap-1 text-[#8b5a6b]">
            <Package className="h-3 w-3" />
            <span>Productos al precio en efectivo ({pct(esquema.productosPorcentaje)})</span>
          </div>
          {esquema.productosEfectivoARS > 0 && (
            <div className="flex justify-between gap-3">
              <span>ARS {formatARSNative(esquema.productosEfectivoARS)}</span>
              <span className="font-semibold text-green-700">{formatARSNative(esquema.comisionProductosARS)}</span>
            </div>
          )}
          {esquema.productosEfectivoUSD > 0 && (
            <div className="flex justify-between gap-3">
              <span>USD {formatUSD(esquema.productosEfectivoUSD)}</span>
              <span className="font-semibold text-green-700">{formatUSD(esquema.comisionProductosUSD)}</span>
            </div>
          )}
        </div>
      )}

      {esquema.serviciosSinComision.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs">
          <div className="mb-1 flex items-center gap-1 font-medium text-amber-800">
            <AlertTriangle className="h-3 w-3" />
            <span>Servicios sin comisión (su categoría no tiene base cargada)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {esquema.serviciosSinComision.map((s) => (
              <Badge key={s.nombre} variant="outline" className="border-amber-300 text-amber-900">
                {s.nombre}: {s.cantidad}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
