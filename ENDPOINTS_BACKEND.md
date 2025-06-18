# ENDPOINTS BACKEND - SISTEMA MERY GARCÍA

## 1. ESTRUCTURA DE DATOS PRINCIPAL

### Comanda (Transacción Principal)

```typescript
interface Comanda {
  id: string;
  numero: string; // manual, único global (usuario lo ingresa)
  fecha: Date;
  unidadNegocio: 'tattoo' | 'estilismo' | 'formacion';
  cliente: Cliente;
  personalPrincipal: Personal; // quien registra la comanda
  items: ItemComanda[];
  seña?: Seña;
  metodosPago: MetodoPago[];
  subtotal: number;
  totalDescuentos: number;
  totalRecargos: number;
  totalSeña: number;
  totalFinal: number;
  comisiones: Comision[];
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  observaciones?: string;
  tipo: 'ingreso' | 'egreso';
}

interface Cliente {
  cuit?: string;
  nombre: string;
  telefono?: string;
  email?: string;
  // Para manejo de señas guardadas
  señasGuardadas?: SeñaGuardada[];
}

interface Personal {
  id: string;
  nombre: string;
  comisionPorcentaje: number; // ej: 15 = 15% - EDITABLE POR ADMIN
  activo: boolean;
  unidadesDisponibles: UnidadNegocio[];
  telefono?: string;
  fechaIngreso: Date;
}

interface ItemComanda {
  productoServicioId: string;
  nombre: string;
  tipo: 'producto' | 'servicio';
  precio: number;
  cantidad: number;
  descuento: number;
  subtotal: number;
  personalId?: string; // quien realizó el servicio/vendió
}

interface Seña {
  monto: number;
  moneda: 'pesos' | 'dolares';
  fecha: Date;
  observaciones?: string;
}

interface SeñaGuardada {
  id: string;
  monto: number;
  moneda: 'pesos' | 'dolares';
  fechaCreacion: Date;
  fechaVencimiento?: Date;
  estado: 'activa' | 'utilizada' | 'vencida';
  observaciones?: string;
}

interface MetodoPago {
  tipo: 'efectivo' | 'tarjeta' | 'transferencia';
  monto: number;
  recargoPorcentaje: number; // ej: 35 = 35%
  montoFinal: number; // monto + recargo
}

interface Comision {
  personalId: string;
  personalNombre: string;
  itemComandaId: string;
  montoBase: number;
  porcentaje: number;
  montoComision: number;
}
```

---

## 2. ENDPOINTS PRINCIPALES

### A. COMANDAS (Transacciones)

#### `GET /api/comandas`

**Propósito**: Obtener comandas con filtros
**Query Parameters**:

```typescript
{
  fechaInicio?: string; // ISO date
  fechaFin?: string; // ISO date
  unidadNegocio?: 'tattoo' | 'estilismo' | 'formacion';
  estado?: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  personalId?: string;
  numeroComanda?: string;
  cliente?: string; // búsqueda por nombre
  tipo?: 'ingreso' | 'egreso';
  busqueda?: string; // búsqueda general
  page?: number;
  limit?: number;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: {
    comandas: Comanda[];
    total: number;
    page: number;
    totalPages: number;
  }
}
```

#### `POST /api/comandas`

**Propósito**: Crear nueva comanda
**Body**: `Comanda` (sin id, se genera en backend)
**Respuesta**:

```typescript
{
  success: true,
  data: Comanda, // con id generado
  message: "Comanda creada exitosamente"
}
```

#### `GET /api/comandas/:id`

**Propósito**: Obtener comanda específica
**Respuesta**:

```typescript
{
  success: true,
  data: Comanda
}
```

#### `PUT /api/comandas/:id`

**Propósito**: Actualizar comanda completa
**Body**: `Partial<Comanda>`
**Respuesta**:

```typescript
{
  success: true,
  data: Comanda, // actualizada
  message: "Comanda actualizada exitosamente"
}
```

#### `PATCH /api/comandas/:id/estado`

**Propósito**: Cambiar solo el estado de una comanda
**Body**:

```typescript
{
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: Comanda, // actualizada
  message: "Estado actualizado exitosamente"
}
```

#### `DELETE /api/comandas/:id`

**Propósito**: Eliminar comanda
**Respuesta**:

```typescript
{
  success: true,
  message: "Comanda eliminada exitosamente"
}
```

---

### B. PERSONAL (Para Admin)

#### `GET /api/personal`

**Propósito**: Obtener lista de personal
**Query Parameters**:

```typescript
{
  unidadNegocio?: string;
  activo?: boolean;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: Personal[]
}
```

#### `POST /api/personal`

**Propósito**: Crear nuevo personal (ADMIN ONLY)
**Body**: `Personal` (sin id)
**Respuesta**:

