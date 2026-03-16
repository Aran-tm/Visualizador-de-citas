# 📅 Visualizador de Citas

Una aplicación de gestión de citas estética/profesional construida con **Angular 21** usando los últimos patrones modernos: Signals, componentes standalone, arquitectura basada en dominio y persistencia local.

---

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# o
npx ng serve

# Compilar para producción
npx ng build
```

La aplicación estará disponible en `http://localhost:4200`.

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una **arquitectura basada en dominios**, organizada dentro de la carpeta `libs/`:

```
visualizador_citas/
├── apps/
│   └── visualizador_citas/         # Aplicación principal Angular (entry point)
│       └── src/
│           ├── app/
│           │   └── pages/
│           │       └── appointments/
│           │           ├── calendar-page.component.ts
│           │           └── calendar-page.component.html
│           ├── index.html
│           └── styles.css
│
└── libs/
    ├── domain/                     # Capa de Dominio (reglas de negocio puras)
    ├── data-access/                # Capa de Acceso a Datos (repositorios)
    ├── features/                   # Capa de Funcionalidades (UI + servicios)
    └── core/                       # Utilidades compartidas
```

---

## 📐 Capas de la Arquitectura

### 1. 🎯 Capa de Dominio (`libs/domain/`)

Contiene las **definiciones puras** del negocio, sin dependencias de Angular o frameworks. Es el núcleo de la aplicación.

#### Modelos
- **`Appointment`** – Define la estructura de una cita:
  - `id`: Identificador único (ej. `apt-1`)
  - `clientName`: Nombre del cliente
  - `serviceName`: Servicio solicitado
  - `teamMember`: Profesional asignado
  - `startTime` / `endTime`: Fechas de inicio y fin (`Date`)
  - `status`: Estado de la cita (`AppointmentStatus`)
  - `notes`: Notas adicionales (opcional)

- **`Client`** – Define la estructura de un cliente

#### Enums
- **`AppointmentStatus`** – Los tres posibles estados de una cita:
  - `Confirmed` → Confirmada (verde)
  - `Pending` → Pendiente (amarillo)
  - `Cancelled` → Cancelada (rojo)

#### Interfaces de Repositorio
- **`IAppointmentRepository`** – Contrato que define qué operaciones debe implementar cualquier fuente de datos:
  - `getAll()` → Obtener todas las citas
  - `create()` → Crear una cita
  - `update()` → Actualizar una cita
  - `delete()` → Eliminar una cita

#### Tokens de Inyección
- **`APPOINTMENT_REPOSITORY`** – Token de Angular para inyectar el repositorio de citas
- **`CLIENT_REPOSITORY`** – Token de Angular para inyectar el repositorio de clientes

> **¿Por qué tokens?** Permiten intercambiar la implementación del repositorio sin modificar el código de la aplicación. Hoy usa `LocalStorage`, mañana podría usar una API REST con cero cambios en la lógica de negocio.

---

### 2. 🗄️ Capa de Acceso a Datos (`libs/data-access/`)

Contiene las **implementaciones concretas** de los repositorios.

#### `MockAppointmentRepository`
Implementación activa que persiste datos en el navegador usando **LocalStorage**.

**Clave de almacenamiento:** `visualizador_citas_data`

**Flujo de datos:**
1. Al **iniciar**, lee las citas del `localStorage` y las deserializa (convierte las fechas de `string` a `Date`)
2. Al **crear/actualizar/eliminar**, actualiza el array en memoria y sincroniza `localStorage`
3. Genera IDs automáticos con el formato `apt-N` (encuentra el mayor ID existente y continúa desde ahí)

---

### 3. ⚙️ Capa de Funcionalidades (`libs/features/`)

Organizada por ámbito de negocio. Contiene los **servicios de aplicación** y los **componentes de UI**.

#### Servicio Principal: `AppointmentService`

```typescript
@Injectable({ providedIn: 'root' })
export class AppointmentService { ... }
```

