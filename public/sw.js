/* Service worker de Mery García: sólo notificaciones push (no cachea nada). */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { cuerpo: event.data ? event.data.text() : '' };
  }
  const titulo = datos.titulo || 'Mery García';
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || '',
      tag: datos.tag,
      renotify: Boolean(datos.tag),
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { enlace: datos.enlace || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const enlace = (event.notification.data && event.notification.data.enlace) || '/';
  const destino = new URL(enlace, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      // Si la web ya está abierta, se usa esa pestaña.
      for (const v of ventanas) {
        if (v.url.startsWith(self.location.origin) && 'focus' in v) {
          return v.focus().then((w) => (w && 'navigate' in w ? w.navigate(destino) : w));
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
