import type { MetadataRoute } from 'next';

/**
 * Para poder agregar la web a la pantalla de inicio. En iPhone es la única
 * forma de recibir notificaciones push (iOS 16.4 o más nuevo).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mery García - Portal de Gestión',
    short_name: 'Mery García',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf6f7',
    theme_color: '#f9bbc4',
    lang: 'es',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