Es el **cerebro** de la aplicación. Gestiona el estado global usando **Angular Signals**:

| Signal | Tipo | Descripción |
|--------|------|-------------|
| `appointments` | `signal<Appointment[]>` | Lista completa de citas |
| `selectedDate` | `signal<Date>` | Fecha actualmente seleccionada |
| `viewMode` | `signal<'day' \| 'week'>` | Vista activa (día o semana) |
| `teamMembers` | `signal<string[]>` | Lista de profesionales disponibles |
| `services` | `signal<string[]>` | Catálogo de servicios disponibles |
| `filteredAppointments` | `computed()` | Citas filtradas por fecha/semana activa |

**Métodos principales:**
- `loadAll()` – Carga todas las citas desde el repositorio
- `create(dto)` – Crea y valida una nueva cita
- `update(id, dto)` – Actualiza una cita existente
- `delete(id)` – Elimina una cita por ID

---

## 🖥️ Componentes de UI

### `CalendarPageComponent` (Página principal)
**Archivo:** `apps/.../calendar-page.component.ts`  
**Responsabilidad:** Orquesta toda la aplicación. Gestiona el estado de la UI (modal abierto/cerrado, fecha seleccionada) y conecta todos los subcomponentes.

**Señales de estado local:**
- `showModal` – Si el modal está visible
- `selectedAppointment` – Cita seleccionada para editar
- `pendingCreateDate` – Fecha preseleccionada al crear desde un slot de tiempo

---

### `DayViewComponent`
**Archivo:** `libs/features/appointments/ui/day-view/`  
**Responsabilidad:** Muestra la cuadrícula de **una sola jornada** con las 24 horas del día.

- Recibe las citas del día como `input()` signal
- Dibuja cada cita como un bloque posicionado absolutamente mediante CSS
- La posición vertical (`top`) se calcula a partir de la hora de inicio
- La altura (`height`) se calcula a partir de la duración con un mínimo de `48px`

**Fórmula de posición:**
```
top    = hora * 80px + (minutos / 60) * 80px
height = max(48px, (duracionMinutos / 60) * 80px)
```

---

### `WeekViewComponent`
**Archivo:** `libs/features/appointments/ui/week-view/`  
**Responsabilidad:** Muestra la cuadrícula de **una semana completa** (7 columnas, una por día).

- Calcula automáticamente los 7 días de la semana a partir de `startDate`
- Para cada día, filtra las citas correspondientes
- Aplica la misma fórmula de posición/altura que `DayView`
- Resalta el día actual visualmente

---

### `AppointmentCardComponent`
**Archivo:** `libs/features/appointments/ui/appointment-card/`  
**Responsabilidad:** Tarjeta visual de una sola cita dentro del calendario.

- Muestra: nombre del cliente, servicio, rango horario y profesional
- Cambia de color según el **estado** de la cita:
  - 🟢 Confirmada → Verde (`bg-green-100`)
  - 🟡 Pendiente → Amarillo (`bg-yellow-100`)
  - 🔴 Cancelada → Rojo (`bg-red-100`)
- Emite un `output()` al ser clicada para abrir el modal de edición

---

### `AppointmentModalComponent`
**Archivo:** `libs/features/appointments/ui/appointment-modal/`  
**Responsabilidad:** Modal para **crear** y **editar** citas. Es el único componente con **Reactive Forms**.

**Estructura del formulario (`FormBuilder`):**
| Campo | Validación |
|-------|-----------|
| `clientName` | Requerido |
| `serviceName` | Requerido |
| `teamMember` | Requerido |
| `date` | Requerido |
| `startTime` | Requerido |
| `endTime` | Requerido |
| `status` | – |
| `notes` | – |

**Flujo de creación:**
1. Usuario rellena el formulario
2. Pulsa "Confirmar Cita"
3. Se muestra un **spinner de carga** (800ms de delay artificial)
4. Los datos se guardan en el servicio → repositorio → `localStorage`
5. El calendario se actualiza automáticamente via Signals

