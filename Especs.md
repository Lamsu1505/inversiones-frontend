# Inversiones Web — Aplicación de Gestión de Portafolio Personal

> Documento de referencia único del proyecto. Consolida producto, arquitectura,
> modelo de datos, lógica financiera, frontend, diseño UI, despliegue,
> migración de datos, estado actual y decisiones abiertas.

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
16. [Pantallas pendientes](#16-pantallas-pendientes)
17. [Responsive](#17-responsive)
18. [Despliegue](#18-despliegue)
19. [Migración de Google Sheets a PostgreSQL](#19-migración-de-google-sheets-a-postgresql)
20. [Orden de construcción y walking skeleton](#20-orden-de-construcción-y-walking-skeleton)
21. [Incidentes de entorno resueltos](#21-incidentes-de-entorno-resueltos)
22. [Principios que deben mantenerse](#22-principios-que-deben-mantenerse)
23. [Decisiones abiertas](#23-decisiones-abiertas)
24. [Arquitectura objetivo](#24-arquitectura-objetivo)
25. [Estado actual detallado](#25-estado-actual-detallado)

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
- Sidebar: Estadísticas · Mis Inversiones · Cerrar sesión
- Página principal = Dashboard de estadísticas
- Registro manual diario (valor unidad, cantidad de unidades cuando esté
  disponible, saldo disponible, saldo total, movimiento)
- CRUD completo de inversiones (crear, editar, desactivar, eliminar)
- Histórico por inversión, tipo Excel, editable día por día
- Ganancias generales y por inversión, con filtros de fecha
- Rentabilidad mensual y tasa efectiva anual, por inversión y consolidada

### Regla de éxito del producto
> **Registrar la información diaria debe ser más rápido y menos tedioso que
> hacerlo en Excel.** Si la captura diaria pide más pasos o esfuerzo que la
> hoja actual, el producto no cumple su objetivo. Esta regla condiciona
> cualquier decisión de UX en las pantallas de captura.

---

## 2. Stack tecnológico

| Capa | Tecnología | Estado |
|---|---|---|
| Frontend | Angular 21.x, standalone, Signals | En construcción |
| Dev server | Vite (vía Angular) | Configurado |
| Formularios | Reactive Forms tipados | En uso |
| Backend | Spring Boot | No iniciado |
| Seguridad | Spring Security + JWT propio **o** Supabase Auth | **Pendiente de decisión** |
| Base de datos | PostgreSQL | Esquema diseñado, no provisionado |
| Hosting frontend | Vercel | Decidido, no desplegado |
| Hosting backend | Railway (recomendado) | No confirmado |
| Diseño UI | Stitch (Google) | Login generado y ajustado |
| CSS | CSS puro por componente + tokens CSS + BEM | En uso |
| Idioma/locale | `es-CO` | Definido |

Convenciones de Angular adoptadas: standalone components (sin NgModules),
`ChangeDetectionStrategy.OnPush`, Signals para estado local, `inject()` en
vez de inyección por constructor, Reactive Forms tipados, control flow
moderno (`@if` / `@else` / `@for`, nunca `*ngIf`/`*ngFor`), Angular Router,
`@angular/localize` con locale `es-CO` para formatear moneda:

```
$ 1.234.567        ← correcto (es-CO)
$1,234,567.00      ← incorrecto (en-US)
```

---

## 3. Arquitectura del frontend

```
src/app/
├── core/            → modelos, servicios, guards (singleton, puede conocer el dominio)
│   ├── models/
│   ├── services/
│   └── guards/
├── shared/           → componentes/pipes reutilizables, SIN conocimiento del dominio
│   ├── components/
│   └── pipes/
├── layout/            → shell fijo de la app (sidebar, header) — único, no repetible
│   └── shell/
├── features/            → cada pantalla principal
│   ├── auth/
│   │   └── login/        ← única pantalla codificada hasta ahora
│   ├── dashboard/
│   ├── investments/
│   └── daily-entry/
├── app.ts
├── app.routes.ts
└── app.config.ts
```

**Convenciones de código:**
- Templates inline (`template: \`...\``) para componentes chicos, `templateUrl`
  separado para componentes grandes (tablas, vistas complejas)
- Código organizado por *features*
- CSS por componente en **BEM** (`.login`, `.login__card`, `.login__input`,
  `.login__input--password`) — se eligió BEM sobre utility classes por
  consistencia y claridad con el sistema de diseño actual
- Nunca colores/tipografía/espaciado hardcodeados si existe un token
  equivalente en `tokens.css`

---

## 4. Patrón Repository

Para que Angular no dependa de que el backend exista:

```typescript
export abstract class InvestmentsRepository {
  abstract list(): Observable<Investment[]>;
  abstract records(id: number, from: string, to: string): Observable<DailyStats[]>;
  abstract saveRecords(records: DailyRecord[]): Observable<void>;
}
```

- **`MockInvestmentsRepository`** — datos en memoria. La intención es usar
  **datos reales extraídos del Excel del usuario**, no inventados, para
  detectar problemas reales de UX/modelado antes de tocar el backend.
  *Todavía no construido* — falta que el usuario aporte las filas del Excel.
- **`HttpInvestmentsRepository`** — consumirá la API real de Spring Boot.

El cambio entre implementaciones se hace en un solo lugar, sin tocar
componentes:

```typescript
providers: [
  { provide: InvestmentsRepository, useClass: MockInvestmentsRepository }
]
```

---

## 5. Contrato de datos (contract-first)

Antes de implementar frontend y backend a fondo, se define un contrato de
datos común: mismos nombres de campo entre Angular, JSON, DTOs de Java y
base de datos (con su mapeo correspondiente). camelCase en TypeScript,
mismo contrato lógico en los DTOs de Java. Esto evita errores silenciosos de
serialización cuando Angular espera un nombre y Spring devuelve otro.

Cuando el backend exista, se recomienda generar el cliente HTTP desde el
OpenAPI de Spring (`springdoc-openapi` + `openapi-generator`), para que los
DTOs de Java y los modelos TypeScript no se desincronicen con el tiempo.

---

## 6. Cálculos financieros: solo en backend

Ganancias, rentabilidad, tasa mensual, EA y consolidaciones se calculan
**en el backend y/o la base de datos** — nunca en Angular. El frontend solo
muestra números ya calculados, filtra visualmente, captura datos y gestiona
estado de UI. Esto evita duplicar lógica financiera entre las dos capas y
mantiene una única fuente de verdad.

---

## 7. Modelo de datos PostgreSQL

```sql
create table investments (
  id          bigserial primary key,
  user_id     uuid        not null,
  nombre      text        not null,
  entidad     text,
  tipo        text,
  moneda      char(3)     not null default 'COP',
  activa      boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, nombre)
);

create table daily_records (
  id                bigserial     primary key,
  investment_id     bigint        not null references investments(id) on delete cascade,
  fecha             date          not null,
  valor_unidad      numeric(18,6) not null,
  cantidad_unidades numeric(18,6),                    -- opcional, ver nota
  saldo_disponible  numeric(18,2) not null default 0,
  saldo_total       numeric(18,2) not null,
  movimiento        numeric(18,2) not null default 0, -- aporte(+) / retiro(-)
  nota              text,
  created_at        timestamptz   not null default now(),
  unique (investment_id, fecha)
);

create index on daily_records (investment_id, fecha desc);
```

**Reglas no negociables:** `numeric` en Postgres para cualquier cifra
monetaria, nunca `float`/`double`. `BigDecimal` en Java para todo el dominio
financiero.

**`cantidad_unidades` es opcional** porque el Excel real del usuario no
contiene esa columna. Se intentó derivarla matemáticamente de otros campos
y el resultado no fue consistente, así que queda nullable — sin inventar el
dato. Ningún cálculo actual (ganancia, rentabilidad, EA) depende de este
campo. A revisar en el futuro si el usuario empieza a registrarlo, sigue sin
usarse, o se elimina del modelo.

**`movimiento` es fundamental.** Positivo para aportes, negativo para
retiros, `0` por defecto. Sin este campo, un aumento de saldo por un aporte
se contabilizaría incorrectamente como ganancia.

**`unique (investment_id, fecha)`** habilita UPSERT:

```sql
insert into daily_records (...) values (...)
on conflict (investment_id, fecha) do update set ...;
```

Registrar un día nuevo crea el registro; corregir un día existente lo
actualiza. Sin duplicados, sin borrados manuales.

---

## 8. Vista de estadísticas diarias y manejo de gaps

```sql
create view v_daily_stats as
select
  r.investment_id,
  r.fecha,
  r.valor_unidad,
  r.cantidad_unidades,
  r.saldo_disponible,
  r.saldo_total,
  r.movimiento,
  lag(r.valor_unidad) over w as valor_unidad_prev,
  r.valor_unidad - lag(r.valor_unidad) over w as delta_unidad,
  round(
    (r.valor_unidad / nullif(lag(r.valor_unidad) over w, 0) - 1) * 100
  , 4) as variacion_pct,
  r.saldo_total - lag(r.saldo_total) over w - r.movimiento as ganancia_dia
from daily_records r
window w as (partition by r.investment_id order by r.fecha);
```

`lag()` compara contra el **registro anterior que exista**, no contra el día
calendario anterior. Si hay registros en `01/08`, `03/08` y `07/08`, el
`07/08` se compara contra el `03/08` — los gaps no rompen el cálculo.

**Regla de captura:** si en un día no registrado hubo un aporte o retiro,
ese movimiento debe sumarse al `movimiento` del siguiente día que sí se
registre. De lo contrario, el sistema interpreta ese cambio de saldo como
ganancia o pérdida falsa. La interfaz de histórico debe mostrar
explícitamente los gaps cuando haya más de un día entre dos registros
consecutivos.

---

## 9. Consolidación del portafolio (LOCF)

Cada inversión puede registrarse en fechas distintas. Para conocer el valor
del portafolio completo en una fecha dada, hace falta el último registro
conocido de cada inversión hasta esa fecha — *Last Observation Carried
Forward*:

```sql
create or replace function valor_a_fecha(p_investment_id bigint, p_fecha date)
returns daily_records as $$
  select *
  from daily_records
  where investment_id = p_investment_id
    and fecha <= p_fecha
  order by fecha desc
  limit 1
$$ language sql stable;
```

Valor consolidado actual de todo el portafolio:

```sql
select sum(saldo_total) as valor_portafolio_hoy
from (
  select distinct on (investment_id) *
  from daily_records
  where fecha <= current_date
  order by investment_id, fecha desc
) ultimos;
```

Mismo principio para cualquier consulta histórica del portafolio completo.

---

## 10. Fórmulas financieras

Validadas contra el Excel real del usuario (hoja **Fiducuenta**). No deben
modificarse sin una nueva validación contra datos reales.

### Ganancia de un período

```
ganancia_periodo = saldo_total(fecha_fin) − saldo_total(fecha_inicio) − Σ movimientos(fecha_inicio, fecha_fin]
```

Validado: `72.985.693 − 75.541.141 − (−3.000.000) = 444.552` ✓

### Tasa mensual

El denominador correcto es el **promedio de posesión** del período, no el
saldo inicial — así lo calcula el Excel del usuario, y representa mejor el
capital efectivamente mantenido:

```
tasa_mensual = ganancia_periodo / promedio_posesion
```

Validado: `444.552 / 74.698.920 = 0,5951 %` ✓

### Tasa efectiva anual (EA)

```
EA = (1 + tasa_mensual)^12 − 1
```

Validado: `(1 + 0,5951 %)^12 − 1 = 7,38 %` ✓

Versión generalizada para rangos que no son meses calendario exactos:

```
EA = (1 + rentabilidad_periodo)^(365 / dias_transcurridos) − 1
```

**Limitación aceptada conscientemente:** esta fórmula asume que los aportes
y retiros no distorsionan demasiado la rentabilidad. El cálculo riguroso
requeriría TIR/XIRR, ponderando *cuándo* entró cada peso. **Se decidió no
implementar XIRR por ahora**, por decisión explícita de evitar
sobreingeniería — pero el modelo de datos permite agregarlo después si los
aportes/retiros se vuelven frecuentes o grandes.

---

## 11. Contrato API planeado

Ningún endpoint está implementado todavía.

```
POST   /api/auth/login

GET    /api/investments
POST   /api/investments
PATCH  /api/investments/{id}

GET    /api/investments/{id}/records?from=&to=

POST   /api/records                              (individual o en lote, UPSERT)

GET    /api/dashboard?from=&to=&investmentId=     (métricas ya calculadas)
```

`GET /api/dashboard` es el endpoint más importante: debe devolver
`gananciaTotal`, `rentabilidadPct`, `eaPct` y demás métricas ya resueltas —
Angular nunca implementa las fórmulas financieras (ver sección 6).

---

## 12. Modelos TypeScript

```typescript
export interface Investment {
  id: number;
  nombre: string;
  entidad?: string;
  tipo?: string;
  moneda: string;
  activa: boolean;
}

export interface DailyRecord {
  id?: number;
  investmentId: number;
  fecha: string;               // 'YYYY-MM-DD'
  valorUnidad: number;
  cantidadUnidades?: number;   // opcional — ver sección 7
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

---

## 13. Autenticación

El login actual **es una simulación**: `onSubmit()` y `loginWithGoogle()`
usan `setTimeout`, no existe backend ni autenticación real todavía.

### Opciones evaluadas

| | Supabase Auth | Spring Security + JWT |
|---|---|---|
| Ventajas | Rápido de implementar, Google OAuth listo, Postgres gestionado | Control total, backend propio, más demostrable, mejor si a futuro hay requisitos regulatorios |
| Desventajas | Dependencia de proveedor externo, menos control de infraestructura | Mayor tiempo de implementación: hay que construir tokens, seguridad y flujo OAuth desde cero |

**Estado:** la base de datos ya se orientó a Postgres independiente
(dejando Supabase como posible proveedor de infraestructura, no como pieza
central), y la opción más alineada con la arquitectura actual es
`Angular → Spring Boot → Spring Security + JWT → PostgreSQL`. **Sin
embargo, esto todavía no es una decisión final.**

### Abstracción obligatoria

Independientemente de qué se elija, el frontend no debe depender
directamente del proveedor. Debe existir un `AuthService` propio:

```
login()
loginWithGoogle()
logout()
currentUser()
```

`LoginComponent` no debe importar `supabase-js` ni conocer detalles de
infraestructura — así se puede cambiar de proveedor sin tocar la pantalla.

### Persistencia de sesión (pendiente)

`localStorage` (más simple, mayor superficie de ataque XSS) vs. cookie
`httpOnly` (más segura, requiere arquitectura de cookies bien configurada).
**No decidido.**

---

## 14. Sistema de diseño

Generado inicialmente en **Stitch** (Google), dirección **Institutional
Dark**: sobrio, profesional, alta densidad de información, sin decoración
innecesaria — inspirado en Linear, Mercury, Stripe Dashboard. Se evita
explícitamente el look "fintech millennial" (gradientes llamativos,
ilustraciones decorativas, exceso de elementos comerciales). El producto
debe sentirse como una herramienta personal seria, no como un panel técnico.

### Tokens (`src/styles/tokens.css`)

Fuente única de verdad, CSS puro con variables nativas, registrado como
stylesheet global independiente en `angular.json` (no vía `@import` de
Sass, para que no se resuelva como `@import` nativo del navegador).

```css
:root {
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

  --font-heading: 'Hanken Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;

  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;

  --row-height: 40px;
  --row-height-compact: 36px;
}
```

Unidad base de espaciado: `4px`. Regla fundamental: **ningún color,
tipografía o espaciado se hardcodea en un componente si existe un token
equivalente.**

### Tipografía

**Hanken Grotesk** para títulos/encabezados, **Inter** para texto,
labels y datos. Toda cifra monetaria o tabla numérica debe usar
`font-variant-numeric: tabular-nums` para alinear dígitos en columna.

> **Incidente corregido:** Stitch generó el link de Google Fonts mal
> formado (`hankenGrotesk`, sin espacio), lo que impedía que la fuente
> cargara y hacía caer el navegador a un fallback serif. Corregido a
> `Hanken+Grotesk` en `index.html`.

### Modo oscuro/claro — implementado y luego revertido

Se llegó a construir un sistema completo de tema claro/oscuro
(`ThemeService`, signals, `localStorage`, `prefers-color-scheme`, toggle).
**Se revirtió.** Estado actual: **Dark Mode fijo**, tokens definidos
directamente en `:root`, sin selector `[data-theme='dark']` ni equivalente.

Si se retoma en el futuro, el patrón recomendado es: valores claros como
default en `:root`, mover los valores oscuros actuales a
`[data-theme='dark']`, y aplicar el tema con un script inline en
`index.html` **antes del primer paint**, para evitar flash del tema
incorrecto.

Al revertir el sistema de temas se detectaron y corrigieron tres
regresiones:
1. Faltaba `font-family` global en `html, body` (el navegador caía a
   Times/serif).
2. Faltaba la variable `--color-primary-contrast` usada por
   `.login__submit` — resuelta con un alias hacia `--color-on-primary`.
3. Los estilos de `.login__divider` y `.login__google` se habían perdido
   durante la limpieza — restaurados.

### Accesibilidad visual

Ganancia/pérdida nunca se comunica solo con color: siempre con signo
explícito (`+`/`−`) e indicador (`▲`/`▼`), por daltonismo rojo-verde.
`focus-visible` visible en todo elemento interactivo. Contraste verificado
en el tema oscuro.

---

## 15. Login — estado actual

Única pantalla funcionalmente codificada. `LoginComponent`: standalone,
`OnPush`, implementa `OnInit` y `OnDestroy`. Imports: `ReactiveFormsModule`,
`RouterLink`.

### Estado (Signals)

```typescript
showPassword = signal(false);
loading = signal(false);
errorMessage = signal<string | null>(null);
```

### Formulario

```typescript
form = formBuilder.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]],
  rememberMe: [false],
});
```

### Bloqueo de scroll al entrar/salir

```typescript
// ngOnInit
document.body.style.overflow = 'hidden';

// ngOnDestroy
document.body.style.overflow = '';
```

Angular Router garantiza que `ngOnDestroy` se ejecute al salir de la ruta,
así que el estado del `body` siempre se restaura.

### Validación con touched-gating

Los errores solo aparecen cuando `invalid && touched` — no se muestran
antes de que el usuario haya interactuado con el campo. Al intentar
enviar sin completar correctamente, `form.markAllAsTouched()` fuerza que
se muestren todos. Se usa `novalidate` en el `<form>` para desactivar la
validación nativa del navegador y dejar el control completo a Angular.

### Elementos de la pantalla

Ícono de marca (provisional) · campo de correo · campo de contraseña con
toggle mostrar/ocultar · checkbox "Mantener sesión iniciada" · mensaje de
error general · botón de login con estado de loading · enlace a
`/registrarse` (ruta prevista pero **fuera del alcance definitivo**, por
tratarse de app privada individual, no contempla registro público) ·
divisor "o" · botón "Continuar con Google" (stub).

**Recuperación de contraseña:** no contemplada.

### Login con Google (stub)

`loginWithGoogle()` deberá reemplazarse por Supabase OAuth (si se elige esa
vía) o backend propio + Google Identity Services (si se elige Spring
Security/JWT). El botón usa `type="button"` explícito para no disparar el
submit del formulario. El azul `#4285F4` del ícono de Google está
hardcodeado a propósito — es identidad de marca de Google, no del sistema
de colores propio de la app.

### Accesibilidad implementada

`for`/`id` en labels · `[attr.aria-invalid]` · `aria-describedby` ·
`aria-hidden="true"` en íconos decorativos · `role="alert"` en errores ·
`aria-live="polite"` · `aria-label` dinámico en el toggle de contraseña.
`aria-describedby` apunta siempre a un ID, aunque el elemento sea
condicional (`@if`) — una referencia a un ID que aún no existe se ignora
sin error y empieza a funcionar en cuanto el elemento aparece en el DOM.

### Problemas conocidos pendientes de corregir

- El campo de email muestra un ícono de persona/usuario; debería ser un
  sobre. Queda un `<path opacity="0">` residual de un ícono de sobre a
  medio implementar — hay que limpiarlo o completarlo.
- El ícono de marca ("trending up") es provisional, falta reemplazarlo por
  el definitivo.
- Existe `console.log('Intento de login', credentials)` que puede imprimir
  la contraseña en texto plano. Aceptable solo mientras el login sea un
  stub — **debe eliminarse antes de conectar el backend real.**

---

## 16. Pantallas pendientes

### Dashboard / Estadísticas (página principal)
Filtros: Hoy · Este mes · Mes anterior · Últimos 3 meses · YTD · Todo ·
Personalizado, más selector de inversión. 4 KPIs (valor total del
portafolio, ganancia del período, promedio diario, EA consolidada).
Gráficos: evolución del portafolio (línea/área, con marcadores de
aportes/retiros), ganancia diaria (barras verde/rojo), composición (dona o
barra apilada). Tabla resumen por inversión (saldo inicial/final, aportes,
ganancia, promedio de posesión, tasa mensual, tasa EA) con fila de totales.

### Mis Inversiones
Grilla de tarjetas (no tabla). Cada tarjeta: nombre, entidad/tipo, saldo
actual, valor de unidad + variación, sparkline de 30 días, fecha del último
registro (con advertencia si tiene más de 2 días de antigüedad). Acciones:
"+ Añadir día", "Ver histórico", Editar, Marcar inactiva, Eliminar. Modal de
crear/editar: nombre, entidad, tipo, moneda, activa.

### Histórico de inversión — la pantalla más importante
Panel de resumen del período (inicio, fin, total añadido, total retirado,
balance, promedio de posesión, tasa mensual, tasa EA). Tabla con columnas
`Fecha · Valor unidad · Cantidad unidades · Subió o bajó · Añadido/retirado
· Disponible · Saldo total · Rentabilidad diaria · Acciones`, distinguiendo
visualmente datos ingresados vs. calculados. Fila "Cierre anterior" fija
arriba como línea base. Edición inline (doble clic → input, Enter guarda,
Escape cancela). Gaps mostrados explícitamente. Header y footer de totales
sticky.

### Modal — Añadir/Editar registro diario
Orden de tabulación: Fecha (preseleccionada hoy) → Valor unidad (foco
automático) → Cantidad unidades (precargada si existe) → Saldo disponible
(precargado) → Saldo total (autocalculado, editable, con advertencia si no
coincide) → Movimiento (default 0, visualmente discreto) → Nota (colapsada).
Previsualización en vivo de "Subió o bajó" y "Rentabilidad del día" mientras
se escribe. Botones: Cancelar / Guardar / **Guardar y añadir otro** (para
ponerse al día con varios días atrasados sin reabrir el flujo).

### Captura masiva diaria (bonus, alcance no confirmado)
Una fila por inversión activa, precargada con últimos valores, un único
selector de fecha, navegación por teclado/Tab, un solo botón "Guardar
todo". Es, en términos de productividad, la pantalla que más directamente
reemplazaría la rutina diaria actual del Excel — pero su inclusión
definitiva **no está confirmada**.

---

## 17. Responsive

Diseño principal para escritorio (1440px), con soporte móvil requerido
(390px) para Login, Dashboard y Mis Inversiones. En móvil: sidebar →
navegación inferior o menú hamburguesa; tabla histórica → tarjetas
apiladas; botón "Añadir día" → FAB flotante.

---

## 18. Despliegue

| Componente | Plataforma | Estado |
|---|---|---|
| Frontend | Vercel | Confirmado, no desplegado |
| Backend | Railway (recomendado) | No confirmado — alternativas evaluadas: Render, Fly.io, Cloud Run, AWS (descartado por complejidad innecesaria) |
| Base de datos | Railway junto al backend, o Neon/Supabase desacoplado | No decidido |

La recomendación es mantener backend y base de datos en el mismo proveedor
para simplificar y minimizar latencia, pero no hay decisión final.

**Cold start:** en proveedores gratuitos como Render, un backend Spring
Boot puede tardar 15–40 segundos en despertar tras inactividad — relevante
para una app personal de uso diario. Railway no presenta este problema de
forma tan agresiva.

**CORS** (config planeada, dominio real pendiente de definir):

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("https://tuapp.vercel.app", "http://localhost:4200")
                    .allowedMethods("GET", "POST", "PATCH", "DELETE")
                    .allowCredentials(true);
            }
        };
    }
}
```

---

## 19. Migración de Google Sheets a PostgreSQL

Independiente del avance del frontend, puede ejecutarse en paralelo.

1. **Exportar** cada pestaña de inversión a CSV (`Archivo → Descargar →
   CSV`), un archivo por inversión.
2. **Limpiar**: eliminar filas de resumen (TOTAL MES, Promedio día, Tasa
   EA...) — son derivadas, se recalculan solas. Conservar solo:
   `fecha, valor_unidad, movimiento, saldo_disponible, saldo_total`.
3. **Reconstruir `movimiento`** copiando a mano la columna "Añadido o
   Retirado" del Excel. Es el paso más tedioso — no se encontró forma
   confiable de automatizarlo, porque el movimiento no se puede deducir
   solo observando el cambio de saldo.
4. **Importar** con script Python (`psycopg2`) usando
   `INSERT ... ON CONFLICT (investment_id, fecha) DO UPDATE` — permite
   re-ejecutar el script sin duplicar datos.
5. **Validar** comparando `v_daily_stats` contra "Subió o bajó" y
   "Rentabilidad diaria" del Excel original para los mismos días.

---

## 20. Orden de construcción y walking skeleton

Estrategia general: **frontend primero, backend/base de datos después.**

Orden original acordado: Shell/Sidebar → Captura diaria → CRUD de
inversiones → Dashboard → Login. En la práctica, Stitch generó primero el
Login, así que ese quedó construido fuera de orden; el shell sigue sin
construirse.

**No se debe construir toda la app contra mocks sin probar nunca contra
Postgres real.** Se acordó un *walking skeleton*:

1. Construir la captura diaria contra el mock.
2. Levantar Postgres local.
3. Crear un único endpoint real: `POST /api/records`.
4. Probar el flujo completo `Angular → Spring Boot → PostgreSQL`.
5. Validar que el contrato funciona de punta a punta.
6. Recién ahí, seguir construyendo el resto de las pantallas.

Esto reduce el riesgo de descubrir problemas de arquitectura demasiado
tarde, cuando ya hay varias pantallas construidas sobre un supuesto
equivocado.

---

## 21. Incidentes de entorno resueltos

| Problema | Causa | Solución |
|---|---|---|
| `ng new ... --standalone` → flag desconocido | El flag fue removido; standalone es el único modo en versiones recientes del CLI | `ng new frontend --routing --style=scss --ssr=false` (sin el flag) |
| `Warning: Node 26 not supported` | Angular soporta `^20.19.0 \| ^22.12.0 \| ^24.0.0`; Node 26 quedaba fuera de rango | `nvm install 22 && nvm use 22 && nvm alias default 22` |
| `npm error EACCES` en `.npm/_cacache` | Caché de npm con archivos de `root` por uso previo de `sudo npm install -g` | `sudo chown -R 501:20 "/Users/andresperez/.npm"` — regla: no volver a usar `sudo` con npm |
| `npm install @angular/localize` → `ERESOLVE` | `npm install` sin versión trae la última publicada, incompatible con Angular 21 | `ng add @angular/localize` — resuelve la versión compatible automáticamente |
| Título del login en fuente serif | Link de Google Fonts mal formado (`hankenGrotesk` sin espacio) | Corregido a `Hanken+Grotesk` en `index.html` |

---

## 22. Principios que deben mantenerse

Reglas de arquitectura y producto que no deben violarse a medida que avanza
el desarrollo:

1. La captura diaria debe ser más rápida que Excel.
2. Los cálculos financieros viven en backend/base de datos, nunca en
   Angular.
3. No inventar datos para los mocks — usar datos reales del Excel siempre
   que sea posible.
4. Mantener la separación mediante Repository.
5. El frontend no depende directamente del proveedor de autenticación.
6. `numeric` en Postgres y `BigDecimal` en Java para todo valor financiero.
7. Nunca contabilizar aportes/retiros como ganancias.
8. Usar LOCF para consolidar inversiones con fechas de registro distintas.
9. No modificar las fórmulas ya validadas contra el Excel sin nueva
   validación.
10. Mantener BEM y el sistema centralizado de tokens.
11. No hardcodear color, tipografía o espaciado si existe un token.
12. Mantener el estilo Institutional Dark; no reinventar el diseño entre
    pantallas.
13. Toda pantalla nueva generada con Stitch/Figma debe usar explícitamente
    el mismo sistema visual ya existente.
14. La interfaz está en español y debe sentirse como app financiera
    personal, no como panel técnico/administrativo.
15. No construir toda la app contra mocks sin ejecutar después un walking
    skeleton real con Postgres.
16. Accesibilidad como requisito desde el desarrollo, no como corrección
    posterior.
17. La información financiera nunca depende solo del color para comunicar
    ganancia/pérdida.
18. El modelo debe poder evolucionar hacia algo más riguroso (ej. XIRR) sin
    necesidad de rediseñar la base de datos desde cero.

---

## 23. Decisiones abiertas

Nada de esto debe asumirse como resuelto antes de avanzar en esa área:

- **Autenticación:** Spring Security + JWT vs. Supabase Auth. La
  arquitectura ya exige que quede detrás de un `AuthService` abstracto,
  cualquiera sea la elección.
- **Persistencia de sesión:** `localStorage` vs. cookie `httpOnly`.
- **Hosting del backend:** Railway es la recomendación, no confirmada.
- **Hosting de Postgres:** junto al backend en Railway, en Neon, o en
  Supabase solo como proveedor de base de datos — no decidido.
- **`cantidad_unidades`:** sigue opcional; falta decidir si se empieza a
  registrar, se abandona, o se elimina del modelo.
- **Captura masiva diaria:** alcance no confirmado (bonus vs. entra al
  producto).
- **Mock con datos reales:** arquitectura aceptada, pero pendiente de que
  el usuario aporte las filas reales del Excel para construir el
  `MockInvestmentsRepository`.

---

## 24. Arquitectura objetivo

```
                    ┌──────────────────────┐
                    │       Usuario         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Angular 21.x        │
                    │   Frontend             │
                    │                        │
                    │   Login · Dashboard    │
                    │   Inversiones          │
                    │   Histórico · Captura  │
                    └──────────┬───────────┘
                               │
                     InvestmentsRepository
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
   MockInvestmentsRepository       HttpInvestmentsRepository
                 │                           │
                 │                           ▼
                 │                 ┌────────────────────┐
                 │                 │   Spring Boot       │
                 │                 │   REST API           │
                 │                 │   Auth · Investments │
                 │                 │   Records · Dashboard│
                 │                 └─────────┬───────────┘
                 │                           │
                 │                           ▼
                 │                 ┌────────────────────┐
                 │                 │   PostgreSQL        │
                 │                 │   investments        │
                 │                 │   daily_records       │
                 │                 │   v_daily_stats       │
                 │                 └────────────────────┘
                 │
                 ▼
        Datos reales del Excel
        (para desarrollo/mock)
```

Se empieza en `Angular → Mock` y se evoluciona a
`Angular → Spring Boot → PostgreSQL` sin reescribir pantallas ni lógica de
presentación — ese es justamente el propósito del patrón Repository.

---

## 25. Estado actual detallado

### Completado
- [x] Proyecto Angular creado (21.x, standalone)
- [x] Entorno local configurado (Node vía nvm, permisos npm corregidos)
- [x] Prompt completo de diseño UI
- [x] Login diseñado en Stitch, corregido a español y tono de app personal
- [x] Login codificado (Signals, OnPush, Reactive Forms, accesibilidad)
- [x] Sistema de tokens CSS
- [x] Modelos TypeScript del contrato
- [x] Esquema PostgreSQL diseñado
- [x] Fórmulas financieras validadas contra Excel real
- [x] Arquitectura Repository definida
- [x] Contrato API diseñado
- [x] Arquitectura general del frontend definida
- [x] Estrategia de migración de datos definida
- [x] Estrategia de walking skeleton definida

### Pendiente
- [ ] Confirmar que Login renderiza correctamente en navegador
- [ ] Corregir ícono de email (actualmente persona, debería ser sobre) y
      limpiar el `<path opacity="0">` residual
- [ ] Reemplazar ícono de marca provisional
- [ ] Eliminar `console.log` de credenciales antes de conectar backend real
- [ ] Construir `InvestmentsRepository` y `MockInvestmentsRepository` con
      datos reales del Excel
- [ ] Construir Shell / Sidebar / Layout
- [ ] Construir captura diaria, CRUD de inversiones, Dashboard, Histórico,
      modales
- [ ] Decidir si se implementa captura masiva
- [ ] Implementar backend Spring Boot
- [ ] Provisionar PostgreSQL
- [ ] Decidir e implementar autenticación real (JWT vs. Supabase Auth)
- [ ] Decidir persistencia de sesión
- [ ] Implementar CORS
- [ ] Ejecutar walking skeleton
- [ ] Migrar datos históricos
- [ ] Desplegar frontend y decidir/desplegar backend y base de datos