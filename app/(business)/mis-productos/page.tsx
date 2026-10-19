'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import Spinner from '@/components/common/Spinner';
import BotonAvisosCelular from '@/components/common/BotonAvisosCelular';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Minus, Package, Plus, Search, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { solicitudesStockService, type SolicitudStock } from '@/services/stock.service';
import { ESTADOS_SOLICITUD, fechaSolicitud, resumenItems } from '@/components/stock/estadosSolicitud';

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Pantalla del empleado: pedir productos para un servicio y ver sus pedidos. */
export default function MisProductosPage() {
  const { soloEmpleado, user } = useAuth();
  const [productos, setProductos] = useState<{ id: string; nombre: string }[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [pedido, setPedido] = useState<Map<string, number>>(new Map());
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargarSolicitudes = useCallback(async () => {
    try {
      setSolicitudes(await solicitudesStockService.misSolicitudes());
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (!soloEmpleado) return;
    (async () => {
      try {
        const [prods] = await Promise.all([solicitudesStockService.misProductos(), cargarSolicitudes()]);
        setProductos(prods);
      } catch (error) {
        console.error(error);
        toast.error('No se pudieron cargar tus productos');
      } finally {
        setCargando(false);
      }
    })();
  }, [soloEmpleado, cargarSolicitudes]);

  // Cuando le resuelven un pedido llega el aviso en vivo: refrescar la lista.
  useEffect(() => {
    const alAviso = () => void cargarSolicitudes();
    window.addEventListener('mery:notificacion', alAviso);
    const alVolver = () => document.visibilityState === 'visible' && void cargarSolicitudes();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.removeEventListener('mery:notificacion', alAviso);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [cargarSolicitudes]);

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return q ? productos.filter((p) => normalizar(p.nombre).includes(q)) : productos;
  }, [productos, busqueda]);

  const cambiar = (id: string, delta: number) =>
    setPedido((prev) => {
      const nuevo = new Map(prev);
      const cant = Math.min(99, Math.max(0, (nuevo.get(id) ?? 0) + delta));
      if (cant) nuevo.set(id, cant);
      else nuevo.delete(id);
      return nuevo;
    });

  const totalItems = [...pedido.values()].reduce((a, b) => a + b, 0);

  const enviar = async () => {
    if (!pedido.size) return;
    setEnviando(true);
    try {
      const nueva = await solicitudesStockService.crear(
        [...pedido].map(([productoId, cantidad]) => ({ productoId, cantidad })),
        nota,
      );
      setSolicitudes((prev) => [nueva, ...prev]);
      setPedido(new Map());
      setNota('');
      toast.success('Pedido enviado. Te avisamos cuando lo aprueben.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo enviar el pedido');
    } finally {
      setEnviando(false);
    }
  };

  const cancelar = async (id: string) => {
    try {
      const actualizada = await solicitudesStockService.cancelar(id);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? actualizada : s)));
      toast.success('Pedido cancelado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cancelar (quizás ya lo resolvieron)');
      void cargarSolicitudes();
    }
  };

  if (!soloEmpleado) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-6 text-center text-[#6b4c57]">
          Esta pantalla es para el personal que pide productos.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10 pb-28">
        <StandardPageBanner title="Mis productos" />

        <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
          <p className="rounded-xl border border-[#f9bbc4]/30 bg-white/95 px-4 py-3 text-sm text-[#4a3540] shadow">
            Hola{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''}. Marcá lo que vas a usar y enviá el pedido.
          </p>

          <BotonAvisosCelular className="w-full" />

          {cargando ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <>
              <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-[#4a3540]">
                    <Package className="h-5 w-5 text-[#8b5a6b]" />
                    Pedir productos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productos.length === 0 ? (
                    <p className="rounded-lg border-2 border-dashed border-[#f9bbc4]/40 p-6 text-center text-sm text-[#8b5a6b]">
                      Todavía no hay productos cargados. Avisale a la encargada.
                    </p>
                  ) : (
                    <>
                      {productos.length > 6 && (
                        <div className="relative">
                          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]" />
                          <Input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar producto..."
                            className="h-11 border-[#f9bbc4]/40 pl-9"
                          />
                        </div>
                      )}
                      <ul className="divide-y divide-[#f9bbc4]/15 rounded-lg border border-[#f9bbc4]/20">
                        {filtrados.map((p) => {
                          const cant = pedido.get(p.id) ?? 0;
                          return (
                            <li
                              key={p.id}
                              className={`flex items-center gap-2 px-3 py-2 ${cant ? 'bg-[#f9bbc4]/10' : ''}`}
                            >
                              <span className="min-w-0 flex-1 text-sm break-words text-[#4a3540]">{p.nombre}</span>
                              {cant > 0 && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    aria-label={`Uno menos de ${p.nombre}`}
                                    onClick={() => cambiar(p.id, -1)}
                                    className="h-10 w-10 shrink-0 border-[#f9bbc4]/50 p-0 text-[#6b4c57]"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-6 text-center text-sm font-semibold text-[#4a3540] tabular-nums">
                                    {cant}
                                  </span>
                                </>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                aria-label={`Agregar ${p.nombre}`}
                                onClick={() => cambiar(p.id, 1)}
                                className="h-10 w-10 shrink-0 border-[#f9bbc4]/50 p-0 text-[#6b4c57]"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </li>
                          );
                        })}
                        {filtrados.length === 0 && (
                          <li className="p-4 text-center text-sm text-[#8b5a6b]">Ningún producto coincide</li>
                        )}
                      </ul>
                      <Input
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        maxLength={300}
                        placeholder="¿Para qué servicio? (opcional)"
                        className="h-11 border-[#f9bbc4]/40"
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-[#f9bbc4]/30 bg-white/95">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-[#4a3540]">
                    <ClipboardList className="h-5 w-5 text-[#8b5a6b]" />
                    Mis pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {solicitudes.length === 0 ? (
                    <p className="text-center text-sm text-[#8b5a6b]">Todavía no hiciste pedidos.</p>
                  ) : (
                    solicitudes.map((s) => (
                      <div key={s.id} className="rounded-lg border border-[#f9bbc4]/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[#8b5a6b]">{fechaSolicitud(s.createdAt)}</span>
                          <Badge variant="outline" className={ESTADOS_SOLICITUD[s.estado].clase}>
                            {ESTADOS_SOLICITUD[s.estado].texto}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm text-[#4a3540]">
                          {resumenItems(s)}
                        </p>
                        {s.nota && <p className="mt-1 text-xs text-[#6b4c57]">{s.nota}</p>}
                        {s.respuesta && (
                          <p className="mt-1 text-xs text-[#6b4c57]">
                            <span className="font-medium">{s.resueltaPor ?? 'Respuesta'}:</span> {s.respuesta}
                          </p>
                        )}
                        {s.estado === 'PENDIENTE' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelar(s.id)}
                            className="mt-2 h-9 px-2 text-[#8b5a6b] hover:bg-red-50 hover:text-red-500"
                          >
                            <X className="mr-1 h-4 w-4" />
                            Cancelar pedido
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Barra fija abajo: se alcanza con el pulgar y respeta el borde del iPhone. */}
        {pedido.size > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#f9bbc4]/30 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(74,53,64,0.25)] backdrop-blur">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
              <span className="text-sm text-[#6b4c57]">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </span>
              <Button
                onClick={enviar}
                disabled={enviando}
                className="h-11 bg-[#d4748c] px-5 font-semibold text-white hover:bg-[#c0607a]"
              >
                <Send className="mr-2 h-4 w-4" />
                {enviando ? 'Enviando...' : 'Enviar pedido'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
