'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, Lock } from 'lucide-react';
import ModalTransaccionUnificadoRefactored from './ModalTransaccionUnificadoRefactored';
import ItemPaymentForm from './ItemPaymentForm';
import TransactionSummary from './TransactionSummary';
import { ItemComandaCreateNew, ProductoServicioNew, TipoPagoNew, TipoProductoServicioNew, MetodoPagoNew, MonedaNew } from '@/services/unidadNegocio.service';

/**
 * PaymentSystemExample Component
 * 
 * This component demonstrates how to use the new payment system components.
 * It shows examples of different scenarios including frozen pricing, dynamic pricing,
 * and mixed currency transactions.
 * 
 * Usage:
 * - Demonstrates the new payment method system
 * - Shows how to integrate components
 * - Provides examples of different use cases
 */
interface PaymentSystemExampleProps {
  className?: string;
}

// Extended interface to include metodosPago for the new payment system
interface ItemWithPaymentMethods extends ItemComandaCreateNew {
  metodosPago?: Partial<MetodoPagoNew>[];
}

export default function PaymentSystemExample({
  className = '',
}: PaymentSystemExampleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exampleItems, setExampleItems] = useState<ItemComandaCreateNew[]>([
    // Example 1: Frozen price item (ARS only)
    {
      id: 'item-1',
      productoServicioId: 'prod-1',
      nombre: 'Tatuaje Personalizado',
      precio: 50000, // ARS
      cantidad: 1,
      descuento: 0,
      subtotal: 50000,
      productoServicio: {
        id: 'prod-1',
        nombre: 'Tatuaje Personalizado',
        precio: 50000,
        esPrecioCongelado: true,
        precioFijoARS: 50000,
        tipo: TipoProductoServicioNew.SERVICIO,
        unidadNegocio: { id: 'unidad-1', nombre: 'Tattoo' } as any,
        descripcion: 'Tatuaje personalizado con precio fijo en ARS',
        duracion: 120,
        codigoBarras: '',
        activo: true,
        createdAt: '',
        updatedAt: '',
        deletedAt: '',
        comandas: [],
      },
      metodosPago: [{
        tipo: TipoPagoNew.EFECTIVO,
        moneda: MonedaNew.ARS,
        monto: 50000,
        montoFinal: 50000,
        recargoPorcentaje: 0,
        descuentoGlobalPorcentaje: 0,
      }],
    } as any,
    // Example 2: Dynamic price item (USD/ARS)
    {
      id: 'item-2',
      productoServicioId: 'prod-2',
      nombre: 'Corte de Cabello',
      precio: 50, // USD
      cantidad: 1,
      descuento: 0,
      subtotal: 50,
      productoServicio: {
        id: 'prod-2',
        nombre: 'Corte de Cabello',
        precio: 50,
        esPrecioCongelado: false,
        precioFijoARS: 0,
        tipo: TipoProductoServicioNew.SERVICIO,
        unidadNegocio: { id: 'unidad-2', nombre: 'Estilismo' } as any,
        descripcion: 'Corte de cabello con precio dinámico',
        duracion: 60,
        codigoBarras: '',
        activo: true,
        createdAt: '',
        updatedAt: '',
        deletedAt: '',
        comandas: [],
      },
      metodosPago: [{
        tipo: TipoPagoNew.TARJETA,
        moneda: MonedaNew.USD,
        monto: 50,
        montoFinal: 50,
        recargoPorcentaje: 0,
        descuentoGlobalPorcentaje: 0,
      }],
    } as any,
  ]);

  const handleUpdateItem = (itemId: string, updates: any) => {
    setExampleItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setExampleItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Helper function to get the first payment method from an item
  const getFirstPaymentMethod = (item: ItemComandaCreateNew): Partial<MetodoPagoNew> | null => {
    const itemWithPayment = item as ItemWithPaymentMethods;
    return itemWithPayment.metodosPago?.[0] || null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment System Example
        </h1>
        <p className="text-gray-600 mb-6">
          Demonstrating the new payment method system with individual item payment configuration
        </p>
      </div>

      {/* Example Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Example Items with Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exampleItems.map((item, index) => {
            const itemWithPayment = item as ItemWithPaymentMethods;
            const paymentMethod = getFirstPaymentMethod(item);
            const isFrozen = item.productoServicio?.esPrecioCongelado;

            return (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {isFrozen && <Lock className="h-3 w-3 mr-1" />}
                      Item #{index + 1}
                    </Badge>
                    <span className="font-medium">{item.nombre}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {isFrozen ? '🔒 ARS' : 'USD'} {item.subtotal}
                    </div>
                    <div className="text-sm text-gray-600">
                      {paymentMethod?.tipo} - {paymentMethod?.moneda}
                    </div>
                  </div>
                </div>

                <ItemPaymentForm
                  item={item}
                  index={index}
                  onUpdateItem={handleUpdateItem}
                  onRemoveItem={handleRemoveItem}
                  tipo="ingreso"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <TransactionSummary
        items={exampleItems}
        tipo="ingreso"
      />

      {/* Open Modal Button */}
      <div className="text-center">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white hover:from-[#e292a3] hover:to-[#d17a8a]"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Open Transaction Modal
        </Button>
      </div>

      {/* Modal */}
      <ModalTransaccionUnificadoRefactored
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tipo="ingreso"
      />

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features Demonstrated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Frozen Pricing (ARS Only)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Price locked in ARS</li>
                <li>• Only ARS payment allowed</li>
                <li>• No currency conversion</li>
                <li>• Lock icon indicator</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Dynamic Pricing (USD/ARS)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Price in USD by default</li>
                <li>• Can switch to ARS</li>
                <li>• Automatic conversion</li>
                <li>• Real-time exchange rates</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Payment Method Features</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Individual payment method per item</li>
              <li>• Multiple payment types (Efectivo, Tarjeta, etc.)</li>
              <li>• Currency restrictions based on pricing</li>
              <li>• Amount validation and conversion</li>
              <li>• Simplified summary display</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 