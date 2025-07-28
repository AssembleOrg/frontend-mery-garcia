import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationProps {
  paginaActual: number;
  totalPaginas: number;
  totalItems: number;
  itemsPorPagina: number;
  itemInicio: number;
  itemFin: number;
  onCambiarPagina: (pagina: number) => void;
  onCambiarItemsPorPagina: (items: number) => void;
  hayPaginaAnterior: boolean;
  hayPaginaSiguiente: boolean;
  className?: string;
}

export function Pagination({
  paginaActual,
  totalPaginas,
  totalItems,
  itemsPorPagina,
  itemInicio,
  itemFin,
  onCambiarPagina,
  onCambiarItemsPorPagina,
  hayPaginaAnterior,
  hayPaginaSiguiente,
  className,
}: PaginationProps) {
  // Generar números de página a mostrar
  const generarNumerosPagina = () => {
    const numeros: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPaginas <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPaginas; i++) {
        numeros.push(i);
      }
    } else {
      // Lógica para páginas con puntos suspensivos
      if (paginaActual <= 3) {
        for (let i = 1; i <= 4; i++) {
          numeros.push(i);
        }
        numeros.push('...');
        numeros.push(totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        numeros.push(1);
        numeros.push('...');
        for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
          numeros.push(i);
        }
      } else {
        numeros.push(1);
        numeros.push('...');
        for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
          numeros.push(i);
        }
        numeros.push('...');
        numeros.push(totalPaginas);
      }
    }

    return numeros;
  };

  const numerosPagina = generarNumerosPagina();

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* Información de elementos */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f9bbc4]/20 to-[#e292a3]/20">
          <span className="text-xs font-semibold text-[#6b4c57]">{totalItems}</span>
        </div>
        <div className="text-sm text-[#6b4c57]">
          <span className="font-medium">Mostrando {itemInicio} - {itemFin}</span>
          <span className="text-[#6b4c57]/70"> de {totalItems} elementos</span>
        </div>
      </div>

      {/* Controles de paginación */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Selector de elementos por página */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#6b4c57] uppercase tracking-wide">
            Por página
          </label>
          <Select
            value={itemsPorPagina.toString()}
            onValueChange={(value) => onCambiarItemsPorPagina(Number(value))}
          >
            <SelectTrigger className="h-8 w-16 border-[#f9bbc4]/20 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20">
              <SelectValue placeholder={itemsPorPagina.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navegación de páginas */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCambiarPagina(paginaActual - 1)}
            disabled={!hayPaginaAnterior}
            className="h-8 w-8 p-0 border-[#f9bbc4]/20 hover:bg-[#f9bbc4]/10 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>

          {numerosPagina.map((numero, index) => (
            <React.Fragment key={index}>
              {numero === '...' ? (
                <div className="flex h-8 w-8 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4 text-[#6b4c57]/50" />
                </div>
              ) : (
                <Button
                  variant={numero === paginaActual ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCambiarPagina(numero as number)}
                  className={cn(
                    "h-8 w-8 p-0 font-medium",
                    numero === paginaActual 
                      ? "bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white border-0 shadow-md" 
                      : "border-[#f9bbc4]/20 hover:bg-[#f9bbc4]/10 text-[#6b4c57]"
                  )}
                >
                  {numero}
                </Button>
              )}
            </React.Fragment>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onCambiarPagina(paginaActual + 1)}
            disabled={!hayPaginaSiguiente}
            className="h-8 w-8 p-0 border-[#f9bbc4]/20 hover:bg-[#f9bbc4]/10 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Página siguiente</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
