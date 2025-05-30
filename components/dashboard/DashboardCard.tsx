// /components/dashboard/DashboardCard.tsx
import Link from 'next/link';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightCircle, Zap } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
  accentColor?: string;
  delay?: number;
  index?: number;
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.8,
    rotateX: 25,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      duration: 0.8,
    },
  },
};

export default function DashboardCard({
  title,
  description,
  href,
  icon,
  gradientFrom = 'from-[#ff6b9d]',
  gradientTo = 'to-[#c44569]',
  accentColor = '#ff6b9d',
  delay = 0,
  // index = 0,
}: DashboardCardProps) {
  return (
    //la magia:
    <motion.div
      variants={cardVariants}
      whileHover={{
        scale: 1.05,
        y: -12,
        rotateY: 5,
        rotateX: 5,
        z: 100,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: delay,
      }}
      className="group perspective-1000 relative rounded-3xl"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-3xl opacity-0 blur-xl transition-all duration-500 group-hover:opacity-60"
        style={{
          background: `linear-gradient(45deg, ${accentColor}40, ${accentColor}20, ${accentColor}40)`,
        }}
        animate={{
          background: [
            `linear-gradient(0deg, ${accentColor}40, ${accentColor}20)`,
            `linear-gradient(180deg, ${accentColor}40, ${accentColor}20)`,
            `linear-gradient(360deg, ${accentColor}40, ${accentColor}20)`,
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* test border */}
      <motion.div
        className="absolute -inset-0.5 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      <Link
        href={href}
        className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border-0 bg-white/80 p-8 text-left backdrop-blur-xl transition-all duration-500 group-hover:bg-white/90 dark:bg-gray-900/80 dark:group-hover:bg-gray-900/90"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
          boxShadow: `
            0 25px 50px -12px ${accentColor}15,
            0 0 0 1px rgba(255,255,255,0.1),
            inset 0 1px 0 rgba(255,255,255,0.2)
          `,
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-700 group-hover:opacity-100">
          {[...Array(5)].map((_, i) => {
            // evitar hydration mismatch
            const leftPos = 20 + i * 15;
            const topPos = 20 + i * 10;

            return (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full"
                style={{ background: accentColor }}
                initial={{
                  left: `${leftPos}%`,
                  top: `${topPos}%`,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  y: [-20, -60],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>

        <div>
          <motion.div
            className={`mb-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} relative overflow-hidden p-4 text-white shadow-2xl`}
            whileHover={{
              rotateY: 15,
              rotateX: 15,
              scale: 1.1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              boxShadow: `
                0 20px 40px -12px ${accentColor}40,
                0 0 0 1px rgba(255,255,255,0.1),
                inset 0 1px 0 rgba(255,255,255,0.2)
              `,
            }}
          >
            <motion.div
              className="absolute inset-0 -skew-x-12 opacity-0 group-hover:opacity-100"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              {icon}
            </motion.div>
          </motion.div>

          <motion.h3
            className="mb-3 text-3xl font-extrabold text-[rgb(var(--card-foreground-rgb))] dark:text-[rgb(var(--card-foreground-rgb))]"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontWeight: '800',
            }}
          >
            {title}
          </motion.h3>

          <motion.p className="leading-relaxed font-medium text-[rgb(var(--muted-foreground-rgb))] dark:text-[rgb(var(--muted-foreground-rgb))]">
            {description}
          </motion.p>
        </div>

        <motion.div
          className="mt-8 flex items-center justify-between"
          whileHover={{ x: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div
            className="flex items-center text-lg font-bold transition-all duration-300 group-hover:scale-105"
            style={{ color: accentColor }}
          >
            <Zap
              size={18}
              className="mr-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            Explorar sección
          </div>

          <motion.div
            whileHover={{
              rotate: 360,
              scale: 1.2,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <ArrowRightCircle
              size={24}
              style={{ color: accentColor }}
              className="transform transition-all duration-300 group-hover:drop-shadow-lg"
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at center, ${accentColor}10 0%, transparent 70%)`,
          }}
          initial={{ scale: 0 }}
          whileHover={{
            scale: 2,
            opacity: [0, 0.3, 0],
          }}
          transition={{ duration: 0.8 }}
        />
      </Link>
    </motion.div>
  );
}
