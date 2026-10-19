import { apiFetch } from '@/lib/apiClient';

/**
 * Notificaciones push del navegador (llegan con la web cerrada).
 *
 * En iPhone sólo funcionan si la web está agregada a la pantalla de inicio
 * (Compartir → "Agregar a inicio") y con iOS 16.4 o más nuevo.
 */
export type EstadoPush =
  | 'no-soportado'
  /** iPhone/iPad desde Safari: primero hay que agregarla a inicio. */
  | 'requiere-instalar'
  /** El servidor no tiene las claves VAPID cargadas. */
  | 'apagado'
  | 'bloqueado'
  | 'activo'
  | 'inactivo';

interface Envelope<T> {
  status: string;
  data: T;
}

const esIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const instalada = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

function soportado(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function clavePublica(): Promise<string | null> {
  const res = await apiFetch<Envelope<{ clavePublica: string | null }>>('/api/push/clave-publica');
  return res.data.clavePublica;
}

function base64AUint8(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function registro(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration('/')) ?? navigator.serviceWorker.register('/sw.js');
}

export async function estadoPush(): Promise<EstadoPush> {
  if (typeof window === 'undefined') return 'no-soportado';
  if (esIOS() && !instalada()) return 'requiere-instalar';
  if (!soportado()) return 'no-soportado';
  try {
    if (!(await clavePublica())) return 'apagado';
  } catch {
    return 'apagado';
  }
  if (Notification.permission === 'denied') return 'bloqueado';
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'activo' : 'inactivo';
}

/** Pide permiso y registra este navegador. Llamar desde un toque (iOS lo exige). */
export async function activarPush(): Promise<EstadoPush> {
  if (!soportado()) return esIOS() ? 'requiere-instalar' : 'no-soportado';
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return permiso === 'denied' ? 'bloqueado' : 'inactivo';

  const clave = await clavePublica();
  if (!clave) return 'apagado';

  const reg = await registro();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64AUint8(clave) }));

  await apiFetch('/api/push/suscripciones', { method: 'POST', json: sub.toJSON() });
  return 'activo';
}

export async function desactivarPush(): Promise<EstadoPush> {
  const reg = soportado() ? await navigator.serviceWorker.getRegistration('/') : undefined;
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await apiFetch('/api/push/suscripciones', { method: 'DELETE', json: { endpoint: sub.endpoint } }).catch(() => {});
    await sub.unsubscribe();
  }
  return 'inactivo';
}

/**
 * Al cerrar sesión: que este navegador no siga recibiendo los avisos de la
 * persona anterior.
 */
export async function olvidarPushLocal(): Promise<void> {
  await desactivarPush().catch(() => {});
}
