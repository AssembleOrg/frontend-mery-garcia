import { apiFetch, getToken } from '@/lib/apiClient';

// ─── Tipos ───────────────────────────────────────────────────────

export type EstadoConversacion = 'BOT' | 'ESPERANDO' | 'ATENDIDA' | 'CERRADA';
export type FiltroEstado = 'ABIERTAS' | EstadoConversacion;
export type TipoMensaje = 'TEXTO' | 'AUDIO' | 'IMAGEN' | 'DOCUMENTO' | 'OTRO';
export type AutorMensaje = 'CLIENTA' | 'BOT' | 'OPERADOR';

export interface Contacto {
  id: string;
  telefono: string | null;
  telefonoDigitos: string | null;
  nombreWhatsapp: string | null;
  cliente: { id: string; nombre: string } | null;
  etiqueta: string;
}

export interface Conversacion {
  id: string;
  estado: EstadoConversacion;
  motivoEspera: string | null;
  contacto: Contacto;
  atendidaPor: { id: string; nombre: string } | null;
  noLeidos: number;
  ultimoMensajeAt: string | null;
  ultimoEntranteAt: string | null;
  esperandoDesde: string | null;
  iniciadaAt: string;
  cerradaAt: string | null;
  motivoCierre: string | null;
  ultimoMensaje: { texto: string | null; tipo: TipoMensaje; autor: AutorMensaje } | null;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  direccion: 'ENTRANTE' | 'SALIENTE';
  autor: AutorMensaje;
  operador: { id: string; nombre: string } | null;
  tipo: TipoMensaje;
  texto: string | null;
  adjunto: {
    mimeType: string;
    nombreArchivo: string | null;
    tamanoBytes: number | null;
    duracionSegundos: number | null;
  } | null;
  respuestaClave: string | null;
  estadoEnvio: 'ENVIADO' | 'FALLIDO' | null;
  createdAt: string;
}

export interface Notificacion {
  id: string;
  tipo: 'ESPERANDO' | 'MENSAJE';
  titulo: string;
  cuerpo: string;
  conversacionId: string | null;
  leida: boolean;
  createdAt: string;
}

export interface Respuesta {
  id: string;
  clave: string;
  titulo: string;
  descripcion: string;
  ejemplos: string[];
  respuesta: string;
  derivaAPersona: boolean;
  activa: boolean;
  orden: number;
}

export type RespuestaInput = Omit<Respuesta, 'id'>;

export interface HorarioAtencion {
  dias: number[];
  desde: string;
  hasta: string;
}

export interface MensajesBot {
  saludo: string;
  noEntendi: string;
  derivacion: string;
  fueraDeHorario: string;
  audioRecibido: string;
  archivoRecibido: string;
  avisoInactividad: string;
  despedida: string;
  botApagado: string;
}

export interface ConfigWhatsapp {
  botActivo: boolean;
  horario: HorarioAtencion;
  mensajes: MensajesBot;
  menuOpcion1: string;
  menuOpcion2: string;
  clasificadorConfigurado: boolean;
}

export interface EstadoSesion {
  configurado: boolean;
  alcanzable: boolean;
  connected: boolean;
  loggedIn: boolean;
  qr: string | null;
  qrAgeSeconds: number | null;
  pairingExpired: boolean;
  pairingAttempts: number;
  pairingMaxAttempts: number;
  pairingAutoRefresh: boolean;
}

export type EventoWhatsapp =
  | { type: 'mensaje'; data: Mensaje }
  | { type: 'conversacion'; data: Conversacion }
  | { type: 'notificacion'; data: Notificacion };

interface Envelope<T> {
  status: string;
  data: T;
}

// NEXT_PUBLIC_API_URL es el host pelado; el prefijo global del backend va acá.
const BASE = '/api/whatsapp';
const NOTIFICACIONES = '/api/notificaciones';

function urlApi(path: string): string {
  return `${(process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')}${path}`;
}

