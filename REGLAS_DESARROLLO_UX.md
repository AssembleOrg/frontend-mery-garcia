# 🚀 **REGLAS DE DESARROLLO UX - Mery García**

## 📋 **Reglas para Prevenir Errores de Keys y Hidratación**

### **🔑 1. GESTIÓN DE KEYS EN REACT**

#### **❌ NUNCA:**

<!-- DUPLICACIÓN :
Inicializaciones Múltiples: El store se inicializaba varias veces
Race Conditions: Múltiples componentes inicializando al mismo tiempo
IDs Predecibles: cmd-ingreso-001 era fácil de duplicar
Hydratación: Diferencias servidor-cliente en Next.js -->

```tsx
// MAL: Keys simples y predecibles
items.map((item, index) => <div key={index}>...</div>);
items.map((item) => <div key='cmd-ingreso-001'>...</div>);

// MAL: Keys basados en Date.now() o Math.random()
items.map((item) => <div key={Date.now()}>...</div>);
```

#### **✅ SIEMPRE:**

```tsx
// BIEN: Keys únicos y estables
const generateUniqueId = (prefix: string, index: number) => {
  const baseTimestamp = new Date('2025-01-01T00:00:00Z').getTime();
  return `${prefix}-${(baseTimestamp + index * 1000).toString(36)}`;
};

// BIEN: Keys combinando múltiples campos únicos
const serviceKey = `${transaction.id}-service-${index}-${
  servicio.productoServicioId
}-${servicio.nombre?.replace(/\s+/g, '-')}-${servicio.cantidad}-${
  servicio.precio
}`;

// BIEN: Keys con timestamp fijo para consistencia servidor-cliente
items.map((item) => <div key={item.uniqueStableId}>...</div>);
```

### **🔄 2. PREVENCIÓN DE HIDRATACIÓN (Next.js)**

#### **❌ PROBLEMAS COMUNES:**

- Diferencias entre servidor y cliente
- Inicialización múltiple de stores
- Race conditions en useEffect
- Estado persistente inconsistente

#### **✅ SOLUCIONES:**

```tsx
// BIEN: Verificar montaje del componente
const mountedRef = useRef(false);

useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
  };
}, []);

// BIEN: Prevenir race conditions con timestamp
let initializationState = {
  isInitialized: false,
  isInitializing: false,
  timestamp: 0,
};

useEffect(() => {
  if (!mountedRef.current) return;

  if (initializationState.isInitializing) return;

  initializationState.isInitializing = true;
  initializationState.timestamp = Date.now();

  const currentTimestamp = initializationState.timestamp;

  // Verificar si sigue siendo la misma inicialización
  if (currentTimestamp !== initializationState.timestamp) {
    initializationState.isInitializing = false;
    return;
  }

  // ... lógica de inicialización

  initializationState.isInitializing = false;
}, [dependencies]);
```

### **🗂️ 3. GESTIÓN DE STORES (Zustand)**

#### **✅ REGLAS OBLIGATORIAS:**

```tsx
// BIEN: Función de limpieza de duplicados
limpiarDuplicados: () => {
  const { items } = get();

  if (items.length === 0) return;

  const itemsMap = new Map<string, Item>();
  const duplicados: string[] = [];

  items.forEach((item) => {
    if (itemsMap.has(item.id)) {
      duplicados.push(item.id);
    } else {
      itemsMap.set(item.id, item);
    }
  });

  if (duplicados.length > 0) {
    const itemsUnicos = Array.from(itemsMap.values());
    set({ items: itemsUnicos });
  }
},

// BIEN: Verificar existencia antes de agregar
agregarItem: (item: Item) => {
  const existingIds = get().items.map(i => i.id);
  if (!existingIds.includes(item.id)) {
    set(state => ({ items: [...state.items, item] }));
  }
},
```

### **🎯 4. MODALES Y UX**

#### **✅ REGLAS OBLIGATORIAS:**

```tsx
// BIEN: Bloqueo de scroll del body
useEffect(() => {
  if (isOpen) {
    const scrollY = window.scrollY;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }
}, [isOpen]);

// BIEN: Z-index jerárquico
// Overlay: z-[9999]
// Modal: z-[10000]
// Dropdowns: z-[10001]
// Nested modals: z-[10002]

// BIEN: Prevención de eventos
const handleOverlayClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};

<div onClick={(e) => e.stopPropagation()}>{/* Contenido del modal */}</div>;
```

