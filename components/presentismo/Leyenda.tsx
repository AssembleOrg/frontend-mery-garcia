import { ESTADOS, LEYENDA } from './estados';

export default function Leyenda() {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b4c57]" aria-label="Referencias">
      {LEYENDA.map((estado) => (
        <li key={estado} className="inline-flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-[3px] ${ESTADOS[estado].celda}`} aria-hidden />
          {ESTADOS[estado].texto}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span className="relative h-3 w-3 rounded-[3px] bg-[#fcf0f3]" aria-hidden>
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#d97706]" />
        </span>
        A revisar
      </li>
    </ul>
  );
}
