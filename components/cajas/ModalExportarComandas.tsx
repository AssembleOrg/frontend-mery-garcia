'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Download, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import { ComandaNew } from '@/services/unidadNegocio.service';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface ModalExportarComandasProps {
  isOpen: boolean;
  onClose: () => void;
  comandas: ComandaNew[];
}

interface ComandaSeleccionada {
  id: string;
  fecha: string;
  numero: string;
  cliente: string;
  seleccionada: boolean;
}

export default function ModalExportarComandas({
  isOpen,
  onClose,
  comandas,
}: ModalExportarComandasProps) {
  const [comandasSeleccionadas, setComandasSeleccionadas] = useState<
    ComandaSeleccionada[]
  >([]);
  const [seleccionarTodo, setSeleccionarTodo] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Inicializar comandas seleccionadas cuando se abre el modal
  useEffect(() => {
    if (isOpen && comandas.length > 0) {
      const comandasFormateadas = comandas.map((comanda) => ({
        id: comanda.id,
        fecha: formatDate(new Date(comanda.createdAt)),
        numero: comanda.numero,
        cliente: comanda.cliente?.nombre || 'Sin cliente',
        seleccionada: false,
      }));
      setComandasSeleccionadas(comandasFormateadas);
      setSeleccionarTodo(false);
    }
  }, [isOpen, comandas]);

  // Manejar selección individual
  const handleSeleccionarComanda = (id: string, seleccionada: boolean) => {
    setComandasSeleccionadas((prev) =>
      prev.map((comanda) =>
        comanda.id === id ? { ...comanda, seleccionada } : comanda
      )
    );
  };

  // Manejar seleccionar todo
  const handleSeleccionarTodo = (seleccionado: boolean) => {
    setComandasSeleccionadas((prev) =>
      prev.map((comanda) => ({ ...comanda, seleccionada: seleccionado }))
    );
    setSeleccionarTodo(seleccionado);
  };

  // Obtener comandas seleccionadas
  const comandasParaExportar = comandas.filter(
    (comanda) =>
      comandasSeleccionadas.find((cs) => cs.id === comanda.id)?.seleccionada
  );

  // Exportar a CSV
  const exportarCSV = async () => {
    if (comandasParaExportar.length === 0) {
      toast.error('Selecciona al menos una comanda para exportar');
      return;
    }

    setExportando(true);
    try {
      const headers = [
        'Fecha',
        'Número',
        'Cliente',
        'Personal',
        'Unidades de Negocio',
        'Servicios',
        'Total',
        'Dólar',
        'Caja',
        'Estado',
        'Creado por',
      ];

      const csvContent = [
        headers.join(','),
        ...comandasParaExportar.map((comanda) => {
          const personal = comanda.items
            .filter((item) => item.trabajador)
            .map((item) => item.trabajador?.nombre)
            .filter(Boolean)
            .join('; ');

          const unidadesNegocio = [
            ...new Set(
              comanda.items
                .filter((item) => item.productoServicio?.unidadNegocio)
                .map((item) => item.productoServicio?.unidadNegocio?.nombre)
                .filter(Boolean)
            ),
          ].join('; ');

          const servicios = comanda.items.map((item) => item.nombre).join('; ');

          const totalUSD = comanda.metodosPago
            .filter((mp) => mp.moneda === 'USD')
            .reduce((sum, mp) => sum + (mp.montoFinal || 0), 0);

          const totalARS = comanda.metodosPago
            .filter((mp) => mp.moneda === 'ARS')
            .reduce((sum, mp) => sum + (mp.montoFinal || 0), 0);

                    const total = `USD: $${totalUSD.toFixed(2)} | ARS: $${totalARS.toFixed(2)}`;
          
          return [
            formatDate(new Date(comanda.createdAt)),
            comanda.numero,
            comanda.cliente?.nombre || 'Sin cliente',
            personal || 'Sin asignar',
            unidadesNegocio || 'Sin unidad',
            servicios || 'Sin servicios',
            total,
            comanda.valorDolar?.toString() || '0',
            comanda.caja || 'Sin caja',
            comanda.estadoDeComanda,
            comanda.creadoPor?.nombre || 'Sin creador',
          ]
            .map((field) => `"${field}"`)
            .join(',');
        }),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Usar API nativa del navegador para descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comandas_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('CSV exportado exitosamente');
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error('Error al exportar CSV');
    } finally {
      setExportando(false);
    }
  };

  // Exportar a Excel
  const exportarExcel = async () => {
    if (comandasParaExportar.length === 0) {
      toast.error('Selecciona al menos una comanda para exportar');
      return;
    }

    setExportando(true);
    try {
      const XLSX = await import('xlsx');

      const data = comandasParaExportar.map((comanda) => {
        const personal = comanda.items
          .filter((item) => item.trabajador)
          .map((item) => item.trabajador?.nombre)
          .filter(Boolean)
          .join('; ');

        const unidadesNegocio = [
          ...new Set(
            comanda.items
              .filter((item) => item.productoServicio?.unidadNegocio)
              .map((item) => item.productoServicio?.unidadNegocio?.nombre)
              .filter(Boolean)
          ),
        ].join('; ');

        const servicios = comanda.items.map((item) => item.nombre).join('; ');

        const totalUSD = comanda.metodosPago
          .filter((mp) => mp.moneda === 'USD')
          .reduce((sum, mp) => sum + (mp.montoFinal || 0), 0);

        const totalARS = comanda.metodosPago
          .filter((mp) => mp.moneda === 'ARS')
          .reduce((sum, mp) => sum + (mp.montoFinal || 0), 0);

                  return {
            Fecha: formatDate(new Date(comanda.createdAt)),
            Número: comanda.numero,
            Cliente: comanda.cliente?.nombre || 'Sin cliente',
            Personal: personal || 'Sin asignar',
            'Unidades de Negocio': unidadesNegocio || 'Sin unidad',
            Servicios: servicios || 'Sin servicios',
            'Total USD': totalUSD.toFixed(2),
            'Total ARS': totalARS.toFixed(2),
            'Dólar': comanda.valorDolar?.toString() || '0',
            'Caja': comanda.caja || 'Sin caja',
            Estado: comanda.estadoDeComanda,
            'Creado por': comanda.creadoPor?.nombre || 'Sin creador',
          };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Comandas');

      XLSX.writeFile(
        wb,
        `comandas_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      toast.success('Excel exportado exitosamente');
    } catch (error) {
      console.error('Error exportando Excel:', error);
      toast.error('Error al exportar Excel');
    } finally {
      setExportando(false);
    }
  };

  // Exportar a PDF
  const exportarPDF = async () => {
    if (comandasParaExportar.length === 0) {
      toast.error('Selecciona al menos una comanda para exportar');
      return;
    }

    setExportando(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF('landscape'); // Orientación apaisada
      
      // Título
      doc.setFontSize(18);
      doc.text('Reporte de Comandas', 14, 22);
      doc.setFontSize(12);
      doc.text(`Fecha de exportación: ${formatDate(new Date())}`, 14, 32);
      doc.text(`Total de comandas: ${comandasParaExportar.length}`, 14, 42);

      // Datos de la tabla
      const tableData = comandasParaExportar.map((comanda) => {
        const personal = comanda.items
          .filter((item) => item.trabajador)
          .map((item) => item.trabajador?.nombre)
          .filter(Boolean)
          .join('; ');

        const unidadesNegocio = [
          ...new Set(
            comanda.items
              .filter((item) => item.productoServicio?.unidadNegocio)
              .map((item) => item.productoServicio?.unidadNegocio?.nombre)
              .filter(Boolean)
          ),
        ].join('; ');

        const servicios = comanda.items.map((item) => item.nombre).join('; ');

        const totalUSD = comanda.metodosPago
          .filter((mp) => mp.moneda === 'USD')
          .reduce((sum, mp) => sum + (mp.montoFinal || 0), 0);

        const totalARS = comanda.metodosPago
          .filter((mp) => mp.moneda === 'ARS')
          .reduce((sum, mp) => sum + (mp.montoFinal || 0), 0);

        return [
          formatDate(new Date(comanda.createdAt)),
          comanda.numero,
          comanda.cliente?.nombre || 'Sin cliente',
          personal || 'Sin asignar',
          unidadesNegocio || 'Sin unidad',
          servicios || 'Sin servicios',
          `USD: $${totalUSD.toFixed(2)} | ARS: $${totalARS.toFixed(2)}`,
          comanda.valorDolar?.toString() || '0',
          comanda.caja || 'Sin caja',
          comanda.estadoDeComanda,
          comanda.creadoPor?.nombre || 'Sin creador',
        ];
      });

              autoTable(doc, {
          head: [
            [
              'Fecha',
              'Número',
              'Cliente',
              'Personal',
              'Unidades',
              'Servicios',
              'Total',
              'Dólar',
              'Caja',
              'Estado',
              'Creado por',
            ],
          ],
          body: tableData,
          startY: 50,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [255, 255, 255] as [number, number, number], // Fondo blanco para headers
            textColor: [74, 53, 64] as [number, number, number],
            fontStyle: 'bold',
          },
          bodyStyles: {
            fillColor: [249, 187, 196] as [number, number, number], // Rosa claro para todas las filas
          },
        });

      doc.save(`comandas_${new Date().toISOString().split('T')[0]}.pdf`);

      toast.success('PDF exportado exitosamente');
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al exportar PDF');
    } finally {
      setExportando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <Download className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Exportar Comandas
                </h2>
                <p className="text-sm text-gray-600">
                  Selecciona las comandas que deseas exportar
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Resumen */}
            <div className="mb-4 rounded-lg border border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/10 to-[#e292a3]/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4a3540]">
                    Comandas disponibles: {comandas.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Comandas seleccionadas:{' '}
                    {comandasSeleccionadas.filter((c) => c.seleccionada).length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seleccionar-todo"
                    checked={seleccionarTodo}
                    onCheckedChange={handleSeleccionarTodo}
                  />
                  <label
                    htmlFor="seleccionar-todo"
                    className="text-sm font-medium text-[#4a3540]"
                  >
                    Seleccionar todo
                  </label>
                </div>
              </div>
            </div>

            {/* Lista de comandas */}
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {comandasSeleccionadas.map((comanda) => (
                <div
                  key={comanda.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={comanda.seleccionada}
                    onCheckedChange={(checked) =>
                      handleSeleccionarComanda(comanda.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#4a3540]">
                        {comanda.numero}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {comanda.fecha}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{comanda.cliente}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de exportación */}
            {comandasSeleccionadas.filter((c) => c.seleccionada).length > 0 && (
              <div className="mt-6 space-y-3">
                <Separator />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#8b5a6b]" />
                  <span className="text-sm font-medium text-[#4a3540]">
                    Exportar comandas seleccionadas:
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={exportarCSV}
                    disabled={exportando}
                    variant="outline"
                    className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {exportando ? 'Exportando...' : 'CSV'}
                  </Button>
                  <Button
                    onClick={exportarExcel}
                    disabled={exportando}
                    variant="outline"
                    className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {exportando ? 'Exportando...' : 'Excel'}
                  </Button>
                  <Button
                    onClick={exportarPDF}
                    disabled={exportando}
                    variant="outline"
                    className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {exportando ? 'Exportando...' : 'PDF'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