### **🔍 5. DEBUGGING Y LOGGING**

#### **✅ SISTEMA DE LOGS:**

```tsx
// BIEN: Logs estructurados para debugging
logger.info('🚀 Inicializando componente...');
logger.warning('⚠️ Duplicado encontrado:', itemId);
logger.error('❌ Error en operación:', error);
logger.debug('🔍 Estado actual:', state);

// BIEN: Logs con contexto
logger.info(`✅ ${comandasAgregadas} comandas agregadas exitosamente`);
logger.info(`📋 IDs procesados: [${ids.join(', ')}]`);
```

### **⚡ 6. PERFORMANCE Y MEMORY LEAKS**

#### **✅ REGLAS:**

```tsx
// BIEN: Cleanup de event listeners
useEffect(() => {
  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };

  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [onClose]);

// BIEN: Cleanup de timeouts
useEffect(() => {
  const timeoutId = setTimeout(() => {
    // lógica
  }, 100);

  return () => clearTimeout(timeoutId);
}, []);

// BIEN: Verificar montaje antes de setState
useEffect(() => {
  let mounted = true;

  fetchData().then((data) => {
    if (mounted) {
      setData(data);
    }
  });

  return () => {
    mounted = false;
  };
}, []);
```

### **🚨 7. CHECKLIST PRE-COMMIT**

#### **✅ VERIFICACIONES OBLIGATORIAS:**

- [ ] **TypeScript**: `npx tsc --noEmit --skipLibCheck`
- [ ] **Build**: `npm run build`
- [ ] **Keys únicos**: Verificar que todos los elementos iterados tengan keys estables
- [ ] **Hidratación**: Verificar consistencia servidor-cliente
- [ ] **Memory leaks**: Cleanup de listeners y timeouts
- [ ] **Modal UX**: Bloqueo de scroll y z-index correcto
- [ ] **Store duplicados**: Limpiar duplicados antes de agregar datos
- [ ] **Logs**: Remover console.log de producción

### **📚 8. PATRONES ESPECÍFICOS DEL PROYECTO**

#### **✅ COMANDAS/TRANSACCIONES:**

```tsx
// BIEN: IDs únicos para comandas
const COMANDA_IDS = {
  INGRESO_001: generateUniqueId('cmd-ing', 1),
  EGRESO_001: generateUniqueId('cmd-egr', 1),
};

// BIEN: Verificación de existencia
const existingIds = store.comandas.map((c) => c.id);
const hasAllSamples = sampleIds.every((id) => existingIds.includes(id));

// BIEN: Keys para servicios
const serviceKey = `${transaction.id}-service-${index}-${
  servicio.productoServicioId
}-${servicio.nombre?.replace(/\s+/g, '-')}-${servicio.cantidad}-${
  servicio.precio
}`;
```

### **🎯 9. TESTING DE UX**

#### **✅ TESTS MANUALES:**

1. **Abrir/cerrar modales múltiples veces**: Verificar que no se acumulen event listeners
2. **Navegación rápida**: Verificar que no se produzcan race conditions
3. **Recarga de página**: Verificar que la hidratación sea consistente
4. **Scroll con modal abierto**: Verificar que esté bloqueado
5. **Dropdowns en modales**: Verificar que no muevan el modal
6. **Console errors**: Verificar que no haya errores de keys duplicados

### **🔧 10. HERRAMIENTAS DE DESARROLLO**

#### **✅ CONFIGURACIÓN:**

```json
// package.json scripts
{
  "scripts": {
    "type-check": "npx tsc --noEmit --skipLibCheck",
    "build-check": "npm run build",
    "dev-safe": "npm run type-check && npm run dev"
  }
}
```

#### **✅ EXTENSIONES VS CODE:**

- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**

---

## 🎯 **REGLA DE ORO**

> **"Si algo puede duplicarse, implementar prevención. Si algo puede fallar en hidratación, usar keys estables. Si algo puede causar memory leaks, implementar cleanup."**

### **📞 EN CASO DE ERRORES:**

1. **Keys duplicados**: Verificar función `generateUniqueId` y `limpiarDuplicados`
2. **Hidratación**: Verificar `mountedRef` y timestamps de inicialización
3. **Modal UX**: Verificar z-index y bloqueo de scroll
4. **Memory leaks**: Verificar cleanup en useEffect

---

**Última actualización**: Enero 2025  
**Responsable**: Equipo de Desarrollo Mery García
