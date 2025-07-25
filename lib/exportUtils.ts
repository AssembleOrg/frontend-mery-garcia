import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Comanda, FiltrosComanda, UnidadNegocio } from '@/types/caja';
import {
  formatARS as formatARSUtil,
  formatUSD as formatUSDUtil,
} from '@/lib/utils';

export interface ExportOptions {
  filename?: string;
  dateRange?: { from: Date; to?: Date };
  filters?: FiltrosComanda;
}

/**
 * Exporta comandas a formato CSV
 */
export const exportComandasToCSV = (
  comandas: Comanda[],
  exchangeRate: number,
  options: ExportOptions = {}
) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = options.filename || `comandas_${timestamp}`;

  const { formatUSD, formatARS } = createCurrencyFormatter(exchangeRate);

  const calcularValoresPorMoneda = (
    comanda: Comanda
  ): { usd: number; ars: number } => {
    if (!comanda.metodosPago || comanda.metodosPago.length === 0) {
      // Si no hay métodos de pago, usar la moneda y total de la comanda
      return {
        usd: comanda.moneda === 'USD' ? comanda.totalFinal : 0,
        ars: comanda.moneda === 'ARS' ? comanda.totalFinal : 0,
      };
    }

    // Calcular valores reales basándose en los métodos de pago
    const metodosUSD = comanda.metodosPago.filter((mp) => mp.moneda === 'USD');
    const metodosARS = comanda.metodosPago.filter((mp) => mp.moneda === 'ARS');

    const totalUSD = metodosUSD.reduce((sum, mp) => sum + mp.monto, 0);
    const totalARS = metodosARS.reduce((sum, mp) => sum + mp.monto, 0);

    return { usd: totalUSD, ars: totalARS };
  };

  const obtenerMetodosPago = (comanda: Comanda): string => {
    if (!comanda.metodosPago || comanda.metodosPago.length === 0) {
      return `Efectivo - ${comanda.moneda}`;
    }

    return comanda.metodosPago
      .map(
        (mp) =>
          `${mp.tipo.charAt(0).toUpperCase() + mp.tipo.slice(1)} - ${mp.moneda}`
      )
      .join(', ');
  };

  const data = comandas.map((comanda) => {
    const valores = calcularValoresPorMoneda(comanda);

    return {
      Fecha: new Date(comanda.fecha).toLocaleDateString('es-AR'),
      Numero: comanda.numero,
      Cliente: comanda.cliente?.nombre || 'N/A',
      Personal: comanda.mainStaff?.nombre || 'N/A',
      'Unidad de Negocio': comanda.businessUnit,
      Tipo: comanda.tipo,
      USD: valores.usd > 0 ? formatUSD(valores.usd) : '-',
      ARS:
        valores.ars > 0
          ? formatARS(valores.ars).replace(/[^\d.,\-]/g, '')
          : '-',
      Estado: comanda.estado,
      'Metodo de Pago': obtenerMetodosPago(comanda),
      Observaciones: comanda.observaciones || '',
    };
  });

  const calcularTotalesPorTipo = (tipo: 'ingreso' | 'egreso') => {
    const comandasFiltradas = comandas.filter((c) => c.tipo === tipo);
    let totalUSD = 0;
    let totalARS = 0;

    comandasFiltradas.forEach((comanda) => {
      const valores = calcularValoresPorMoneda(comanda);
      totalUSD += valores.usd;
      totalARS += valores.ars;
    });

    return { totalUSD, totalARS };
  };

  const totalesIngresos = calcularTotalesPorTipo('ingreso');
  const totalesEgresos = calcularTotalesPorTipo('egreso');

  data.push(
    {
      Fecha: '',
      Numero: '',
      Cliente: '',      Personal: '',
      'Unidad de Negocio': '' as any,
      Tipo: '' as any,
      Estado: '' as any,
      USD: '',
      ARS: '',
      'Metodo de Pago': '',
      Observaciones: '',
    },
    {
      Fecha: '',
      Numero: '',
      Cliente: '',
      Personal: 'INGRESOS',
      'Unidad de Negocio': '' as any,
      Tipo: '' as any,
      Estado: '' as any,
      USD: formatUSD(totalesIngresos.totalUSD),
      ARS: formatARS(totalesIngresos.totalARS).replace(/[^\d.,\-]/g, ''),
      'Metodo de Pago': '',
      Observaciones: '',
    },
    {
      Fecha: '',
      Numero: '',
      Cliente: '',
      Personal: 'EGRESOS',
      'Unidad de Negocio': '' as any,
      Tipo: '' as any,
      Estado: '' as any,
      USD: formatUSD(totalesEgresos.totalUSD),
      ARS: formatARS(totalesEgresos.totalARS).replace(/[^\d.,\-]/g, ''),
      'Metodo de Pago': '',
      Observaciones: '',
    },
    {
      Fecha: '',
      Numero: '',
      Cliente: '',
      Personal: 'SALDO NETO',
      'Unidad de Negocio': '' as any,
      Tipo: '' as any,
      Estado: '' as any,
      USD: formatUSD(totalesIngresos.totalUSD - totalesEgresos.totalUSD),
      ARS: formatARS(
        totalesIngresos.totalARS - totalesEgresos.totalARS
      ).replace(/[^\d.,\-]/g, ''),
      'Metodo de Pago': '',
      Observaciones: '',
    }
  );

  // Generar CSV
  const csv = Papa.unparse(data, {
    delimiter: ',',
    header: true,
  });

  // Descargar archivo
  downloadFile(csv, `${filename}.csv`, 'text/csv');
};

