// /components/dashboard/DashboardCard.tsx
import Link from 'next/link';
import { ReactNode } from 'react';
import { ArrowRightCircle } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
  accentColor?: string;
}

export default function DashboardCard({
  title,
  description,
  href,
  icon,
  gradientFrom = 'from-[#ff6b9d]',
  gradientTo = 'to-[#c44569]',
  accentColor = '#ff6b9d',
}: DashboardCardProps) {
  return (
    <div className="group h-full">
      <Link
        href={href}
        className="flex h-full flex-col rounded-2xl border-2 bg-gradient-to-br from-white/95 via-[#f9bbc4]/5 to-white/90 p-6 shadow-xl shadow-[#f9bbc4]/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
        style={{
          borderColor: `${accentColor}80`,
          boxShadow: `0 8px 30px -6px ${accentColor}35, 0 4px 15px -3px rgba(0,0,0,0.15)`,
        }}
      >
        <div className="flex-1">
          <div
            className={`mb-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} p-4 text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
            style={{
              boxShadow: `0 12px 35px -10px ${accentColor}60, 0 6px 20px -5px ${accentColor}40`,
            }}
          >
            {icon}
          </div>

          <h3 className="mb-4 text-xl font-bold text-[#4a3540] transition-colors group-hover:text-[#3d2b35]">
            {title}
          </h3>

          <p className="mb-6 leading-relaxed font-medium text-[#5a4550] transition-colors group-hover:text-[#4a3540]">
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between transition-all duration-200">
          <span
            className={`rounded-lg bg-gradient-to-br px-4 py-2 text-sm font-bold text-white shadow-lg transition-all duration-300 group-hover:scale-105 ${gradientFrom} ${gradientTo}`}
            style={{
              boxShadow: `0 8px 20px -6px ${accentColor}50`,
            }}
          >
            Acceder
          </span>
          <ArrowRightCircle
            size={28}
            className="transition-all duration-300 group-hover:translate-x-2 group-hover:scale-125"
            style={{
              color: accentColor,
              stroke: accentColor,
              strokeWidth: '2.5',
            }}
          />
        </div>

        {/* Borde decorativo femenino */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, ${accentColor}15, transparent 30%, ${accentColor}10 70%, transparent)`,
            border: `1px solid ${accentColor}50`,
          }}
        />

        {/* Efecto de brillo sutil */}
        <div
          className="absolute top-0 left-0 h-1 w-full rounded-t-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
          }}
        />
      </Link>
    </div>
  );
}
