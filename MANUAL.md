# Manual de Usuario - Sistema Core Avícola

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación](#instalación)
4. [Módulos del Sistema](#módulos-del-sistema)
   - [Dashboard](#dashboard)
   - [Lotes](#lotes)
   - [Pesajes](#pesajes)
   - [Presupuesto de Pesos](#presupuesto-de-pesos)
   - [Mortalidad](#mortalidad)
   - [Alimentación](#alimentación)
   - [Costos](#costos)
   - [Inventario](#inventario)
   - [Galpones](#galpones)
   - [Tercerización](#tercerización)
   - [Procesamiento](#procesamiento)
   - [Reportes](#reportes)
   - [Configuración](#configuración)

---

## Introducción

Core Avícola es un sistema de gestión integral para granjas avícolas de engorde. Permite administrar lotes de pollos, controlar el inventario de insumos, registrar pesajes, mortalidad, alimentación, costos y presupuestos de重量.

---

## Requisitos del Sistema

### Backend
- Python 3.10+
- PostgreSQL 14+
- Windows Server / Windows 10/11

### Frontend
- Node.js 18+
- Navegador moderno (Chrome, Firefox, Edge)

---

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/slagosr205/core-avicola.git
cd core-avicola
```

### 2. Configurar Base de Datos
Crear una base de datos PostgreSQL llamada `core_avicola` y ejecutar las migraciones en `backend/migrations/`.

### 3. Backend
```bash
cd backend
pip install -r requirements.txt
python scripts/reset_db.py  # Reinicializar BD
python -m uvicorn app.main:app --reload  # Iniciar servidor
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Módulos del Sistema

### Dashboard

El dashboard muestra una vista general de la operación avícola:

- **Resumen de Lotes Activos**: Total de lotes en producción
- **Total de Animales**: Inventario actual de pollos
- **Peso Promedio**: Promedio de peso de todos los lotes
- **Mortandad Acumulada**: Total de mortalidad del período
- **Consumo de Alimento**: Balanceo consumido en lbs

Acceso rápido a los módulos principales mediante tarjetas.

---

### Lotes

Permite crear y gestionar lotes de pollos de engorde.

#### Crear Lote
1. Ir a **Lotes** → **Nuevo Lote**
2. Completar formulario:
   - **Granja**: Seleccionar granja
   - **Galpón**: Seleccionar galpón
   - **Fecha de Entrada**: Fecha de llegada de los pollitos
   - ** pollitos Bebés**: Cantidad de pollitos entrados
   - **Edad Actual**: Días de edad (automático o manual)
   - **Proveedor**: Tercero que suministra los pollitos
   - **Peso Entrada**: Peso promedio al ingreso
3. Hacer clic en **Guardar**

#### Ver Detalle de Lote
- Muestra información completa del lote
- Historial de pesajes
- Mortalidad registrada
- Consumo de alimento
- Costos asociados

---

### Pesajes

Registra el pesaje periódico de los lotes para seguimiento del crecimiento.

#### Registrar Pesaje
1. Ir a **Pesajes** → **Nuevo Pesaje**
2. Seleccionar **Lote**
3. Ingresar **Fecha del Pesaje**
4. Ingresar **Peso Total** (lbs)
5. Ingresar **Cantidad Pesada**
6. Sistema calcula **Peso Promedio** automáticamente
7. **Guardar**

#### Ver Historial
Lista todos los pesajes ordenados por fecha, con filtro por lote.

---

### Presupuesto de Pesos

Define las metas de peso esperado por edad para cada lote.

#### Campos del Registro
- **Lote**: Lote al que pertenece el presupuesto
- **Edad**: Días de edad del pollo
- **Peso Esperado**: Peso en lbs esperado para esa edad
- **Ganancia Diaria (GD)**: Gramos de ganancia por día
- **Conversión Alimenticia (CA)**: Relación alimento/peso

#### Usar Tabla Estándar
Sistema proporciona tabla de referencia con estándares de la industria:

| Edad (días) | Peso (lbs) | GD (g/día) | CA |
|-------------|------------|------------|-----|
| 1 | 0.15 | - | - |
| 7 | 0.35 | 28 | 1.0 |
| 14 | 0.75 | 58 | 1.2 |
| 21 | 1.30 | 80 | 1.35 |
| 28 | 1.95 | 95 | 1.45 |
| 35 | 2.65 | 102 | 1.55 |
| 42 | 3.35 | 103 | 1.65 |

---

### Mortalidad

Registra las muertes diarias en cada lote.

#### Registrar Mortalidad
1. Ir a **Mortalidad** → **Registrar**
2. Seleccionar **Lote**
3. Ingresar **Fecha**
4. Ingresar **Cantidad Muerta**
5. Opcional: **Causa** (enfermedad, calor, otro)
6. **Guardar**

#### Ver Historial
Lista de mortalidades por lote con totales acumulados.

---

### Alimentación

Registra el consumo de alimento balanceado por lote.

#### Registrar Consumo
1. Ir a **Alimentación** → **Nuevo Consumo**
2. Seleccionar **Lote**
3. Ingresar **Fecha**
4. Seleccionar **Tipo de Alimento**
5. Ingresar **Cantidad** (lbs)
6. **Guardar**

#### Tipos de Alimento
- Iniciador (0-10 días)
- Crecimiento (11-24 días)
- Finalizador (25-42 días)

#### Ver Consumos
Lista de todos los consumos con:
- Fecha
- Lote
- Tipo de alimento
- Cantidad
- Costo acumulado

---

### Costos

Controla todos los costos asociados a cada lote.

#### Tipos de Costo
- ** pollito Bebé**: Costo de pollitos entrados
- **Alimento**: Balanceado consumido
- **Mano de Obra**: Personal de la granja
- **Medicamento**: Vacunas, antibióticos
- **Energía**: Electricidad
- **Combustible**: Gas, diesel
- **Fletes**: Transporte
- **Mantenimiento**: Reparaciones
- **Otros**: Gastos varios

#### Registrar Costo
1. Ir a **Costos** → **Nuevo Costo**
2. Seleccionar **Lote**
3. Seleccionar **Tipo de Costo**
4. Ingresar **Fecha**
5. Ingresar **Valor**
6. **Guardar**

---

### Inventario

Gestiona el stock de insumos de la granja.

#### Insumos Disponibles

**Tipos de Insumo:**
- ALIMENTO (códigos: ALIM-XXXX)
- MEDICAMENTO (códigos: MED-XXXX)
- VACUNA (códigos: VAC-XXXX)
- POLLITO (códigos: POLL-XXXX)
- MATERIAL (códigos: MATE-XXXX)
- OTRO (códigos: OTRO-XXXX)

#### Crear Insumo
1. Ir a **Inventario** → **Nuevo Insumo**
2. Completar:
   - **Nombre**: Nombre del insumo
   - **Tipo**: Categoría del insumo
   - **Unidad**: kg, lbs, unidades, litros
   - **Costo Promedio**: Precio por unidad
3. Sistema genera código automáticamente
4. **Guardar**

#### Movimientos de Inventario

**Entrada de Inventario**
1. Ir a **Inventario** → **Entrada**
2. Seleccionar **Insumo**
3. Ingresar **Cantidad**
4. Ingresar **Costo Unitario**
5. **Guardar**

**Transferencia** (mover entre bodegas)
1. Ir a **Inventario** → **Transferencia**
2. Seleccionar **Insumo**
3. Seleccionar **Bodega Origen**
4. Seleccionar **Bodega Destino**
5. Ingresar **Cantidad**
6. **Guardar**

#### Kardex
Ver el movimiento completo de cada insumo:
- Entradas
- Salidas
- Saldo actual
- Costo promedio

---

### Galpones

Configura las instalaciones de la granja.

#### Crear Galpón
1. Ir a **Galpones** → **Nuevo Galpón**
2. Ingresar:
   - **Código**: Identificador único
   - **Nombre**: Nombre descriptivo
   - **Granja**: Granja a la que pertenece
   - **Capacidad**: Cantidad máxima de aves

---

### Tercerización

Gestiona servicios tercerizados (planta de beneficio, transporte).

#### Registrar Servicio
1. Ir a **Tercerización** → **Nuevo**
2. Seleccionar **Tercero** (empresa de servicio)
3. Seleccionar **Tipo de Servicio**
4. Ingresar **Fecha**
5. Ingresar **Valor**
6. **Guardar**

---

### Procesamiento

Registra el sacrificio de aves.

#### Registrar Procesamiento
1. Ir a **Procesamiento** → **Nuevo**
2. Seleccionar **Lote**
3. Ingresar **Fecha**
4. Ingresar **Cantidad Procesada**
5. Ingresar **Peso en Canal**
6. **Guardar**

---

### Reportes

Genera informes de la operación:

- **Producción por Lote**: Resumen de cada lote
- **Costos por Lote**: Desglose de gastos
- **Mortandad**: Estadísticas de mortalidad
- **Consumo de Alimento**: Balanceado utilizado
- **Kardex de Insumos**: Movimiento de inventario

---

### Configuración

Ajustes generales del sistema:

- **Granjas**: Gestionar ubicaciones
- **Bodegas**: Almacenes de insumos
- **Terceros**: Proveedores y clientes
- **Parámetros**: Configuraciones generales

---

## Glosario

| Término | Descripción |
|---------|-------------|
| **GD** | Ganancia Diaria - Gramos que gana el pollo por día |
| **CA** | Conversión Alimenticia - Relación entre alimento consumido y peso ganado |
| **Lote** | Grupo de pollos en proceso de engorde |
| **Granja** | Ubicación física de los galpones |
| **Galpón** | Estructura donde se crían los pollos |
| **Insumo** | Material utilizado en la producción (alimento, medicamentos) |

---

## Soporte

Para soporte técnico, crear un issue en:
https://github.com/slagosr205/core-avicola/issues

---

© 2026 Core Avícola - Sistema de Gestión Avícola