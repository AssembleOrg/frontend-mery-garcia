'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Store,
  Tags,
  Truck,
  ShoppingCart,
  Lock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  comprasService,
  type Categoria,
  type EstadoPedido,
  type FiltroEstado,
  type Pedido,
  type Proveedor,
} from '@/services/compras.service';
import { stockService, type ProductoStock } from '@/services/stock.service';
import EditorPedido, { ChipEstado, type PedidoInicial } from './EditorPedido';
import DialogoEntregar from './DialogoEntregar';
import TabProveedores from './TabProveedores';
import TabCategorias from './TabCategorias';
import {
  BOTON_ICONO,
  BOTON_PRIMARIO,
  CAMPO,
  CLASE_POCO_STOCK,
  FOCO,
  fecha,
  fechaHora,
  mensajeError,
  plata,
  totalDe,
} from './formato';

type Vista = 'pedidos' | 'proveedores' | 'categorias';

const FILTROS: { id: FiltroEstado | 'TODOS'; texto: string }[] = [
  { id: 'ABIERTOS', texto: 'Abiertos' },
  { id: 'ANOTADO', texto: 'Anotados' },
  { id: 'PEDIR_PRECIO', texto: 'Pedir precio' },
  { id: 'COMPRADO', texto: 'Comprados' },
  { id: 'ENTREGADO', texto: 'Entregados' },
  { id: 'CANCELADO', texto: 'Cancelados' },
  { id: 'TODOS', texto: 'Todos' },
];

const POR_PAGINA = 30;
const TODAS = '__todas';

/** "Hisopos ×10, Café en grano ×2 y 3 más". */
function resumenItems(p: Pedido): string {
  if (!p.items.length) return '';
  const primeros = p.items.slice(0, 3).map((i) => `${i.nombre} ×${i.cantidad}`);
  const resto = p.items.length - primeros.length;
  return primeros.join(', ') + (resto > 0 ? ` y ${resto} más` : '');
}

