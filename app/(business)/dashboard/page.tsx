'use client';
import MainLayout from '@/components/layout/MainLayout';
import PageBanner from '@/components/common/PageBanner';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import DashboardCard from '@/components/dashboard/DashboardCard';
import {
  CreditCard,
  BarChart3,
  Users2,
  DollarSign,
  ListOrdered,
  Cog,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard' },
];

const menuItems = [
  {
    title: 'Caja 1',
    description: 'Registra servicios, gestiona ingresos y egresos diarios.',
    href: '/caja-1',
    icon: <CreditCard size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#f9bbc4]',
    gradientTo: 'to-[#e292a3]',
    accentColor: '#f9bbc4',
    delay: 0.1,
  },
  {
    title: 'Caja 2',
    description: 'Administra la caja central y movimientos financieros.',
    href: '/caja-2',
    icon: <BarChart3 size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#f7a8b8]',
    gradientTo: 'to-[#e087a3]',
    accentColor: '#f7a8b8',
    delay: 0.2,
  },
  {
    title: 'Tipo de Cambio',
    description: 'Actualiza y consulta el valor del dólar.',
    href: '/tipo-cambio',
    icon: <DollarSign size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#d4a7ca]',
    gradientTo: 'to-[#b8869e]',
    accentColor: '#d4a7ca',
    delay: 0.3,
  },
  {
    title: 'Personal',
    description: 'Gestiona tu equipo y calcula comisiones.',
    href: '/personal',
    icon: <Users2 size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#f0b7c8]',
    gradientTo: 'to-[#d691a8]',
    accentColor: '#f0b7c8',
    delay: 0.4,
  },
  {
    title: 'Lista de Precios',
    description: 'Define y actualiza tus servicios y productos.',
    href: '/precio-lista',
    icon: <ListOrdered size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#e8b4c6]',
    gradientTo: 'to-[#cc8fa8]',
    accentColor: '#e8b4c6',
    delay: 0.5,
  },
  {
    title: 'Configuración',
    description: 'Ajustes generales y personalización.',
    href: '/configuracion',
    icon: <Cog size={32} strokeWidth={1.5} />,
    gradientFrom: 'from-[#deb2c4]',
    gradientTo: 'to-[#c48ba6]',
    accentColor: '#deb2c4',
    delay: 0.6,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  moveX: number;
  size: number;
}

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const newParticles = [...Array(25)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 3,
      moveX: Math.random() * 60 - 30,
      size: Math.random() * 3 + 1,
    }));
    setParticles(newParticles);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-[#f9bbc4] via-[#e8b4c6] to-[#d4a7ca]"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -120, 0],
            x: [0, particle.moveX, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

const GlowOrb = ({
  color,
  size,
  position,
}: {
  color: string;
  size: number;
  position: { x: string; y: string };
}) => (
  <motion.div
    className="pointer-events-none absolute rounded-full opacity-15 blur-3xl"
    style={{
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      width: `${size}px`,
      height: `${size}px`,
      left: position.x,
      top: position.y,
    }}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.15, 0.35, 0.15],
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

const WaveBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <svg
      className="absolute bottom-0 left-0 w-full opacity-20"
      viewBox="0 0 1200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M0,100 C300,150 600,50 900,100 C1050,125 1200,75 1200,100 L1200,200 L0,200 Z"
        fill="url(#wave-gradient)"
        animate={{
          d: [
            'M0,100 C300,150 600,50 900,100 C1050,125 1200,75 1200,100 L1200,200 L0,200 Z',
            'M0,80 C300,130 600,30 900,80 C1050,105 1200,55 1200,80 L1200,200 L0,200 Z',
            'M0,100 C300,150 600,50 900,100 C1050,125 1200,75 1200,100 L1200,200 L0,200 Z',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f9bbc4" />
          <stop offset="50%" stopColor="#e8b4c6" />
          <stop offset="100%" stopColor="#d4a7ca" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-white via-[#f9bbc4]/5 to-[#e8b4c6]/10 dark:from-gray-900 dark:via-[#f9bbc4]/5 dark:to-[#e8b4c6]/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,187,196,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(232,180,198,0.1),transparent_50%)]" />
          <WaveBackground />
        </div>

        <GlowOrb color="#f9bbc4" size={450} position={{ x: '5%', y: '15%' }} />
        <GlowOrb color="#e8b4c6" size={350} position={{ x: '75%', y: '55%' }} />
        <GlowOrb color="#d4a7ca" size={400} position={{ x: '45%', y: '5%' }} />
        <GlowOrb color="#f0b7c8" size={280} position={{ x: '85%', y: '20%' }} />
        <FloatingParticles />

        <div className="relative z-10">
          <PageBanner
            title="Portal de Gestión"
            imageUrl="/png/imagen2portal.png"
            altText="Banner principal del portal Mery García"
            heightClass="h-72 md:h-80 lg:h-96"
            imagePosition="object-[90%_10%] lg:object-[85%_15%]"
          />

          <div className="relative -mt-16 h-16 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-gray-900/50 dark:to-gray-900" />

          <div className="relative bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          <div className="relative bg-gradient-to-b from-white/90 via-white/95 to-white dark:from-gray-900/90 dark:via-gray-900/95 dark:to-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="mb-20 text-center"
              >
                <motion.div
                  className="mb-8 inline-flex items-center gap-3 rounded-full border-2 border-[#f9bbc4]/30 bg-gradient-to-r from-white/90 via-[#f9bbc4]/10 to-white/90 px-8 py-4 shadow-lg backdrop-blur-sm dark:border-[#f9bbc4]/40 dark:from-gray-800/90 dark:via-[#f9bbc4]/10 dark:to-gray-800/90"
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(249, 187, 196, 0.4)',
                      '0 0 50px rgba(232, 180, 198, 0.5)',
                      '0 0 30px rgba(249, 187, 196, 0.4)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-[#f9bbc4]" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-[#f9bbc4] via-[#e8b4c6] to-[#d4a7ca] bg-clip-text text-lg font-semibold text-transparent">
                    Dashboard Portal de Gestión
                  </span>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-[#e8b4c6]" />
                  </motion.div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300"
                >
                  Administra tu negocio de manera eficiente con nuestras
                  herramientas integradas
                </motion.p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-12"
              >
                {menuItems.map((item, index) => (
                  <DashboardCard
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    href={item.href}
                    icon={item.icon}
                    gradientFrom={item.gradientFrom}
                    gradientTo={item.gradientTo}
                    accentColor={item.accentColor}
                    delay={item.delay}
                    index={index}
                  />
                ))}
              </motion.div>

              {/* Manejar estado del server visual aca */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="mt-20 text-center"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20 px-6 py-3 backdrop-blur-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#f9bbc4]" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sistema actualizado y funcionando correctamente
                    (hardcodeado)
                  </span>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#e8b4c6]" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
