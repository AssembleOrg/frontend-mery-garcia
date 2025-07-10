// /components/auth/LoginForm.tsx
'use client';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useState } from 'react';

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const { errors, validateField, validateForm } = useFormValidation({
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email válido es requerido',
    },
    password: {
      required: true,
      min: 6,
      message: 'Contraseña debe tener al menos 6 caracteres',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm(formData)) return;

    await login(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative w-full max-w-md space-y-6 rounded-2xl border-2 border-[#f9bbc4]/40 bg-white/95 p-8 shadow-2xl backdrop-blur-md dark:border-[#f9bbc4]/50 dark:bg-gray-900/95"
      style={{
        background:
          'linear-gradient(135deg, rgba(249, 187, 196, 0.12) 0%, rgba(255, 255, 255, 0.98) 15%, rgba(255, 255, 255, 0.98) 85%, rgba(249, 187, 196, 0.12) 100%)',
        boxShadow:
          '0 32px 64px -12px rgba(249, 187, 196, 0.5), 0 0 0 1px rgba(249, 187, 196, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      }}
    >
      <div className="absolute -inset-1.5 animate-pulse rounded-2xl bg-gradient-to-r from-[#f9bbc4] via-[#ec9cab] to-[#f9bbc4] opacity-40 blur-sm"></div>
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#f9bbc4] via-transparent to-[#f9bbc4] opacity-30"></div>

      <div className="relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              type: 'spring',
              stiffness: 200,
            }}
            className="group relative mb-6 inline-block cursor-pointer"
          >
            <div
              className="relative rounded-full bg-gradient-to-br from-[#f9bbc4] via-[#fcdce3] to-[#ec9cab] p-8 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              style={{
                boxShadow:
                  '0 30px 60px -12px rgba(249, 187, 196, 0.8), 0 0 50px rgba(249, 187, 196, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              <div className="relative z-10 transition-all duration-500 group-hover:scale-105">
                <Image
                  src="/MeryLogo.svg"
                  alt="Logo de Mery García"
                  width={160}
                  height={50}
                  className="mx-auto drop-shadow-2xl filter transition-all duration-500 group-hover:brightness-110"
                  priority
                  style={{
                    filter:
                      'drop-shadow(0 0 20px rgba(249, 187, 196, 1)) drop-shadow(0 0 40px rgba(249, 187, 196, 0.6)) drop-shadow(0 0 60px rgba(249, 187, 196, 0.3))',
                  }}
                />
              </div>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-4 bg-gradient-to-r from-[#ec9cab] via-[#f9bbc4] to-[#ec9cab] bg-clip-text text-center font-sans text-4xl font-bold tracking-tight text-transparent"
            style={{
              textShadow: '0 0 25px rgba(249, 187, 196, 0.4)',
            }}
          >
            Bienvenida
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-3 text-center text-base font-medium text-gray-600"
          >
            Ingresa a tu portal de gestión
          </motion.p>
        </div>

        <form className="mt-8 space-y-7" onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="group relative"
          >
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#ec9cab] opacity-40 blur transition-opacity duration-300 group-hover:opacity-60"></div>
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`relative h-14 rounded-lg border-2 bg-white text-base font-medium text-gray-800 shadow-lg transition-all duration-300 placeholder:text-gray-500 hover:shadow-xl focus:shadow-2xl focus:ring-4 focus:ring-[#f9bbc4]/25 ${
                errors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#f9bbc4]/50 hover:border-[#f9bbc4]/70 focus:border-[#f9bbc4]'
              }`}
              placeholder="Correo Electrónico"
              style={{
                boxShadow:
                  '0 10px 30px -8px rgba(249, 187, 196, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="group relative"
          >
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#ec9cab] opacity-40 blur transition-opacity duration-300 group-hover:opacity-60"></div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`relative h-14 rounded-lg border-2 bg-white text-base font-medium text-gray-800 shadow-lg transition-all duration-300 placeholder:text-gray-500 hover:shadow-xl focus:shadow-2xl focus:ring-4 focus:ring-[#f9bbc4]/25 ${
                errors.password
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#f9bbc4]/50 hover:border-[#f9bbc4]/70 focus:border-[#f9bbc4]'
              }`}
              placeholder="Contraseña"
              style={{
                boxShadow:
                  '0 10px 30px -8px rgba(249, 187, 196, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="group hover:shadow-3xl relative h-14 w-full overflow-hidden rounded-lg bg-gradient-to-r from-[#f9bbc4] via-[#ec9cab] to-[#f9bbc4] text-lg font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 focus:ring-4 focus:ring-[#f9bbc4]/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{
                boxShadow:
                  '0 20px 40px -8px rgba(249, 187, 196, 0.6), 0 0 30px rgba(249, 187, 196, 0.4)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ec9cab] via-[#f9bbc4] to-[#ec9cab] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <span className="relative z-10">
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </span>
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
