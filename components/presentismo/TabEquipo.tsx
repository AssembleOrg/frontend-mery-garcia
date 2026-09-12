'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Spinner from '@/components/common/Spinner';
import { AlertTriangle, MailWarning, UserCheck, Users } from 'lucide-react';
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
  activo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'sin-invitar': 'border-amber-200 bg-amber-50 text-amber-700',
  'sin-acceso': 'border-neutral-200 bg-neutral-50 text-neutral-600',
};

const TONO: Record<string, string> = {
  ok: 'text-emerald-700',
  alerta: 'text-amber-700',
  info: 'text-sky-700',
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
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!equipo) return null;

  const metricas = [
    { label: 'En el equipo', valor: equipo.total, icono: Users, color: 'text-[#d4a7ca]' },
    { label: 'Con acceso a la app', valor: equipo.withAccess, icono: UserCheck, color: 'text-emerald-600' },
    { label: 'Sin invitar', valor: equipo.notInvited, icono: MailWarning, color: 'text-amber-600' },
    { label: 'Sin acceso', valor: equipo.inactive, icono: AlertTriangle, color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border border-[#f9bbc4]/30 bg-white/95">
        <CardContent className="p-4 text-sm text-[#6b4c57]">
          Quién está dado de alta en Ritmo. Las altas, las bajas y los datos de cada
          persona se administran desde la consola de Ritmo; acá se ven para saber contra
          quién se están cargando los horarios.
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricas.map(({ label, valor, icono: Icono, color }) => (
          <Card key={label} className="border border-[#f9bbc4]/30 bg-white/95">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-[#6b4c57]">
                <Icono className={`h-4 w-4 ${color}`} />
                <span>{label}</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-[#4a3540]">{valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#f9bbc4]/30 text-xs text-[#6b4c57]">
                  <th className="p-3 text-left font-semibold">Persona</th>
                  <th className="p-3 text-left font-semibold">Email</th>
                  <th className="p-3 text-left font-semibold">Rol</th>
                  <th className="p-3 text-left font-semibold">Lugar</th>
                  <th className="p-3 text-right font-semibold">Turnos esta semana</th>
                  <th className="p-3 text-right font-semibold">Horas</th>
                  <th className="p-3 text-right font-semibold">Tarde este mes</th>
                  <th className="p-3 text-left font-semibold">Acceso</th>
                  <th className="p-3 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {equipo.people.map((persona, i) => (
                  <tr
                    key={persona.id}
                    className={`border-b border-[#f9bbc4]/10 ${i % 2 === 0 ? 'bg-[#f9bbc4]/5' : ''}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-[10px] font-bold text-white">
                          {persona.initials}
                        </span>
                        <div>
                          <div className="font-medium text-[#4a3540]">{persona.fullName}</div>
                          {persona.employeeCode && (
                            <div className="text-xs text-[#8b5a6b]">{persona.employeeCode}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[#6b4c57]">{persona.email}</td>
                    <td className="p-3 text-[#6b4c57]">{ROL[persona.role] ?? persona.role}</td>
                    <td className="p-3 text-[#6b4c57]">{persona.worksiteName ?? '—'}</td>
                    <td className="p-3 text-right text-[#4a3540]">{persona.shiftsThisWeek}</td>
                    <td className="p-3 text-right text-[#4a3540]">{persona.hoursThisWeek} h</td>
                    <td
                      className={`p-3 text-right ${
                        persona.lateThisMonth > 0 ? 'text-amber-600' : 'text-[#6b4c57]'
                      }`}
                    >
                      {persona.lateThisMonth}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={ACCESO[persona.access] ?? ACCESO['sin-acceso']}
                      >
                        {persona.accessLabel}
                      </Badge>
                    </td>
                    <td className={`p-3 text-xs ${TONO[persona.statusTone] ?? 'text-[#6b4c57]'}`}>
                      {persona.statusLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
