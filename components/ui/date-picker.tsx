'use client';

import * as React from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  accentColor?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  className,
  disabled = false,
  accentColor = '#f9bbc4',
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date
  );
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleReset = () => {
    setSelectedDate(undefined);
    onDateChange?.(undefined);
    setIsOpen(false);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('es-ES');
  };

  const clearDate = (e: React.MouseEvent) => {
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
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDate(selectedDate)}
            {selectedDate && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={clearDate}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-white p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={selectedDate}
            selected={selectedDate}
            onSelect={handleDateChange}
            numberOfMonths={1}
            className="rounded-md border bg-white"
            styles={{
              day_selected: {
                backgroundColor: accentColor,
                color: 'white',
              },
              day_today: {
                backgroundColor: `${accentColor}20`,
                color: accentColor,
              },
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
