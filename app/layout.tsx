import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { TipoCambioProvider } from '@/components/providers/TipoCambioProvider';

// Usar la fuente existente
const avantMedium = localFont({
  src: '../public/font/avant-medium.woff2',
  variable: '--font-avant-medium',
  weight: '500',
});

export const metadata: Metadata = {
  title: 'Mery García - Portal de Gestión',
  description: 'Sistema de gestión para Mery García',
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
          <TipoCambioProvider>{children}</TipoCambioProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