export default function Compras() {
  const [vista, setVista] = useState<Vista>('pedidos');
  const [filtro, setFiltro] = useState<FiltroEstado | 'TODOS'>('ABIERTOS');
  const [buscar, setBuscar] = useState('');
  const [buscarYa, setBuscarYa] = useState('');
  const [categoriaId, setCategoriaId] = useState(TODAS);
  const [proveedorId, setProveedorId] = useState(TODAS);
  const [pagina, setPagina] = useState(1);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
  const [porEstado, setPorEstado] = useState<Record<
    EstadoPedido,
    number
  > | null>(null);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<ProductoStock[]>([]);

  // Editor: null = cerrado; { pedido: null } = nuevo.
  const [editor, setEditor] = useState<{
    pedido: Pedido | null;
    inicial?: PedidoInicial;
  } | null>(null);
  const [aEntregar, setAEntregar] = useState<Pedido | null>(null);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // La búsqueda espera a que se deje de escribir.
  useEffect(() => {
    const t = setTimeout(() => setBuscarYa(buscar.trim()), 300);
    return () => clearTimeout(t);
  }, [buscar]);
  useEffect(() => setPagina(1), [filtro, buscarYa, categoriaId, proveedorId]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    comprasService
      .pedidos({
        estado: filtro === 'TODOS' ? undefined : filtro,
        buscar: buscarYa || undefined,
        categoriaId: categoriaId === TODAS ? undefined : categoriaId,
        proveedorId: proveedorId === TODAS ? undefined : proveedorId,
        page: pagina,
        limit: POR_PAGINA,
      })
      .then((r) => {
        if (!vigente) return;
        setPedidos(r.items);
        setTotal(r.total);
      })
      .catch(
        (e) =>
          vigente &&
          toast.error(mensajeError(e, 'No se pudieron cargar los pedidos'))
      )
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [filtro, buscarYa, categoriaId, proveedorId, pagina, version]);

  useEffect(() => {
    comprasService
      .porEstado()
      .then(setPorEstado)
      .catch(() => undefined);
    stockService
      .listarProductos()
      .then(setProductos)
      .catch(() => undefined);
  }, [version]);

  const cargarCatalogos = useCallback(() => {
    comprasService
      .proveedores()
      .then(setProveedores)
      .catch(() => undefined);
    comprasService
      .categorias()
      .then(setCategorias)
      .catch(() => undefined);
  }, []);
  useEffect(cargarCatalogos, [cargarCatalogos]);

  const bajos = useMemo(() => productos.filter((p) => p.bajo), [productos]);
  const cuenta = (id: FiltroEstado | 'TODOS'): number | null => {
    if (!porEstado) return null;
    if (id === 'TODOS')
      return Object.values(porEstado).reduce((a, b) => a + b, 0);
    if (id === 'ABIERTOS')
      return porEstado.ANOTADO + porEstado.PEDIR_PRECIO + porEstado.COMPRADO;
    return porEstado[id];
  };

  // Lo que vuelve del editor reemplaza la fila y sigue abierto con lo nuevo.
  const alGuardar = (p: Pedido) => {
    setEditor((e) => (e ? { pedido: p } : e));
    recargar();
  };

  const pedirFaltante = (p: ProductoStock) =>
    setEditor({
      pedido: null,
      inicial: {
        titulo: `Reponer ${p.nombre}`,
        items: [
          {
            productoId: p.id,
            nombre: p.nombre,
            cantidad: 1,
            afectaStock: true,
          },
        ],
      },
    });

  const repetir = async (p: Pedido) => {
    try {
      const nuevo = await comprasService.repetir(p.id);
      toast.success(`Pedido N° ${nuevo.numero} anotado con lo mismo`);
      setEditor({ pedido: nuevo });
      recargar();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo repetir'));
    }
  };

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="mg-presentismo text-[#4a3540]">
      {/* Barra */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#f5d0d9] pb-4">
        <div className="flex items-center gap-1">
          <BotonSeccion
            activo={vista === 'pedidos'}
            onClick={() => setVista('pedidos')}
          >
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </BotonSeccion>
          <BotonSeccion
            activo={vista === 'proveedores'}
            onClick={() => setVista('proveedores')}
          >
            <Store className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Proveedores</span>
          </BotonSeccion>
          <BotonSeccion
            activo={vista === 'categorias'}
            onClick={() => setVista('categorias')}
          >
            <Tags className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Categorías</span>
          </BotonSeccion>
        </div>
        {vista === 'pedidos' && (
          <button
            type="button"
            onClick={() => setEditor({ pedido: null })}
            className={`${BOTON_PRIMARIO} ml-auto`}
          >
            <Plus className="h-4 w-4" />
            Nuevo pedido
          </button>
        )}
      </div>

      {vista === 'proveedores' && (
        <div className="mg-entrar pt-4">
          <TabProveedores onCambio={cargarCatalogos} />
        </div>
      )}
      {vista === 'categorias' && (
        <div className="mg-entrar pt-4">
          <TabCategorias onCambio={cargarCatalogos} />
        </div>
      )}

      {vista === 'pedidos' && (
        <div className="mg-entrar">
          {/* Poco stock: aviso chico, amarillo suave */}
          {bajos.length > 0 && (
            <div
              className={`mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-3 py-2 text-sm ${CLASE_POCO_STOCK}`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              <span>Quedan pocos:</span>
              {bajos.map((p, n) => (
                <span key={p.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => pedirFaltante(p)}
                    title={`Anotar un pedido de ${p.nombre}`}
                    className={`rounded underline decoration-[#e7c58f] underline-offset-2 hover:decoration-current ${FOCO}`}
                  >
                    {p.nombre}{' '}
                    <span className="tabular-nums">
                      ({Math.max(p.cantidad ?? 0, 0)})
                    </span>
                  </button>
                  {n < bajos.length - 1 && <span aria-hidden>&nbsp;·</span>}
                </span>
              ))}
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-col gap-3 py-4">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div
                role="tablist"
                aria-label="Estado"
                className="inline-flex rounded-lg border border-[#f5d0d9] bg-white p-0.5"
              >
                {FILTROS.map((f) => {
                  const activo = filtro === f.id;
                  const n = cuenta(f.id);
                  return (
                    <button
                      key={f.id}
                      role="tab"
                      aria-selected={activo}
                      onClick={() => setFiltro(f.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 ${FOCO} ${
                        activo
                          ? 'bg-[#4a3540] text-white'
                          : 'text-[#6b4c57] hover:bg-[#fcf0f3]'
                      }`}
                    >
                      {f.texto}
                      {n !== null && n > 0 && f.id !== 'TODOS' && (
                        <span
                          className={`text-xs tabular-nums ${activo ? 'text-white/70' : 'text-[#8b5a6b]'}`}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:flex-1 lg:max-w-sm">
                <Search
                  className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]"
                  aria-hidden
                />
                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Buscar artículo, proveedor o N°"
                  aria-label="Buscar pedidos"
                  className={`${CAMPO} pl-8`}
                />
              </div>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger
                  className="h-9 border-[#f5d0d9] bg-white text-sm text-[#6b4c57] sm:w-56"
                  aria-label="Categoría"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todas las categorías</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={proveedorId} onValueChange={setProveedorId}>
                <SelectTrigger
                  className="h-9 border-[#f5d0d9] bg-white text-sm text-[#6b4c57] sm:w-56"
                  aria-label="Proveedor"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todos los proveedores</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista */}
          <div
            className={`overflow-hidden rounded-xl border border-[#f5d0d9] bg-white transition-opacity ${cargando && pedidos.length ? 'opacity-60' : ''}`}
          >
            {cargando && !pedidos.length ? (
              <Esqueleto />
            ) : pedidos.length === 0 ? (
              <Vacio
                filtrado={
                  !!buscarYa ||
                  categoriaId !== TODAS ||
                  proveedorId !== TODAS ||
                  filtro !== 'ABIERTOS'
                }
                onNuevo={() => setEditor({ pedido: null })}
              />
            ) : (
              <ul className="divide-y divide-[#fcf0f3]">
                {pedidos.map((p) => (
                  <FilaPedido
                    key={p.id}
                    p={p}
                    onAbrir={() => setEditor({ pedido: p })}
                    onRepetir={() => repetir(p)}
                    onEntregar={() => setAEntregar(p)}
                  />
                ))}
              </ul>
            )}
          </div>

          {paginas > 1 && (
            <div className="flex items-center justify-end gap-1 pt-3 text-sm text-[#6b4c57] tabular-nums">
              <button
                onClick={() => setPagina((x) => Math.max(1, x - 1))}
                disabled={pagina === 1}
                aria-label="Página anterior"
                className={BOTON_ICONO}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pagina} de {paginas}
              <button
                onClick={() => setPagina((x) => Math.min(paginas, x + 1))}
                disabled={pagina === paginas}
                aria-label="Página siguiente"
                className={BOTON_ICONO}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <EditorPedido
        abierto={!!editor}
        pedido={editor?.pedido ?? null}
        inicial={editor?.inicial}
        proveedores={proveedores}
        categorias={categorias}
        productos={productos}
        onCerrar={() => setEditor(null)}
        onGuardado={alGuardar}
        onEliminado={() => {
          setEditor(null);
          recargar();
        }}
        onRepetido={(p) => {
          setEditor({ pedido: p });
          recargar();
        }}
        onProveedorCreado={(p) =>
          setProveedores((xs) =>
            [...xs, p].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
          )
        }
        onEntregar={(p) => setAEntregar(p)}
      />

      <DialogoEntregar
        pedido={aEntregar}
        onCerrar={() => setAEntregar(null)}
        onEntregado={(p) => {
          setAEntregar(null);
          setEditor((e) => (e?.pedido?.id === p.id ? { pedido: p } : e));
          recargar();
        }}
      />
    </div>
  );
}

function FilaPedido({
  p,
  onAbrir,
  onRepetir,
  onEntregar,
}: {
  p: Pedido;
  onAbrir: () => void;
  onRepetir: () => void;
  onEntregar: () => void;
}) {
  const t = totalDe(p);
  const categorias = [
    ...new Map(
      p.items.flatMap((i) => i.categorias).map((c) => [c.id, c])
    ).values(),
  ];
  const titulo = p.titulo || resumenItems(p) || p.nota || 'Sin detalle';
  const detalle = p.titulo ? resumenItems(p) : null;
  const suma = p.items.some((i) => i.afectaStock);

  return (
    <li className="group flex items-stretch hover:bg-[#fdf8fa]">
      <button
        type="button"
        onClick={onAbrir}
        className={`grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-3 text-left sm:grid-cols-[3rem_minmax(0,1fr)_10rem_7.5rem_6.5rem] sm:items-center sm:px-4 ${FOCO} focus-visible:-outline-offset-2`}
      >
        <span className="text-xs text-[#8b5a6b] tabular-nums sm:text-sm">
          N° {p.numero}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm text-[#4a3540]">
            {titulo}
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-[#8b5a6b]">
            {detalle && <span className="truncate">{detalle}</span>}
            {categorias.length > 0 && (
              <span className="truncate">
                {categorias.map((c) => c.nombre).join(' · ')}
              </span>
            )}
            {suma && <span className="whitespace-nowrap">· stock</span>}
            {p.comprobantes.length > 0 && (
              <span
                className="inline-flex items-center gap-0.5 whitespace-nowrap"
                title="Comprobantes"
              >
                <Paperclip className="h-3 w-3" aria-hidden />
                {p.comprobantes.length}
              </span>
            )}
          </span>
        </span>
        <span className="col-start-2 truncate text-xs text-[#6b4c57] sm:col-start-auto sm:text-sm">
          {p.proveedores.map((x) => x.nombre).join(', ') || (
            <span className="text-[#b496a2]">Sin proveedor</span>
          )}
        </span>
        <span className="col-start-2 flex items-center gap-2 sm:col-start-auto">
          <ChipEstado estado={p.estado} />
          {p.bloqueado && (
            <Lock
              className="h-3 w-3 text-[#b496a2]"
              aria-label="Cerrado: pasaron 48 h desde la compra"
            />
          )}
        </span>
        <span className="col-start-2 flex items-baseline gap-2 sm:col-start-auto sm:flex-col sm:items-end sm:gap-0">
          <span className="text-sm text-[#4a3540] tabular-nums">
            {t !== null ? plata(t, p.moneda) : ''}
          </span>
          <span
            className="text-[11px] text-[#8b5a6b] tabular-nums"
            title={fechaHora(p.createdAt)}
          >
            {fecha(
              p.estado === 'ENTREGADO'
                ? p.entregadoAt
                : p.estado === 'COMPRADO'
                  ? p.compradoAt
                  : p.createdAt
            )}
          </span>
        </span>
      </button>
      <div className="flex items-center pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Más acciones del pedido N° ${p.numero}`}
              className={BOTON_ICONO}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-[#f5d0d9] text-[#4a3540] shadow-none"
          >
            {p.estado === 'COMPRADO' && (
              <DropdownMenuItem onClick={onEntregar}>
                <Truck className="h-4 w-4" />
                Llegó
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onRepetir}>
              <Copy className="h-4 w-4" />
              Repetir pedido
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function BotonSeccion({
  children,
  activo,
  onClick,
}: {
  children: React.ReactNode;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${FOCO} ${
        activo ? 'bg-[#4a3540] text-white' : 'text-[#6b4c57] hover:bg-[#fcf0f3]'
      }`}
    >
      {children}
    </button>
  );
}

function Esqueleto() {
  return (
    <ul className="divide-y divide-[#fcf0f3]" aria-hidden>
      {[0, 1, 2, 3].map((n) => (
        <li key={n} className="flex animate-pulse items-center gap-3 px-4 py-4">
          <span className="h-3 w-8 rounded bg-[#fcf0f3]" />
          <span className="h-3 flex-1 rounded bg-[#fdf6f8]" />
          <span className="h-5 w-20 rounded bg-[#fcf0f3]" />
        </li>
      ))}
    </ul>
  );
}

function Vacio({
  filtrado,
  onNuevo,
}: {
  filtrado: boolean;
  onNuevo: () => void;
}) {
  return (
    <div className="px-4 py-12 text-center">
      <ShoppingCart
        className="mx-auto mb-3 h-8 w-8 text-[#d4a7ca]"
        aria-hidden
      />
      {filtrado ? (
        <p className="text-sm text-[#6b4c57]">
          No hay pedidos con estos filtros.
        </p>
      ) : (
        <>
          <p className="text-sm text-[#6b4c57]">
            No hay nada pendiente de comprar.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[#8b5a6b]">
            Cuando falte algo, anotalo acá aunque todavía no sepas el precio ni
            a quién comprárselo.
          </p>
          <button
            type="button"
            onClick={onNuevo}
            className={`${BOTON_PRIMARIO} mt-4`}
          >
            <Plus className="h-4 w-4" />
            Anotar lo que falta
          </button>
        </>
      )}
    </div>
  );
}
