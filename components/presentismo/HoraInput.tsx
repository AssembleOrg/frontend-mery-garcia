'use client';

export const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Hora en 24 h siempre. El input nativo de hora sigue el idioma del navegador
 * y en muchas compus muestra AM/PM; acá se escribe "1030" y queda "10:30".
 */
export default function HoraInput({
  valor,
  onCambio,
  etiqueta,
  id,
}: {
  valor: string;
  onCambio: (v: string) => void;
  etiqueta: string;
  id?: string;
}) {
  const invalida = valor.length === 5 && !HORA_VALIDA.test(valor);
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="hh:mm"
      maxLength={5}
      value={valor}
      aria-label={`${etiqueta} (24 h)`}
      aria-invalid={invalida}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, '').slice(0, 4);
        onCambio(d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d);
      }}
      onBlur={() => {
        const d = valor.replace(/\D/g, '');
        if (d.length === 1 || d.length === 2) onCambio(`${d.padStart(2, '0')}:00`);
        else if (d.length === 3) onCambio(`0${d[0]}:${d.slice(1)}`);
      }}
      className={`h-9 w-[4.75rem] rounded-md border bg-white px-2 text-center text-sm tabular-nums text-[#4a3540] focus:outline-none focus:ring-2 focus:ring-[#f9bbc4]/60 ${
        invalida ? 'border-[#dc267f]' : 'border-[#f5d0d9] focus:border-[#ec9cab]'
      }`}
    />
  );
}
