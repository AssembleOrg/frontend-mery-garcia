import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: string | number | boolean) => boolean;
  message: string;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Hook para validación de formularios centralizada
 * Evita duplicación de lógica de validación
 */
export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback(
    (field: string, value: string | number | boolean): boolean => {
      const rule = rules[field];
      if (!rule) return true;

      // Validación required
      if (
        rule.required &&
        (!value || (typeof value === 'string' && !value.trim()))
      ) {
        setErrors((prev) => ({ ...prev, [field]: rule.message }));
        return false;
      }

      // Validación min (para números)
      if (
        rule.min !== undefined &&
        typeof value === 'number' &&
        value < rule.min
      ) {
        setErrors((prev) => ({ ...prev, [field]: rule.message }));
        return false;
      }

      // Validación max (para números)
      if (
        rule.max !== undefined &&
        typeof value === 'number' &&
        value > rule.max
      ) {
        setErrors((prev) => ({ ...prev, [field]: rule.message }));
        return false;
      }

      // Validación pattern (para strings)
      if (
        rule.pattern &&
        typeof value === 'string' &&
        !rule.pattern.test(value)
      ) {
        setErrors((prev) => ({ ...prev, [field]: rule.message }));
        return false;
      }

      // Validación custom
      if (rule.custom && !rule.custom(value)) {
        setErrors((prev) => ({ ...prev, [field]: rule.message }));
        return false;
      }

      // Si llegamos aquí, la validación pasó
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });

      return true;
    },
    [rules]
  );

  const validateForm = useCallback(
    (formData: Record<string, string | number | boolean>): boolean => {
      let isValid = true;
      const newErrors: ValidationErrors = {};

      Object.keys(rules).forEach((field) => {
        const fieldIsValid = validateField(field, formData[field]);
        if (!fieldIsValid) {
          isValid = false;
          newErrors[field] = rules[field].message;
        }
      });

      setErrors(newErrors);

      // Mostrar primer error encontrado
      if (!isValid) {
        const firstError = Object.values(newErrors)[0];
        if (firstError) {
          toast.error(firstError);
        }
      }

      return isValid;
    },
    [rules, validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
};
