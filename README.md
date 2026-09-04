# InvManager — Gestión de Portafolio Personal de Inversiones

Aplicación web personal para el registro y seguimiento diario de inversiones financieras colombianas (CDTs, fondos de inversión, cuentas de ahorro, etc.), con cálculo automático de ganancias, rentabilidad periódica y tasa efectiva anual.

Nace para reemplazar una hoja de cálculo de Google Sheets usada durante años para el mismo propósito, conservando la velocidad de captura de la hoja pero agregando cálculos consistentes, historial confiable y visualizaciones.

> **Proyecto personal, de un solo usuario.** No es un producto multiusuario ni un SaaS: es una herramienta privada construida sobre requisitos reales de uso diario.

---

## Tabla de contenido

- [Motivación](#motivación)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Lógica financiera](#lógica-financiera)
- [Sistema de diseño](#sistema-de-diseño)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecución local](#ejecución-local)
- [Despliegue](#despliegue)
- [Estado del proyecto](#estado-del-proyecto)
- [Roadmap](#roadmap)
- [Principios de desarrollo](#principios-de-desarrollo)
- [Autor](#autor)

---

## Motivación

Cada día, las entidades financieras reportan el valor de la unidad, el saldo disponible y el saldo total de cada producto. Registrar esos datos en una hoja de cálculo funciona, pero tiene límites conocidos: las fórmulas se rompen al insertar filas, no hay validación de datos duplicados, y consolidar el portafolio completo exige mantener fórmulas paralelas en varias pestañas.

InvManager automatiza ese trabajo:

- La captura diaria se reduce a los datos que **realmente reporta la entidad**; todo lo demás se calcula.
- Los cálculos viven en un solo lugar (la base de datos), no replicados por celda.
- El historial es consultable, filtrable y editable sin riesgo de romper fórmulas.

### Regla de éxito del producto

> **Registrar la información diaria debe ser más rápido y menos tedioso que hacerlo en Excel.**

Esta regla condiciona cualquier decisión de UX en las pantallas de captura. Si un flujo nuevo agrega pasos frente a la hoja actual, se rediseña.

---

## Funcionalidades

### Implementadas

| Módulo | Descripción |
|---|---|
| **Shell + navegación** | Layout responsive con sidebar fija en escritorio y off-canvas con scrim en móvil (breakpoint 767px). |
| **Tema claro / oscuro** | Sistema completo basado en tokens CSS y signals, con persistencia en `localStorage`, respeto a `prefers-color-scheme` y script anti-flash previo al arranque de Angular. |
| **Mis Inversiones** | Grilla responsive de tarjetas con búsqueda por nombre/entidad, filtro por estado (activas / inactivas / todas) y ordenamiento por nombre, saldo, rentabilidad o última actualización. |
| **Tarjeta de inversión** | Jerarquía de 7 métricas priorizadas (saldo total, saldo disponible, ganancia del mes, promedio de rentabilidad diaria, aportes/retiros netos, tasa mensual, tasa EA), sparkline de 30 días e indicador de antigüedad del último registro. |
| **Dashboard** | Filtro de período por presets (hoy, este mes, mes anterior, últimos 3 meses, año actual, todo) y por inversión, con 4 KPI cards reactivas: valor total, ganancia del período, promedio diario y tasa EA ponderada. |
| **Calculadora de interés compuesto** | Formulario reactivo con proyección año por año, barra de proporción capital vs. intereses y sección de referencia de fórmulas. |
| **Sistema de íconos** | Componente compartido con SVG inline que usan `currentColor` exclusivamente, tematizados desde CSS. |
| **Formato es-CO** | Pipes propios (`CurrencyCoPipe`, `PercentCoPipe`, `RelativeDateCoPipe`) que garantizan punto de miles y coma decimal (`$ 1.234.567`, `0,72%`) en toda la aplicación. |
| **Directivas de entrada** | `CurrencyMaskDirective` (máscara de miles con preservación de posición del cursor, vía `ControlValueAccessor`) y `NoScrollChangeDirective` (evita que la rueda del mouse altere inputs numéricos). |

### En construcción

- Registro diario de datos (valor unidad, cantidad de unidades, saldo disponible, saldo total, movimiento).
- Historial por inversión, tipo hoja de cálculo, editable día por día.
- CRUD completo de inversiones (modal de creación/edición y menú de acciones).
- Gráficos del dashboard: evolución del portafolio, ganancia diaria y distribución.
- Autenticación real (hoy el login es un stub de navegación).

---

## Stack tecnológico

### Frontend

| Tecnología | Uso |
|---|---|
| **Angular 21** | Componentes standalone (sin NgModules), `ChangeDetectionStrategy.OnPush` en todos los componentes, Signals para estado, `inject()` en lugar de inyección por constructor, control flow moderno (`@if` / `@for` / `@switch`). |
| **TypeScript** | Modo estricto con `noUncheckedIndexedAccess` activo. Los modelos actúan como contrato explícito frontend–backend. |
| **RxJS** | `toSignal()` / `toObservable()` + `switchMap()` como patrón estándar para reaccionar a cambios de filtro. |
| **CSS puro + BEM + tokens** | Sin frameworks de UI. Tokens registrados en `angular.json`, Container Queries por componente y Media Queries por página. |
| **Vite** | Dev server vía Angular CLI. |

### Backend

| Tecnología | Uso |
|---|---|
| **Spring Boot** | API REST que expone métricas ya calculadas. `spring.jpa.hibernate.ddl-auto: validate` — el esquema es artesanal y Hibernate no lo modifica. |
| **Spring Data JPA** | Entidades y repositorios sobre el esquema existente. |

### Base de datos

| Tecnología | Uso |
|---|---|
| **PostgreSQL 18** | Local vía Homebrew para desarrollo. |
| **Supabase** | Instancia gestionada en producción (nivel gratuito permanente). El navegador nunca accede directamente: RLS deshabilitado porque la conexión es exclusivamente del backend con credenciales de servidor. |

### Infraestructura

| Servicio | Uso |
|---|---|
| **Vercel** | Hosting del frontend, despliegue continuo desde `main`. |
| **Railway** | Hosting del backend. |

**Stack resumido:** Angular 21 · TypeScript · RxJS · Signals · CSS/BEM · Spring Boot · Java · PostgreSQL · Supabase · Vercel · Railway

---

## Arquitectura

```
┌─────────────────────┐      HTTPS/JSON      ┌──────────────────┐      JDBC      ┌──────────────────┐
│   Angular 21 (SPA)  │ ───────────────────▶ │   Spring Boot    │ ─────────────▶ │   PostgreSQL     │
│      Vercel         │ ◀─────────────────── │     Railway      │ ◀───────────── │    Supabase      │
└─────────────────────┘   métricas ya        └──────────────────┘   vistas SQL   └──────────────────┘
                          calculadas
```

### Patrón Repository

El frontend nunca conoce el transporte de los datos. Todo pasa por una clase abstracta:

```typescript
export abstract class InvestmentsRepository {
  abstract list(): Observable<Investment[]>;
  abstract records(id: number, from: string, to: string): Observable<DailyStats[]>;
  abstract saveRecords(records: DailyRecord[]): Observable<void>;
  abstract dashboardSummary(filter: DashboardFilter): Observable<DashboardSummary>;
  abstract investmentSummary(investmentId: number): Observable<InvestmentSummary>;
  abstract investmentSummaries(): Observable<InvestmentSummary[]>;
}
```

`MockInvestmentsRepository` y `HttpInvestmentsRepository` son intercambiables desde un único provider en `app.config.ts`. Esto permitió construir toda la interfaz antes de que existiera el backend, sin acoplarla a él.

### Patrón contenedor / presentacional

Las páginas que listan entidades con datos derivados actúan como **contenedores inteligentes**: piden todo en lote (`list()` + `investmentSummaries()`), arman un `Map<id, Summary>` para lookup O(1) y reparten los datos ya resueltos por `@Input` a componentes **presentacionales**.

El motivo es concreto: si cada tarjeta pidiera su propio resumen, la página no podría ordenar la lista por saldo o rentabilidad, y se dispararían N peticiones HTTP independientes contra el backend real.

### Estado compartido vía Signals

Los componentes hermanos sin relación padre-hijo comparten estado a través de servicios `providedIn: 'root'` con un signal privado y una versión pública `.asReadonly()`, mutable únicamente mediante métodos explícitos. Ejemplos: `DashboardFilterService`, `ThemeService`. Se eligió sobre el prop-drilling de `@Input`/`@Output`.

### Contract-first

Los modelos TypeScript son el contrato. Los mismos nombres de campo se mantienen entre Angular, el JSON de la API y los DTOs de Java, en camelCase español (`saldoTotal`, `valorUnidad`, `gananciaMes`), lo que elimina capas de mapeo y reduce la superficie de error.

---

## Modelo de datos

Cuatro tablas, en convención singular:

```
investment_type ──┐
                  │
                  ├──▶ investment ──┬──▶ daily_record
                                    │
                                    └──▶ movement
```

| Tabla | Propósito | Notas de diseño |
|---|---|---|
| `investment_type` | Catálogo de tipos de producto | `smallserial`, `code` único, `display_order` (no `order`, palabra reservada en SQL). |
| `investment` | Producto financiero | `entity` nullable, `currency CHAR(3) DEFAULT 'COP'`, flags `tracks_unit_value` / `tracks_available_balance`, `opening_date` separada de `created_at`. |
| `daily_record` | Registro diario | `unit_value` y `available_balance` nullable (un CDT no los reporta); `total_balance` siempre obligatorio. `UNIQUE(investment_id, record_date)` es la restricción más importante del esquema: impide dos registros del mismo día. |
| `movement` | Aportes y retiros | `movement_type` restringido a `deposit` / `withdrawal`; todas las columnas monetarias son `DECIMAL`, nunca `FLOAT`. |

**Integridad adicional:**

- Un *trigger* de coherencia entre tablas valida que los flags `tracks_*` de `investment` correspondan con la presencia o ausencia de los campos nullable en `daily_record`. Una inversión que declara seguir el valor de la unidad no puede tener registros sin él.
- *Trigger* de `updated_at` en tres tablas.
- Sin columnas `user_id`: la aplicación es de un solo usuario por diseño.

### Sin valores derivados almacenados

**Ningún cálculo se guarda en la base de datos.** Ganancias, variaciones, promedios ponderados y tasas efectivas anuales se computan en vistas SQL usando funciones de ventana (`lag()`) sobre `daily_record`. Cada consulta produce el valor actual a partir de los datos crudos.

La razón: un valor derivado almacenado es un valor que puede quedar desactualizado. Corregir un registro de hace tres meses debe recalcular todo lo que dependía de él, automáticamente y sin migraciones de datos.

---

## Lógica financiera

Los cálculos residen **exclusivamente en el backend**. Ningún componente de Angular calcula ganancia, rentabilidad, tasa mensual o EA; los recibe ya resueltos.

Métricas soportadas:

- **Variación de la unidad** — delta y porcentaje frente al cierre anterior.
- **Ganancia diaria y acumulada** — neta de aportes y retiros del período.
- **Promedio de posesión** — saldo promedio ponderado por días.
- **Rentabilidad del período** y **tasa mensual**.
- **Tasa efectiva anual (EA)** — por inversión y ponderada a nivel de portafolio.
- **Consolidación del portafolio (LOCF)** — *last observation carried forward* para días sin reporte de alguna entidad, de modo que el total consolidado no caiga artificialmente cuando un producto no reporta.

### Alcance deliberadamente acotado

El proyecto **no** implementa TWR ni XIRR completos, ni conversión multimoneda. Los saldos en COP y USD se presentan como totales separados. Es una decisión consciente: replicar con exactitud lo que ya se calculaba a mano, no construir una plataforma de gestión de activos institucional.

---

## Sistema de diseño

### Tokens CSS

Todo color, tipografía, radio y espaciado vive en `tokens.css`. No hay valores hardcodeados en los CSS de componente cuando existe un token equivalente.

```css
:root {
  --color-bg: #f6f9f7;
  --color-surface: #ffffff;
  --color-primary: #1f6f52;
  --color-profit: #15803d;   /* contraste AA sobre fondo blanco */
  --color-loss: #dc2626;
  --font-heading: 'Hanken Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
}

[data-theme='dark'] {
  --color-bg: #101412;
  --color-surface: #181c1a;
  --color-primary: #8ad6b3;
  --color-profit: #22c55e;
  --color-loss: #ef4444;
}
```

Los colores semánticos de ganancia y pérdida **cambian de valor entre temas**: los tonos usados en oscuro no alcanzan contraste AA sobre fondo blanco.

### Localización es-CO

```
$ 1.234.567     correcto        $1,234,567.00   incorrecto
0,72%           correcto        0.72%           incorrecto
```

Todo monto o porcentaje pasa por los pipes compartidos. No hay formato manual en ningún template.

### Responsive

Dos herramientas con criterios distintos:

- **Container Queries** cuando el problema es *"este componente se ve mal cuando es angosto"*, sin importar por qué quedó angosto. Una tarjeta puede ser estrecha por pantalla pequeña o por ser una de tres columnas en un monitor grande; las Media Queries no distinguen esos casos.
- **Media Queries** cuando el problema es *"el layout de la página cambia según el viewport"*.
- **Grid `auto-fit` + `minmax()`** para listados, delegando al navegador cuántas columnas caben.

> **Regla obligatoria:** antes de fijar un umbral responsive nuevo, verificarlo contra todos los demás valores de layout con los que pueda interactuar. Un `minmax(360px, 1fr)` combinado con un `@container (max-width: 380px)` hace que prácticamente cualquier tarjeta active la regla de "angosta", incluso a pantalla completa.

---

## Estructura del proyecto

```
src/app/
├── core/                  # Sin UI
│   ├── models/            # Contrato de datos (interfaces + union types)
│   ├── repositories/      # Clases abstractas + implementaciones intercambiables
│   ├── services/          # Servicios de implementación única (theme, filtros, auth)
│   ├── utils/             # date.util.ts — conversión ISO segura para UTC-5
│   └── guards/
├── shared/                # Componentes visuales reutilizables
│   ├── components/        # icon, period-filter, sparkline
│   ├── directives/        # currency-mask, no-scroll-change
│   └── pipes/             # currency-co, percent-co, relative-date-co
├── layout/                # Componentes estructurales, usados una sola vez
│   └── shell/
│       └── sidebar/
└── features/              # Una carpeta por dominio funcional
    ├── auth/
    ├── dashboard/
    ├── investments/
    └── daily-entry/
```

`layout/` frente a `shared/`: los componentes de layout son estructurales y aparecen una única vez en pantalla simultáneamente; los de `shared/` se repiten dentro del área de contenido. Los repositorios viven aparte de los servicios porque son abstracciones con múltiples implementaciones — la carpeta comunica esa diferencia sin necesidad de abrir el archivo.

---

## Ejecución local

### Requisitos

- Node.js 22 LTS
- Java 17 o superior + Maven
- PostgreSQL 18 (o una instancia de Supabase)

### Frontend

```bash
git clone https://github.com/Lamsu1505/inversiones-frontend.git
cd inversiones-frontend
npm install
ng serve
```

Disponible en `http://localhost:4200`.

Para trabajar sin backend, `app.config.ts` debe apuntar al repositorio mock:

```typescript
providers: [
  { provide: InvestmentsRepository, useClass: MockInvestmentsRepository },
]
```

### Base de datos

```bash
createdb inversiones
psql -d inversiones -f schema.sql
```

### Backend

```bash
cd inversiones-backend
./mvnw spring-boot:run
```

Configuración en `application.yml`:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
```

`ddl-auto: validate` es intencional: el esquema se escribió a mano con triggers y restricciones que Hibernate no debe modificar. Si la validación falla, el problema está en el desajuste entre entidad y tabla, no en la tabla.

---

## Despliegue

| Componente | Plataforma | Detalle |
|---|---|---|
| Frontend | Vercel | Despliegue continuo desde `main` del repositorio `inversiones-frontend`. |
| Backend | Railway | Variables de entorno para la conexión a la base de datos. |
| Base de datos | Supabase | PostgreSQL gestionado. Requiere configurar CORS en el backend por tratarse de un despliegue separado. |

---

## Estado del proyecto

**En desarrollo activo.**

- **Frontend** — Shell, sidebar, sistema de temas, íconos, pipes, directivas, "Mis Inversiones" y la calculadora de interés compuesto están terminados. El dashboard está parcial (filtro y KPIs listos, gráficos pendientes de decisión de diseño).
- **Base de datos** — Esquema completo desplegado, con triggers y restricciones.
- **Backend** — Esqueleto: configuración, entidades JPA y repositorios iniciales.
- **Migración** — La carga histórica desde Google Sheets, mediante un script puntual en Python con `psycopg2`, es el siguiente hito.

---

## Roadmap

1. Migración de los datos históricos desde Google Sheets.
2. Endpoints del backend (`GET /api/dashboard?from=&to=&investmentId=`) y validación del flujo completo Angular → Spring Boot → PostgreSQL.
3. Modal de creación/edición de inversión y menú de acciones (editar, dar de baja, eliminar).
4. Pantalla de Histórico: fila fija de "cierre anterior", edición en línea e indicadores de días faltantes.
5. Captura diaria masiva, optimizada para superar en velocidad a la hoja de cálculo.
6. Gráficos del dashboard: evolución, ganancia diaria y distribución.
7. Autenticación real y decisión de proveedor.

---

## Principios de desarrollo

Reglas no negociables del proyecto, derivadas de decisiones y errores reales durante la construcción:

1. **Ningún valor derivado se almacena.** Todo cálculo se computa al momento de la consulta, mediante vistas SQL.
2. **Ningún cálculo financiero vive en el frontend.** La interfaz captura intención y muestra resultados.
3. **Ningún dato inventado.** Los repositorios mock devuelven arreglos vacíos: cero es el resultado honesto de sumar cero inversiones.
4. **Ningún formato manual de moneda o porcentaje.** Siempre a través de los pipes compartidos, ni siquiera "temporalmente".
5. **Ningún ícono con color literal.** `currentColor` exclusivamente; el color se decide en CSS mediante tokens.
6. **Ningún umbral responsive sin verificar colisiones** con los demás valores de layout relacionados.
7. **Explicar antes de implementar.** Las decisiones de arquitectura se plantean con sus alternativas y compensaciones antes de escribir código.
8. **Analizar efectos colaterales.** Todo cambio se evalúa contra el comportamiento que ya funcionaba.

---

## Autor

**Andrés** — diseño, arquitectura, desarrollo full-stack y operación.

Proyecto personal sin fines comerciales, construido sobre un caso de uso propio y real.