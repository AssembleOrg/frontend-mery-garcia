'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Mail, Pencil, Phone, Plus, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { contableService, mensajeError, type AcreedorDetalle, type Moneda } from '@/services/contable.service';
import { useContable } from './contexto';
import { Confirmar } from './dialogos';
import DeudaCard from './DeudaCard';
import HistorialTab from './HistorialTab';
import { BarraAvance, Cargando, formatMonto, IconoAcreedor, Vacio } from './ui';

/** Ficha lateral de un acreedor: totales, deudas con sus pagos e historial propio. */
export default function AcreedorPanel({ id, onCerrar }: { id: string | null; onCerrar: () => void }) {
  const { version, editarAcreedor, nuevaDeuda, refrescar } = useContable();
  const [datos, setDatos] = useState<AcreedorDetalle | null>(null);
  const [verSaldadas, setVerSaldadas] = useState(false);
  const [borrar, setBorrar] = useState(false);

  useEffect(() => {
    if (!id) return;
    contableService
      .acreedor(id)
      .then(setDatos)
      .catch(() => toast.error('No se pudo cargar el acreedor'));
  }, [id, version]);

  useEffect(() => {
    if (!id) {
      setDatos(null);
      setVerSaldadas(false);
    }
  }, [id]);

  const eliminar = async () => {
    setBorrar(false);
    if (!datos) return;
    try {
      await contableService.eliminarAcreedor(datos.id);
      toast.success(`${datos.nombre} eliminado`);
      onCerrar();
      refrescar();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo eliminar'));
    }
  };

  const abiertas = datos?.deudas.filter((d) => d.saldo > 0) ?? [];
  const saldadas = datos?.deudas.filter((d) => d.saldo <= 0) ?? [];
  const monedas = (['ARS', 'USD'] as Moneda[]).filter((m) => (datos?.totales[m]?.deuda ?? 0) > 0);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent className="w-full gap-0 overflow-y-auto border-l-[#f0dde3] bg-[#fdf9fa] p-0 sm:max-w-xl">
        {!datos || datos.id !== id ? (
          <div className="space-y-4 p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Cargando acreedor</SheetTitle>
            </SheetHeader>
            <Cargando alto="h-24" />
            <Cargando alto="h-40" />
          </div>
        ) : (
          <>
            <SheetHeader className="border-b border-[#f0dde3] bg-white px-6 pt-6 pb-5">
              <div className="flex items-start gap-3 pr-6">
                <IconoAcreedor tipo={datos.tipo} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-xl text-[#3d2a32]">{datos.nombre}</SheetTitle>
                  <SheetDescription className="text-[#9a7d88]">
                    {datos.tipo === 'EMPRESA' ? 'Empresa' : 'Persona'}
                    {datos.documento && ` · ${datos.documento}`}
                  </SheetDescription>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6b4c57]">
                    {datos.telefono && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {datos.telefono}
                      </span>
                    )}
                    {datos.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {datos.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {datos.notas && <p className="mt-3 rounded-lg bg-[#fdf6f8] px-3 py-2 text-sm text-[#6b4c57]">{datos.notas}</p>}

              <div className={cn('mt-4 grid gap-3', monedas.length > 1 && 'sm:grid-cols-2')}>
                {(monedas.length ? monedas : (['ARS'] as Moneda[])).map((m) => {
                  const t = datos.totales[m];
                  return (
                    <div key={m} className="rounded-xl bg-gradient-to-br from-[#5b2139] to-[#8b5a6b] p-4 text-white">
                      <p className="text-[11px] tracking-[0.14em] text-white/70 uppercase">
                        Se le debe {m === 'USD' ? '(dólares)' : '(pesos)'}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMonto(t.saldo, m)}</p>
                      <BarraAvance pagado={t.pagado} total={t.deuda} className="mt-3 bg-white/20 [&>div]:bg-white" />
                      <p className="mt-1.5 text-[11px] text-white/70 tabular-nums">
                        Pagado {formatMonto(t.pagado, m)} de {formatMonto(t.deuda, m)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" className="bg-[#8b5a6b] text-white hover:bg-[#744a5a]" onClick={() => nuevaDeuda(datos.id)}>
                  <Plus className="mr-1 h-4 w-4" /> Nueva deuda
                </Button>
                <Button size="sm" variant="outline" onClick={() => editarAcreedor(datos)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar datos
                </Button>
                {datos.deudas.length === 0 && (
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setBorrar(true)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
                  </Button>
                )}
              </div>
            </SheetHeader>

            <Tabs defaultValue="deudas" className="px-6 py-5">
              <TabsList className="mb-4 w-full border border-[#f0dde3] bg-white">
                <TabsTrigger value="deudas" className="flex-1 data-[state=active]:bg-[#fbeef2] data-[state=active]:text-[#5b2139]">
                  Deudas ({abiertas.length})
                </TabsTrigger>
                <TabsTrigger value="historial" className="flex-1 data-[state=active]:bg-[#fbeef2] data-[state=active]:text-[#5b2139]">
                  Historial
                </TabsTrigger>
              </TabsList>
              <TabsContent value="deudas" className="mt-0 space-y-3">
                {datos.deudas.length === 0 ? (
                  <Vacio
                    icono={<Wallet className="h-6 w-6" />}
                    titulo="Sin deudas"
                    texto="Cargale una deuda para empezar a llevar la cuenta."
                  />
                ) : (
                  <>
                    {abiertas.map((d) => (
                      <DeudaCard key={d.id} deuda={d} abiertaInicial={abiertas.length === 1} />
                    ))}
                    {abiertas.length === 0 && (
                      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Al día: no se le debe nada.</p>
                    )}
                    {saldadas.length > 0 && (
                      <div className="pt-2">
                        <button
                          type="button"
                          className="text-xs font-medium text-[#8b5a6b] hover:underline"
                          onClick={() => setVerSaldadas((v) => !v)}
                        >
                          {verSaldadas ? 'Ocultar' : 'Ver'} {saldadas.length} {saldadas.length === 1 ? 'deuda saldada' : 'deudas saldadas'}
                        </button>
                        {verSaldadas && (
                          <div className="mt-3 space-y-3">
                            {saldadas.map((d) => (
                              <DeudaCard key={d.id} deuda={d} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="historial" className="mt-0">
                <HistorialTab acreedorId={datos.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
        <Confirmar
          abierto={borrar}
          titulo="¿Eliminar acreedor?"
          texto="No tiene deudas cargadas. Queda registrado en el historial."
          accion="Eliminar"
          onConfirmar={eliminar}
          onCerrar={() => setBorrar(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
