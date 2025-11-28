'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { attendanceService, AttendanceRecord } from '@/services/attendance.service';

import { DateRangePicker } from '@/components/ui/date-range-picker';

export default function AsistenciaTab() {
  // estado inicial:ultimos 7 días
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    // Validar que el rango este completo
    if (!date?.from || !date?.to) {
      toast.error("Por favor selecciona un rango de fechas completo");
      return;
    }

    setLoading(true);
    try {
      // formateo de fechas a 'yyyy-MM-dd'
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-[#f9bbc4]/30 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#6b4c57]">Consultar Fichajes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          
          {/* 2. uso del "DateRangePicker" */}
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

      {/* tabla de resultados */}
      {reportData.length > 0 && (
        <Card className="border-[#f9bbc4]/30 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <div className="relative max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Filtrar empleado por nombre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-white"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f9bbc4]/10">
                    <TableHead className="font-bold text-[#6b4c57]">Empleado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Horas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((emp) => (
                    emp.details.map((dia, idx) => (
                      <TableRow key={`${emp.id}-${idx}`} className="hover:bg-[#f9bbc4]/5">
                        <TableCell className="font-medium text-[#6b4c57]">
                          {idx === 0 ? emp.name : ''}
                        </TableCell>
                        <TableCell>{dia.date}</TableCell>
                        <TableCell>{dia.entry}</TableCell>
                        <TableCell>{dia.exit}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            dia.hours >= 8 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}>
                            {dia.hours} hs
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}