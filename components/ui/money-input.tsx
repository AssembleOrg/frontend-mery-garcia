'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function MoneyInput({
  value,
  onChange,
  placeholder = "Monto",
  className = "",
  disabled = false,
  readOnly = false,
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Función para formatear número a formato de dinero
  const formatToMoney = (num: number): string => {
    if (num === 0) return '';
    return `$${num.toLocaleString('es-AR')}`;
  };

  // Función para limpiar el formato y obtener solo números
  const cleanNumber = (str: string): number => {
    return parseInt(str.replace(/\D/g, '')) || 0;
  };

  // Actualizar display value cuando cambia el value prop
  useEffect(() => {
    setDisplayValue(formatToMoney(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Si el input está vacío, limpiar el valor
    if (inputValue === '' || inputValue === '$') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Limpiar el valor y obtener solo números
    const cleanValue = cleanNumber(inputValue);
    
    // Formatear para mostrar
    const formattedValue = formatToMoney(cleanValue);
    setDisplayValue(formattedValue);
    
    // Enviar el valor limpio al onChange
    onChange(cleanValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Al hacer focus, mostrar solo números sin formato
    if (value > 0) {
      setDisplayValue(value.toString());
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Al perder focus, aplicar formato
    if (value > 0) {
      setDisplayValue(formatToMoney(value));
    }
  };

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
} 