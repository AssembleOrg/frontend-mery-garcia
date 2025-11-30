import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f9bbc4',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    color: '#6b4c57',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#8b5a6b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#6b4c57',
    marginTop: 15,
    marginBottom: 8,
    fontWeight: 'bold',
    backgroundColor: '#fff0f3',
    padding: 6,
    borderRadius: 4,
  },
  // --- TARJETAS DE RESUMEN ---
  summaryContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  card: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f9bbc4',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 9,
    color: '#e91e63',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 16,
    color: '#6b4c57',
    fontWeight: 'bold',
  },
  // --- tablas, solapamiento corregido ---
  table: {
    width: '100%', 
    borderWidth: 1,
    borderColor: '#f9bbc4',
    borderRadius: 5,
    marginTop: 5,
  },
  tableRow: {
    flexDirection: 'row', 
    borderBottomWidth: 1,
    borderBottomColor: '#ffeef2',
    minHeight: 24,
    alignItems: 'center',
    width: '100%', 
  },
  tableHeader: {
    backgroundColor: '#fff0f3',
    borderBottomWidth: 1,
    borderBottomColor: '#f9bbc4',
  },
  tableCell: {
    fontSize: 8,
    color: '#4a3540',
    paddingVertical: 4,
    paddingHorizontal: 4, 
  },
  
  colDate: { width: '18%' },
  colDay: { width: '15%' },
  colEntry: { width: '15%', textAlign: 'center' },
  colExit: { width: '15%', textAlign: 'center' },
  colHours: { width: '15%', textAlign: 'right', paddingRight: 8 },
  colStatus: { width: '22%', textAlign: 'center' },

  statusPresente: { color: '#16a34a' },
  statusAusente: { color: '#dc2626' },
  statusNoLab: { color: '#9ca3af' },
});

interface PdfProps {
  employeeName: string;
  startDate: string;
  endDate: string;
  totalHours: string;
  weeklyAvg: string;
  weeklyStats: any[];
  days: any[];
}

export const AttendanceDocument = ({ 
  employeeName, 
  startDate, 
  endDate, 
  totalHours, 
  weeklyAvg, 
  weeklyStats, 
  days 
}: PdfProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reporte de Asistencia</Text>
          <Text style={styles.subtitle}>Generado el {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: '#6b4c57', fontWeight: 'bold' }}>{employeeName}</Text>
          <Text style={styles.subtitle}>{startDate} - {endDate}</Text>
        </View>
      </View>

      {/* resumen tarjetas */}
      <View style={styles.summaryContainer}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Periodo</Text>
          <Text style={styles.cardValue}>{totalHours} hs</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Promedio Semanal</Text>
          <Text style={styles.cardValue}>{weeklyAvg} hs</Text>
        </View>
      </View>

      {/* desglose semanal */}
      <Text style={styles.sectionTitle}>Desglose Semanal</Text>
      <View style={styles.table}>
        {weeklyStats.map((week, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, paddingLeft: 8 }]}>
              {format(new Date(week.start), 'dd MMM', { locale: es })} - {format(new Date(week.end), 'dd MMM', { locale: es })}
            </Text>
            <Text style={[styles.tableCell, { width: '30%', textAlign: 'right', paddingRight: 8, fontWeight: 'bold' }]}>
              {week.total.toFixed(2)} hs
            </Text>
          </View>
        ))}
      </View>

      {/* detalle diario*/}
      <Text style={styles.sectionTitle}>Detalle Diario</Text>
      <View style={styles.table}>
        {/* Encabezado */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.colDate, { fontWeight: 'bold' }]}>Fecha</Text>
          <Text style={[styles.tableCell, styles.colDay, { fontWeight: 'bold' }]}>Día</Text>
          <Text style={[styles.tableCell, styles.colEntry, { fontWeight: 'bold' }]}>Entrada</Text>
          <Text style={[styles.tableCell, styles.colExit, { fontWeight: 'bold' }]}>Salida</Text>
          <Text style={[styles.tableCell, styles.colHours, { fontWeight: 'bold' }]}>Horas</Text>
          <Text style={[styles.tableCell, styles.colStatus, { fontWeight: 'bold' }]}>Estado</Text>
        </View>

        {/* Filas */}
        {days.map((day, idx) => (
          <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fffbfc' }]}>
            <Text style={[styles.tableCell, styles.colDate]}>
              {format(new Date(day.dateObj), 'dd/MM/yyyy')}
            </Text>
            <Text style={[styles.tableCell, styles.colDay, { textTransform: 'capitalize', color: '#888' }]}>
              {format(new Date(day.dateObj), 'EEEE', { locale: es })}
            </Text>
            
            <Text style={[styles.tableCell, styles.colEntry]}>
              {day.status === 'presente' ? day.entry : '-'}
            </Text>
            
           <Text style={[styles.tableCell, styles.colExit]}>{day.status === 'presente' ? (day.missingPunch === 'exit' ? (
            <Text style={{ color: 'red', fontWeight: 'bold' }}>No marca</Text>) : (day.exit)) : ('-')}
        </Text>
            
            <Text style={[styles.tableCell, styles.colHours]}>
              {day.hours ? day.hours.toFixed(2) : '0.00'}
            </Text>

            <View style={[styles.tableCell, styles.colStatus]}>
              {day.status === 'presente' && <Text style={styles.statusPresente}>Presente</Text>}
              {day.status === 'ausente' && <Text style={styles.statusAusente}>Ausente</Text>}
              {day.status === 'no_laborable' && <Text style={styles.statusNoLab}>No Lab.</Text>}
            </View>
          </View>
        ))}
      </View>

      {/* footer |pie de pagina */}
      <Text style={{ position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#aaa', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
        Documento generado automáticamente por el Sistema de Gestión 
      </Text>
    </Page>
  </Document>
);