function cabecerasAuth(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Servicio ────────────────────────────────────────────────────

export const whatsappService = {
  async estado(): Promise<{ configurado: boolean; alcanzable: boolean; conectado: boolean }> {
    const res = await apiFetch<Envelope<{ configurado: boolean; alcanzable: boolean; conectado: boolean }>>(
      `${BASE}/estado`,
    );
    return res.data;
  },

  async conversaciones(params: {
    estado?: FiltroEstado;
    q?: string;
    dia?: string;
    pagina?: number;
    porPagina?: number;
  }): Promise<{ items: Conversacion[]; total: number; esperando: number; noLeidos: number }> {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.q) qs.set('q', params.q);
    if (params.dia) qs.set('dia', params.dia);
    if (params.pagina) qs.set('pagina', String(params.pagina));
    if (params.porPagina) qs.set('porPagina', String(params.porPagina));
    const res = await apiFetch<Envelope<{ items: Conversacion[]; total: number; esperando: number; noLeidos: number }>>(
      `${BASE}/conversaciones?${qs.toString()}`,
    );
    return res.data;
  },

  async mensajes(
    id: string,
    antesDe?: string,
  ): Promise<{ conversacion: Conversacion; mensajes: Mensaje[]; hayMas: boolean }> {
    const qs = antesDe ? `?antesDe=${encodeURIComponent(antesDe)}` : '';
    const res = await apiFetch<Envelope<{ conversacion: Conversacion; mensajes: Mensaje[]; hayMas: boolean }>>(
      `${BASE}/conversaciones/${id}/mensajes${qs}`,
    );
    return res.data;
  },

  async tomar(id: string): Promise<Conversacion> {
    const res = await apiFetch<Envelope<Conversacion>>(`${BASE}/conversaciones/${id}/tomar`, { method: 'POST' });
    return res.data;
  },

  async devolverAlBot(id: string): Promise<Conversacion> {
    const res = await apiFetch<Envelope<Conversacion>>(`${BASE}/conversaciones/${id}/devolver-bot`, {
      method: 'POST',
    });
    return res.data;
  },

  async enviarTexto(id: string, texto: string): Promise<Mensaje> {
    const res = await apiFetch<Envelope<Mensaje>>(`${BASE}/conversaciones/${id}/mensajes`, {
      method: 'POST',
      json: { texto },
    });
    return res.data;
  },

  /** multipart: el archivo no pasa por apiFetch porque no es JSON. */
  async enviarAdjunto(
    id: string,
    archivo: Blob,
    nombre: string,
    opciones: { caption?: string; duracionSegundos?: number } = {},
  ): Promise<Mensaje> {
    const form = new FormData();
    form.append('archivo', archivo, nombre);
    if (opciones.caption) form.append('caption', opciones.caption);
    if (opciones.duracionSegundos) form.append('duracionSegundos', String(opciones.duracionSegundos));
    const res = await fetch(urlApi(`${BASE}/conversaciones/${id}/adjuntos`), {
      method: 'POST',
      headers: cabecerasAuth(),
      body: form,
    });
    const json = (await res.json().catch(() => null)) as Envelope<Mensaje> | { message?: string } | null;
    if (!res.ok) {
      const msg = (json as { message?: string | string[] } | null)?.message;
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || `Error ${res.status}`);
    }
    return (json as Envelope<Mensaje>).data;
  },

  async cerrar(id: string, despedida: boolean): Promise<Conversacion> {
    const res = await apiFetch<Envelope<Conversacion>>(`${BASE}/conversaciones/${id}/cerrar`, {
      method: 'POST',
      json: { despedida },
    });
    return res.data;
  },

  /**
   * Bytes de un adjunto como URL local (blob:). Se usa fetch y no `src` directo
   * porque un `<audio src>` no puede mandar el token en la cabecera, y ponerlo
   * en la URL lo dejaría en los logs.
   */
  async adjuntoUrl(mensajeId: string): Promise<{ url: string; mime: string }> {
    const res = await fetch(urlApi(`${BASE}/mensajes/${mensajeId}/adjunto`), { headers: cabecerasAuth() });
    if (!res.ok) throw new Error(`No se pudo cargar el adjunto (${res.status})`);
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), mime: blob.type };
  },

  // ─── Notificaciones ──────────────────────────────────────────

  async notificaciones(): Promise<Notificacion[]> {
    const res = await apiFetch<Envelope<Notificacion[]>>(NOTIFICACIONES);
    return res.data;
  },

  async marcarTodasLeidas(): Promise<void> {
    await apiFetch(`${NOTIFICACIONES}/leidas`, { method: 'POST' });
  },

  async marcarLeida(id: string): Promise<void> {
    await apiFetch(`${NOTIFICACIONES}/${id}/leida`, { method: 'POST' });
  },

  // ─── Configuración (admin) ───────────────────────────────────

  async config(): Promise<ConfigWhatsapp> {
    const res = await apiFetch<Envelope<ConfigWhatsapp>>(`${BASE}/config`);
    return res.data;
  },

  async guardarConfig(input: Partial<Omit<ConfigWhatsapp, 'clasificadorConfigurado'>>): Promise<ConfigWhatsapp> {
    const res = await apiFetch<Envelope<ConfigWhatsapp>>(`${BASE}/config`, { method: 'PUT', json: input });
    return res.data;
  },

  async respuestas(): Promise<Respuesta[]> {
    const res = await apiFetch<Envelope<Respuesta[]>>(`${BASE}/config/respuestas`);
    return res.data;
  },

  async crearRespuesta(input: RespuestaInput): Promise<Respuesta> {
    const res = await apiFetch<Envelope<Respuesta>>(`${BASE}/config/respuestas`, { method: 'POST', json: input });
    return res.data;
  },

  async editarRespuesta(id: string, input: Partial<RespuestaInput>): Promise<Respuesta> {
    const res = await apiFetch<Envelope<Respuesta>>(`${BASE}/config/respuestas/${id}`, {
      method: 'PUT',
      json: input,
    });
    return res.data;
  },

  async borrarRespuesta(id: string): Promise<void> {
    await apiFetch(`${BASE}/config/respuestas/${id}`, { method: 'DELETE' });
  },

  async sesion(): Promise<EstadoSesion> {
    const res = await apiFetch<Envelope<EstadoSesion>>(`${BASE}/config/sesion`);
    return res.data;
  },

  async sesionAccion(accion: 'refrescar' | 'reiniciar' | 'cerrar'): Promise<void> {
    await apiFetch(`${BASE}/config/sesion/${accion}`, { method: 'POST' });
  },

  // ─── En vivo ─────────────────────────────────────────────────

  /**
   * Escucha el stream de eventos. Mismo patrón que presentismo: fetch +
   * ReadableStream (EventSource no manda cabeceras) y reconexión con espera
   * creciente hasta 30 s.
   */
  escucharEventos(onEvento: (evento: EventoWhatsapp) => void, onEstado: (conectado: boolean) => void): () => void {
    const control = new AbortController();
    let cerrado = false;
    let intentos = 0;

    const conectar = async () => {
      while (!cerrado) {
        try {
          const res = await fetch(urlApi(`${BASE}/eventos`), {
            headers: { Accept: 'text/event-stream', ...cabecerasAuth() },
            signal: control.signal,
          });
          if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
          intentos = 0;
          onEstado(true);
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
              if (!data || !tipo || tipo === 'ping') continue;
              if (tipo === 'mensaje' || tipo === 'conversacion' || tipo === 'notificacion') {
                onEvento({ type: tipo, data: JSON.parse(data) } as EventoWhatsapp);
              }
            }
          }
        } catch {
          if (cerrado) return;
        }
        onEstado(false);
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
