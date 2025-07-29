'use client';

import { SenaIndependiente } from '@/types/sena';
import { SenaCard } from './SenaCard';
import { useSenas } from '@/features/senas/hooks/useSenas';

interface SenaListProps {
  senas: SenaIndependiente[];
  showActions?: boolean;
  onUsar?: (senaId: string) => void;
  onCancelar?: (senaId: string) => void;
}

export function SenaList({ 
  senas, 
  showActions = true, 
  onUsar, 
  onCancelar 
}: SenaListProps) {
  const { obtenerSenas } = useSenas();

  if (senas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay señas disponibles
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {senas.map((sena) => (
        <SenaCard
          key={sena.id}
          sena={sena}
          showActions={showActions}
          onUsar={onUsar}
          onCancelar={onCancelar}
        />
      ))}
    </div>
  );
}