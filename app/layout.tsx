import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import AppInitializer from '@/components/AppInitializer';
import ChatWhatsapp from '@/components/whatsapp/ChatWhatsapp';
import AvisosPersonales from '@/components/common/AvisosPersonales';

const avantMedium = localFont({
  src: '../public/font/avant-medium.woff2',
  variable: '--font-avant-medium',
  weight: '500',
});

export const metadata: Metadata = {
  title: 'Mery García - Portal de Gestión',
  description: 'Sistema de gestión para Mery García',
  // Agregada a la pantalla de inicio del iPhone se abre como app (y recibe push).
  appleWebApp: { capable: true, title: 'Mery García', statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f9bbc4',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${avantMedium.variable} font-sans antialiased`}>
        <AuthProvider>
          <AppInitializer />
          {children}
          {/* Botón flotante + bandeja de WhatsApp. Sólo se ve con rol admin o encargada. */}
          <ChatWhatsapp />
          {/* Avisos en vivo del empleado (pedidos aprobados / rechazados). */}
          <AvisosPersonales />
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