```typescript
{
  success: true,
  data: Personal, // con id generado
  message: "Personal creado exitosamente"
}
```

#### `PUT /api/personal/:id`

**Propósito**: Actualizar personal (ADMIN ONLY)
**Body**: `Partial<Personal>`
**Respuesta**:

```typescript
{
  success: true,
  data: Personal, // actualizado
  message: "Personal actualizado exitosamente"
}
```

#### `PATCH /api/personal/:id/comision`

**Propósito**: Actualizar solo el porcentaje de comisión (ADMIN ONLY)
**Body**:

```typescript
{
  comisionPorcentaje: number;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: Personal, // actualizado
  message: "Comisión actualizada exitosamente"
}
```

---

### C. PRODUCTOS Y SERVICIOS

#### `GET /api/productos-servicios`

**Propósito**: Obtener catálogo de productos y servicios
**Query Parameters**:

```typescript
{
  unidadNegocio?: 'tattoo' | 'estilismo' | 'formacion';
  tipo?: 'producto' | 'servicio';
  activo?: boolean;
  busqueda?: string;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: ProductoServicio[]
}
```

#### `POST /api/productos-servicios`

**Propósito**: Crear nuevo producto/servicio (ADMIN ONLY)
**Body**: `ProductoServicio` (sin id)
**Respuesta**:

```typescript
{
  success: true,
  data: ProductoServicio,
  message: "Producto/Servicio creado exitosamente"
}
```

#### `PUT /api/productos-servicios/:id`

**Propósito**: Actualizar producto/servicio (ADMIN ONLY)
**Body**: `Partial<ProductoServicio>`
**Respuesta**:

```typescript
{
  success: true,
  data: ProductoServicio,
  message: "Producto/Servicio actualizado exitosamente"
}
```

---

### D. CLIENTES Y SEÑAS

#### `GET /api/clientes`

**Propósito**: Obtener lista de clientes
**Query Parameters**:

```typescript
{
  busqueda?: string; // por nombre, teléfono, email
  conSeñas?: boolean; // solo clientes con señas activas
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: Cliente[]
}
```

#### `POST /api/clientes/:clienteId/señas`

**Propósito**: Guardar seña para un cliente
**Body**:

```typescript
{
  monto: number;
  moneda: 'pesos' | 'dolares';
  fechaVencimiento?: Date;
  observaciones?: string;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: SeñaGuardada,
  message: "Seña guardada exitosamente"
}
```

#### `GET /api/clientes/:clienteId/señas`

**Propósito**: Obtener señas de un cliente
**Query Parameters**:

```typescript
{
  estado?: 'activa' | 'utilizada' | 'vencida';
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: SeñaGuardada[]
}
```

#### `PATCH /api/señas/:señaId/utilizar`

**Propósito**: Marcar seña como utilizada
**Body**:

```typescript
{
  comandaId: string; // comanda donde se utilizó
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: SeñaGuardada,
  message: "Seña utilizada exitosamente"
}
```

---

### E. CONFIGURACIÓN

#### `GET /api/configuracion/recargos`

**Propósito**: Obtener configuración de recargos por método de pago
**Respuesta**:

```typescript
{
  success: true,
  data: ConfiguracionRecargo[]
}
```

#### `PUT /api/configuracion/recargos`

**Propósito**: Actualizar configuración de recargos (ADMIN ONLY)
**Body**: `ConfiguracionRecargo[]`
**Respuesta**:

```typescript
{
  success: true,
  data: ConfiguracionRecargo[],
  message: "Configuración actualizada exitosamente"
}
```

#### `GET /api/configuracion/tipo-cambio`

**Propósito**: Obtener tipo de cambio actual
**Respuesta**:

```typescript
{
  success: true,
  data: TipoCambio
}
```

#### `PUT /api/configuracion/tipo-cambio`

**Propósito**: Actualizar tipo de cambio (ADMIN ONLY)
**Body**:

```typescript
{
  valorCompra: number;
  valorVenta: number;
  fuente: string;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: TipoCambio,
  message: "Tipo de cambio actualizado exitosamente"
}
```

---

## 3. REPORTES Y ESTADÍSTICAS (CAJA 2 - ADMIN ONLY)

### A. Resumen General

#### `GET /api/reportes/resumen-caja`

**Propósito**: Obtener resumen de caja para dashboard
**Query Parameters**:

```typescript
{
  fechaInicio?: string;
  fechaFin?: string;
  unidadNegocio?: string;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: {
    totalIngresos: number;
    totalEgresos: number;
    saldo: number;
    cantidadComandas: number;
    comisionesTotales: number;
    unidadMasActiva?: string;
    personalMasVentas?: string;
    // Estadísticas adicionales
    ingresosPorMetodoPago: { [metodo: string]: number };
    ventasPorUnidad: { [unidad: string]: number };
    comisionesPorPersonal: { personalId: string; nombre: string; total: number }[];
  }
}
```