/**
 * Exporta comandas a formato PDF
 */
const createCurrencyFormatter = (exchangeRate: number) => ({
  formatUSD: (amount: number) => formatUSDUtil(amount),
  formatARS: (amount: number) => formatARSUtil(amount, exchangeRate),
});

export const exportComandasToPDF = (
  comandas: Comanda[],
  exchangeRate: number,
  options: ExportOptions = {}
) => {
  const { formatUSD, formatARS } = createCurrencyFormatter(exchangeRate);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = options.filename || `comandas_${timestamp}`;

  const doc = new jsPDF();

  // Header del documento
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Reporte de Comandas - Mery García', 20, 20);

  // Información del período y filtros
  let currentY = 30;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  if (options.dateRange) {
    const desde = options.dateRange.from.toLocaleDateString('es-AR');
    const hasta = options.dateRange.to?.toLocaleDateString('es-AR') || 'Hoy';
    doc.text(`Período: ${desde} - ${hasta}`, 20, currentY);
    currentY += 8;
  }

  // Información de filtros aplicados
  if (options.filters) {
    const filtrosTexto = [];
    if (options.filters.businessUnit) {
      filtrosTexto.push(`Unidad: ${options.filters.businessUnit}`);
    }
    if (options.filters.estado) {
      filtrosTexto.push(`Estado: ${options.filters.estado}`);
    }
    if (options.filters.moneda) {
      filtrosTexto.push(`Moneda: ${options.filters.moneda}`);
    }
    if (options.filters.metodoPago) {
      filtrosTexto.push(`Método Pago: ${options.filters.metodoPago}`);
    }
    if (options.filters.cliente) {
      filtrosTexto.push(`Cliente: ${options.filters.cliente}`);
    }
    if (filtrosTexto.length > 0) {
      doc.text(`Filtros: ${filtrosTexto.join(' | ')}`, 20, currentY);
      currentY += 8;
    }
  }

  // Total de comandas incluidas
  doc.text(`Total de comandas: ${comandas.length}`, 20, currentY);
  currentY += 8;

  // Fecha de generación
  doc.setFontSize(8);
  doc.text(
    `Generado el: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`,
    20,
    currentY
  );

  const calcularValoresPorMoneda = (
    comanda: Comanda
  ): { usd: number; ars: number } => {
    if (!comanda.metodosPago || comanda.metodosPago.length === 0) {
      // Si no hay métodos de pago, usar la moneda y total de la comanda
      return {
        usd: comanda.moneda === 'USD' ? comanda.totalFinal : 0,
        ars: comanda.moneda === 'ARS' ? comanda.totalFinal : 0,
      };
    }

    // Calcular valores reales basándose en los métodos de pago
    const metodosUSD = comanda.metodosPago.filter((mp) => mp.moneda === 'USD');
    const metodosARS = comanda.metodosPago.filter((mp) => mp.moneda === 'ARS');

    const totalUSD = metodosUSD.reduce((sum, mp) => sum + mp.monto, 0);
    const totalARS = metodosARS.reduce((sum, mp) => sum + mp.monto, 0);

    return { usd: totalUSD, ars: totalARS };
  };

  const obtenerMetodosPago = (comanda: Comanda): string => {
    if (!comanda.metodosPago || comanda.metodosPago.length === 0) {
      return `Efectivo - ${comanda.moneda}`;
    }

    return comanda.metodosPago
      .map(
        (mp) =>
          `${mp.tipo.charAt(0).toUpperCase() + mp.tipo.slice(1)} - ${mp.moneda}`
      )
      .join(', ');
  };

  // Preparar datos para la tabla
  const columns = [
    'Fecha',
    'N°',
    'Cliente',
    'Personal',
    'Unidad',
    'Tipo',
    'USD',
    'ARS',
    'Método Pago',
    'Estado',
  ];
  const rows = comandas.map((comanda) => {
    const valores = calcularValoresPorMoneda(comanda);

    return [
      new Date(comanda.fecha).toLocaleDateString('es-AR'),
      comanda.numero.toString(),
      comanda.cliente?.nombre || 'N/A',
      comanda.mainStaff?.nombre || 'N/A',
      comanda.businessUnit,
      comanda.tipo,
      valores.usd > 0 ? formatUSD(valores.usd) : '-',
      valores.ars > 0 ? formatARS(valores.ars) : '-',
      obtenerMetodosPago(comanda),
      comanda.estado,
    ];
  });

  // Generar tabla
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: currentY + 10,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'left',
    },
    headStyles: {
      fillColor: [249, 187, 196], // Color rosa de la marca
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 6,
    },
    alternateRowStyles: {
      fillColor: [252, 248, 249], // Rosa muy claro
    },
    columnStyles: {
      0: { cellWidth: 16 }, // Fecha - Reducido de 18 a 16
      1: { cellWidth: 12 }, // Número - Reducido de 14 a 12
      2: { cellWidth: 20 }, // Cliente
      3: { cellWidth: 20 }, // Personal
      4: { cellWidth: 16 }, // Unidad - Reducido de 22 a 16
      5: { cellWidth: 14 }, // Tipo - Reducido de 18 a 14
      6: { cellWidth: 18 }, // USD - Reducido de 22 a 18
      7: { cellWidth: 18 }, // ARS - Reducido de 22 a 18
      8: { cellWidth: 28 }, // Método Pago - Reducido de 35 a 28
      9: { cellWidth: 16 }, // Estado - Reducido de 20 a 16
    },
    margin: { top: 45, left: 10, right: 10 }, // Reducido márgenes de 15 a 10
    tableWidth: 'auto',
  });

  // Footer con totales mejorados usando valores reales por moneda
  const calcularTotalesPorTipo = (tipo: 'ingreso' | 'egreso') => {
    const comandasFiltradas = comandas.filter((c) => c.tipo === tipo);
    let totalUSD = 0;
    let totalARS = 0;

    comandasFiltradas.forEach((comanda) => {
      const valores = calcularValoresPorMoneda(comanda);
      totalUSD += valores.usd;
      totalARS += valores.ars;
    });

    return { totalUSD, totalARS };
  };

  const totalesIngresos = calcularTotalesPorTipo('ingreso');
  const totalesEgresos = calcularTotalesPorTipo('egreso');

  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY || 100;

  // Título de resumen
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('RESUMEN FINANCIERO', 20, finalY + 15);

  // Línea separadora
  doc.setDrawColor(249, 187, 196);
  doc.setLineWidth(0.5);
  doc.line(20, finalY + 18, 190, finalY + 18);

  // Totales por tipo y moneda
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  let summaryY = finalY + 28;

  // Ingresos
  doc.setFont('helvetica', 'bold');
  doc.text('INGRESOS:', 20, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.text(`USD: ${formatUSD(totalesIngresos.totalUSD)}`, 35, summaryY + 8);
  doc.text(`ARS: ${formatARS(totalesIngresos.totalARS)}`, 35, summaryY + 16);

  // Egresos
  doc.setFont('helvetica', 'bold');
  doc.text('EGRESOS:', 110, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.text(`USD: ${formatUSD(totalesEgresos.totalUSD)}`, 125, summaryY + 8);
  doc.text(`ARS: ${formatARS(totalesEgresos.totalARS)}`, 125, summaryY + 16);

  // Saldo neto
  summaryY += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('SALDO NETO:', 20, summaryY);

  const saldoNetoUSD = totalesIngresos.totalUSD - totalesEgresos.totalUSD;
  const saldoNetoARS = totalesIngresos.totalARS - totalesEgresos.totalARS;

  // Color verde para positivo, rojo para negativo
  doc.setTextColor(saldoNetoUSD >= 0 ? 0 : 255, saldoNetoUSD >= 0 ? 128 : 0, 0);
  doc.text(`USD: ${formatUSD(saldoNetoUSD)}`, 35, summaryY + 10);

  doc.setTextColor(saldoNetoARS >= 0 ? 0 : 255, saldoNetoARS >= 0 ? 128 : 0, 0);
  doc.text(`ARS: ${formatARS(saldoNetoARS)}`, 35, summaryY + 18);

  // Información adicional
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Comandas procesadas: ${comandas.length}`, 20, summaryY + 35);
  doc.text(
    `Ingresos: ${comandas.filter((c) => c.tipo === 'ingreso').length} | Egresos: ${comandas.filter((c) => c.tipo === 'egreso').length}`,
    20,
    summaryY + 42
  );

  // Guardar archivo
  doc.save(`${filename}.pdf`);
};

/**
 * Función auxiliar para descargar archivos
 */
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
