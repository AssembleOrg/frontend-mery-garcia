'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { presentismoService, type Equipo, type PersonaRitmo } from '@/services/presentismo.service';

const ROL: Record<PersonaRitmo['role'], string> = {
  ADMIN: 'Administración',
  SUPERVISOR: 'Supervisión',
  CONTABLE: 'Contable',
  EMPLEADO: 'Empleado',
  PLATAFORMA: 'Plataforma',
};

const ACCESO: Record<string, string> = {
  activo: 'bg-[#d8eadf] text-[#24533a]',
  'sin-invitar': 'bg-[#fbe3b8] text-[#7a4a05]',
  'sin-acceso': 'bg-[#fcf0f3] text-[#8b5a6b]',
};

const TONO: Record<string, string> = {
  ok: 'text-[#24533a]',
  alerta: 'text-[#7a4a05]',
  info: 'text-[#3b4a86]',
};

export default function TabEquipo() {
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setEquipo(await presentismoService.equipo());
    } catch (error) {
      console.error('Error cargando el equipo:', error);
      toast.error('No se pudo cargar el equipo');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-[#fcf0f3]" />
        ))}
      </div>
    );
  }
  if (!equipo) return null;

  const metricas = [
    { label: 'En el equipo', valor: equipo.total, alerta: false },
    { label: 'Con acceso a la app', valor: equipo.withAccess, alerta: false },
    { label: 'Sin invitar', valor: equipo.notInvited, alerta: equipo.notInvited > 0 },
    { label: 'Sin acceso', valor: equipo.inactive, alerta: false },
  ];

  return (
    <div className="space-y-4">
      <p className="max-w-[70ch] text-sm text-[#6b4c57]">
        Quién está dado de alta en Ritmo. Altas, bajas y datos de cada persona se administran
        desde la consola de Ritmo; acá se ven para saber contra quién se cargan los horarios.
      </p>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {metricas.map((m) => (
          <div key={m.label} className="flex flex-col">
            <dt className="text-xs text-[#8b5a6b]">{m.label}</dt>
            <dd className={`text-xl tabular-nums ${m.alerta ? 'text-[#7a4a05]' : 'text-[#4a3540]'}`}>{m.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mg-scroll overflow-x-auto rounded-xl border border-[#f5d0d9] bg-white">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#f5d0d9] text-xs text-[#8b5a6b]">
              <th className="px-3 py-2 text-left font-normal">Persona</th>
              <th className="px-3 py-2 text-left font-normal">Email</th>
              <th className="px-3 py-2 text-left font-normal">Rol</th>
              <th className="px-3 py-2 text-left font-normal">Lugar</th>
              <th className="px-3 py-2 text-right font-normal">Turnos esta semana</th>
              <th className="px-3 py-2 text-right font-normal">Horas</th>
              <th className="px-3 py-2 text-right font-normal">Tarde este mes</th>
              <th className="px-3 py-2 text-left font-normal">Acceso</th>
              <th className="px-3 py-2 text-left font-normal">Estado</th>
            </tr>
          </thead>
          <tbody>
            {equipo.people.map((persona) => (
              <tr key={persona.id} className="border-b border-[#fcf0f3] last:border-b-0 hover:bg-[#fdf8fa]">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fcf0f3] text-[11px] text-[#6b4c57]">
                      {persona.initials}
                    </span>
                    <div>
                      <div className="text-[#4a3540]">{persona.fullName}</div>
                      {persona.employeeCode && (
                        <div className="text-xs text-[#8b5a6b]">{persona.employeeCode}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-[#6b4c57]">{persona.email}</td>
                <td className="px-3 py-2.5 text-[#6b4c57]">{ROL[persona.role] ?? persona.role}</td>
                <td className="px-3 py-2.5 text-[#6b4c57]">{persona.worksiteName ?? '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{persona.shiftsThisWeek}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{persona.hoursThisWeek} h</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${persona.lateThisMonth > 0 ? 'text-[#7a4a05]' : 'text-[#8b5a6b]'}`}>
                  {persona.lateThisMonth}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-md px-1.5 py-0.5 text-xs ${ACCESO[persona.access] ?? ACCESO['sin-acceso']}`}>
                    {persona.accessLabel}
                  </span>
                </td>
                <td className={`px-3 py-2.5 text-xs ${TONO[persona.statusTone] ?? 'text-[#6b4c57]'}`}>
                  {persona.statusLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
