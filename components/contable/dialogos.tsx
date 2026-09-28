'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Building2, FileText, ImageIcon, Lock, Paperclip, Plus, Trash2, Upload, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  contableService,
  mensajeError,
  type Acreedor,
  type AcreedorResumen,
  type Comprobante,
  type Deuda,
  type Moneda,
  type Pago,
  type TipoAcreedor,
} from '@/services/contable.service';
import { formatMonto, hoyLocal, MontoInput, SelectorDia, VentanaEdicion } from './ui';

const BOTON_PRIMARIO = 'bg-[#8b5a6b] text-white hover:bg-[#744a5a]';

function Campo({ label, htmlFor, children, ayuda }: { label: string; htmlFor?: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium tracking-wide text-[#6b4c57] uppercase">
        {label}
      </Label>
      {children}
      {ayuda && <p className="text-xs text-[#9a7d88]">{ayuda}</p>}
    </div>
  );
}

// ─── Acreedor ───────────────────────────────────────────────────

export function AcreedorDialog({
  abierto,
  acreedor,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  acreedor: Acreedor | null;
  onCerrar: () => void;
  onGuardado: (a: Acreedor) => void;
}) {
  const [f, setF] = useState({ nombre: '', tipo: 'EMPRESA' as TipoAcreedor, documento: '', telefono: '', email: '', notas: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setF({
      nombre: acreedor?.nombre ?? '',
      tipo: acreedor?.tipo ?? 'EMPRESA',
      documento: acreedor?.documento ?? '',
      telefono: acreedor?.telefono ?? '',
      email: acreedor?.email ?? '',
      notas: acreedor?.notas ?? '',
    });
  }, [abierto, acreedor]);

  const guardar = async () => {
    if (!f.nombre.trim()) return toast.error('Poné un nombre');
    setGuardando(true);
    try {
      const a = acreedor
        ? await contableService.actualizarAcreedor(acreedor.id, f)
        : await contableService.crearAcreedor(f);
      toast.success(acreedor ? 'Datos actualizados' : `${a.nombre} agregado`);
      onGuardado(a);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => {
          // Radix enfocaría el primer botón (Empresa); el nombre es lo primero a escribir.
          e.preventDefault();
          document.getElementById('ac-nombre')?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#3d2a32]">{acreedor ? 'Editar acreedor' : 'Nuevo acreedor'}</DialogTitle>
          <DialogDescription>Persona o empresa a la que el negocio le debe.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo">
            {(['EMPRESA', 'PERSONA'] as TipoAcreedor[]).map((t) => {
              const Icono = t === 'EMPRESA' ? Building2 : User;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={f.tipo === t}
                  onClick={() => setF({ ...f, tipo: t })}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                    f.tipo === t
                      ? 'border-[#8b5a6b] bg-[#fbeef2] text-[#5b2139]'
                      : 'border-[#f0dde3] text-[#6b4c57] hover:bg-[#fdf6f8]',
                  )}
                >
                  <Icono className="h-4 w-4" />
                  {t === 'EMPRESA' ? 'Empresa' : 'Persona'}
                </button>
              );
            })}
          </div>
          <Campo label="Nombre" htmlFor="ac-nombre">
            <Input id="ac-nombre" value={f.nombre} maxLength={120} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label={f.tipo === 'EMPRESA' ? 'CUIT' : 'DNI / CUIT'} htmlFor="ac-doc">
              <Input id="ac-doc" value={f.documento} maxLength={40} onChange={(e) => setF({ ...f, documento: e.target.value })} />
            </Campo>
            <Campo label="Teléfono" htmlFor="ac-tel">
              <Input id="ac-tel" value={f.telefono} maxLength={40} onChange={(e) => setF({ ...f, telefono: e.target.value })} />
            </Campo>
          </div>
          <Campo label="Email" htmlFor="ac-mail">
            <Input id="ac-mail" type="email" value={f.email} maxLength={120} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Campo>
          <Campo label="Notas" htmlFor="ac-notas">
            <Textarea id="ac-notas" rows={2} value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </Campo>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button className={BOTON_PRIMARIO} onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deuda ──────────────────────────────────────────────────────

export function DeudaDialog({
  abierto,
  deuda,
  acreedorInicial,
  version,
  onCerrar,
  onGuardado,
  onNuevoAcreedor,
}: {
  abierto: boolean;
  deuda: Deuda | null;
  acreedorInicial?: string;
  version: number;
  onCerrar: () => void;
  onGuardado: () => void;
  onNuevoAcreedor: (alCrear: (a: Acreedor) => void) => void;
}) {
  const [acreedores, setAcreedores] = useState<AcreedorResumen[]>([]);
  const [f, setF] = useState({
    acreedorId: '',
    concepto: '',
    moneda: 'ARS' as Moneda,
    monto: 0,
    fecha: hoyLocal(),
    vencimiento: null as string | null,
    notas: '',
  });
  const [guardando, setGuardando] = useState(false);
  // Pasadas las 24 h sólo se corrigen concepto, vencimiento y notas.
  const bloqueado = !!deuda && !deuda.editable;
  const conPagos = !!deuda && deuda.pagado > 0;

  useEffect(() => {
    if (!abierto) return;
    contableService.acreedores().then(setAcreedores).catch(() => toast.error('No se pudieron cargar los acreedores'));
  }, [abierto, version]);

  useEffect(() => {
    if (!abierto) return;
    setF({
      acreedorId: deuda?.acreedorId ?? acreedorInicial ?? '',
      concepto: deuda?.concepto ?? '',
      moneda: deuda?.moneda ?? 'ARS',
      monto: deuda?.monto ?? 0,
      fecha: deuda?.fecha ?? hoyLocal(),
      vencimiento: deuda?.vencimiento ?? null,
      notas: deuda?.notas ?? '',
    });
  }, [abierto, deuda, acreedorInicial]);

  const guardar = async () => {
    if (!f.acreedorId) return toast.error('Elegí a quién se le debe');
    if (!f.concepto.trim()) return toast.error('Poné un concepto');
    if (!(f.monto > 0)) return toast.error('El monto tiene que ser mayor a cero');
    setGuardando(true);
    try {
      if (deuda) {
        const datos = bloqueado
          ? { concepto: f.concepto, vencimiento: f.vencimiento, notas: f.notas }
          : { ...f };
        await contableService.actualizarDeuda(deuda.id, datos);
        toast.success('Deuda actualizada');
      } else {
        await contableService.crearDeuda(f);
        toast.success('Deuda registrada');
      }
      onGuardado();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo guardar la deuda'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#3d2a32]">{deuda ? 'Editar deuda' : 'Nueva deuda'}</DialogTitle>
          <DialogDescription>
            {deuda ? (
              bloqueado ? (
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Pasaron 24 h: sólo concepto, vencimiento y notas.
                </span>
              ) : (
                <VentanaEdicion hasta={deuda.editableHasta} />
              )
            ) : (
              'Lo que el negocio le debe a alguien. Después se va descontando con pagos.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Campo label="A quién se le debe">
            <div className="flex gap-2">
              <Select value={f.acreedorId} onValueChange={(v) => setF({ ...f, acreedorId: v })} disabled={bloqueado}>
                <SelectTrigger className="flex-1 bg-white">
                  <SelectValue placeholder="Elegí persona o empresa" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {acreedores.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!bloqueado && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Nuevo acreedor"
                  onClick={() =>
                    onNuevoAcreedor((a) => {
                      setAcreedores((l) => [...l, { ...a, totales: { ARS: { deuda: 0, pagado: 0, saldo: 0 }, USD: { deuda: 0, pagado: 0, saldo: 0 } }, cantidadDeudas: 0, deudasAbiertas: 0, deudasVencidas: 0, ultimoMovimiento: a.createdAt }]);
                      setF((x) => ({ ...x, acreedorId: a.id }));
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Campo>

          <Campo label="Concepto" htmlFor="de-concepto">
            <Input
              id="de-concepto"
              value={f.concepto}
              maxLength={200}
              placeholder="Ej.: Insumos de septiembre, alquiler, préstamo…"
              onChange={(e) => setF({ ...f, concepto: e.target.value })}
            />
          </Campo>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <Campo label="Moneda">
              <div className="inline-flex h-9 rounded-md border border-[#f0dde3] bg-white p-0.5">
                {(['ARS', 'USD'] as Moneda[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={bloqueado || conPagos}
                    onClick={() => setF({ ...f, moneda: m })}
                    className={cn(
                      'rounded px-3 text-sm font-medium disabled:opacity-50',
                      f.moneda === m ? 'bg-[#8b5a6b] text-white' : 'text-[#6b4c57]',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Campo>
            <Campo
              label="Monto total"
              htmlFor="de-monto"
              ayuda={conPagos && !bloqueado ? `No puede ser menor a lo pagado (${formatMonto(deuda!.pagado, deuda!.moneda)}).` : undefined}
            >
              <MontoInput id="de-monto" valor={f.monto} moneda={f.moneda} disabled={bloqueado} onCambio={(n) => setF((x) => ({ ...x, monto: n }))} />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha">
              <SelectorDia valor={f.fecha} disabled={bloqueado} onCambio={(d) => setF({ ...f, fecha: d ?? hoyLocal() })} />
            </Campo>
            <Campo label="Vence (opcional)">
              <SelectorDia valor={f.vencimiento} placeholder="Sin vencimiento" onCambio={(d) => setF({ ...f, vencimiento: d })} />
            </Campo>
          </div>

          <Campo label="Notas" htmlFor="de-notas">
            <Textarea id="de-notas" rows={2} value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </Campo>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button className={BOTON_PRIMARIO} onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : deuda ? 'Guardar cambios' : 'Registrar deuda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pago ───────────────────────────────────────────────────────

const METODOS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Cheque', 'Tarjeta'];
const ACEPTA = 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf';
const MAX_MB = 10;

export function ArchivoIcono({ mime, className }: { mime: string; className?: string }) {
  return mime === 'application/pdf' ? <FileText className={className} /> : <ImageIcon className={className} />;
}

export function PagoDialog({
  abierto,
  deuda,
  pago,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  deuda: Deuda | null;
  pago: Pago | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [f, setF] = useState({ monto: 0, fecha: hoyLocal(), metodo: '', nota: '' });
  const [archivos, setArchivos] = useState<File[]>([]);
  const [existentes, setExistentes] = useState<Comprobante[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    setF({
      monto: pago?.monto ?? 0,
      fecha: pago?.fecha ?? hoyLocal(),
      metodo: pago?.metodo ?? '',
      nota: pago?.nota ?? '',
    });
    setArchivos([]);
    setExistentes(pago?.comprobantes ?? []);
  }, [abierto, pago]);

  if (!deuda) return null;
  // Al editar, el tope es el saldo actual más lo que ya tenía este pago.
  const tope = Math.round((deuda.saldo + (pago?.monto ?? 0)) * 100) / 100;
  const restante = Math.max(0, Math.round((tope - f.monto) * 100) / 100);

  const sumarArchivos = (lista: FileList | null) => {
    if (!lista) return;
    const nuevos: File[] = [];
    for (const a of Array.from(lista)) {
      if (!ACEPTA.split(',').includes(a.type)) {
        toast.error(`${a.name}: sólo imágenes o PDF`);
        continue;
      }
      if (a.size > MAX_MB * 1024 * 1024) {
        toast.error(`${a.name} pesa más de ${MAX_MB} MB`);
        continue;
      }
      nuevos.push(a);
    }
    setArchivos((l) => [...l, ...nuevos].slice(0, 5));
  };

  const quitarExistente = async (c: Comprobante) => {
    try {
      await contableService.eliminarComprobante(c.id);
      setExistentes((l) => l.filter((x) => x.id !== c.id));
      toast.success('Comprobante quitado');
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo quitar'));
    }
  };

  const guardar = async () => {
    if (!(f.monto > 0)) return toast.error('El monto tiene que ser mayor a cero');
    if (f.monto > tope) return toast.error(`No puede superar el saldo (${formatMonto(tope, deuda.moneda)})`);
    setGuardando(true);
    try {
      const guardado = pago
        ? await contableService.actualizarPago(pago.id, f)
        : await contableService.registrarPago(deuda.id, f);
      if (archivos.length) {
        try {
          await contableService.subirComprobantes(guardado.id, archivos);
        } catch (e) {
          toast.error(`El pago quedó guardado, pero no los comprobantes: ${mensajeError(e)}`);
        }
      }
      toast.success(pago ? 'Pago actualizado' : restante <= 0 ? 'Deuda saldada' : 'Pago registrado');
      onGuardado();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo guardar el pago'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#3d2a32]">{pago ? 'Editar pago' : 'Registrar pago'}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-[#6b4c57]">
              {deuda.acreedor?.nombre && <span className="font-medium text-[#3d2a32]">{deuda.acreedor.nombre}</span>}
              {deuda.acreedor?.nombre && ' · '}
              {deuda.concepto}
              {pago && (
                <div className="mt-1">
                  <VentanaEdicion hasta={pago.editableHasta} />
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#fdf6f8] p-3 text-center">
          {[
            ['Total', deuda.monto],
            ['Pagado', deuda.pagado - (pago?.monto ?? 0)],
            ['Queda', restante],
          ].map(([t, v]) => (
            <div key={t as string}>
              <p className="text-[11px] tracking-wide text-[#9a7d88] uppercase">{t}</p>
              <p className={cn('text-sm font-semibold tabular-nums', t === 'Queda' ? 'text-[#b84d74]' : 'text-[#3d2a32]')}>
                {formatMonto(v as number, deuda.moneda)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Campo label="Monto del pago" htmlFor="pa-monto">
            <MontoInput id="pa-monto" autoFocus valor={f.monto} moneda={deuda.moneda} onCambio={(n) => setF((x) => ({ ...x, monto: n }))} />
            <div className="flex gap-1.5 pt-1">
              {[
                ['Todo el saldo', tope],
                ['La mitad', Math.round((tope / 2) * 100) / 100],
              ].map(([t, v]) => (
                <button
                  key={t as string}
                  type="button"
                  onClick={() => setF({ ...f, monto: v as number })}
                  className="rounded-full border border-[#f0dde3] px-2.5 py-0.5 text-xs text-[#6b4c57] hover:bg-[#fbeef2]"
                >
                  {t}
                </button>
              ))}
            </div>
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha">
              <SelectorDia valor={f.fecha} onCambio={(d) => setF({ ...f, fecha: d ?? hoyLocal() })} />
            </Campo>
            <Campo label="Método" htmlFor="pa-metodo">
              <Input
                id="pa-metodo"
                list="metodos-pago-contable"
                value={f.metodo}
                maxLength={40}
                placeholder="Efectivo, transferencia…"
                onChange={(e) => setF({ ...f, metodo: e.target.value })}
              />
              <datalist id="metodos-pago-contable">
                {METODOS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Campo>
          </div>

          <Campo label="Nota" htmlFor="pa-nota">
            <Textarea id="pa-nota" rows={2} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} />
          </Campo>

          <Campo label="Comprobantes (opcional)">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                sumarArchivos(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-4 text-center text-sm transition-colors',
                arrastrando ? 'border-[#8b5a6b] bg-[#fbeef2]' : 'border-[#e6cfd7] text-[#6b4c57] hover:bg-[#fdf6f8]',
              )}
            >
              <Upload className="h-5 w-5 text-[#8b5a6b]" />
              <span>Arrastrá o tocá para adjuntar</span>
              <span className="text-xs text-[#9a7d88]">Foto o PDF, hasta {MAX_MB} MB</span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACEPTA}
                className="hidden"
                onChange={(e) => {
                  sumarArchivos(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            {(existentes.length > 0 || archivos.length > 0) && (
              <ul className="space-y-1 pt-1">
                {existentes.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 rounded-lg bg-[#fdf6f8] px-2.5 py-1.5 text-sm">
                    <ArchivoIcono mime={c.mimeType} className="h-4 w-4 shrink-0 text-[#8b5a6b]" />
                    <button type="button" className="truncate text-left text-[#3d2a32] hover:underline" onClick={() => contableService.abrirComprobante(c).catch((e) => toast.error(mensajeError(e)))}>
                      {c.nombre}
                    </button>
                    {c.editable && (
                      <button type="button" className="ml-auto text-[#9a7d88] hover:text-red-600" title="Quitar" onClick={() => quitarExistente(c)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
                {archivos.map((a, i) => (
                  <li key={`${a.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-[#f0dde3] px-2.5 py-1.5 text-sm">
                    <Paperclip className="h-4 w-4 shrink-0 text-[#8b5a6b]" />
                    <span className="truncate text-[#3d2a32]">{a.name}</span>
                    <span className="text-xs text-[#9a7d88]">nuevo</span>
                    <button type="button" className="ml-auto text-[#9a7d88] hover:text-red-600" title="Quitar" onClick={() => setArchivos((l) => l.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Campo>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button className={BOTON_PRIMARIO} onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : pago ? 'Guardar cambios' : 'Registrar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirmación ───────────────────────────────────────────────

export function Confirmar({
  abierto,
  titulo,
  texto,
  accion = 'Borrar',
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  texto: string;
  accion?: string;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <AlertDialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{texto}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirmar}>
            {accion}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
