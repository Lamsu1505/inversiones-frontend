# Inversiones Web — Aplicación de Gestión de Portafolio Personal

> Documento de referencia único del proyecto. Consolida producto, arquitectura,
> modelo de datos, lógica financiera, frontend, diseño UI, despliegue,
> migración de datos, estado actual y decisiones abiertas.
>
> **Esta versión fue actualizada al cierre de la sesión de construcción del
> Shell, Sidebar, sistema de temas, Dashboard (parcial) y Mis Inversiones
> (completo). Si estás retomando el proyecto en una conversación nueva, lee
> primero la sección 30 ("Cómo continuar") antes que cualquier otra cosa.**

---

## Tabla de contenido

1. [Objetivo del producto](#1-objetivo-del-producto)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura del frontend](#3-arquitectura-del-frontend)
4. [Patrón Repository](#4-patrón-repository)
5. [Contrato de datos (contract-first)](#5-contrato-de-datos-contract-first)
6. [Cálculos financieros: solo en backend](#6-cálculos-financieros-solo-en-backend)
7. [Modelo de datos PostgreSQL](#7-modelo-de-datos-postgresql)
8. [Vista de estadísticas diarias y manejo de gaps](#8-vista-de-estadísticas-diarias-y-manejo-de-gaps)
9. [Consolidación del portafolio (LOCF)](#9-consolidación-del-portafolio-locf)
10. [Fórmulas financieras](#10-fórmulas-financieras)
11. [Contrato API planeado](#11-contrato-api-planeado)
12. [Modelos TypeScript](#12-modelos-typescript)
13. [Autenticación](#13-autenticación)
14. [Sistema de diseño](#14-sistema-de-diseño)
15. [Login — estado actual](#15-login--estado-actual)
16. [Mis Inversiones — estado actual (completo)](#16-mis-inversiones--estado-actual-completo)
17. [Dashboard — estado actual (parcial)](#17-dashboard--estado-actual-parcial)
18. [Calculadora de Rentabilidad — nueva, sin definir](#18-calculadora-de-rentabilidad--nueva-sin-definir)
19. [Otras pantallas pendientes](#19-otras-pantallas-pendientes)
20. [Responsive](#20-responsive)
21. [Despliegue](#21-despliegue)
22. [Migración de Google Sheets a PostgreSQL](#22-migración-de-google-sheets-a-postgresql)
23. [Orden de construcción real y walking skeleton](#23-orden-de-construcción-real-y-walking-skeleton)
24. [Incidentes de entorno y bugs resueltos](#24-incidentes-de-entorno-y-bugs-resueltos)
25. [Principios que deben mantenerse](#25-principios-que-deben-mantenerse)
26. [Decisiones abiertas](#26-decisiones-abiertas)
27. [Arquitectura objetivo](#27-arquitectura-objetivo)
28. [Convenciones y patrones establecidos durante la construcción](#28-convenciones-y-patrones-establecidos-durante-la-construcción)
29. [Estado actual detallado](#29-estado-actual-detallado)
30. [Cómo continuar en una conversación nueva](#30-cómo-continuar-en-una-conversación-nueva)

---

## 1. Objetivo del producto

**Inversiones Web** reemplaza una hoja de Google Sheets usada hoy para el
seguimiento diario de varias inversiones (ej. **Fiducuenta**, **InvesBot**).
Es de **uso individual y privado**, no un producto multiusuario.

Cada día, el usuario registra manualmente lo que le reporta cada entidad:
valor de la unidad, saldo disponible, saldo total, y si hubo aporte o retiro.
A partir de eso, la app debe calcular automáticamente lo que hoy calcula el
Excel: variación de la unidad, ganancia/pérdida diaria y acumulada, promedio
de posesión, rentabilidad del período, tasa mensual, tasa efectiva anual
(EA) — por inversión y consolidado.

### Requisitos funcionales
- Login (acceso privado, no público)
- Sidebar: Estadísticas · Mis Inversiones · Histórico · Reportes · Cerrar sesión
- Página principal = Dashboard de estadísticas
- Registro manual diario (valor unidad, cantidad de unidades cuando esté
  disponible, saldo disponible, saldo total, movimiento)
- CRUD completo de inversiones (crear, editar, desactivar, eliminar)
- Histórico por inversión, tipo Excel, editable día por día
- Ganancias generales y por inversión, con filtros de fecha
- Rentabilidad mensual y tasa efectiva anual, por inversión y consolidada
- **(Nuevo, sin definir aún)** Calculadora de rentabilidad — ver sección 18

### Regla de éxito del producto
> **Registrar la información diaria debe ser más rápido y menos tedioso que
> hacerlo en Excel.** Si la captura diaria pide más pasos o esfuerzo que la
> hoja actual, el producto no cumple su objetivo. Esta regla condiciona
> cualquier decisión de UX en las pantallas de captura.

---

## 2. Stack tecnológico

| Capa | Tecnología | Estado |
|---|---|---|
| Frontend | Angular 21.x, standalone, Signals | **En construcción activa — Shell, Sidebar, Dashboard parcial y Mis Inversiones completos** |
| Dev server | Vite (vía Angular) | Configurado y funcionando |
| Formularios | Reactive Forms tipados | En uso (Login) |
| Backend | Spring Boot | **No iniciado** — todo el frontend corre contra mocks |
| Seguridad | Spring Security + JWT propio **o** Supabase Auth | **Pendiente de decisión** — sigue sin resolverse |
| Base de datos | PostgreSQL | Esquema diseñado, no provisionado |
| Hosting frontend | Vercel | **Desplegado y funcionando** — repo conectado: `Lamsu1505/inversiones-frontend` (ver sección 24 sobre el incidente de repo duplicado, ya resuelto) |
| Hosting backend | Railway (recomendado) | No confirmado |
| Diseño UI | Stitch (Google) | Login generado; **Mis Inversiones rediseñada por completo vía cuestionario + prompt a Stitch** (ver sección 16) |
| CSS | CSS puro por componente + tokens CSS + BEM | En uso, con **Container Queries** además de Media Queries (ver sección 20) |
| Idioma/locale | `es-CO` | Definido y **con pipes propios para forzar el formato correcto** (ver sección 28) |
| Tema | Claro/oscuro con toggle | **Implementado** — ver sección 14 (esto revierte la decisión previa de "Dark Mode fijo") |

Convenciones de Angular adoptadas: standalone components (sin NgModules),
`ChangeDetectionStrategy.OnPush` en **todos** los componentes construidos,
Signals para estado local y compartido, `inject()` en vez de inyección por
constructor, Reactive Forms tipados, control flow moderno (`@if` / `@else` /
`@for` / `@switch`, nunca `*ngIf`/`*ngFor`), Angular Router, formato de
moneda `es-CO` vía pipes propios (no `@angular/localize` directamente —
ver sección 28).

```
$ 1.234.567        ← correcto (es-CO)
$1,234,567.00      ← incorrecto (en-US)
0,72%               ← correcto (es-CO, coma decimal)
0.72%               ← incorrecto (en-US) — bug real encontrado y corregido,
                       ver sección 24
```

---

## 3. Arquitectura del frontend

Este es el árbol **real actual**, no solo el planeado:

```
src/app/
├── core/
│   ├── models/
│   │   ├── investment.model.ts          [Investment + fechaCreacion + tipo:InvestmentTipo]
│   │   ├── investment-tipo.model.ts      [union type + labels, NUEVO]
│   │   ├── daily-record.model.ts        [DailyRecord, DailyStats]
│   │   ├── dashboard-filter.model.ts    [DashboardFilter, NUEVO]
│   │   ├── dashboard-summary.model.ts   [DashboardSummary, NUEVO]
│   │   └── investment-summary.model.ts  [InvestmentSummary, NUEVO]
│   ├── repositories/                     [NUEVO — separado de services/, ver razón abajo]
│   │   ├── investments.repository.ts     [abstract class, 6 métodos]
│   │   └── mock-investments.repository.ts
│   ├── services/
│   │   ├── dashboard-filter.service.ts   [NUEVO — signal-based, compartido]
│   │   ├── theme.service.ts              [NUEVO — signal-based, compartido]
│   │   └── auth.service.ts               [PENDIENTE — no existe todavía]
│   ├── utils/
│   │   └── date.util.ts                  [NUEVO — toISODate, daysAgo, daysSinceIso]
│   └── guards/                           [vacío, sin construir]
├── shared/
│   ├── components/
│   │   ├── icon/                         [NUEVO — sistema de íconos SVG centralizado]
│   │   ├── period-filter/                [NUEVO]
│   │   └── sparkline/                    [NUEVO]
│   └── pipes/                            [NUEVO]
│       ├── currency-co.pipe.ts
│       ├── percent-co.pipe.ts
│       └── relative-date-co.pipe.ts
├── layout/
│   └── shell/
│       ├── shell.component.ts/html/css   [COMPLETO — responsive, off-canvas móvil]
│       └── sidebar/
│           └── sidebar.component.ts/html/css  [COMPLETO]
├── features/
│   ├── auth/
│   │   └── login/                        [existente, con problemas conocidos sin resolver — ver sección 15]
│   ├── dashboard/
│   │   ├── dashboard.component.ts/html/css  [PARCIAL — filtro + 4 KPIs, sin gráficos ni tabla]
│   │   └── components/
│   │       └── kpi-card/                 [COMPLETO]
│   ├── investments/
│   │   ├── investments.component.ts/html/css  [COMPLETO — grilla, filtros, búsqueda, orden]
│   │   └── components/
│   │       └── investment-card/          [COMPLETO — ver diseño final en sección 16]
│   └── daily-entry/                      [vacío, sin construir]
├── app.ts
├── app.routes.ts                          [rutas: /login, /dashboard, /investments — todas dentro del Shell excepto login]
└── app.config.ts                          [providers: InvestmentsRepository → MockInvestmentsRepository]
```

**Convenciones de código (confirmadas y en uso):**
- Templates en archivo separado (`templateUrl`) para todos los componentes
  construidos hasta ahora — se abandonó la idea de usar `template` inline
  incluso para componentes chicos, por consistencia.
- CSS por componente en **BEM**, sin excepciones.
- Nunca colores/tipografía/espaciado hardcodeados si existe un token
  equivalente en `tokens.css` — **incluyendo íconos SVG**, que usan
  `currentColor` exclusivamente (ver sección 28).
- Sufijo `.component.ts` obligatorio en todo componente — se corrigió una
  inconsistencia temprana donde algunos archivos no lo llevaban.

### Por qué `core/repositories/` está separado de `core/services/`

Decisión tomada explícitamente durante la sesión: un **servicio**
(`DashboardFilterService`, `ThemeService`, futuro `AuthService`) tiene una
sola implementación — se inyecta y no hay ambigüedad. Un **repository** es
distinto por diseño: es una clase abstracta con múltiples implementaciones
intercambiables (`Mock...` vs. `Http...`), donde `app.config.ts` decide cuál
usar. Separarlos en carpetas distintas comunica esa diferencia con solo ver
en qué carpeta vive un archivo, sin tener que abrirlo.

---

## 4. Patrón Repository

Contrato **final y completo**, ya implementado (más amplio que la versión
original del spec):

```typescript
export abstract class InvestmentsRepository {
  abstract list(): Observable<Investment[]>;
  abstract records(id: number, from: string, to: string): Observable<DailyStats[]>;
  abstract saveRecords(records: DailyRecord[]): Observable<void>;

  /** Métricas ya calculadas para las KPI cards del Dashboard. */
  abstract dashboardSummary(filter: DashboardFilter): Observable<DashboardSummary>;

  /** Resumen del mes actual para UNA inversión (ej. para Histórico a futuro). */
  abstract investmentSummary(investmentId: number): Observable<InvestmentSummary>;

  /** Resúmenes de TODAS las inversiones en una sola llamada — usado por la
   *  página de listado para poder ordenar por Saldo/Rentabilidad sin
   *  disparar N peticiones independientes. */
  abstract investmentSummaries(): Observable<InvestmentSummary[]>;
}
```

- **`MockInvestmentsRepository`** — implementado y funcionando. **Estado
  actual del array de inversiones: debe estar vacío (`[]`)** según el
  principio #3 (no inventar datos). Durante la sesión se usaron datos de
  prueba temporales varias veces (ej. `nombre: 'Inversión 1'`, o un
  generador de caminata aleatoria en `records()` para probar visualmente el
  sparkline) — **si sigues con este proyecto y encuentras datos de prueba
  todavía ahí, hay que confirmar con el usuario si ya los quiere reemplazar
  por datos reales del Excel, o si hay que revertir a vacío.**
- **`HttpInvestmentsRepository`** — no construido, pendiente de que exista
  el backend real.

### Patrón contenedor/presentacional (nuevo, no estaba en la versión original)

Durante la construcción de "Mis Inversiones" se tomó una decisión de
arquitectura explícita: en vez de que **cada** `InvestmentCardComponent`
pida su propio `InvestmentSummary` (lo cual impedía ordenar la lista desde
la página padre, y generaría N peticiones HTTP independientes contra el
backend real), se refactorizó así:

- **`InvestmentsComponent`** (la página) es el **contenedor/inteligente**:
  pide `list()` **y** `investmentSummaries()` una sola vez, arma un
  `Map<investmentId, InvestmentSummary>` para lookup O(1), y pasa a cada
  tarjeta su `Investment` y su `InvestmentSummary` ya resueltos por
  `@Input`.
- **`InvestmentCardComponent`** es **presentacional** para esos dos datos —
  ya no los pide él mismo, los recibe. **Excepción deliberada:** el
  sparkline de 30 días **sí sigue pidiéndose dentro de la tarjeta** (vía
  `records()`), porque ningún criterio de orden depende del sparkline —
  mover también esa responsabilidad al padre habría sido refactor
  innecesario.

Este patrón (contenedor pide y reparte, presentacional solo muestra) es el
que se debe seguir para cualquier pantalla nueva que liste varias entidades
con datos derivados (ej. si el Histórico algún día necesita listar varios
días con resúmenes).

---

## 5. Contrato de datos (contract-first)

Sin cambios respecto al original — sigue sin implementarse porque no hay
backend. Cuando se construya, aplica tal como estaba descrito: mismos
nombres de campo entre Angular, JSON, DTOs de Java y base de datos, con
`springdoc-openapi` + `openapi-generator` recomendado para mantener
sincronía.

---

## 6. Cálculos financieros: solo en backend

**Principio respetado estrictamente durante toda la construcción.** Ningún
componente Angular calcula ganancia, rentabilidad, tasa mensual o EA — todo
llega ya resuelto desde el repository (hoy mock, mañana HTTP real). Esto se
verificó explícitamente varias veces durante la sesión (por ejemplo, al
decidir dónde debía vivir `fechaCreacion` vs. por qué `balance` NO debía
agregarse a `Investment`).

---

## 7. Modelo de datos PostgreSQL

Sin cambios — sigue siendo el esquema diseñado, aún no provisionado. Sigue
siendo la fuente de verdad para el backend cuando se construya.

Nota agregada: en el modelo TypeScript actual, `DailyRecord.valorUnidad` es
**obligatorio** (`number`, sin `?`), consistente con que en SQL no tiene
default y es `not null`. Durante la sesión se detectó y corrigió un bug real
donde alguien había escrito `valorUnidad?: number` (opcional) por error en
el archivo TypeScript — ver sección 24.

---

## 8. Vista de estadísticas diarias y manejo de gaps

Sin cambios — sigue sin implementarse (no hay backend). El componente
`SparklineComponent` (ver sección 28) asume que recibe un arreglo de
`valorUnidad` ya resuelto por `records()`, sin preocuparse de cómo se
calculó — la lógica de gaps sigue siendo 100% responsabilidad del backend
futuro.

---

## 9. Consolidación del portafolio (LOCF)

Sin cambios — sigue sin implementarse (no hay backend).

---

## 10. Fórmulas financieras

Sin cambios en las fórmulas mismas. Confirmado durante la sesión: el
`DashboardFilterService` y toda la UI **nunca** implementan estas fórmulas
— solo capturan la intención del usuario (qué rango de fechas, qué
inversión) y delegan el cálculo al repository.

---

## 11. Contrato API planeado

Sin cambios respecto al original. Los 6 métodos del `InvestmentsRepository`
actual (sección 4) están diseñados para mapear 1 a 1 contra estos endpoints
cuando el backend exista — en particular, `investmentSummaries()` sugiere
que probablemente convenga un endpoint de lote nuevo
(`GET /api/investments/summaries?mes=actual`) que no estaba en la lista
original, para evitar N llamadas HTTP reales desde el frontend.

---

## 12. Modelos TypeScript

Estos son los modelos **reales y finales** tal como quedaron construidos —
reemplazan la versión original de esta sección.

```typescript
// core/models/investment.model.ts
export interface Investment {
  id: number;
  nombre: string;
  entidad?: string;
  tipo?: InvestmentTipo;      // antes: string libre — ahora union type
  moneda: string;
  activa: boolean;
  fechaCreacion: string;      // 'YYYY-MM-DD' — NUEVO, mapea a created_at
}
```

```typescript
// core/models/investment-tipo.model.ts — NUEVO
export type InvestmentTipo =
  | 'cdt'
  | 'fondo-inversion'
  | 'cuenta-ahorro'
  | 'acciones'
  | 'bonos'
  | 'cripto'
  | 'otro';

export const INVESTMENT_TIPO_LABELS: Record<InvestmentTipo, string> = {
  'cdt': 'CDT',
  'fondo-inversion': 'Fondo de Inversión',
  'cuenta-ahorro': 'Cuenta de Ahorro',
  'acciones': 'Acciones',
  'bonos': 'Bonos',
  'cripto': 'Criptomonedas',
  'otro': 'Otro',
};
```

> ⚠️ **Esta lista de 7 valores es una SUPOSICIÓN**, no viene de datos reales
> del Excel (que sigue sin llegar — ver sección 26). Cuando existan datos
> reales, hay que revisar si estos 7 tipos cubren lo que realmente usa el
> usuario, y ajustar el union type en consecuencia (agregar, quitar o
> renombrar valores).

```typescript
// core/models/daily-record.model.ts
export interface DailyRecord {
  id?: number;
  investmentId: number;
  fecha: string;
  valorUnidad: number;         // obligatorio — ver nota en sección 7
  cantidadUnidades?: number;   // opcional a propósito, spec sección 7
  saldoDisponible: number;
  saldoTotal: number;
  movimiento: number;
  nota?: string;
}

export interface DailyStats extends DailyRecord {
  valorUnidadPrev: number | null;
  deltaUnidad: number | null;
  variacionPct: number | null;
  gananciaDia: number | null;
}
```

```typescript
// core/models/dashboard-filter.model.ts — NUEVO
export interface DashboardFilter {
  from: string;                  // 'YYYY-MM-DD'
  to: string;                    // 'YYYY-MM-DD'
  investmentId: number | null;   // null = "todas las inversiones"
}
```

```typescript
// core/models/dashboard-summary.model.ts — NUEVO
export interface DashboardSummary {
  valorTotal: number;
  gananciaPeriodo: number;
  promedioDiario: number;
  eaPonderada: number;
}
```

```typescript
// core/models/investment-summary.model.ts — NUEVO
export interface InvestmentSummary {
  investmentId: number;
  saldoTotal: number;
  saldoDisponible: number;
  gananciaMes: number;
  promedioRentabilidadDiaria: number;
  aportesRetirosNetos: number;
  tasaMensual: number;
  tasaEA: number;
  fechaUltimoRegistro: string | null;  // null = sin registros todavía
}
```

**Por qué `Investment` NO tiene `valorActual`, `rentabilidad` ni
`balance`:** se discutió explícitamente durante la sesión. Cualquier campo
que cambie según el rango de fechas filtrado (sin que la inversión misma
cambie) es un dato **derivado**, y vive en `InvestmentSummary` o
`DashboardSummary` — nunca en `Investment`. La pregunta de referencia que se
estableció para decidir esto en el futuro: *"¿este valor cambia si cambio
el rango de fechas del filtro, sin tocar la inversión en sí?"* — si sí, no
va en `Investment`.

---

## 13. Autenticación

**Sin cambios — sigue sin resolverse.** `LoginComponent` sigue siendo un
stub (`onSubmit()` con navegación directa a `/dashboard`, sin llamar a
ningún `AuthService` real porque **ese servicio todavía no existe**). El
botón "Cerrar sesión" de la Sidebar también es un stub
(`console.log` + `router.navigateByUrl('/login')`).

La decisión Spring Security+JWT vs. Supabase Auth **sigue abierta** — no se
tocó durante esta sesión.

---

## 14. Sistema de diseño

### Cambio importante respecto a la versión original: el tema claro/oscuro fue retomado e implementado

La versión anterior de este documento decía *"Se llegó a construir un
sistema completo de tema claro/oscuro... Se revirtió... Dark Mode fijo"*.
**Eso ya no es cierto.** Durante esta sesión se volvió a construir el
sistema de temas, esta vez completo y funcional, siguiendo exactamente el
patrón que el documento anterior recomendaba para "si se retoma en el
futuro".

### `tokens.css` — estructura actual

```css
:root {
  /* Tema CLARO — es el default */
  --color-bg: #f6f9f7;
  --color-surface: #ffffff;
  --color-surface-elevated: #ffffff;
  --color-surface-hover: #e9efeb;
  --color-border: #d2dcd6;
  --color-border-focus: #1f6f52;
  --color-text-primary: #131714;
  --color-text-secondary: #3f4943;
  --color-text-muted: #6b756e;
  --color-primary: #1f6f52;
  --color-primary-hover: #17583f;
  --color-on-primary: #ffffff;
  --color-primary-container: #a2efca;
  --color-on-primary-container: #00281a;
  --color-primary-contrast: var(--color-on-primary);
  --color-profit: #15803d;   /* más oscuro que en dark mode — contraste AA sobre blanco */
  --color-loss: #dc2626;
  --font-heading: 'Hanken Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --row-height: 40px;
  --row-height-compact: 36px;
  --spacing-unit: 4px;
}

[data-theme='dark'] {
  /* Tema OSCURO — los valores que antes vivían fijos en :root */
  --color-bg: #101412;
  --color-surface: #181c1a;
  --color-surface-elevated: #1c211e;
  --color-surface-hover: #272b28;
  --color-border: #3f4943;
  --color-border-focus: #8ad6b3;
  --color-text-primary: #e0e3df;
  --color-text-secondary: #bec9c1;
  --color-text-muted: #89938c;
  --color-primary: #8ad6b3;
  --color-primary-hover: #a5f3ce;
  --color-on-primary: #003826;
  --color-primary-container: #1f6f52;
  --color-on-primary-container: #a2efca;
  --color-profit: #22c55e;
  --color-loss: #ef4444;
}
```

### `ThemeService` (`core/services/theme.service.ts`) — NUEVO

Signal-based, con persistencia en `localStorage` y respeto a
`prefers-color-scheme` cuando no hay preferencia guardada. Prioridad:
**elección explícita del usuario > preferencia del sistema operativo >
claro por defecto.**

```typescript
export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.resolveInitialTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      const theme = this._theme();
      document.documentElement.dataset['theme'] = theme;
      localStorage.setItem('inversiones-theme', theme);
    });
  }

  toggle(): void { this._theme.update((c) => (c === 'dark' ? 'light' : 'dark')); }
  set(theme: Theme): void { this._theme.set(theme); }
  private resolveInitialTheme(): Theme { /* localStorage → prefers-color-scheme → 'light' */ }
}
```

### Script inline en `src/index.html` — evita el flash de tema incorrecto

Se agregó un script duplicado (a propósito) dentro del `<head>`, antes de
cualquier `<link>` de estilos, que lee `localStorage` y aplica
`data-theme` **antes** de que Angular arranque. Sin esto, la app parpadea
brevemente en el tema equivocado al recargar. Es el mismo patrón que usan
Linear, GitHub, etc.

### Toggle conectado en la Sidebar

El botón de tema en `sidebar.component.html` ahora es funcional (antes
estaba deshabilitado a propósito, cuando el tema era fijo). Muestra el
ícono de **sol cuando está en oscuro** (indica la acción, no el estado
actual) y **luna cuando está en claro**.

### Semántica financiera ajustada por tema

`--color-profit` y `--color-loss` **cambian de valor entre temas** — no son
los mismos hex en claro que en oscuro. Razón: los tonos usados en oscuro
(`#22c55e`, `#ef4444`) no pasan contraste AA sobre fondo blanco; en claro se
usan versiones más oscuras (`#15803d`, `#dc2626`).

### Sistema de íconos SVG (nuevo, no existía en la versión original)

Ver sección 28 para el detalle completo — es un componente compartido
(`IconComponent`) que reemplazó tanto los emojis iniciales de la Sidebar
como los SVG sueltos repetidos entre componentes.

---

## 15. Login — estado actual

**Sin cambios de código durante esta sesión** — no se tocó el
`LoginComponent` más allá de agregarle la navegación a `/dashboard` al
final de `onSubmit()`. Los problemas conocidos que listaba la versión
original del spec **siguen sin resolver**, salvo que se confirme lo
contrario en una sesión futura:

- Ícono de email sigue siendo de persona, no de sobre (con el
  `<path opacity="0">` residual sin limpiar).
- Ícono de marca ("trending up") sigue siendo provisional.
- `console.log('Intento de login', credentials)` — no se confirmó si se
  eliminó. **Verificar antes de conectar el backend real.**

---

## 16. Mis Inversiones — estado actual (completo)

**Esta pantalla está funcionalmente terminada del lado del frontend
(contra mocks).** Fue rediseñada por completo respecto al mockup inicial de
Stitch, mediante un cuestionario detallado con el usuario. Reemplaza por
completo la descripción breve que tenía la versión original de este
documento en la sección 16.

### Proceso de diseño seguido (para que quede como precedente de cómo se decide esto en el proyecto)

1. Se generó un mockup inicial en Stitch basado en el spec original.
2. El usuario lo encontró demasiado angosto y con información incompleta
   respecto al spec.
3. Se hizo un cuestionario estructurado (varias rondas) cubriendo: ancho de
   tarjeta, jerarquía de métricas, tratamiento de la advertencia de dato
   desactualizado, qué hacer con "tipo" de inversión, período de las
   métricas mensuales, y contenido del sparkline.
4. Con las respuestas, se redactó un prompt detallado para que Stitch
   regenerara el diseño.
5. El segundo mockup de Stitch se revisó contra el spec — se encontró y
   corrigió un bug real de formato (porcentajes con punto decimal en vez de
   coma, violando `es-CO`).
6. Se construyó el componente, y **luego** el usuario pidió una
   reorganización visual adicional (mover Tasa EA al header, agrupar
   métricas en pares distintos, mover la fecha al footer) — esa es la
   versión que quedó implementada.
7. Varias rondas de ajuste fino de responsive (ver sección 20).

### Jerarquía de métricas, tal como se definió originalmente (para contexto histórico)

El usuario priorizó explícitamente 7 métricas (1 = más importante, 5 =
menos importante), empatando algunas:

| Prioridad | Métrica |
|---|---|
| 1 | Saldo Total |
| 2 | Saldo Disponible |
| 2 | Ganancia (rentabilidad absoluta) del mes |
| 3 | Promedio de rentabilidad diaria del mes |
| 3 | Aportes/Retiros netos del mes |
| 4 | Tasa de rentabilidad mensual |
| 5 | Tasa EA |

**Nota importante:** en la implementación final, **Tasa EA se movió
visualmente al header** de la tarjeta (junto al nombre/tipo/entidad), no
al final del cuerpo como sugeriría su prioridad numérica 5. Esto fue una
decisión de diseño explícita del usuario en la última ronda de ajustes — la
prioridad numérica definió el *tamaño de fuente relativo* en el cuerpo de
la tarjeta, pero la *posición* de la Tasa EA terminó siendo distinta.

### Diseño final implementado (estructura real de `investment-card.component.html`)

```
┌─────────────────────────────────────────────┐
│ [Nombre]                    [Badge] [⋮]      │  ← header
│ [Tipo · Entidad]                             │
│ Tasa EA  17,56%                              │
│ ───────────────────────────────────────────  │  ← divider
│ SALDO TOTAL          GANANCIA DEL MES        │  ← fila hero (nivel 1-2)
│ $ 114.989.765         ↑ + $ 450.987          │
│                                               │
│ Saldo Disponible      Prom. Rentabilidad     │  ← fila nivel 2-3
│ $ 110.678.654          Diaria: $ 20.675      │
│                                               │
│ Aportes/Retiros Netos  Tasa Mensual          │  ← fila nivel 3-4
│ $ 12.309.776            1,23%                │
│                                               │
│ [sparkline sutil, 30 días]                   │
│ ───────────────────────────────────────────  │
│ 🕐 Hace 3 días      [+ Añadir Día] [Histórico]│  ← footer
└─────────────────────────────────────────────┘
```

**Decisiones confirmadas sobre cada pieza:**

- **Tipo + Entidad**: ambos visibles, texto chico y discreto — el usuario
  explícitamente pidió que no compitieran visualmente con las métricas.
- **Advertencia de dato desactualizado**: se consideraron dos opciones
  (ícono con tooltip al interactuar, vs. texto siempre visible). **Se
  decidió el texto siempre visible** ("Hace 3 días", con color de alerta si
  pasan más de 2 días) — más práctico según el usuario, aunque contradice
  la idea inicial de "solo ícono discreto".
- **Sparkline**: se mantiene, sutil, últimos 30 días de `valorUnidad`. Sigue
  viviendo dentro de la tarjeta (no se movió al padre — ver sección 4).
- **Menú "⋮"**: confirmado que debe contener **Editar inversión, Dar de
  baja, Eliminar** — pero **el menú desplegable NO está construido
  todavía**, es solo un botón visual sin funcionalidad (`aria-label="Más
  acciones"`, sin `(click)` real).
- **"Eliminar" debe sentirse visualmente destructivo**, distinto de las
  otras dos opciones — pendiente de implementar cuando se construya el
  menú.
- **Formato `es-CO`**: todos los montos y porcentajes usan
  `CurrencyCoPipe` / `PercentCoPipe` (ver sección 28) — no hay formato
  manual en el template.
- **Período de las métricas mensuales**: fijo a "Este mes", sin selector de
  período propio en esta pantalla (a diferencia del Dashboard).

### Página `investments.component.ts` — controles construidos

- **Búsqueda**: filtra por `nombre` + `entidad`, client-side, sobre el
  arreglo ya cargado (no hay debounce ni petición al servidor — no hace
  falta porque no hay backend real todavía).
- **Filtro de estado**: Activas / Inactivas / Todas, con contador junto a
  cada pestaña.
- **Orden**: Nombre / Saldo / Rentabilidad / Última actualización — **los
  4 funcionan correctamente**, confirmado por el usuario. Usa
  `localeCompare(..., 'es')` para el orden alfabético (evita que tildes/Ñ
  ordenen mal).
- **Tarjeta fantasma "Registrar Inversión"**: presente, con `(click)` que
  hoy solo hace `console.log` (`createInvestment()` es un TODO — el modal
  de crear/editar no está construido).

### Pendiente explícito de esta pantalla

- Modal de crear/editar inversión (nombre, entidad, tipo, moneda, activa) —
  **no construido**.
- Menú "⋮" con sus 3 acciones — **no construido**, solo el botón visual.
- Confirmación de eliminar (irreversible) — no construido, depende del
  menú anterior.
- El usuario decidió **explícitamente no** unificar los filtros
  (Activas/Inactivas/Todas + Ordenar) en la misma fila en vista móvil por
  ahora ("no haré el cambio de los filtros en móvil por ahora") — quedó
  aceptado tal como está, no es un olvido.
- Los datos de prueba usados para verificar visualmente (nombres, montos)
  deben limpiarse quedando `[]` en el mock, o reemplazarse por datos reales
  del Excel cuando lleguen — confirmar con el usuario en qué estado quedó
  esto al final de la sesión.

---

## 17. Dashboard — estado actual (parcial)

**Deliberadamente detenido a medio construir por decisión del usuario**
("dejaré así por el momento la parte del dashboard, porque aún no tengo
claro del todo cómo quiero los gráficos").

### Lo que SÍ está construido

- **`PeriodFilterComponent`** (`shared/components/period-filter/`) —
  botones de preset (Hoy, Este mes, Mes anterior, Últimos 3 meses, Año
  actual, Todo) + selector de inversión (dropdown con "Todas las
  inversiones (N)"). El botón "Personalizado" existe visualmente pero está
  **deshabilitado** (selector de fechas manual, no implementado).
- **`DashboardFilterService`** (`core/services/`) — signal-based, expuesto
  como `filter` (readonly) y `activePreset` (readonly), con `setPreset()`,
  `setCustomRange()` (sin usar todavía, por lo del botón deshabilitado) y
  `setInvestment()`. Traduce cada preset a fechas `from`/`to` concretas.
- **4 KPI cards** (`KpiCardComponent`, reutilizable vía `@Input`): Valor
  Total, Ganancia del Período, Promedio Diario, Tasa EA (Ponderada).
  Reaccionan al filtro vía `toObservable(filter) → switchMap →
  dashboardSummary()`.

### Lo que NO está construido (explícitamente pausado, no olvidado)

- Gráfico de Evolución del Portafolio (línea/área).
- Gráfico de Ganancia Diaria (barras verde/rojo).
- Gráfico de Distribución del Portafolio (dona o barra apilada).
- Tabla "Resumen de Inversiones" con fila de totales.
- El botón "Personalizado" del filtro de período (rango de fechas manual).

### Deuda técnica menor detectada, no resuelta

- `DashboardComponent` formatea moneda y porcentaje con métodos propios
  inline (`formatCurrency()`, cálculo manual de EA con
  `.replace('.', ',')`) en vez de usar `CurrencyCoPipe` / `PercentCoPipe`
  — porque esos pipes se construyeron **después** de que el Dashboard ya
  estaba escrito. Sería bueno refactorizar el Dashboard para usar los
  pipes compartidos y eliminar la duplicación de lógica de formato.
- `DashboardFilterService` tiene su propia copia privada de una función
  `toISODate()`, casi idéntica a la que después se centralizó en
  `core/utils/date.util.ts`. No se unificó por no ser urgente — es un
  candidato a limpieza futura.

---

## 18. Calculadora de Rentabilidad — nueva, sin definir

**Feature completamente nueva, mencionada al cierre de la sesión.** Solo se
alcanzó a crear el ícono SVG (`calculator`, ya agregado al
`IconComponent`). **No se ha definido nada más**: ni qué calcula
exactamente, ni si usa las fórmulas ya validadas (sección 10) o necesita
algo nuevo, ni si es pantalla propia con ruta o un modal/widget dentro de
otra pantalla existente.

**Preguntas pendientes de resolver en la próxima sesión sobre este tema**
(ya identificadas, sin responder):
- ¿Es una herramienta de *simulación* ("si invierto X a una tasa Y por Z
  meses, ¿cuánto tengo al final?"), o es para *verificar retroactivamente*
  el rendimiento real de una inversión existente?
- ¿Usa las fórmulas ya validadas del spec (sección 10), o necesita algo
  adicional?
- ¿Vive como pantalla propia con su ruta (agregar a la Sidebar, que ya
  tiene un ítem "Reportes" sin construir — ¿es lo mismo, o son cosas
  distintas?), o como modal/widget dentro de una pantalla existente?

---

## 19. Otras pantallas pendientes

Sin cambios respecto al original — **ninguna de estas se tocó durante esta
sesión**:

- **Histórico de inversión** — la pantalla más importante según el spec
  original, sigue sin empezar.
- **Modal — Añadir/Editar registro diario** — sin empezar.
- **Captura masiva diaria** — sin empezar, alcance todavía no confirmado.
- **"Reportes"** — existe como ítem de navegación en la Sidebar (con su
  ícono `report`) pero **no tiene ninguna ruta ni componente detrás**. Es
  posible que esto termine relacionado con la Calculadora de Rentabilidad
  (sección 18) — hay que aclararlo con el usuario.

---

## 20. Responsive

Se estableció y validó un enfoque más robusto que solo Media Queries,
después de varios ciclos de prueba y error reales (documentados en detalle
en la sección 24).

### Técnicas en uso

1. **Grid con `auto-fit` + `minmax()`** en vez de columnas fijas, para
   listados de tarjetas (`investments__grid`):
   ```css
   .investments__grid {
     grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
     gap: 24px;
   }
   ```
   Esto reemplaza la necesidad de calcular a mano "a tal ancho, tantas
   columnas" — el navegador decide solo cuántas caben.

2. **Container Queries en la tarjeta individual**, no solo Media Queries en
   la página. Una tarjeta puede quedar angosta por dos razones distintas
   (pantalla chica, o ser 1 de 3 columnas en una pantalla grande) — Media
   Queries no distingue entre esos casos, Container Queries sí:
   ```css
   .investment-card {
     container-type: inline-size;
     container-name: investment-card;
   }

   @container investment-card (max-width: 360px) {
     .investment-card__btn { padding: 7px 9px; font-size: 0.75rem; }
   }
   @container investment-card (max-width: 320px) {
     .investment-card__btn { padding: 6px 8px; font-size: 0.6875rem; }
   }
   ```
   **Importante:** el footer (fecha + botones) se **encoge** cuando el
   espacio escasea — **no se apila** verticalmente. Se probó apilar
   primero y se revirtió (ver el bug documentado en sección 24) porque
   generaba una regresión visual peor que el problema que resolvía.

3. **Truncamiento de texto con ellipsis** para nombres largos de inversión:
   ```css
   .investment-card__name {
     overflow: hidden;
     text-overflow: ellipsis;
     white-space: nowrap;
   }
   .investment-card__title-block {
     min-width: 0; /* imprescindible dentro de un contenedor flex */
   }
   ```

4. **Shell / Sidebar**: breakpoint de 767px para pasar de sidebar fija
   (desktop) a off-canvas con scrim (móvil) — sin cambios respecto a como
   se construyó originalmente, sigue funcionando bien.

### Regla aprendida (agregada como principio nuevo — ver sección 25)

**Nunca elegir dos umbrales de responsive relacionados sin verificar
explícitamente que no colisionen entre sí.** El bug más costoso de esta
sesión (footer apilándose "al azar" tanto en desktop como en móvil) fue
causado por poner el mínimo de la grilla (`minmax(360px, ...)`) por debajo
del umbral de un container query (`max-width: 380px`) — como 360 < 380,
casi cualquier tarjeta producida por la grilla activaba la regla "angosta",
incluso en pantalla completa. Antes de fijar un número de breakpoint,
verificar contra todos los demás números de layout que puedan interactuar
con él.

---

## 21. Despliegue

| Componente | Plataforma | Estado |
|---|---|---|
| Frontend | Vercel | **Desplegado y funcionando**, conectado al repo correcto |
| Backend | Railway (recomendado) | No confirmado, sin cambios |
| Base de datos | Railway junto al backend, o Neon/Supabase desacoplado | No decidido, sin cambios |

### Incidente resuelto: repositorio duplicado en GitHub

Durante la sesión se descubrió que existían **dos repositorios distintos**
en GitHub (`Lamsu1505/inversiones`, vacío salvo un commit inicial generado
por Vercel, y `Lamsu1505/inversiones-frontend`, el real con todo el
trabajo) — y Vercel estaba conectado al equivocado (el vacío), por lo que
los `git push` a `main` del repo real no disparaban ningún deploy.

**Resuelto:** se reconectó el proyecto de Vercel a
`Lamsu1505/inversiones-frontend`, verificando `Production Branch = main`.
El repo vacío (`inversiones`) sigue existiendo — pendiente de que el
usuario decida si lo archiva o lo borra para no volver a confundirse.

---

## 22. Migración de Google Sheets a PostgreSQL

Sin cambios — **sigue sin ejecutarse, y sigue siendo el bloqueador
principal del proyecto.** El `MockInvestmentsRepository` no puede
poblarse con datos reales hasta que esto se haga. Se recomienda encarecidamente
priorizar esto en la próxima sesión de trabajo si es posible — casi todo
el resto de la construcción del frontend (mocks con datos reales,
validación visual real de las tarjetas y KPIs) depende de tener aunque sea
una inversión real con algunos días de historial.

---

## 23. Orden de construcción real y walking skeleton

El orden **realmente seguido** durante esta sesión (distinto al orden
original planeado, y también distinto del orden original de Stitch):

1. Shell (`layout/shell/`)
2. Sidebar (`layout/shell/sidebar/`)
3. Sistema de íconos SVG (`IconComponent`) — surgió como necesidad al
   pulir la Sidebar, se generalizó rápido
4. Sistema de temas claro/oscuro (`ThemeService` + reestructuración de
   `tokens.css`)
5. `DashboardFilterService` + modelo `DashboardFilter`
6. `PeriodFilterComponent`
7. `InvestmentsRepository` (contrato) + `MockInvestmentsRepository`
   (implementación mínima)
8. `DashboardSummary` (modelo) + método `dashboardSummary()` en el
   repository
9. `KpiCardComponent` + `DashboardComponent` (parcial — sin gráficos)
10. `InvestmentTipo` (modelo)
11. `InvestmentSummary` (modelo) + métodos `investmentSummary()` /
    `investmentSummaries()` en el repository
12. `core/utils/date.util.ts` + pipes compartidos (`CurrencyCoPipe`,
    `PercentCoPipe`, `RelativeDateCoPipe`)
13. `SparklineComponent`
14. `InvestmentCardComponent` (varias iteraciones de diseño)
15. Refactor a patrón contenedor/presentacional (ver sección 4)
16. `InvestmentsComponent` (la página completa)
17. Varias rondas de ajuste responsive (ver sección 20)
18. Ícono de Calculadora (sin funcionalidad detrás todavía)

**El walking skeleton descrito en la versión original de este documento
sigue sin ejecutarse.** Toda la construcción hasta ahora corre 100% contra
`MockInvestmentsRepository` — nunca se ha probado nada contra Postgres real
ni contra un endpoint Spring Boot real. Esto sigue siendo una recomendación
fuerte del spec original que aplica igual hoy: no seguir construyendo
pantallas nuevas indefinidamente sin validar el flujo real de punta a
punta al menos una vez.

---

## 24. Incidentes de entorno y bugs resueltos

Tabla ampliada respecto a la original, con los incidentes reales de esta
sesión:

| Problema | Causa | Solución |
|---|---|---|
| `ng new ... --standalone` → flag desconocido | Removido, standalone es el único modo | `ng new frontend --routing --style=scss --ssr=false` |
| `Warning: Node 26 not supported` | Fuera de rango soportado | `nvm install 22 && nvm use 22 && nvm alias default 22` |
| `npm error EACCES` en `.npm/_cacache` | Uso previo de `sudo npm install -g` | `sudo chown -R 501:20 "~/.npm"` — no volver a usar `sudo` con npm |
| `npm install @angular/localize` → `ERESOLVE` | Versión incompatible | `ng add @angular/localize` |
| Título del login en fuente serif | Google Fonts mal formado (`hankenGrotesk`) | Corregido a `Hanken+Grotesk` |
| **Vercel no actualizaba el deploy** | **Repo de GitHub duplicado, Vercel conectado al vacío** | **Reconectado al repo correcto (`inversiones-frontend`), ver sección 21** |
| **Menú hamburguesa se cerraba al tocar cualquier cosa dentro** | El listener de cierre estaba en el contenedor completo de la sidebar, no solo en el scrim | Se quitó el `(click)` del contenedor, se dejó solo en el `<button class="shell__scrim">` |
| **Zona muerta al tocar "afuera" del drawer móvil no cerraba el menú** | `inset: 0 25% 0 0` hacía que el contenedor del drawer midiera 75% de la pantalla, mucho más que el `<aside>` visible de 240px | Cambiado a `width: max-content` con `top/left/bottom: 0` — el contenedor hereda el ancho real del contenido |
| **`toSignal()` con `initialValue: null` — error de tipos `ts(2769)` / `ts(2344)`** | `null` no es subtipo válido para el genérico `U extends T` de `toSignal` en esta versión de Angular | Se quitó `initialValue` por completo — sin él, `toSignal` infiere `Signal<T \| undefined>` automáticamente, compatible con `?? 0` / `?.` ya usados en el resto del código |
| **`NG0201: No provider found for InvestmentsRepository`** | El provider nunca se registró en `app.config.ts` mientras se posponía construir el mock | Se creó un `MockInvestmentsRepository` con arrays vacíos (no inventados — cero es el resultado honesto de "sumar cero inversiones") y se registró el provider |
| **`'first' is possibly 'undefined'` (ts18048) al hacer destructuring de un array** | El proyecto tiene `noUncheckedIndexedAccess` activo — cualquier acceso indexado (`arr[0]`, destructuring) devuelve `T \| undefined`, aunque ya se haya validado `.length` antes | Usar `!` (non-null assertion) después de la validación de longitud, ej. `values[0]!` |
| **`Type '(number \| undefined)[]' is not assignable to type 'number[]'`** en `[values]="sparklineValues()"` | `DailyRecord.valorUnidad` estaba accidentalmente marcado opcional (`valorUnidad?: number`) en el archivo del usuario, en vez de obligatorio como pide el spec | Se quitó el `?` del modelo; adicionalmente se agregó un `.filter((v): v is number => v !== undefined)` como blindaje extra en `sparklineValues` |
| **`NG0950: Input "investment" is required but no value is available yet`** | Una ruta de prueba (`/investments` apuntando a un componente viejo) renderizaba `<app-investment-card>` sin pasarle `[investment]` | Se quitó la ruta de prueba; la ruta real y definitiva se agregó después, correctamente enlazada |
| **Error fantasma de HMR (`Component update failed`) sin ningún uso real del componente en pantalla** | Vite/HMR quedó con un grafo de módulos desincronizado tras varios cambios seguidos a modelos compartidos | Recarga forzada (Cmd+Shift+R) → si persiste, reiniciar `ng serve` → último recurso, `rm -rf .angular/cache` |
| **Botón "Añadir Día" se partía en 2 líneas dentro del footer de la tarjeta** | `flex: 1` en el botón primario lo estiraba a ocupar todo el ancho sobrante del footer | `flex: 0 0 auto` + `white-space: nowrap` en todos los botones del footer |
| **Footer se apilaba verticalmente en anchos donde no debía (tanto desktop como móvil)** | Colisión de umbrales: `minmax(360px, ...)` de la grilla vs. `@container (max-width: 380px)` que apilaba el footer — 360 < 380, así que casi cualquier tarjeta activaba el apilado | Se reemplazó "apilar" por "encoger" (padding/font-size más chicos en vez de cambiar `flex-direction`), evitando el conflicto de umbrales por completo — ver sección 20 |
| **Título largo de inversión se desbordaba de la tarjeta en 2 líneas** | Faltaban `overflow: hidden` + `text-overflow: ellipsis` +, crucialmente, `min-width: 0` en el contenedor flex padre | Se agregaron las 3 propiedades — sin `min-width: 0` el truncamiento no se activa nunca dentro de un contenedor flex |
| **Porcentajes con punto decimal (`0.72%`) en vez de coma (`0,72%`) en el mockup de Stitch** | Stitch generó el diseño con formato `en-US` por defecto, sin conocer la convención `es-CO` del proyecto | Se resuelve automáticamente al usar `PercentCoPipe` en el código real — anotado para no copiar el formato del mockup tal cual |

---

## 25. Principios que deben mantenerse

Los 18 principios originales siguen vigentes sin excepción. Se agregan 3
nuevos, derivados directamente de los incidentes de esta sesión:

19. **Ningún ícono SVG debe tener `stroke`/`fill` con un color literal —
    siempre `currentColor`.** El color real se decide 100% en CSS, con un
    token, nunca dentro del SVG (extensión del principio #11 a íconos).
20. **Ningún dato de moneda o porcentaje se formatea a mano en un
    template o componente — siempre vía los pipes compartidos
    (`CurrencyCoPipe`, `PercentCoPipe`)**, para que el formato `es-CO`
    (coma decimal, punto de miles) sea consistente en toda la app sin
    excepción.
21. **Al definir un breakpoint o umbral responsive nuevo (Media Query o
    Container Query), verificar explícitamente contra todos los demás
    umbrales de layout relacionados que puedan colisionar** — ver el
    incidente de la sección 24 sobre `minmax(360px)` vs. `@container
    (max-width: 380px)`.

---

## 26. Decisiones abiertas

Actualizado — se resolvió una (tema claro/oscuro), se agregaron nuevas:

- **Autenticación:** sigue exactamente igual que antes — Spring Security +
  JWT vs. Supabase Auth, sin resolver.
- **Persistencia de sesión:** `localStorage` vs. cookie `httpOnly` — sin
  resolver.
- **Hosting del backend:** Railway, no confirmado.
- **Hosting de Postgres:** no decidido.
- **`cantidad_unidades`:** sigue opcional, sin resolver.
- **Captura masiva diaria:** alcance no confirmado.
- **~~Tema claro/oscuro~~:** ✅ **RESUELTO** — implementado, ver sección 14.
- **`InvestmentTipo` (los 7 valores del union type):** son una suposición,
  pendiente de validar/ajustar contra datos reales del Excel.
- **Mock con datos reales:** sigue exactamente igual — pendiente de que el
  usuario aporte las filas reales del Excel. **Este es hoy el bloqueador
  más importante de todo el proyecto.**
- **Calculadora de Rentabilidad (nueva):** sin ningún requisito definido
  más allá del nombre y el ícono — ver sección 18.
- **Relación entre "Reportes" (ítem de Sidebar sin construir) y la nueva
  Calculadora de Rentabilidad:** ¿son la misma pantalla, o dos cosas
  distintas? Sin aclarar.
- **Menú "⋮" de las tarjetas de inversión:** contenido confirmado (Editar,
  Dar de baja, Eliminar), pero la construcción del dropdown/modal en sí
  está pendiente.
- **Repo de GitHub duplicado (`inversiones`, vacío):** sigue existiendo,
  pendiente de que el usuario decida si lo borra o lo archiva.

---

## 27. Arquitectura objetivo

Sin cambios respecto al diagrama original — sigue siendo válido a alto
nivel. La única actualización conceptual es que hoy existen **6 métodos**
en `InvestmentsRepository` en vez de los 3 originales (ver sección 4), y
que el flujo real hoy es enteramente:

```
Angular → MockInvestmentsRepository (con datos vacíos o de prueba)
```

Sin haber tocado nunca, ni una sola vez, el camino
`Angular → Spring Boot → PostgreSQL` — ese sigue siendo 100% el estado
planeado, no el actual.

---

## 28. Convenciones y patrones establecidos durante la construcción

Esta sección es **nueva** — documenta patrones que no estaban en la
versión original del spec, pero que se volvieron estándar de facto durante
la construcción y **deben seguirse para cualquier componente nuevo.**

### Sistema de íconos SVG centralizado

`shared/components/icon/icon.component.ts` — recibe `name` (union type
`IconName`) y `size` (número en px, default 20) por `input()`. Internamente
usa `@switch (name())` con un `@case` por ícono, cada uno un `<svg>` con
`stroke="currentColor"` (nunca un color literal). El tamaño se aplica al
propio elemento host vía `@HostBinding('style.width.px')` /
`@HostBinding('style.height.px')` — **no** vía `:host { width: 100% }`,
porque eso requiere que el padre ya tenga un tamaño explícito, lo cual
generó bugs de íconos gigantes al principio.

Íconos disponibles hoy: `chart`, `trending`, `history`, `report`, `eye`,
`eye-off`, `moon`, `user`, `info`, `settings`, `sun`, `plus`, `arrow-up`,
`arrow-down`, `more-vertical`, `search`, `calculator`.

Uso: `<app-icon name="plus" [size]="14" />`

### Pipes de formato `es-CO`

`shared/pipes/currency-co.pipe.ts`, `percent-co.pipe.ts`,
`relative-date-co.pipe.ts`. Los tres son standalone, con nombre de pipe en
camelCase (`currencyCo`, `percentCo`, `relativeDateCo`). `currencyCo` y
`percentCo` aceptan un segundo parámetro opcional `forceSign` (booleano) —
los negativos **siempre** muestran `-`, pero el `+` en positivos es
opcional y se activa explícitamente (ej. en "Ganancia del Mes", pero no en
"Saldo Total").

### Utilidades de fecha compartidas

`core/utils/date.util.ts` — `toISODate(date)` (evita el bug de
`toISOString()` convirtiendo a UTC y corriendo la fecha un día en zonas
horarias negativas como Bogotá UTC-5), `daysAgo(n)`, `daysSinceIso(iso)`.
**Cualquier cálculo de fechas nuevo debe usar estas utilidades**, no
reinventar la conversión a mano.

### Servicios de estado compartido vía Signals (no `@Input`/`@Output`)

Cuando varios componentes hermanos (sin relación padre-hijo directa)
necesitan compartir estado reactivo (ej. el filtro del Dashboard, el tema),
el patrón establecido es: un `@Injectable({ providedIn: 'root' })` con un
signal privado + una versión pública `.asReadonly()`, y métodos explícitos
para mutarlo (nunca se expone el `.set()` directo hacia afuera). Ejemplos:
`DashboardFilterService`, `ThemeService`. Se eligió este patrón
explícitamente sobre prop-drilling de `@Input`/`@Output` para evitar que un
componente padre tenga que reenviar estado a hijos no relacionados entre
sí.

### `toSignal()` + `toObservable()` + `switchMap()` para reaccionar a cambios de filtro

Patrón repetido en `PeriodFilterComponent`, `DashboardComponent`, y
`InvestmentCardComponent` (para el sparkline): cuando un signal de filtro
cambia, hay que volver a pedir datos al repository. La fórmula estándar:

```typescript
protected readonly datos = toSignal(
  toObservable(this.algunSignalDeFiltro).pipe(
    switchMap((filtro) => this.repository.metodoQueDevuelveObservable(filtro))
  )
);
```

**No** pasar `initialValue` explícito a menos que sea estrictamente
necesario — ver el bug de tipos documentado en la sección 24; dejar que
`toSignal` infiera `T | undefined` automáticamente es más simple y funciona
bien con `?.` / `?? valor` en el resto del código.

### Container/presentacional para listados con datos derivados

Ver sección 4 — cualquier pantalla nueva que liste varias entidades con
datos calculados (no solo el modelo base) debe seguir el mismo patrón que
`InvestmentsComponent` / `InvestmentCardComponent`: el contenedor pide todo
en lote, arma un `Map` para lookup, y reparte por `@Input` a componentes
presentacionales.

### Truncamiento de texto (checklist de 3 propiedades + 1 en el padre)

```css
/* En el elemento de texto */
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;

/* En el CONTENEDOR FLEX PADRE — sin esto, nada de lo anterior funciona */
min-width: 0;
```

### Responsive: Container Queries por componente, Media Queries por página

Ver sección 20 — la regla de bolsillo establecida: si el problema es "este
componente se ve mal cuando ES angosto" (sin importar por qué quedó
angosto), usar Container Query dentro de su propio CSS. Si el problema es
"el layout general de la página cambia según el viewport", usar Media
Query en el CSS de la página.

---

## 29. Estado actual detallado

### Completado y funcionando (verificado por el usuario en esta sesión)

- [x] Shell responsive (sidebar fija en desktop, off-canvas con scrim en
      móvil, breakpoint 767px)
- [x] Sidebar con navegación (Estadísticas, Mis Inversiones, Histórico,
      Reportes), toggle de tema, toggle de "ocultar saldos" (visual, sin
      función real todavía), logout stub
- [x] Sistema de íconos SVG centralizado (`IconComponent`, 17 íconos)
- [x] Sistema de tema claro/oscuro completo (`ThemeService`, `tokens.css`
      reestructurado, script anti-flash en `index.html`)
- [x] Login navega correctamente a `/dashboard` (sigue siendo un stub sin
      `AuthService` real)
- [x] `InvestmentsRepository` con 6 métodos, `MockInvestmentsRepository`
      implementado
- [x] `DashboardFilterService` (presets de período + inversión
      seleccionada, vía signals)
- [x] `PeriodFilterComponent` (presets + selector de inversión;
      "Personalizado" deshabilitado)
- [x] Dashboard parcial: filtro + 4 KPI cards reactivas al filtro
- [x] Pipes `es-CO`: `CurrencyCoPipe`, `PercentCoPipe`,
      `RelativeDateCoPipe`
- [x] `SparklineComponent` reutilizable (SVG normalizado, sin librerías
      externas)
- [x] `InvestmentCardComponent` completo, con diseño final aprobado por el
      usuario, patrón presentacional (recibe `investment` + `summary` por
      `@Input`)
- [x] `InvestmentsComponent` completo: grilla responsive, búsqueda,
      filtro por estado, orden (4 criterios funcionando), tarjeta fantasma
      de "Registrar Inversión"
- [x] Responsive validado en varios anchos (desktop, ~850px, ~550px,
      móvil) con Container Queries + grid `auto-fit`
- [x] Vercel desplegado y conectado al repo correcto

### Pendiente — priorizado de mayor a menor impacto en el proyecto

1. **Datos reales del Excel** — sigue siendo el bloqueador #1. Sin esto,
   `MockInvestmentsRepository` sigue vacío o con datos de prueba
   temporales, y no se puede validar visualmente nada con honestidad.
2. **Modal de crear/editar inversión** — sin esto, "Nueva Inversión" y
   "Registrar Inversión" no hacen nada real.
3. **Menú "⋮" (Editar / Dar de baja / Eliminar)** — botón visual sin
   función.
4. **Definir requisitos de la Calculadora de Rentabilidad** (sección 18) —
   conversación pendiente, explícitamente pospuesta por el usuario.
5. **Aclarar relación entre "Reportes" y la Calculadora** — ambigüedad sin
   resolver.
6. **Gráficos del Dashboard** (evolución, ganancia diaria, distribución) —
   pospuesto a propósito por el usuario, sin decisión de diseño tomada
   todavía.
7. **Tabla "Resumen de Inversiones" del Dashboard** — no construida.
8. **Pantalla de Histórico** — la más importante según el spec original,
   sin empezar.
9. **Modal de captura diaria** — sin empezar.
10. **`AuthService` real + decisión de proveedor de autenticación** — sin
    empezar, sin decidir.
11. **Backend Spring Boot completo** — sin empezar; el walking skeleton
    del spec original nunca se ejecutó.
12. **Limpieza de deuda técnica menor**: unificar `toISODate()` duplicado,
    refactorizar `DashboardComponent` para usar los pipes compartidos en
    vez de formateo manual inline.
13. **Problemas conocidos del Login** sin confirmar si se resolvieron
    (ícono de email, ícono de marca, `console.log` de credenciales).
14. **Decidir qué hacer con el repo de GitHub duplicado y vacío**
    (`inversiones`).

---

## 30. Cómo continuar en una conversación nueva

Si estás retomando este proyecto en un chat distinto a donde se construyó
todo lo de arriba, esto es lo que necesitas saber para no repetir trabajo
ni re-litigar decisiones ya tomadas:

1. **Lee primero las secciones 16, 17, 20, 24, 28 y 29** — son las que
   documentan en más detalle el trabajo reciente, los patrones a seguir, y
   los bugs ya resueltos (para no volver a caer en los mismos).
2. **El bloqueador más importante del proyecto sigue siendo la falta de
   datos reales del Excel.** Si el usuario no lo menciona, es válido
   preguntarle directamente si ya los tiene disponibles — desbloquea
   validar visualmente casi todo lo construido.
3. **No cambies el union type `InvestmentTipo` (sección 12) sin avisar**
   que es una suposición pendiente de validar — no asumas que esos 7
   valores son correctos.
4. **Antes de tocar cualquier CSS de responsive, revisa la sección 20 y el
   principio #21** — el proyecto ya sufrió un bug real por elegir dos
   umbrales que colisionaban entre sí.
5. **Sigue el patrón contenedor/presentacional (sección 4 y 28) para
   cualquier pantalla nueva que liste varias entidades con datos
   derivados** — no repitas el error inicial de que cada tarjeta pida sus
   propios datos por separado.
6. **Usa siempre los pipes compartidos (`CurrencyCoPipe`, `PercentCoPipe`)
   para cualquier monto o porcentaje nuevo** — nunca formato manual, ni
   siquiera "temporalmente".
7. **Cualquier ícono SVG nuevo va al `IconComponent` compartido**
   (sección 28), con `currentColor`, nunca un color hardcodeado ni un SVG
   suelto dentro de un componente específico.
8. El usuario **prefiere que le expliques el porqué de una decisión técnica
   antes de escribir código**, y corrige errores de inmediato en vez de
   acumularlos — mantén ese estilo de trabajo: plantea el problema, explica
   las opciones con sus trade-offs, y espera confirmación cuando la
   decisión no sea obvia (como se hizo con el patrón
   contenedor/presentacional, el cuestionario de diseño de "Mis
   Inversiones", y el tratamiento de la advertencia de dato desactualizado).
9. **Los próximos temas naturales a retomar**, en el orden que el propio
   usuario dejó insinuado: (a) definir requisitos de la Calculadora de
   Rentabilidad, (b) construir el modal de crear/editar inversión y el
   menú "⋮", (c) retomar el Dashboard con decisiones de diseño de los
   gráficos, (d) finalmente, la pantalla de Histórico.