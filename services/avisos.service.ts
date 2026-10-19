import { apiFetch, getToken } from '@/lib/apiClient';
import type { Notificacion } from '@/services/whatsapp.service';

interface Envelope<T> {
  status: string;
  data: T;
}

const BASE = '/api/notificaciones/mias';

function urlApi(path: string): string {
  return `${(process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')}${path}`;
}

/** Avisos dirigidos a la persona de la sesión (p. ej. al empleado). */
export const avisosService = {
  async listar(): Promise<Notificacion[]> {
    const res = await apiFetch<Envelope<Notificacion[]>>(BASE);
    return res.data;
  },

  async marcarTodasLeidas(): Promise<void> {
    await apiFetch(`${BASE}/leidas`, { method: 'POST' });
  },

  /**
   * En vivo. Mismo patrón que WhatsApp y presentismo: fetch + ReadableStream
   * (EventSource no manda cabeceras) y reconexión con espera creciente.
   */
  escuchar(onAviso: (n: Notificacion) => void): () => void {
    const control = new AbortController();
    let cerrado = false;
    let intentos = 0;

    const conectar = async () => {
      while (!cerrado) {
        try {
          const token = getToken();
          const res = await fetch(urlApi(`${BASE}/eventos`), {
            headers: { Accept: 'text/event-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            signal: control.signal,
          });
          if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
          intentos = 0;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!cerrado) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const partes = buffer.split('\n\n');
            buffer = partes.pop() ?? '';
            for (const parte of partes) {
              const tipo = /^event:\s*(.+)$/m.exec(parte)?.[1]?.trim();
              const data = /^data:\s*(.+)$/m.exec(parte)?.[1];
              if (tipo === 'notificacion' && data) onAviso(JSON.parse(data) as Notificacion);
            }
          }
        } catch {
          if (cerrado) return;
        }
        intentos += 1;
        await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** Math.min(intentos, 5), 30_000)));
      }
    };

    void conectar();
    return () => {
      cerrado = true;
      control.abort();
    };
  },
};
