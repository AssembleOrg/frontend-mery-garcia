'use client';

import * as React from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  accentColor?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = 'Seleccionar rango de fechas',
  className,
  disabled = false,
  accentColor = '#f9bbc4',
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(dateRange);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onDateRangeChange?.(newDate);
  };

  const handleReset = () => {
    setDate(undefined);
    onDateRangeChange?.(undefined);
    setIsOpen(false);
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range) return placeholder;

    const { from, to } = range;

    if (from && to) {
      return `${from.toLocaleDateString('es-ES')} - ${to.toLocaleDateString('es-ES')}`;
    } else if (from) {
      return `Desde ${from.toLocaleDateString('es-ES')}`;
    }

    return placeholder;
  };

  const clearDateRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleReset();
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="sm"
            className={cn(
              'w-full justify-start border-2 bg-white/80 text-left font-normal shadow-sm transition-all hover:bg-white hover:shadow-md',
              !date && 'text-muted-foreground'
            )}
            style={{
              borderColor: accentColor,
              color: '#4a3540',
            }}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            📅 {formatDateRange(date)}
            {date && (
              <span
                onClick={clearDateRange}
                className="ml-auto flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-xs hover:bg-gray-300"
                title="Limpiar fechas"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto border border-gray-200 bg-white p-0 shadow-xl"
          align="start"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
          <div className="border-t p-4 space-y-4">
            {/* Layout responsivo mejorado */}
            <div className="space-y-3">
              {/* Primera fila: Opciones básicas (centradas) */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const startOfDay = new Date(today);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(today);
                    endOfDay.setHours(23, 59, 59, 999);
                    handleDateChange({ from: startOfDay, to: endOfDay });
                    setIsOpen(false);
                  }}
                  className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md min-w-[90px]"
                  style={{
                    borderColor: accentColor,
                    color: '#4a3540',
                  }}
                >
                  📅 Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    // Asegurar que las fechas sean el inicio y fin del día
                    weekAgo.setHours(0, 0, 0, 0);
                    today.setHours(23, 59, 59, 999);
                    handleDateChange({ from: weekAgo, to: today });
                    setIsOpen(false);
                  }}
                  className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md min-w-[120px]"
                  style={{
                    borderColor: accentColor,
                    color: '#4a3540',
                  }}
                >
                  📊 Última semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    // Asegurar que las fechas sean el inicio y fin del día
                    monthAgo.setHours(0, 0, 0, 0);
                    today.setHours(23, 59, 59, 999);
                    handleDateChange({ from: monthAgo, to: today });
                    setIsOpen(false);
                  }}
                  className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md min-w-[110px]"
                  style={{
                    borderColor: accentColor,
                    color: '#4a3540',
                  }}
                >
                  📈 Último mes
                </Button>
              </div>

              {/* Segunda fila: Opciones mensuales (centradas) */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    // Asegurar que las fechas sean el inicio y fin del día
                    firstDayOfMonth.setHours(0, 0, 0, 0);
                    today.setHours(23, 59, 59, 999);
                    handleDateChange({ from: firstDayOfMonth, to: today });
                    setIsOpen(false);
                  }}
                  className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md min-w-[100px]"
                  style={{
                    borderColor: accentColor,
                    color: '#4a3540',
                  }}
                >
                  📊 Este mes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    // Asegurar que las fechas sean el inicio y fin del día
                    firstDayOfLastMonth.setHours(0, 0, 0, 0);
                    lastDayOfLastMonth.setHours(23, 59, 59, 999);
                    handleDateChange({ from: firstDayOfLastMonth, to: lastDayOfLastMonth });
                    setIsOpen(false);
                  }}
                  className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md min-w-[120px]"
                  style={{
                    borderColor: accentColor,
                    color: '#4a3540',
                  }}
                >
                  📈 Mes anterior
                </Button>
              </div>
            </div>

            {/* Botón Reiniciar separado */}
            <div className="flex justify-center pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md px-8"
                style={{
                  borderColor: accentColor,
                  color: '#4a3540',
                }}
              >
                🗑️ Reiniciar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
