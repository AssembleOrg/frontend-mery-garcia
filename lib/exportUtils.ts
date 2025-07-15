import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Comanda, FiltrosComanda } from '@/types/caja';
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
  options: ExportOptions = {}
) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = options.filename || `comandas_${timestamp}`;

  const calcularValorEfectivo = (comanda: Comanda): number => {
    if (!comanda.metodosPago || comanda.metodosPago.length === 0) {
      return 0;
    }

    return comanda.metodosPago
      .filter((metodo) => metodo.tipo === 'efectivo')
      .reduce((total, metodo) => total + metodo.monto, 0);
  };

  // Preparar datos para CSV
  const data = comandas.map((comanda) => ({
    Fecha: new Date(comanda.fecha).toLocaleDateString('es-AR'),
    Numero: comanda.numero,
    Cliente: comanda.cliente?.nombre || 'N/A',
    Personal: comanda.mainStaff?.nombre || 'N/A',
    'Unidad de Negocio': comanda.businessUnit,
    Tipo: comanda.tipo,
    Total: comanda.totalFinal,
    'Valor Efectivo': calcularValorEfectivo(comanda),
    Estado: comanda.estado,
    'Metodo de Pago': comanda.metodosPago?.[0]?.tipo || 'N/A',
    Observaciones: comanda.observaciones || '',
  }));

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
  const { formatUSD } = createCurrencyFormatter(exchangeRate);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = options.filename || `comandas_${timestamp}`;

  const doc = new jsPDF();

  // Header del documento
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Reporte de Comandas - Mery García', 20, 20);

  // Información del período
  if (options.dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const desde = options.dateRange.from.toLocaleDateString('es-AR');
    const hasta = options.dateRange.to?.toLocaleDateString('es-AR') || 'Hoy';
    doc.text(`Período: ${desde} - ${hasta}`, 20, 30);
  }

  // Fecha de generación
  doc.setFontSize(8);
  doc.text(
    `Generado el: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`,
    20,
    35
  );

  const calcularValorEfectivo = (comanda: Comanda): number => {
    if (!comanda.metodosPago || comanda.metodosPago.length === 0) {
      return 0;
    }

    return comanda.metodosPago
      .filter((metodo) => metodo.tipo === 'efectivo')
      .reduce((total, metodo) => total + metodo.monto, 0);
  };

  // Preparar datos para la tabla
  const columns = [
    'Fecha',
    'N°',
    'Cliente',
    'Personal',
    'Unidad',
    'Tipo',
    'Total',
    'Efectivo',
    'Estado',
  ];
  const rows = comandas.map((comanda) => [
    new Date(comanda.fecha).toLocaleDateString('es-AR'),
    comanda.numero.toString(),
    comanda.cliente?.nombre || 'N/A',
    comanda.mainStaff?.nombre || 'N/A',
    comanda.businessUnit,
    comanda.tipo,
    formatUSD(comanda.totalFinal),
    formatUSD(calcularValorEfectivo(comanda)),
    comanda.estado,
  ]);

  // Generar tabla
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 45,
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
      0: { cellWidth: 16 }, // Fecha
      1: { cellWidth: 12 }, // Número
      2: { cellWidth: 30 }, // Cliente
      3: { cellWidth: 30 }, // Personal
      4: { cellWidth: 20 }, // Unidad
      5: { cellWidth: 20 }, // Tipo
      6: { cellWidth: 24 }, // Total
      7: { cellWidth: 20 }, // Efectivo
      8: { cellWidth: 20 }, // Estado
    },
    margin: { top: 45, left: 15, right: 15 },
    tableWidth: 'auto',
  });

  // Footer con totales
  const totalIngresos = comandas
    .filter((c) => c.tipo === 'ingreso')
    .reduce((sum, c) => sum + c.totalFinal, 0);

  const totalEgresos = comandas
    .filter((c) => c.tipo === 'egreso')
    .reduce((sum, c) => sum + c.totalFinal, 0);

  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY || 100; // Reemplazado 'any' con tipo específico

  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Ingresos: ${formatUSD(totalIngresos)}`, 20, finalY + 15);
  doc.text(`Total Egresos: ${formatUSD(totalEgresos)}`, 20, finalY + 25);
  doc.text(
    `Saldo Neto: ${formatUSD(totalIngresos - totalEgresos)}`,
    20,
    finalY + 35
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
