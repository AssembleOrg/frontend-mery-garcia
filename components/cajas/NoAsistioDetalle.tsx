'use client';

import { Clock, UserX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NoAsistioDto } from '@/services/comisiones.service';
import { formatARSNative, formatDiaISO, formatUSD } from '@/lib/utils';

const pct = (n: number) =>
  `${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
const monto = (n: number, moneda: 'ARS' | 'USD') =>
  moneda === 'USD' ? formatUSD(n) : formatARSNative(n);

/**
 * Clientas que no se presentaron: cada servicio comisiona sobre la seña que se
 * perdió, con el % que le toca. Ya está sumado en el total de la trabajadora.
 */
export default function NoAsistioDetalle({
  noAsistio,
}: {
  noAsistio: NoAsistioDto;
}) {
  return (
    <div className="mt-4 space-y-2 rounded-md border border-red-200 bg-white p-3">
      <div className="flex items-center gap-1 text-xs font-medium text-red-700">
        <UserX className="h-3 w-3" />
        <span>
          No se presentaron ({noAsistio.cantidad}): comisión sobre la seña
        </span>
      </div>
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 text-[#8b5a6b]">Comanda</TableHead>
            <TableHead className="h-8 text-[#8b5a6b]">Cálculo</TableHead>
            <TableHead className="h-8 text-right text-[#8b5a6b]">
              Comisión
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {noAsistio.detalle.map((d) => (
            <TableRow key={`${d.comandaId}|${d.servicio}|${d.moneda}`}>
              <TableCell className="py-1.5">
                <div className="font-medium text-[#4a3540]">{d.servicio}</div>
                <div className="text-[11px] text-gray-500">
                  {d.numero} · {formatDiaISO(d.dia)}
                </div>
              </TableCell>
              <TableCell className="py-1.5 whitespace-nowrap text-[#4a3540]">
                seña {monto(d.seña, d.moneda)} ×{' '}
                <span
                  className={
                    d.confirmado
                      ? 'font-semibold text-green-700'
                      : 'font-semibold text-amber-700'
                  }
                >
                  {pct(d.porcentaje)}
                </span>
                {!d.confirmado && (
                  <Clock
                    className="ml-1 inline h-3 w-3 text-amber-600"
                    aria-label="Porcentaje a confirmar"
                  />
                )}
              </TableCell>
              <TableCell className="py-1.5 text-right font-semibold whitespace-nowrap text-green-700">
                {monto(d.comision, d.moneda)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-red-50">
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={2}
              className="py-1.5 font-medium text-[#6b4c57]"
            >
              Total por inasistencias
            </TableCell>
            <TableCell className="py-1.5 text-right font-bold whitespace-nowrap text-green-700">
              {[
                noAsistio.comisionARS > 0
                  ? formatARSNative(noAsistio.comisionARS)
                  : null,
                noAsistio.comisionUSD > 0
                  ? formatUSD(noAsistio.comisionUSD)
                  : null,
              ]
                .filter(Boolean)
                .join(' + ') || formatARSNative(0)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
