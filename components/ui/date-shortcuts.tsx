'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';

interface DateShortcutsProps {
  onDateRangeChange?: (range: DateRange | undefined) => void;
  accentColor?: string;
  className?: string;
}

export function DateShortcuts({
  onDateRangeChange,
  accentColor = '#f9bbc4',
  className,
}: DateShortcutsProps) {
  const handleToday = () => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    onDateRangeChange?.({ from: startOfDay, to: endOfDay });
  };

  const handleLastWeek = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    onDateRangeChange?.({ from: weekAgo, to: today });
  };

  const handleLastMonth = () => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    onDateRangeChange?.({ from: monthAgo, to: today });
  };

  const handleThisMonth = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    onDateRangeChange?.({ from: firstDayOfMonth, to: today });
  };

  const handlePreviousMonth = () => {
    const today = new Date();
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    firstDayOfLastMonth.setHours(0, 0, 0, 0);
    lastDayOfLastMonth.setHours(23, 59, 59, 999);
    onDateRangeChange?.({ from: firstDayOfLastMonth, to: lastDayOfLastMonth });
  };

  const handleReset = () => {
    onDateRangeChange?.(undefined);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primera fila: Opciones básicas (centradas) */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
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
          onClick={handleLastWeek}
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
          onClick={handleLastMonth}
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
          onClick={handleThisMonth}
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
          onClick={handlePreviousMonth}
          className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md min-w-[120px]"
          style={{
            borderColor: accentColor,
            color: '#4a3540',
          }}
        >
          📈 Mes anterior
        </Button>
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
  );
} 