'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { whatsappService, type ConfigWhatsapp, type MensajesBot, type Respuesta } from '@/services/whatsapp.service';

const DIAS = [
  { n: 1, l: 'Lun' },
  { n: 2, l: 'Mar' },
  { n: 3, l: 'Mié' },
  { n: 4, l: 'Jue' },
  { n: 5, l: 'Vie' },
  { n: 6, l: 'Sáb' },
  { n: 7, l: 'Dom' },
];

const MENSAJES: Array<{ clave: keyof MensajesBot; titulo: string; ayuda: string }> = [
  { clave: 'derivacion', titulo: 'Cuando pasa la charla a una persona', ayuda: 'Se manda cuando la clienta pide hablar con alguien o el bot no entendió dos veces.' },
  { clave: 'fueraDeHorario', titulo: 'Fuera del horario de atención', ayuda: 'Se agrega cuando una charla pasa a una persona y el local está cerrado. {horario} se reemplaza por el horario de abajo.' },
  { clave: 'noEntendi', titulo: 'No entendió (menú)', ayuda: 'La primera vez que no entiende ofrece este menú. 1 y 2 mandan las respuestas elegidas abajo; 3 pasa a una persona.' },
  { clave: 'audioRecibido', titulo: 'Recibió un audio', ayuda: 'Los audios no los procesa el bot: avisa y pasa la charla a una persona.' },
  { clave: 'archivoRecibido', titulo: 'Recibió una imagen o archivo', ayuda: 'Igual que con los audios.' },
  { clave: 'avisoInactividad', titulo: 'Aviso por inactividad', ayuda: 'En una charla atendida por una persona, tras 1 hora sin mensajes.' },
  { clave: 'despedida', titulo: 'Despedida', ayuda: 'Al cerrar una charla con despedida, o 1 hora después del aviso de inactividad.' },
  { clave: 'botApagado', titulo: 'Bot apagado', ayuda: 'Si el bot está apagado, cada charla nueva recibe esto y pasa directo a una persona.' },
];

export default function TabBot() {
  const [cfg, setCfg] = useState<ConfigWhatsapp | null>(null);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([whatsappService.config(), whatsappService.respuestas()])
      .then(([c, r]) => {
        setCfg(c);
        setRespuestas(r);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'No se pudo cargar la configuración'));
  }, []);

  if (!cfg) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#d4a7ca]" />
      </div>
    );
  }

  const guardar = async () => {
    setGuardando(true);
    try {
      const { clasificadorConfigurado: _omit, ...resto } = cfg;
      void _omit;
      setCfg(await whatsappService.guardarConfig(resto));
      toast.success('Configuración guardada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const alternarDia = (n: number) => {
    const dias = cfg.horario.dias.includes(n) ? cfg.horario.dias.filter((d) => d !== n) : [...cfg.horario.dias, n].sort((a, b) => a - b);
    setCfg({ ...cfg, horario: { ...cfg.horario, dias } });
  };

  return (
    <div className="space-y-6">
      {!cfg.clasificadorConfigurado && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          El clasificador de mensajes no está configurado en el servidor: el bot no puede elegir respuestas y pasa todo a una persona.
        </div>
      )}

      <section className="rounded-xl border border-[#f9bbc4]/30 bg-white p-4">
        <label className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-[#4a3540]">Bot activo</div>
            <div className="text-xs text-[#8b5a6b]">Apagado, cada charla nueva pasa directo a una persona con el mensaje de “bot apagado”.</div>
          </div>
          <Switch checked={cfg.botActivo} onCheckedChange={(v) => setCfg({ ...cfg, botActivo: v })} />
        </label>
      </section>

      <section className="space-y-3 rounded-xl border border-[#f9bbc4]/30 bg-white p-4">
        <div>
          <div className="font-medium text-[#4a3540]">Horario de atención del local</div>
          <div className="text-xs text-[#8b5a6b]">
            El bot responde las 24 horas. Hablar con una persona sólo dentro de este horario: fuera de él la charla queda esperando y la clienta
            recibe el aviso.
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DIAS.map((d) => (
            <button
              key={d.n}
              type="button"
              onClick={() => alternarDia(d.n)}
              className={cn(
                'rounded-full px-3 py-1 text-sm transition',
                cfg.horario.dias.includes(d.n) ? 'bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white' : 'bg-[#f9bbc4]/15 text-[#6b4c57] hover:bg-[#f9bbc4]/30',
              )}
            >
              {d.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm text-[#6b4c57]">
          <span>de</span>
          <input type="time" value={cfg.horario.desde} onChange={(e) => setCfg({ ...cfg, horario: { ...cfg.horario, desde: e.target.value } })} className="rounded-md border border-[#f9bbc4]/40 px-2 py-1" />
          <span>a</span>
          <input type="time" value={cfg.horario.hasta} onChange={(e) => setCfg({ ...cfg, horario: { ...cfg.horario, hasta: e.target.value } })} className="rounded-md border border-[#f9bbc4]/40 px-2 py-1" />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-[#f9bbc4]/30 bg-white p-4">
        <div>
          <div className="font-medium text-[#4a3540]">Menú de “no entendí”</div>
          <div className="text-xs text-[#8b5a6b]">Qué respuesta manda cada opción del menú. La opción 3 siempre pasa a una persona.</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['menuOpcion1', 'menuOpcion2'] as const).map((campo, i) => (
            <div key={campo} className="grid gap-1.5">
              <Label>Opción {i + 1}</Label>
              <Select value={cfg[campo]} onValueChange={(v) => setCfg({ ...cfg, [campo]: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {respuestas.map((r) => (
                    <SelectItem key={r.id} value={r.clave}>
                      {r.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[#f9bbc4]/30 bg-white p-4">
        <div className="font-medium text-[#4a3540]">Mensajes fijos del bot</div>
        {MENSAJES.map((m) => (
          <div key={m.clave} className="grid gap-1.5">
            <Label htmlFor={m.clave}>{m.titulo}</Label>
            <Textarea id={m.clave} rows={2} value={cfg.mensajes[m.clave]} onChange={(e) => setCfg({ ...cfg, mensajes: { ...cfg.mensajes, [m.clave]: e.target.value } })} />
            <div className="text-[11px] text-[#8b5a6b]">{m.ayuda}</div>
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={guardando} className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white">
          {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
