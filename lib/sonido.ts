/**
 * Aviso sonoro corto, sintetizado con WebAudio: dos notas suaves. Sin
 * archivos de audio que servir ni cachear.
 *
 * El navegador sólo deja sonar después de un gesto de la persona; por eso el
 * contexto se crea en el primer click/tecla y recién ahí se puede usar.
 */
let contexto: AudioContext | null = null;

function asegurarContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!contexto) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    contexto = new Ctor();
  }
  if (contexto.state === 'suspended') void contexto.resume();
  return contexto;
}

export function prepararSonido(): void {
  if (typeof window === 'undefined') return;
  const desbloquear = () => {
    asegurarContexto();
    window.removeEventListener('pointerdown', desbloquear);
    window.removeEventListener('keydown', desbloquear);
  };
  window.addEventListener('pointerdown', desbloquear, { once: true });
  window.addEventListener('keydown', desbloquear, { once: true });
}

export function sonarAviso(): void {
  const ctx = asegurarContexto();
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  const notas = [
    { f: 659.25, t: 0, d: 0.16 }, // mi5
    { f: 880.0, t: 0.14, d: 0.22 }, // la5
  ];
  for (const n of notas) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.f;
    gain.gain.setValueAtTime(0, ahora + n.t);
    gain.gain.linearRampToValueAtTime(0.18, ahora + n.t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ahora + n.t + n.d);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ahora + n.t);
    osc.stop(ahora + n.t + n.d + 0.05);
  }
}