### B. Reportes Detallados

#### `GET /api/reportes/ventas-por-vendedor`

**Propósito**: Reporte de ventas filtrado por vendedor (ADMIN ONLY)
**Query Parameters**:

```typescript
{
  fechaInicio?: string;
  fechaFin?: string;
  personalId?: string;
  unidadNegocio?: string;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: {
    vendedor: Personal;
    totalVentas: number;
    cantidadComandas: number;
    comisionesTotales: number;
    ventasPorDia: { fecha: string; total: number }[];
    serviciosMasVendidos: { nombre: string; cantidad: number; total: number }[];
  }[]
}
```

#### `GET /api/reportes/productos-servicios`

**Propósito**: Reporte de productos/servicios más vendidos (ADMIN ONLY)
**Query Parameters**:

```typescript
{
  fechaInicio?: string;
  fechaFin?: string;
  unidadNegocio?: string;
  tipo?: 'producto' | 'servicio';
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: {
    productoServicioId: string;
    nombre: string;
    tipo: 'producto' | 'servicio';
    cantidadVendida: number;
    totalVentas: number;
    ventasPorMes: { mes: string; cantidad: number; total: number }[];
  }[]
}
```

#### `GET /api/reportes/comisiones`

**Propósito**: Reporte detallado de comisiones (ADMIN ONLY)
**Query Parameters**:

```typescript
{
  fechaInicio?: string;
  fechaFin?: string;
  personalId?: string;
}
```

**Respuesta**:

```typescript
{
  success: true,
  data: {
    personal: Personal;
    totalComisiones: number;
    cantidadServicios: number;
    comisionesPorDia: { fecha: string; total: number }[];
    detalleComisiones: Comision[];
  }[]
}
```

### C. Exportación

#### `GET /api/reportes/export`

**Propósito**: Exportar reportes en diferentes formatos (ADMIN ONLY)
**Query Parameters**:

```typescript
{
  tipo: 'comandas' | 'ventas-vendedor' | 'productos-servicios' | 'comisiones';
  formato: 'pdf' | 'excel' | 'csv';
  // + todos los filtros del reporte específico
}
```

**Respuesta**: Archivo binario

---

## 4. VALIDACIONES Y CÁLCULOS AUTOMÁTICOS

### Cálculos que debe hacer el Backend:

- **Subtotales** de items (cantidad × precio - descuento)
- **Total de descuentos** (suma de descuentos individuales)
- **Total de recargos** (según configuración de métodos de pago)
- **Comisiones** (según porcentaje del personal para cada item)
- **Total final** (subtotal - descuentos + recargos - seña)
- **Conversiones de moneda** (seña en dólares a pesos)

### Validaciones Importantes:

- **Número único**: Verificar que el número de comanda no exista
- **Métodos de pago**: Validar que la suma cubra el total a pagar
- **Personal activo**: Verificar que el personal esté activo
- **Productos/servicios**: Verificar que estén activos y disponibles
- **Seña válida**: Si se usa seña guardada, verificar que esté activa

---

## 5. ESTRUCTURA DE RESPUESTA ESTÁNDAR

### Respuesta Exitosa:

```typescript
{
  success: true,
  data: any,
  message?: string
}
```

### Respuesta con Error:

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Códigos de Error Comunes:

- `VALIDATION_ERROR`: Error de validación de datos
- `NOT_FOUND`: Recurso no encontrado
- `UNAUTHORIZED`: Sin permisos para la operación
- `DUPLICATE_NUMBER`: Número de comanda ya existe
- `INSUFFICIENT_PAYMENT`: Métodos de pago no cubren el total
- `INACTIVE_RESOURCE`: Recurso inactivo (personal, producto, etc.)

---

## 6. NOTAS IMPORTANTES

### Numeración Manual:

- Los usuarios ingresan manualmente el número de comanda
- El backend solo valida que sea único
- Formato sugerido: "ING-001", "EGR-001", pero no obligatorio

### Manejo de Señas:

- **Opción 1**: Ingreso manual en cada comanda
- **Opción 2**: Señas guardadas por cliente (recomendado)
- Las señas pueden tener fecha de vencimiento
- Se pueden marcar como utilizadas automáticamente

### Permisos:

- **Caja 1 (Usuarios)**: CRUD de comandas, consulta de datos de referencia
- **Caja 2 (Admin)**: Todo lo anterior + gestión de personal, productos, configuración, reportes

### Monedas:

- **Base**: Pesos argentinos
- **Seña**: Puede ser en pesos o dólares
- **Conversión**: Usar tipo de cambio configurado
- **Mostrar**: Equivalencias en ambas monedas en el frontend
