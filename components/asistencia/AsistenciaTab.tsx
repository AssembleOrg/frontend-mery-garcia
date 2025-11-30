'use client';

import { useState } from 'react';
import { 
  format, 
  eachDayOfInterval, 
  isMonday, 
  isSunday, 
  startOfWeek, 
  endOfWeek 
} from 'date-fns';
import { es } from 'date-fns/locale'; 
import { Search, Eye, CalendarDays, AlertCircle } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { attendanceService, AttendanceRecord, AttendanceDetail } from '@/services/attendance.service';
import { DateRangePicker } from '@/components/ui/date-range-picker';

import { PDFDownloadLink } from '@react-pdf/renderer'; 
import { AttendanceDocument } from './AttendancePdf';  
import { FileDown } from 'lucide-react'; //icono de descarga

interface ExtendedDetail extends Partial<AttendanceDetail> {
  dateObj: Date;
  status: 'presente' | 'ausente' | 'no_laborable';
  missingPunch?: 'entry' | 'exit' | 'none'; 
}

export default function AsistenciaTab() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!date?.from || !date?.to) {
      toast.error("Por favor selecciona un rango de fechas completo");
      return;
    }
    setLoading(true);
    try {
      const startStr = format(date.from, 'yyyy-MM-dd');
      const endStr = format(date.to, 'yyyy-MM-dd');
      const data = await attendanceService.getReport(startStr, endStr);
      setReportData(data);
      if (data.length === 0) toast.info("No se encontraron registros");
      else toast.success("Reporte actualizado");
    } catch (error) {
      console.error(error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = reportData.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const processEmployeeDays = (details: AttendanceDetail[]): ExtendedDetail[] => {
    if (!date?.from || !date?.to) return [];
    const allDays = eachDayOfInterval({ start: date.from, end: date.to });

    return allDays.map((day) => {
      const dayStr = format(day, 'dd/MM/yyyy'); 
      const record = details.find((d) => d.date === dayStr);

      if (record) {
        let missing: 'entry' | 'exit' | 'none' = 'none';
        if (record.entry === record.exit && record.hours === 0) {
            missing = 'exit'; 
        }
        return { ...record, dateObj: day, status: 'presente', missingPunch: missing };
      }

      if (isMonday(day) || isSunday(day)) {
        return { dateObj: day, status: 'no_laborable' };
      }
      return { dateObj: day, status: 'ausente' };
    });
  };

  const calculateWeeklyBreakdown = (days: ExtendedDetail[]) => {
    if (!date?.from || !date?.to) return [];

    const weeksMap = new Map<string, { start: Date; end: Date; total: number }>();

    days.forEach((day) => {
        const standardMonday = startOfWeek(day.dateObj, { weekStartsOn: 1 });
        const standardSunday = endOfWeek(day.dateObj, { weekStartsOn: 1 });
        
        const weekKey = format(standardMonday, 'yyyy-MM-dd'); 

        if (!weeksMap.has(weekKey)) {
            let visualStart = standardMonday;
            let visualEnd = standardSunday;

            if (visualStart < date.from!) visualStart = date.from!;
            if (visualEnd > date.to!) visualEnd = date.to!;

            weeksMap.set(weekKey, {
                start: visualStart,
                end: visualEnd,
                total: 0
            });
        }

        const currentWeek = weeksMap.get(weekKey)!;
        currentWeek.total += (day.hours || 0);
    });

    return Array.from(weeksMap.values())
        .sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* filtros */}
      <Card className="border-[#f9bbc4]/30 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#6b4c57]">Consultar Asistencia</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="grid w-full gap-1.5">
            <label className="text-sm font-medium text-gray-600">Rango de Fechas</label>
            <DateRangePicker 
              dateRange={date} 
              onDateRangeChange={setDate}
              placeholder="Seleccionar periodo"
              accentColor="#f9bbc4"
              className="w-full"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={loading} 
            className="w-full md:w-auto bg-[#f9bbc4] hover:bg-[#e292a3] text-[#6b4c57] font-bold"
          >
            {loading ? 'Cargando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {/* tabla principal */}
      {reportData.length > 0 && (
        <Card className="border-[#f9bbc4]/30 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
               <h3 className="text-lg font-semibold text-[#6b4c57]">Resumen General</h3>
               <div className="relative w-full max-w-xs">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                    placeholder="Buscar empleado..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-white"
                />
               </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f9bbc4]/10">
                    <TableHead className="font-bold text-[#6b4c57]">Empleado</TableHead>
                    <TableHead className="font-bold text-[#6b4c57] text-center">Horas Totales</TableHead>
                    <TableHead className="font-bold text-[#6b4c57] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((emp) => {
                    const fullDays = processEmployeeDays(emp.details);
                    const totalPeriodo = fullDays.reduce((acc, curr) => acc + (curr.hours || 0), 0);
                    const weeklyStats = calculateWeeklyBreakdown(fullDays);

                    const weeklyAvg = (totalPeriodo / (weeklyStats.length || 1)).toFixed(2);

                    return (
                      <TableRow key={emp.id} className="hover:bg-[#f9bbc4]/5 transition-colors">
                        <TableCell className="font-medium text-gray-700">{emp.name}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-base font-bold text-[#e91e63]">
                            {totalPeriodo.toFixed(2)} hs
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          
                          {/* detalles del modal */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2 border-[#f9bbc4] text-[#6b4c57] hover:bg-[#f9bbc4]/20">
                                <Eye className="h-4 w-4" />
                                Detalles
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="!max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
                              
                              {/* header */}
                              <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
                                <DialogTitle className="flex items-center gap-2 text-xl text-[#6b4c57]">
                                  <CalendarDays className="h-5 w-5" />
                                  Fichajes de {emp.name}
                                </DialogTitle>

                                {/* boton para pdf */}
                                <PDFDownloadLink
                                  document={
                                    <AttendanceDocument 
                                      employeeName={emp.name}
                                      startDate={format(date?.from || new Date(), 'dd/MM/yyyy')}
                                      endDate={format(date?.to || new Date(), 'dd/MM/yyyy')}
                                      totalHours={totalPeriodo.toFixed(2)}
                                      weeklyAvg={weeklyAvg}
                                      weeklyStats={weeklyStats}
                                      days={fullDays}
                                    />
                                  }
                                  fileName={`Asistencia_${emp.name.replace(/\s+/g, '_')}.pdf`}
                                >
                                  {({ loading }) => (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="gap-2 border-[#e91e63] text-[#e91e63] hover:bg-[#e91e63] hover:text-white transition-all mr-8"
                                      disabled={loading}
                                    >
                                      <FileDown className="h-4 w-4" />
                                      {loading ? 'Generando...' : 'Descargar PDF'}
                                    </Button>
                                  )}
                                </PDFDownloadLink>
                              </DialogHeader>
                              {/* fin de header */}


                              <div className="flex flex-col lg:flex-row gap-6 mt-4">
                                <div className="lg:w-72 space-y-4 flex-shrink-0">
                                    {/* tarjeta del Total */}
                                    <div className="p-4 rounded-lg bg-pink-50 border border-pink-100 flex flex-col items-center">
                                        <span className="text-sm text-pink-600 font-medium">Horas totales del periodo</span>
                                        <span className="text-3xl font-bold text-pink-800">{totalPeriodo.toFixed(2)} hs</span>
                                    </div>

                                    {/* lista de Semanas */}
                                    <div className="rounded-md border bg-white p-4">
                                        <h4 className="font-semibold text-gray-700 mb-3 text-sm">Resumen Semanal</h4>
                                        <div className="space-y-2">
                                            {weeklyStats.map((week, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                                    <span className="text-gray-500 text-xs">
                                                        {format(week.start, 'dd MMM', { locale: es })} - {format(week.end, 'dd MMM', { locale: es })}
                                                    </span>
                                                    <span className="font-bold text-gray-800 text-xs">
                                                        {week.total.toFixed(2)} hs
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    <h4 className="font-semibold text-gray-700 mb-3 text-sm">Detalle Diario</h4>
                                    
                                    <div className="rounded-md border max-h-[60vh] overflow-y-auto relative shadow-sm">
                                        <Table>
                                          <TableHeader className="sticky top-0 bg-gray-100 z-10">
                                            <TableRow>
                                              <TableHead className="font-bold text-gray-700 w-[120px]">Fecha</TableHead>
                                              <TableHead className="font-bold text-gray-700">Día</TableHead>
                                              <TableHead className="font-bold text-gray-700">Entrada</TableHead>
                                              <TableHead className="font-bold text-gray-700">Salida</TableHead>
                                              <TableHead className="text-right font-bold text-gray-700">Horas</TableHead>
                                              <TableHead className="text-center font-bold text-gray-700">Estado</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          
                                          <TableBody>
                                            {fullDays.map((dia, idx) => (
                                              <TableRow key={idx} className={dia.status === 'ausente' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}>
                                                <TableCell className="font-medium whitespace-nowrap">{format(dia.dateObj, 'dd/MM/yyyy')}</TableCell>
                                                <TableCell className="capitalize text-gray-500">
                                                    {format(dia.dateObj, 'EEEE', { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    {dia.status === 'presente' ? dia.entry : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {dia.status === 'presente' ? (
                                                        dia.missingPunch === 'exit' ? (
                                                            <span className="text-red-500 font-bold flex items-center gap-1 text-xs">
                                                                <AlertCircle className="h-3 w-3" /> No marca
                                                            </span>
                                                        ) : dia.exit
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-gray-600">
                                                    {dia.hours ? dia.hours.toFixed(2) : '0.00'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {dia.status === 'presente' && <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 shadow-none">Presente</Badge>}
                                                    {dia.status === 'ausente' && <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 shadow-none">Ausente</Badge>}
                                                    {dia.status === 'no_laborable' && <Badge variant="outline" className="text-gray-400 border-gray-200 bg-gray-50 shadow-none">No Lab.</Badge>}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                    </div>
                                </div>

                              </div>
                            </DialogContent>
                          </Dialog>

                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}