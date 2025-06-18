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
          <div className="border-t p-3">
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md"
                style={{
                  borderColor: accentColor,
                  color: '#4a3540',
                }}
              >
                🗑️ Reiniciar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    handleDateChange({ from: today, to: today });
                  }}
                  className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md"
                  style={{
                    borderColor: accentColor,
                    color: '#4a3540',
                  }}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    handleDateChange({ from: weekAgo, to: today });
                  }}
                  className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md"
                  style={{
                    borderColor: accentColor,
                    color: '#4a3540',
                  }}
                >
                  Última semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    handleDateChange({ from: monthAgo, to: today });
                  }}
                  className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md"
                  style={{
                    borderColor: accentColor,
                    color: '#4a3540',
                  }}
                >
                  Último mes
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
