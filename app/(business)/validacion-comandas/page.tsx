'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ScanText } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ClientOnly from '@/components/common/ClientOnly';
import AdminOnly from '@/components/auth/AdminOnly';
import { validacionComandasService, type Lote, type LoteDetalle } from '@/services/validacionComandas.service';
import { Cargando, Panel, Vacio } from '@/components/contable/ui';
import SubirLote from '@/components/validacion-comandas/SubirLote';
import ListaLotes from '@/components/validacion-comandas/ListaLotes';
import DetalleLote from '@/components/validacion-comandas/DetalleLote';

/**
 * Validación de comandas en papel con IA. Herramienta interna: sin acceso desde
 * el dashboard ni desde ninguna otra pantalla (se entra por URL, sólo admin).
 * Nada es automático: subir no lee, la lectura se inicia a mano y nunca se
 * modifica una comanda.
 */
const breadcrumbItems = [{ label: 'Inicio', href: '/dashboard' }, { label: 'Validación de comandas' }];

export default function ValidacionComandasPage() {
  const [lotes, setLotes] = useState<Lote[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<LoteDetalle | null>(null);

  const cargarLotes = useCallback(async () => {
    try {
      setLotes(await validacionComandasService.lotes());
    } catch {
      toast.error('No se pudieron cargar los lotes');
    }
  }, []);

  const cargarDetalle = useCallback(async (id: string) => {
    try {
      setDetalle(await validacionComandasService.lote(id));
    } catch {
      toast.error('No se pudo cargar el lote');
    }
  }, []);

  useEffect(() => {
    cargarLotes();
  }, [cargarLotes]);

  useEffect(() => {
    if (seleccionado) cargarDetalle(seleccionado);
    else setDetalle(null);
  }, [seleccionado, cargarDetalle]);

  // Mientras el servidor lee, se refresca la pantalla cada 3 s (la lectura en sí no depende de esto).
  const leyendo = !!detalle?.leyendo;
  useEffect(() => {
    if (!leyendo || !seleccionado) return;
    const t = setInterval(async () => {
      const d = await validacionComandasService.lote(seleccionado).catch(() => null);
      if (d) {
        setDetalle(d);
        if (!d.leyendo) cargarLotes();
      }
    }, 3000);
    return () => clearInterval(t);
  }, [leyendo, seleccionado, cargarLotes]);

  const actualizado = (l: LoteDetalle) => {
    setDetalle(l);
    setSeleccionado(l.id);
    cargarLotes();
  };

  return (
    <AdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Validación de comandas" />
          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
          <StandardBreadcrumbs items={breadcrumbItems} />

          <ClientOnly>
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <p className="mb-5 rounded-2xl border border-[#f0dde3] bg-white/90 px-4 py-3 text-sm text-[#6b4c57] shadow-sm">
                La IA lee las comandas en papel y las compara con las cargadas en el sistema. Es una herramienta de
                control: no valida ni modifica ninguna comanda.
              </p>
              <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <SubirLote onSubido={actualizado} />
                  {lotes ? (
                    <ListaLotes lotes={lotes} seleccionado={seleccionado} onElegir={setSeleccionado} />
                  ) : (
                    <Cargando alto="h-48" />
                  )}
                </div>
                <div className="min-w-0">
                  {detalle ? (
                    <DetalleLote
                      lote={detalle}
                      onActualizado={actualizado}
                      onEliminado={() => {
                        setSeleccionado(null);
                        cargarLotes();
                      }}
                    />
                  ) : seleccionado ? (
                    <Cargando alto="h-96" />
                  ) : (
                    <Panel>
                      <Vacio
                        icono={<ScanText className="h-6 w-6" />}
                        titulo="Elegí un lote o subí uno nuevo"
                        texto="Cada lote son las comandas en papel de un día. Después de subirlo, leelo con IA para compararlo con el sistema."
                      />
                    </Panel>
                  )}
                </div>
              </div>
            </div>
          </ClientOnly>
        </div>
      </MainLayout>
    </AdminOnly>
  );
}