**Flujo de eliminación:**
1. Usuario pulsa "Eliminar Cita"
2. Aparece un **modal de confirmación** secundario
3. Al confirmar, se muestra un spinner de "Eliminando..."
4. La cita se elimina del servicio → repositorio → `localStorage`

**Comportamiento de modales:**
- Al hacer clic **fuera** del modal se cierra automáticamente
- El botón de cerrar (✕) también cierra el modal

---

## 🔄 Flujo de Datos Completo

```
Usuario interactúa
       ↓
CalendarPageComponent (page)
       ↓
AppointmentService (signal state)
       ↓
IAppointmentRepository (interfaz de contrato)
       ↓
MockAppointmentRepository (LocalStorage)
       ↑
  Se actualiza el signal
       ↑
Angular re-renderiza los componentes afectados (OnPush + Signals)
```

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|-----------|-----|
| Angular 21 | Framework principal |
| Angular Signals | Gestión de estado reactivo |
| Reactive Forms | Formulario del modal |
| TailwindCSS | Estilos y diseño |
| LocalStorage | Persistencia de datos |
| NgOptimizedImage | Carga optimizada del logo |
| Server-Side Rendering (SSR) | Angular Universal |

---

## 📁 Estructura de Archivos Completa

```
libs/
├── domain/
│   ├── appointments/
│   │   ├── enums/
│   │   │   └── appointment-status.enum.ts
│   │   ├── models/
│   │   │   └── appointment.model.ts
│   │   ├── repositories/
│   │   │   └── appointment.repository.interface.ts
│   │   └── tokens/
│   │       └── appointment-repository.token.ts
│   └── clients/
│       ├── models/client.model.ts
│       ├── repositories/client.repository.interface.ts
│       └── tokens/client-repository.token.ts
│
├── data-access/
│   ├── appointments/
│   │   └── repositories/
│   │       └── mock-appointment.repository.ts
│   └── clients/
│       └── repositories/
│           └── mock-client.repository.ts
│
├── features/
│   ├── appointments/
│   │   ├── services/
│   │   │   └── appointment.service.ts
│   │   └── ui/
│   │       ├── appointment-card/
│   │       │   ├── appointment-card.component.ts
│   │       │   └── appointment-card.component.html
│   │       ├── appointment-modal/
│   │       │   ├── appointment-modal.component.ts
│   │       │   └── appointment-modal.component.html
│   │       ├── day-view/
│   │       │   ├── day-view.component.ts
│   │       │   └── day-view.component.html
│   │       └── week-view/
│   │           ├── week-view.component.ts
│   │           └── week-view.component.html
│   └── clients/
│       └── services/
│           └── client.service.ts
│
└── core/
    └── utils/
        └── date-utils.ts
```

---

## 💡 Patrones y Decisiones de Diseño

### Inversión de Dependencias (Dependency Inversion)
El `AppointmentService` no conoce de dónde vienen los datos. Solo conoce la interfaz `IAppointmentRepository`. Esto hace que cambiar de `LocalStorage` a una API real sea trivial: basta con crear una nueva implementación y registrarla en el token.

### Angular Signals (fine-grained reactivity)
En lugar de `BehaviorSubject` o `@Input()` con `ngOnChanges`, se usan Signals con `computed()`. Angular solo re-renderiza exactamente el fragmento de la UI que leyó el signal que cambió.

### ChangeDetectionStrategy.OnPush
Todos los componentes usan `OnPush`, lo que significa que Angular solo comprueba si hay cambios cuando:
- Un `input()` signal referenciado cambia
- Un `computed()` signal derivado cambia
- Se dispara un evento del DOM dentro del componente

### Standalone Components
No se usan `NgModule`. Cada componente declara sus propios `imports[]`, lo que facilita entender de un vistazo qué dependencias tiene cada componente.
