import { create } from 'zustand';
import {
  whatsappService,
  type Conversacion,
  type EventoWhatsapp,
  type FiltroEstado,
  type Mensaje,
  type Notificacion,
} from '@/services/whatsapp.service';

type Conexion = 'desconocido' | 'conectado' | 'desconectado';

interface WhatsappState {
  abierto: boolean;
  conexion: Conexion;
  streamConectado: boolean;

  filtro: FiltroEstado;
  q: string;
  dia: string | null;
  conversaciones: Conversacion[];
  total: number;
  esperando: number;
  noLeidosTotal: number;
  cargandoLista: boolean;
  pagina: number;

  seleccionadaId: string | null;
  mensajes: Record<string, Mensaje[]>;
  hayMas: Record<string, boolean>;
  cargandoMensajes: boolean;

  notificaciones: Notificacion[];

  // Callbacks que registra la capa de UI (toast + sonido + aviso del navegador).
  alNotificar: ((n: Notificacion) => void) | null;
}

interface WhatsappActions {
  setAbierto: (abierto: boolean) => void;
  setConexion: (c: Conexion) => void;
  setStreamConectado: (v: boolean) => void;
  setAlNotificar: (fn: ((n: Notificacion) => void) | null) => void;

  setFiltro: (f: FiltroEstado) => void;
  setQ: (q: string) => void;
  setDia: (dia: string | null) => void;
  cargarConversaciones: (masPaginas?: boolean) => Promise<void>;
  refrescarEstado: () => Promise<void>;

  seleccionar: (id: string | null) => Promise<void>;
  cargarMasMensajes: (id: string) => Promise<void>;

  enviarTexto: (id: string, texto: string) => Promise<void>;
  enviarAdjunto: (id: string, blob: Blob, nombre: string, opciones?: { caption?: string; duracionSegundos?: number }) => Promise<void>;
  tomar: (id: string) => Promise<void>;
  cerrar: (id: string, despedida: boolean) => Promise<void>;
  devolverAlBot: (id: string) => Promise<void>;

  cargarNotificaciones: () => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  marcarLeida: (id: string) => Promise<void>;

  aplicarEvento: (evento: EventoWhatsapp) => void;
  /** Contadores del backend (esperando, no leídos), con una pequeña espera para no martillar. */
  refrescarContadores: () => Promise<void>;
}

const POR_PAGINA = 40;

function ordenar(lista: Conversacion[]): Conversacion[] {
  return [...lista].sort((a, b) => {
    const ea = a.estado === 'ESPERANDO' ? 0 : 1;
    const eb = b.estado === 'ESPERANDO' ? 0 : 1;
    if (ea !== eb) return ea - eb;
    return (b.ultimoMensajeAt ?? '').localeCompare(a.ultimoMensajeAt ?? '');
  });
}

function pasaFiltro(c: Conversacion, filtro: FiltroEstado): boolean {
  if (filtro === 'ABIERTAS') return c.estado === 'ESPERANDO' || c.estado === 'ATENDIDA';
  return c.estado === filtro;
}

let refrescoPendiente: ReturnType<typeof setTimeout> | null = null;

