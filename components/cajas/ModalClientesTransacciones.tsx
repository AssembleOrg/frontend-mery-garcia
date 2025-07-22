'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Users, Receipt } from 'lucide-react';
import ClientesTab from '@/components/clientes/ClientesTab';
import TransactionsTable from '@/components/cajas/TransactionsTableTanStack';
import { useTransactions } from '@/hooks/useTransactions';

interface ModalClientesTransaccionesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalClientesTransacciones({
  isOpen,
  onClose,
}: ModalClientesTransaccionesProps) {
  const [activeTab, setActiveTab] = useState('clientes');

  // Hook para transacciones
  const { data: transactions, statistics } = useTransactions({
    type: 'ingreso',
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[#4a3540]">
            <Users className="h-6 w-6 text-[#f9bbc4]" />
            Gestión de Clientes y Transacciones
          </DialogTitle>
          <button
            onClick={onClose}
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger
              value="clientes"
              className="flex items-center gap-2 data-[state=active]:bg-[#f9bbc4] data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              👥 Clientes
            </TabsTrigger>
            <TabsTrigger
              value="transacciones"
              className="flex items-center gap-2 data-[state=active]:bg-[#f9bbc4] data-[state=active]:text-white"
            >
              <Receipt className="h-4 w-4" />
              💰 Transacciones
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
            <TabsContent value="clientes" className="mt-0">
              <div className="rounded-lg bg-gradient-to-br from-[#f9bbc4]/5 via-white to-[#e8b4c6]/5 p-4">
                <ClientesTab />
              </div>
            </TabsContent>

            <TabsContent value="transacciones" className="mt-0">
              <div className="rounded-lg bg-gradient-to-br from-[#f9bbc4]/5 via-white to-[#e8b4c6]/5 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#4a3540]">
                      Historial de Transacciones
                    </h3>
                    <div className="text-sm text-[#6b4c57]">
                      {statistics?.transactionCount || 0} transacciones
                      encontradas
                    </div>
                  </div>

                  <TransactionsTable
                    data={transactions || []}
                    onEdit={(id) => {
                      // TODO: Implementar edición de transacción
                      console.log('Edit transaction:', id);
                    }}
                    onDelete={(id) => {
                      // TODO: Implementar eliminación de transacción
                      console.log('Delete transaction:', id);
                    }}
                    onChangeStatus={(id) => {
                      // TODO: Implementar cambio de estado
                      console.log('Change status:', id);
                    }}
                    onView={(id) => {
                      // TODO: Implementar vista de detalles
                      console.log('View transaction:', id);
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
