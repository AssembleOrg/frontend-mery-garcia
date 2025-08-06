import { create } from 'zustand';
import {
  FiltrarMovimientosDto,
  movimientoService,
} from '@/services/movimiento.service';
import {
  MovimientoNew,
  MovimientoCreateNew,
} from '@/services/unidadNegocio.service';
import { toast } from 'sonner';
import { logger } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MovimientosState {
  // Estado
  movimientos: MovimientoNew[];
  movimientosPaginados: {
    data: MovimientoNew[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  loading: boolean;
  error: string | null;
  lastRequestId: string | null;

  // Acciones
  crearMovimiento: (
    movimiento: MovimientoCreateNew
  ) => Promise<MovimientoNew | null>;
  resetError: () => void;
  resetState: () => void;
  obtenerMovimientosPaginados: (filtros: FiltrarMovimientosDto) => Promise<{
    data: MovimientoNew[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
  exportarMovimientosCSV: () => void;
  exportarMovimientosPDF: () => void;
}

// Función para generar un ID único para cada request
const generateRequestId = () =>
  `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useMovimientosStore = create<MovimientosState>((set, get) => ({
  // Estado inicial
  movimientos: [],
  movimientosPaginados: {
    data: [],
    meta: {
      total: 0,
      page: 0,
      limit: 0,
      totalPages: 0,
    },
  },
  loading: false,
  error: null,
  lastRequestId: null,

  // Crear movimiento con protección contra race requests
  crearMovimiento: async (movimiento: MovimientoCreateNew) => {
    const requestId = generateRequestId();

    // Si ya hay una request en curso, no permitir otra
    if (get().loading) {
      console.warn(
        'Movimiento: Ya hay una request en curso, ignorando nueva request'
      );
      return null;
    }

    set({
      loading: true,
      error: null,
      lastRequestId: requestId,
    });

    try {
      console.log('Movimiento: Creando movimiento...', {
        requestId,
        movimiento,
      });

      const nuevoMovimiento =
        await movimientoService.crearMovimiento(movimiento);

      // Verificar que esta request sigue siendo la más reciente
      if (get().lastRequestId !== requestId) {
        console.warn('Movimiento: Request obsoleta, ignorando respuesta', {
          requestId,
          currentRequestId: get().lastRequestId,
        });
        return null;
      }

      // Actualizar el estado con el nuevo movimiento
      set((state) => ({
        movimientos: [...state.movimientos, nuevoMovimiento],
        loading: false,
        error: null,
      }));

      console.log('Movimiento: Movimiento creado exitosamente', {
        requestId,
        nuevoMovimiento,
      });
      return nuevoMovimiento;
    } catch (error) {
      // Verificar que esta request sigue siendo la más reciente
      if (get().lastRequestId !== requestId) {
        console.warn('Movimiento: Error en request obsoleta, ignorando', {
          requestId,
          currentRequestId: get().lastRequestId,
        });
        return null;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al crear movimiento';

      set({
        loading: false,
        error: errorMessage,
      });

      console.error('Movimiento: Error al crear movimiento', {
        requestId,
        error: errorMessage,
      });
      throw error;
    }
  },
  obtenerMovimientosPaginados: async (filtros: FiltrarMovimientosDto) => {
    const response =
      await movimientoService.obtenerMovimientosPaginados(filtros);
    set({ movimientosPaginados: response });
    return response;
  },

  // Resetear error
  resetError: () => {
    set({ error: null });
  },

  // Resetear estado completo
  resetState: () => {
    set({
      movimientos: [],
      loading: false,
      error: null,
      lastRequestId: null,
    });
  },

  // Exportar movimientos a CSV
  exportarMovimientosCSV: () => {
    const { movimientosPaginados } = get();

    if (!movimientosPaginados.data || movimientosPaginados.data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      // Calcular resumen de caja
      const resumenCaja = calcularResumenCaja(movimientosPaginados.data);

      // Crear headers del CSV
      const headers = [
        'ID',
        'Fecha',
        'Tipo',
        'Monto USD',
        'Monto ARS',
        'Residual USD',
        'Residual ARS',
        'Comentario',
        'Personal',
        'Comandas Asociadas',
      ];

      // Crear filas de datos
      const rows = movimientosPaginados.data.map((movimiento) => [
        movimiento.id,
        format(new Date(movimiento.createdAt), 'dd/MM/yyyy HH:mm:ss', {
          locale: es,
        }),
        movimiento.esIngreso ? 'Ingreso' : 'Egreso',
        movimiento.montoUSD || 0,
        movimiento.montoARS || 0,
        movimiento.residualUSD || 0,
        movimiento.residualARS || 0,
        movimiento.comentario || '',
        movimiento.personal?.nombre || '',
        movimiento.comandas?.length || 0,
      ]);

      // Agregar resumen de caja al final
      const resumenRows = [
        [],
        ['RESUMEN DE CAJA'],
        ['Total Ingresos USD', resumenCaja.totalArs],
        ['Total Ingresos ARS', resumenCaja.totalUsd],
        ['Total Residual USD', resumenCaja.residualArs],
        ['Total Residual ARS', resumenCaja.residualUsd],
        ['Egresos USD', resumenCaja.egresosArs],
        ['Egresos ARS', resumenCaja.egresosUsd],
        ['Saldo Neto USD', resumenCaja.saldoNetoARS],
        ['Saldo Neto ARS', resumenCaja.saldoNetoUSD],
        ['Cantidad de Movimientos', movimientosPaginados.data.length],
      ];

      // Combinar headers y datos
      const csvContent = [headers, ...rows, ...resumenRows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `movimientos_caja_grande_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Movimientos exportados a CSV exitosamente');
      logger.info(
        '✅ Movimientos exportados a CSV:',
        movimientosPaginados.data.length,
        'registros'
      );
    } catch (error) {
      logger.error('❌ Error exportando movimientos a CSV:', error);
      toast.error('Error al exportar movimientos a CSV');
    }
  },

  // Exportar movimientos a PDF
  exportarMovimientosPDF: () => {
    const { movimientosPaginados } = get();
    
    if (!movimientosPaginados.data || movimientosPaginados.data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      // Importar jsPDF dinámicamente
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF();
          
          // Calcular resumen de caja
          const resumenCaja = calcularResumenCaja(movimientosPaginados.data);
          
          // Título del documento
          doc.setFontSize(20);
          doc.text('Reporte de Movimientos - Caja Grande', 20, 20);
          
          // Subtítulo con fecha
          doc.setFontSize(12);
          doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}`, 20, 30);
          
          // Estadísticas
          doc.setFontSize(10);
          let yPosition = 45;
          doc.text(`Total de movimientos: ${movimientosPaginados.data.length}`, 20, yPosition);
          yPosition += 10;
          
          // Tabla de movimientos
          const tableData = movimientosPaginados.data.map(movimiento => [
            movimiento.id,
            format(new Date(movimiento.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
            movimiento.esIngreso ? 'Ingreso' : 'Egreso',
            movimiento.montoUSD || 0,
            movimiento.montoARS || 0,
            movimiento.residualUSD || 0,
            movimiento.residualARS || 0,
            movimiento.personal?.nombre || '',
            movimiento.comentario?.substring(0, 30) + (movimiento.comentario && movimiento.comentario.length > 30 ? '...' : '') || '',
          ]);
          
          autoTable(doc, {
            head: [['ID', 'Fecha', 'Tipo', 'USD', 'ARS', 'Res. USD', 'Res. ARS', 'Personal', 'Comentario']],
            body: tableData,
            startY: yPosition,
            styles: {
              fontSize: 8,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [249, 187, 196],
              textColor: [74, 53, 64],
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [255, 255, 255],
            },
            columnStyles: {
              0: { cellWidth: 15 }, // ID
              1: { cellWidth: 25 }, // Fecha
              2: { cellWidth: 15 }, // Tipo
              3: { cellWidth: 15 }, // USD
              4: { cellWidth: 15 }, // ARS
              5: { cellWidth: 15 }, // Res. USD
              6: { cellWidth: 15 }, // Res. ARS
              7: { cellWidth: 25 }, // Personal
              8: { cellWidth: 30 }, // Comentario
            },
            margin: { top: 10 },
          });
          
          // Resumen de caja en una nueva página
          doc.addPage();
          doc.setFontSize(16);
          doc.text('Resumen de Caja', 20, 20);
          
          doc.setFontSize(12);
          let resumenY = 40;
          
          // Agregar información del resumen como texto
          doc.text(`Total Ingresos USD: ${resumenCaja.totalUsd}`, 20, resumenY);
          resumenY += 10;
          doc.text(`Total Ingresos ARS: ${resumenCaja.totalArs}`, 20, resumenY);
          resumenY += 10;
          doc.text(`Total Residual USD: ${resumenCaja.residualUsd}`, 20, resumenY);
          resumenY += 10;
          doc.text(`Total Residual ARS: ${resumenCaja.residualArs}`, 20, resumenY);
          resumenY += 10;
          doc.text(`Egresos USD: ${resumenCaja.egresosUsd}`, 20, resumenY);
          resumenY += 10;
          doc.text(`Egresos ARS: ${resumenCaja.egresosArs}`, 20, resumenY);
          resumenY += 15;
          doc.setFontSize(14);
          doc.text(`SALDO NETO USD: ${resumenCaja.saldoNetoUSD}`, 20, resumenY);
          resumenY += 10;
          doc.text(`SALDO NETO ARS: ${resumenCaja.saldoNetoARS}`, 20, resumenY);
          
          // Guardar el PDF
          const fileName = `movimientos_caja_grande_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`;
          doc.save(fileName);
          
          toast.success('Movimientos exportados a PDF exitosamente');
          logger.info('✅ Movimientos exportados a PDF:', movimientosPaginados.data.length, 'registros');
        });
      });
    } catch (error) {
      logger.error('❌ Error exportando movimientos a PDF:', error);
      toast.error('Error al exportar movimientos a PDF');
    }
  },
}));

// Función auxiliar para calcular resumen de caja
const calcularResumenCaja = (movimientos: MovimientoNew[]) => {
  const totalArs = movimientos.reduce((acc, mov) => {
    if (mov.esIngreso) {
      return acc + (Number(mov.montoARS) || 0);
    }
    return acc;
  }, 0);

  const totalUsd = movimientos.reduce((acc, mov) => {
    if (mov.esIngreso) {
      return acc + (Number(mov.montoUSD) || 0);
    }
    return acc;
  }, 0);

  const residualArs = movimientos.reduce((acc, mov) => {
    if (mov.esIngreso) {
      return acc + (Number(mov.residualARS) || 0);
    }
    return acc;
  }, 0);

  const residualUsd = movimientos.reduce((acc, mov) => {
    if (mov.esIngreso) {
      return acc + (Number(mov.residualUSD) || 0);
    }
    return acc;
  }, 0);

  const egresosArs = movimientos.reduce((acc, mov) => {
    if (!mov.esIngreso) {
      return acc + (Number(mov.montoARS) || 0);
    }
    return acc;
  }, 0);

  const egresosUsd = movimientos.reduce((acc, mov) => {
    if (!mov.esIngreso) {
      return acc + (Number(mov.montoUSD) || 0);
    }
    return acc;
  }, 0);

  const saldoNetoARS = totalArs - egresosArs;
  const saldoNetoUSD = totalUsd - egresosUsd;

  return {
    totalArs,
    totalUsd,
    residualArs,
    residualUsd,
    saldoNetoARS,
    saldoNetoUSD,
    egresosArs,
    egresosUsd,
  };
};