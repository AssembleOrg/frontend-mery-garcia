/** Lugar reservado mientras llega la primera carga de la grilla. */
export default function Esqueleto({ filas = 5 }: { filas?: number }) {
  return (
    <div className="rounded-xl border border-[#f5d0d9] bg-white p-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="h-4 w-32 animate-pulse rounded bg-[#fcf0f3]" />
          <div className="h-7 flex-1 animate-pulse rounded bg-[#fdf6f8]" />
        </div>
      ))}
    </div>
  );
}
