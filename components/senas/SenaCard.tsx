'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SenaIndependiente } from '@/types/sena';
import { formatCurrencyUyu } from '@/lib/utils';

interface SenaCardProps {
  sena: SenaIndependiente;
  clienteNombre?: string;
  onUsar?: (senaId: string) => void;
  onCancelar?: (senaId: string) => void;
  showActions?: boolean;
}

export function SenaCard({ 
  sena, 
  clienteNombre, 
  onUsar, 
  onCancelar, 
  showActions = true 
}: SenaCardProps) {
  const getEstadoBadgeVariant = (estado: SenaIndependiente['estado']) => {
    switch (estado) {
      case 'disponible': return 'default';
      case 'usada': return 'secondary';
      case 'expirada': return 'destructive';
      case 'cancelada': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {sena.moneda === 'ARS' ? `$${sena.monto.toLocaleString()}` : `$${sena.monto.toLocaleString()} USD`}
          </CardTitle>
          <Badge variant={getEstadoBadgeVariant(sena.estado)}>
            {sena.estado.toUpperCase()}
          </Badge>
        </div>
        {clienteNombre && (
          <p className="text-sm text-muted-foreground">{clienteNombre}</p>
        )}
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Creada:</span>
            <span>{sena.fechaCreacion.toLocaleDateString()}</span>
          </div>
          
          {sena.fechaUso && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usada:</span>
              <span>{sena.fechaUso.toLocaleDateString()}</span>
            </div>
          )}
          
          {sena.fechaExpiracion && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expira:</span>
              <span>{sena.fechaExpiracion.toLocaleDateString()}</span>
            </div>
          )}
          
          {sena.observaciones && (
            <div>
              <span className="text-muted-foreground">Observaciones:</span>
              <p className="mt-1 text-sm">{sena.observaciones}</p>
            </div>
          )}
        </div>

        {showActions && sena.estado === 'disponible' && (
          <div className="flex gap-2 mt-4">
            {onUsar && (
              <Button 
                size="sm" 
                onClick={() => onUsar(sena.id)}
                className="flex-1"
              >
                Usar
              </Button>
            )}
            {onCancelar && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onCancelar(sena.id)}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}