export const useWhatsappStore = create<WhatsappState & WhatsappActions>()((set, get) => ({
  abierto: false,
  conexion: 'desconocido',
  streamConectado: false,
  filtro: 'ABIERTAS',
  q: '',
  dia: null,
  conversaciones: [],
  total: 0,
  esperando: 0,
  noLeidosTotal: 0,
  cargandoLista: false,
  pagina: 1,
  seleccionadaId: null,
  mensajes: {},
  hayMas: {},
  cargandoMensajes: false,
  notificaciones: [],
  alNotificar: null,

  setAbierto: (abierto) => set({ abierto }),
  setConexion: (conexion) => set({ conexion }),
  setStreamConectado: (streamConectado) => set({ streamConectado }),
  setAlNotificar: (alNotificar) => set({ alNotificar }),

  setFiltro: (filtro) => {
    set({ filtro, pagina: 1 });
    void get().cargarConversaciones();
  },
  setQ: (q) => {
    set({ q, pagina: 1 });
    void get().cargarConversaciones();
  },
  setDia: (dia) => {
    set({ dia, pagina: 1 });
    void get().cargarConversaciones();
  },

  cargarConversaciones: async (masPaginas = false) => {
    const { filtro, q, dia, pagina, conversaciones } = get();
    const siguiente = masPaginas ? pagina + 1 : 1;
    set({ cargandoLista: true });
    try {
      const r = await whatsappService.conversaciones({
        estado: filtro,
        q: q || undefined,
        dia: dia || undefined,
        pagina: siguiente,
        porPagina: POR_PAGINA,
      });
      set({
        conversaciones: masPaginas ? [...conversaciones, ...r.items] : r.items,
        total: r.total,
        esperando: r.esperando,
        noLeidosTotal: r.noLeidos,
        pagina: siguiente,
      });
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    } finally {
      set({ cargandoLista: false });
    }
  },

  refrescarEstado: async () => {
    try {
      const e = await whatsappService.estado();
      set({ conexion: e.conectado ? 'conectado' : 'desconectado' });
    } catch {
      set({ conexion: 'desconocido' });
    }
  },

  seleccionar: async (id) => {
    set({ seleccionadaId: id });
    if (!id) return;
    set({ cargandoMensajes: true });
    try {
      const r = await whatsappService.mensajes(id);
      set((s) => ({
        mensajes: { ...s.mensajes, [id]: r.mensajes },
        hayMas: { ...s.hayMas, [id]: r.hayMas },
        conversaciones: s.conversaciones.map((c) => (c.id === id ? r.conversacion : c)),
      }));
      // Abrirla la deja leída: se recalculan los no leídos totales.
      void get().refrescarContadores();
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      set({ cargandoMensajes: false });
    }
  },

  cargarMasMensajes: async (id) => {
    const actuales = get().mensajes[id] ?? [];
    if (actuales.length === 0 || !get().hayMas[id]) return;
    const r = await whatsappService.mensajes(id, actuales[0].createdAt);
    set((s) => ({
      mensajes: { ...s.mensajes, [id]: [...r.mensajes, ...(s.mensajes[id] ?? [])] },
      hayMas: { ...s.hayMas, [id]: r.hayMas },
    }));
  },

  enviarTexto: async (id, texto) => {
    const m = await whatsappService.enviarTexto(id, texto);
    get().aplicarEvento({ type: 'mensaje', data: m });
  },

  enviarAdjunto: async (id, blob, nombre, opciones) => {
    const m = await whatsappService.enviarAdjunto(id, blob, nombre, opciones);
    get().aplicarEvento({ type: 'mensaje', data: m });
  },

  tomar: async (id) => {
    const c = await whatsappService.tomar(id);
    get().aplicarEvento({ type: 'conversacion', data: c });
  },

  cerrar: async (id, despedida) => {
    const c = await whatsappService.cerrar(id, despedida);
    get().aplicarEvento({ type: 'conversacion', data: c });
  },

  devolverAlBot: async (id) => {
    const c = await whatsappService.devolverAlBot(id);
    get().aplicarEvento({ type: 'conversacion', data: c });
  },

  cargarNotificaciones: async () => {
    try {
      set({ notificaciones: await whatsappService.notificaciones() });
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  },

  marcarTodasLeidas: async () => {
    set((s) => ({ notificaciones: s.notificaciones.map((n) => ({ ...n, leida: true })) }));
    await whatsappService.marcarTodasLeidas();
  },

  marcarLeida: async (id) => {
    set((s) => ({ notificaciones: s.notificaciones.map((n) => (n.id === id ? { ...n, leida: true } : n)) }));
    await whatsappService.marcarLeida(id);
  },

  aplicarEvento: (evento) => {
    const s = get();
    if (evento.type === 'mensaje') {
      const m = evento.data;
      const lista = s.mensajes[m.conversacionId];
      if (lista && !lista.some((x) => x.id === m.id)) {
        set({ mensajes: { ...s.mensajes, [m.conversacionId]: [...lista, m] } });
      }
      // Si la charla está abierta en pantalla, lo que entra ya se leyó.
      if (s.abierto && s.seleccionadaId === m.conversacionId && m.direccion === 'ENTRANTE') {
        void whatsappService.mensajes(m.conversacionId).then((r) => {
          set((st) => ({ conversaciones: st.conversaciones.map((c) => (c.id === r.conversacion.id ? r.conversacion : c)) }));
          void get().refrescarContadores();
        });
      }
      return;
    }
    if (evento.type === 'conversacion') {
      const c = evento.data;
      const existe = s.conversaciones.some((x) => x.id === c.id);
      let lista = s.conversaciones;
      if (pasaFiltro(c, s.filtro)) {
        lista = existe ? lista.map((x) => (x.id === c.id ? c : x)) : [c, ...lista];
      } else if (existe) {
        lista = lista.filter((x) => x.id !== c.id);
      }
      set({ conversaciones: ordenar(lista) });
      void get().refrescarContadores();
      return;
    }
    if (evento.type === 'notificacion') {
      const n = evento.data;
      if (s.notificaciones.some((x) => x.id === n.id)) return;
      set({ notificaciones: [n, ...s.notificaciones].slice(0, 200) });
      s.alNotificar?.(n);
    }
  },

  refrescarContadores: async () => {
    if (refrescoPendiente) clearTimeout(refrescoPendiente);
    refrescoPendiente = setTimeout(async () => {
      refrescoPendiente = null;
      try {
        const { filtro, q, dia } = get();
        const r = await whatsappService.conversaciones({ estado: filtro, q: q || undefined, dia: dia || undefined, porPagina: 1 });
        set({ esperando: r.esperando, noLeidosTotal: r.noLeidos, total: r.total });
      } catch {
        /* sin drama: el próximo evento lo vuelve a intentar */
      }
    }, 800);
  },
}));
