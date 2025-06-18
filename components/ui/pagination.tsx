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
        'flex items-center justify-between space-x-6 lg:space-x-8',
        className
      )}
    >
      {/* Información de elementos */}
      <div className="text-muted-foreground flex items-center space-x-2 text-sm">
        <span>
          Mostrando {itemInicio} - {itemFin} de {totalItems} elementos
        </span>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center space-x-2">
        {/* Selector de elementos por página */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Elementos por página</p>
          <Select
            value={itemsPorPagina.toString()}
            onValueChange={(value) => onCambiarItemsPorPagina(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
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
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCambiarPagina(paginaActual - 1)}
            disabled={!hayPaginaAnterior}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>

          {numerosPagina.map((numero, index) => (
            <React.Fragment key={index}>
              {numero === '...' ? (
                <div className="flex h-8 w-8 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  variant={numero === paginaActual ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCambiarPagina(numero as number)}
                  className="h-8 w-8 p-0"
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
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Página siguiente</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
