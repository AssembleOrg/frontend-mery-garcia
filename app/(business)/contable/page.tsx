'use client';

import { useCallback, useMemo, useState } from 'react';
import { History, LayoutDashboard, Plus, UserPlus, Users, Wallet } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ClientOnly from '@/components/common/ClientOnly';
import AdminOnly from '@/components/auth/AdminOnly';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Acreedor, Deuda, Moneda, Pago } from '@/services/contable.service';
import { Contable, type ContableCtx } from '@/components/contable/contexto';
import { AcreedorDialog, DeudaDialog, PagoDialog } from '@/components/contable/dialogos';
import { SelectorMoneda } from '@/components/contable/ui';
import ResumenTab from '@/components/contable/ResumenTab';
import AcreedoresTab from '@/components/contable/AcreedoresTab';
import DeudasTab from '@/components/contable/DeudasTab';
import HistorialTab from '@/components/contable/HistorialTab';
import AcreedorPanel from '@/components/contable/AcreedorPanel';

/**
 * Estado contable: deudas del negocio con personas y empresas, sus pagos y
 * comprobantes. Sin acceso desde el dashboard a propósito: se entra por URL.
 */

const breadcrumbItems = [{ label: 'Inicio', href: '/dashboard' }, { label: 'Contable' }];

const TABS = [
  { id: 'resumen', texto: 'Resumen', Icono: LayoutDashboard },
  { id: 'deudas', texto: 'Deudas', Icono: Wallet },
  { id: 'acreedores', texto: 'Acreedores', Icono: Users },
  { id: 'historial', texto: 'Historial', Icono: History },
] as const;

type Tab = (typeof TABS)[number]['id'];

export default function ContablePage() {
  const [tab, setTab] = useState<Tab>('resumen');
  const [moneda, setMoneda] = useState<Moneda>('ARS');
  const [version, setVersion] = useState(0);
  const [acreedorAbierto, setAcreedorAbierto] = useState<string | null>(null);

  const [dlgAcreedor, setDlgAcreedor] = useState<{ acreedor: Acreedor | null; alCrear?: (a: Acreedor) => void } | null>(null);
  const [dlgDeuda, setDlgDeuda] = useState<{ deuda: Deuda | null; acreedorId?: string } | null>(null);
  const [dlgPago, setDlgPago] = useState<{ deuda: Deuda; pago: Pago | null } | null>(null);

  const refrescar = useCallback(() => setVersion((v) => v + 1), []);

  const ctx = useMemo<ContableCtx>(
    () => ({
      moneda,
      setMoneda,
      version,
      refrescar,
      verAcreedor: setAcreedorAbierto,
      nuevoAcreedor: (alCrear) => setDlgAcreedor({ acreedor: null, alCrear }),
      editarAcreedor: (a) => setDlgAcreedor({ acreedor: a }),
      nuevaDeuda: (acreedorId) => setDlgDeuda({ deuda: null, acreedorId }),
      editarDeuda: (d) => setDlgDeuda({ deuda: d }),
      pagar: (d) => setDlgPago({ deuda: d, pago: null }),
      editarPago: (p, d) => setDlgPago({ deuda: d, pago: p }),
    }),
    [moneda, version, refrescar],
  );

  return (
    <AdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Contable" />
          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
          <StandardBreadcrumbs items={breadcrumbItems} />

          <ClientOnly>
            <Contable.Provider value={ctx}>
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Barra de trabajo */}
                <div className="mb-6 rounded-2xl border border-[#f0dde3] bg-white/70 px-3 py-3 shadow-sm backdrop-blur-md">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none]" aria-label="Secciones">
                      {TABS.map(({ id, texto, Icono }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTab(id)}
                          aria-current={tab === id ? 'page' : undefined}
                          className={cn(
                            'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                            tab === id
                              ? 'bg-[#3d2a32] text-white shadow-sm'
                              : 'text-[#6b4c57] hover:bg-white hover:text-[#3d2a32]',
                          )}
                        >
                          <Icono className="h-4 w-4" />
                          {texto}
                        </button>
                      ))}
                    </nav>
                    <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                      <SelectorMoneda valor={moneda} onCambio={setMoneda} />
                      <Button variant="outline" className="rounded-full border-[#e6cfd7] bg-white" onClick={() => ctx.nuevoAcreedor()}>
                        <UserPlus className="mr-1.5 h-4 w-4" /> Acreedor
                      </Button>
                      <Button className="rounded-full bg-[#8b5a6b] text-white hover:bg-[#744a5a]" onClick={() => ctx.nuevaDeuda()}>
                        <Plus className="mr-1.5 h-4 w-4" /> Nueva deuda
                      </Button>
                    </div>
                  </div>
                </div>

                {tab === 'resumen' && <ResumenTab />}
                {tab === 'deudas' && <DeudasTab />}
                {tab === 'acreedores' && <AcreedoresTab />}
                {tab === 'historial' && <HistorialTab />}
              </div>

              <AcreedorPanel id={acreedorAbierto} onCerrar={() => setAcreedorAbierto(null)} />

              <AcreedorDialog
                abierto={!!dlgAcreedor}
                acreedor={dlgAcreedor?.acreedor ?? null}
                onCerrar={() => setDlgAcreedor(null)}
                onGuardado={(a) => {
                  const alCrear = dlgAcreedor?.alCrear;
                  setDlgAcreedor(null);
                  refrescar();
                  if (alCrear) alCrear(a);
                  else if (!dlgAcreedor?.acreedor) setAcreedorAbierto(a.id);
                }}
              />
              <DeudaDialog
                abierto={!!dlgDeuda}
                deuda={dlgDeuda?.deuda ?? null}
                acreedorInicial={dlgDeuda?.acreedorId}
                version={version}
                onCerrar={() => setDlgDeuda(null)}
                onGuardado={() => {
                  setDlgDeuda(null);
                  refrescar();
                }}
                onNuevoAcreedor={(alCrear) => setDlgAcreedor({ acreedor: null, alCrear })}
              />
              <PagoDialog
                abierto={!!dlgPago}
                deuda={dlgPago?.deuda ?? null}
                pago={dlgPago?.pago ?? null}
                onCerrar={() => setDlgPago(null)}
                onGuardado={() => {
                  setDlgPago(null);
                  refrescar();
                }}
              />
            </Contable.Provider>
          </ClientOnly>
        </div>
      </MainLayout>
    </AdminOnly>
  );
}
