// /components/auth/LoginForm.tsx
'use client'; //framer motion need
import Image from 'next/image';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LoginForm() {
  const handleSubmitVisual = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulario enviado visualmente!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative w-full max-w-md space-y-8 rounded-2xl border-2 border-[#f9bbc4]/40 bg-white/95 p-10 shadow-2xl backdrop-blur-md dark:border-[#f9bbc4]/50 dark:bg-gray-900/95"
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
              <div
                className="absolute -inset-6 animate-spin rounded-full border-2 border-[#f9bbc4]/30"
                style={{ animationDuration: '8s' }}
              ></div>
              <div
                className="absolute -inset-4 animate-spin rounded-full border border-[#ec9cab]/40"
                style={{
                  animationDuration: '6s',
                  animationDirection: 'reverse',
                }}
              ></div>
              <div
                className="absolute -inset-8 animate-spin rounded-full border border-[#fcdce3]/20"
                style={{ animationDuration: '12s' }}
              ></div>

              <div className="absolute -inset-12">
                <div
                  className="absolute top-0 left-1/2 h-2 w-2 animate-spin rounded-full bg-[#f9bbc4] shadow-lg"
                  style={{
                    animationDuration: '4s',
                    transformOrigin: '0 96px',
                    filter: 'drop-shadow(0 0 6px rgba(249, 187, 196, 0.8))',
                  }}
                ></div>
                <div
                  className="absolute top-1/2 right-0 h-1.5 w-1.5 animate-spin rounded-full bg-[#ec9cab] shadow-md"
                  style={{
                    animationDuration: '5s',
                    transformOrigin: '-96px 0',
                    animationDirection: 'reverse',
                    filter: 'drop-shadow(0 0 4px rgba(236, 156, 171, 0.8))',
                  }}
                ></div>
                <div
                  className="absolute bottom-0 left-1/2 h-1 w-1 animate-spin rounded-full bg-[#fcdce3] shadow-sm"
                  style={{
                    animationDuration: '6s',
                    transformOrigin: '0 -96px',
                    filter: 'drop-shadow(0 0 3px rgba(252, 220, 227, 0.8))',
                  }}
                ></div>
                <div
                  className="absolute top-1/2 left-0 h-1.5 w-1.5 animate-spin rounded-full bg-[#f9bbc4] shadow-md"
                  style={{
                    animationDuration: '7s',
                    transformOrigin: '96px 0',
                    animationDirection: 'reverse',
                    filter: 'drop-shadow(0 0 5px rgba(249, 187, 196, 0.8))',
                  }}
                ></div>
              </div>

              <div className="absolute -inset-4 animate-pulse rounded-full bg-[#f9bbc4] opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-80"></div>
              <div
                className="absolute -inset-2 animate-pulse rounded-full bg-[#ec9cab] opacity-40 blur-lg transition-opacity duration-500 group-hover:opacity-60"
                style={{ animationDelay: '0.5s' }}
              ></div>

              <div className="absolute -inset-6 rounded-full border-2 border-[#f9bbc4]/0 transition-all duration-1000 group-hover:scale-150 group-hover:border-[#f9bbc4]/50 group-hover:opacity-0"></div>
              <div
                className="absolute -inset-8 rounded-full border border-[#ec9cab]/0 transition-all duration-1200 group-hover:scale-200 group-hover:border-[#ec9cab]/30 group-hover:opacity-0"
                style={{ transitionDelay: '0.2s' }}
              ></div>

              <div
                className="absolute top-2 right-2 h-1 w-1 animate-ping rounded-full bg-white opacity-0 group-hover:opacity-90"
                style={{ animationDelay: '0.5s', animationDuration: '2s' }}
              ></div>
              <div
                className="absolute bottom-3 left-3 h-0.5 w-0.5 animate-ping rounded-full bg-white opacity-0 group-hover:opacity-80"
                style={{ animationDelay: '1s', animationDuration: '1.5s' }}
              ></div>
              <div
                className="absolute top-1/2 right-1 h-0.5 w-0.5 animate-ping rounded-full bg-white opacity-0 group-hover:opacity-70"
                style={{ animationDelay: '1.8s', animationDuration: '1.8s' }}
              ></div>

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
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#f9bbc4]/20 via-[#fcdce3]/30 to-[#ec9cab]/20 opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100"></div>
              </div>

              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-60"></div>
              <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-white/30 blur-sm"></div>
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

        <form className="mt-8 space-y-7" onSubmit={handleSubmitVisual}>
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
              className="relative h-14 rounded-lg border-2 border-[#f9bbc4]/50 bg-white text-base font-medium text-gray-800 shadow-lg transition-all duration-300 placeholder:text-gray-500 hover:border-[#f9bbc4]/70 hover:shadow-xl focus:border-[#f9bbc4] focus:shadow-2xl focus:ring-4 focus:ring-[#f9bbc4]/25"
              placeholder="Correo Electrónico"
              style={{
                boxShadow:
                  '0 10px 30px -8px rgba(249, 187, 196, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            />
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
              className="relative h-14 rounded-lg border-2 border-[#f9bbc4]/50 bg-white text-base font-medium text-gray-800 shadow-lg transition-all duration-300 placeholder:text-gray-500 hover:border-[#f9bbc4]/70 hover:shadow-xl focus:border-[#f9bbc4] focus:shadow-2xl focus:ring-4 focus:ring-[#f9bbc4]/25"
              placeholder="Contraseña"
              style={{
                boxShadow:
                  '0 10px 30px -8px rgba(249, 187, 196, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="relative pt-4"
          >
            <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-r from-[#f9bbc4] via-[#ec9cab] to-[#f9bbc4] opacity-70 blur-sm"></div>
            <Button
              type="submit"
              className="group relative h-16 w-full overflow-hidden rounded-xl px-6 text-lg font-bold text-white transition-all duration-500 hover:scale-105 hover:shadow-2xl active:scale-95"
              style={{
                background:
                  'linear-gradient(135deg, #f9bbc4 0%, #ec9cab 50%, #f9bbc4 100%)',
                boxShadow:
                  '0 20px 40px -8px rgba(249, 187, 196, 0.7), 0 8px 25px -5px rgba(236, 156, 171, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              }}
            >
              <span className="relative z-10 tracking-wide transition-transform duration-400 group-hover:scale-110">
                Iniciar Sesión
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ec9cab] via-[#f9bbc4] to-[#db6177] opacity-50 transition-opacity duration-500 group-hover:opacity-100"></div>
              <div className="bg-gray/20 absolute inset-0 origin-left scale-x-0 transform transition-transform duration-700 group-hover:scale-x-100"></div>
              <div className="absolute -inset-1 -translate-x-full skew-x-12 transform bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100"></div>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="pt-6 text-center"
          >
            <button
              type="button"
              className="relative text-sm font-semibold text-gray-600 transition-all duration-300 hover:scale-101 hover:text-[#806165] hover:underline hover:decoration-2 hover:underline-offset-4"
              style={{
                textShadow: 'none',
                transition: 'all 0.1s ease',
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </motion.div>
        </form>

        {/* A testear */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.6, type: 'spring' }}
          className="flex justify-center pt-8"
        >
          <div className="group relative">
            <div className="h-3 w-32 rounded-full bg-gradient-to-r from-[#f9bbc4] via-[#ec9cab] to-[#f9bbc4] shadow-lg"></div>
            <div className="absolute -inset-2 h-3 w-32 rounded-full bg-gradient-to-r from-[#f9bbc4] via-[#ec9cab] to-[#f9bbc4] opacity-60 blur-md"></div>
            <div className="absolute top-1/2 -left-4 h-2 w-2 -translate-y-1/2 transform animate-pulse rounded-full bg-[#f9bbc4] shadow-lg"></div>
            <div
              className="absolute top-1/2 -right-4 h-2 w-2 -translate-y-1/2 transform animate-pulse rounded-full bg-[#ec9cab] shadow-lg"
              style={{ animationDelay: '0.5s' }}
            ></div>
            <div className="absolute -top-2 left-1/2 h-px w-16 -translate-x-1/2 transform bg-gradient-to-r from-transparent via-[#f9bbc4]/40 to-transparent"></div>
            <div className="absolute -bottom-2 left-1/2 h-px w-20 -translate-x-1/2 transform bg-gradient-to-r from-transparent via-[#ec9cab]/40 to-transparent"></div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
