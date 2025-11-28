'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Eye, CalendarDays } from 'lucide-react'; 
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; 
import { toast } from 'sonner';
import { attendanceService, AttendanceRecord } from '@/services/attendance.service';
import { DateRangePicker } from '@/components/ui/date-range-picker';

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
      
      if (data.length === 0) {
        toast.info("No se encontraron registros en esas fechas");
      } else {
        toast.success("Reporte actualizado correctamente");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conectar con el servidor de Asistencia");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = reportData.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // funcion para sumar el total de horas
  const calculateTotalHours = (details: any[]) => {
    const total = details.reduce((sum, day) => sum + (day.hours || 0), 0);
    return total.toFixed(2); // redondeo a 2 decimales
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TARJETA DE FILTROS */}
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

      {/* TABLA RESUMEN POR EMPLEADO */}
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
                    <TableHead className="font-bold text-[#6b4c57] text-center">Días Trabajados</TableHead>
                    <TableHead className="font-bold text-[#6b4c57] text-center">Horas Totales</TableHead>
                    <TableHead className="font-bold text-[#6b4c57] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((emp) => {
                    const totalHoras = calculateTotalHours(emp.details);
                    const diasTrabajados = emp.details.length;

                    return (
                      <TableRow key={emp.id} className="hover:bg-[#f9bbc4]/5 transition-colors">
                        <TableCell className="font-medium text-gray-700">
                          {emp.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {diasTrabajados} días
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-base font-bold text-[#e91e63]">
                            {totalHoras} hs
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          
                          {/* MODAL DE DETALLES */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2 border-[#f9bbc4] text-[#6b4c57] hover:bg-[#f9bbc4]/20">
                                <Eye className="h-4 w-4" />
                                Detalles
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl text-[#6b4c57]">
                                  <CalendarDays className="h-5 w-5" />
                                  Fichajes de {emp.name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              {/* TABLA DETALLADA  */}
                              <div className="mt-4 rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-50">
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Entrada</TableHead>
                                      <TableHead>Salida</TableHead>
                                      <TableHead className="text-right">Horas</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {emp.details.map((dia, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{dia.date}</TableCell>
                                        <TableCell>{dia.entry}</TableCell>
                                        <TableCell>{dia.exit}</TableCell>
                                        <TableCell className="text-right">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            dia.hours >= 8 
                                              ? 'bg-green-100 text-green-700' 
                                              : 'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {dia.hours} hs
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No se encontraron empleados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}