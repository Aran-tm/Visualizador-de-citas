# 📋 Documento de Decisiones Técnicas
### Visualizador de Citas — Angular 21

> Este documento explica de forma exhaustiva y profesional cada decisión técnica tomada durante el desarrollo de la aplicación, incluyendo el razonamiento detrás de cada patrón arquitectónico, tecnología elegida y solución aplicada.

---

## Índice

1. [Arquitectura basada en Dominios (DDD)](#1-arquitectura-por-capas)
2. [Angular Signals como Sistema de Estado](#2-angular-signals)
3. [Patrón Repositorio + Tokens de Inyección](#3-patrón-repositorio)
4. [Persistencia con LocalStorage](#4-persistencia-con-localstorage)
5. [Standalone Components (sin NgModule)](#5-standalone-components)
6. [ChangeDetectionStrategy.OnPush](#6-changedetectionstrategy-onpush)
7. [Reactive Forms con FormBuilder y Validators](#7-reactive-forms)
8. [ControlValueAccessor en TimeRangeSelectorComponent](#8-controlvalueaccessor)
9. [Separación de HTML en archivos externos](#9-separacion-de-html)
10. [Cálculo de posición de citas en el calendario](#10-calculo-de-posicion)
11. [NgOptimizedImage para el logo](#11-ngoptimizedimage)
12. [Icono de la aplicación (Favicon)](#12-favicon)
13. [Spinner y delay artificial](#13-spinner-y-delay)
14. [Modal de confirmación de eliminación](#14-modal-de-eliminacion)
15. [Cierre de modales al hacer clic fuera](#15-cierre-de-modales)
16. [Altura mínima en tarjetas de cita](#16-altura-minima)

---

## 1. Arquitectura por Capas

### ¿Qué se hizo?
Se organizó todo el código en tres grandes capas dentro de la carpeta `libs/`:

```
libs/
├── domain/         ← Reglas de negocio puras (modelos, interfaces, enums)
├── data-access/    ← Implementaciones concretas de acceso a datos
└── features/       ← Lógica de aplicación + componentes de UI
```

### ¿Por qué?
Esta separación sigue los principios de **Domain-Driven Design (DDD)** y **Clean Architecture**:

- **Independencia del framework:** La capa `domain/` no importa nada de Angular. Podría usarse en Node.js, React o cualquier otro framework sin cambios.
- **Testeabilidad:** Cada capa puede probarse de forma aislada. El dominio no requiere un entorno Angular para ejecutar sus tests.
- **Claridad de responsabilidades:** Un desarrollador nuevo al proyecto sabe inmediatamente dónde buscar cada tipo de código.
- **Escalabilidad:** Si mañana se añade una vista de clientes o una pantalla de reportes, se crea un nuevo módulo dentro de `features/` sin tocar el dominio.

### La regla de dependencias
Las dependencias solo fluyen hacia adentro:

```
features/ → data-access/ → domain/   ✅
domain/ → features/                   ❌ Prohibido
```

Esto garantiza que el núcleo del negocio nunca se "contamine" con detalles de implementación.

---

## 2. Angular Signals como Sistema de Estado

### ¿Qué se hizo?
Se usaron **Angular Signals** (introducidos en Angular 16, maduros en Angular 19) para gestionar todo el estado de la aplicación en lugar de `BehaviorSubject` + `async pipe` de RxJS.

```typescript
// En AppointmentService
private appointmentsSignal = signal<Appointment[]>([]);
readonly appointments = computed(() => this.appointmentsSignal());
readonly filteredAppointments = computed(() => { /* filtra por fecha/semana */ });
```

### ¿Por qué Signals y no RxJS?

| Criterio | RxJS (BehaviorSubject) | Angular Signals |
|---|---|---|
| Complejidad | Alta (subscribe, unsubscribe, pipes) | Baja (lectura directa como función) |
| Memory leaks | Frecuentes si no se hace `unsubscribe` | Imposibles por diseño |
| Integración con OnPush | Requiere `async pipe` en todo el template | Nativa, automática |
| Curva de aprendizaje | Empinada (operadores RxJS) | Mínima |
| Reactividad granular | No, re-evalúa el observable completo | Sí, solo lo que cambió |

Los Signals son **la solución de estado recomendada por el equipo de Angular** para nuevos proyectos a partir de Angular 17+.

### `computed()` para estado derivado
```typescript
readonly filteredAppointments = computed(() => {
  const allAppointments = this.appointmentsSignal();
  const date = this.selectedDateSignal();
  const mode = this.viewModeSignal();
  // filtra...
});
```

`computed()` recalcula automáticamente cuando cualquier signal del que depende cambia. Es el equivalente reactivo de una función pura: mismo input → mismo output.

---

## 3. Patrón Repositorio + Tokens de Inyección

### ¿Qué se hizo?
Se definió una **interfaz de repositorio** en la capa de dominio y se inyecta mediante un **token** de Angular, en lugar de inyectar directamente la implementación concreta.

```typescript
// domain/appointments/repositories/appointment.repository.interface.ts
export interface IAppointmentRepository {
  getAll(): Appointment[];
  create(dto: CreateAppointmentDto): Appointment;
  update(id: string, dto: UpdateAppointmentDto): Appointment | undefined;
  delete(id: string): void;
}

// domain/appointments/tokens/appointment-repository.token.ts
export const APPOINTMENT_REPOSITORY = new InjectionToken<IAppointmentRepository>(
  'APPOINTMENT_REPOSITORY'
);
```

```typescript
// En AppointmentService — solo conoce la interfaz, no la clase concreta
private repository: IAppointmentRepository = inject(APPOINTMENT_REPOSITORY);
```

### ¿Por qué?
Este patrón implementa el principio **DIP (Dependency Inversion Principle)** de SOLID:

> *"Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."*

**Ventaja práctica:** Si el día de mañana se quiere conectar la aplicación a una API REST real, basta con:
1. Crear `HttpAppointmentRepository implements IAppointmentRepository`
2. Cambiar el token en `app.config.ts`
3. **Cero cambios** en `AppointmentService` ni en ningún componente

Actualmente usa `MockAppointmentRepository` (LocalStorage). La transición a producción sería transparente para toda la capa de negocio.

---

## 4. Persistencia con LocalStorage

### ¿Qué se hizo?
Se implementó `MockAppointmentRepository` que guarda y recupera citas del `localStorage` del navegador bajo la clave `visualizador_citas_data`.

```typescript
const STORAGE_KEY = 'visualizador_citas_data';

private loadFromStorage(): void {
  if (!isPlatformBrowser(this.platformId)) return; // Guard SSR
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    this.appointments = parsed.map(apt => ({
      ...apt,
      startTime: new Date(apt.startTime), // Deserialización de fechas
      endTime: new Date(apt.endTime),
    }));
  }
}
```

### Decisiones específicas

**1. Guard de SSR (`isPlatformBrowser`):**
La aplicación usa Angular Universal (SSR). `localStorage` no existe en Node.js. Sin este guard, el servidor crashearía al intentar acceder a `window.localStorage`. Se inyecta `PLATFORM_ID` para discriminar si estamos en el navegador o el servidor.

**2. Deserialización de fechas:**
JSON no tiene un tipo `Date`. Al parsear el JSON del storage, los campos `startTime` y `endTime` vienen como strings ISO (`"2025-03-13T10:00:00.000Z"`). Se convierten explícitamente a `new Date()` al cargar.

**3. Generación de IDs:**
Para no reiniciar el contador de IDs (`apt-1`, `apt-2`...) cada vez que la app arranca con datos existentes en storage, al cargar se busca el ID más alto y el contador se posiciona desde ahí:
```typescript
let maxId = 0;
for (const apt of this.appointments) {
  const num = parseInt(apt.id.replace('apt-', ''), 10);
  if (!isNaN(num) && num > maxId) maxId = num;
}
this.idCounter = maxId + 1;
```

---

## 5. Standalone Components (sin NgModule)

### ¿Qué se hizo?
Todos los componentes son **standalone** — no se declaran en ningún `NgModule`. Cada componente declara sus propias dependencias en el array `imports[]`.

```typescript
@Component({
  selector: 'app-day-view',
  imports: [CommonModule, AppointmentCardComponent], // <-- autosuficiente
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './day-view.component.html',
})
export class DayViewComponent { ... }
```

### ¿Por qué?

Los `NgModule` fueron durante años el mecanismo de Angular para organizar la aplicación, pero introducían problemas serios:

- **Dificultad de entender el grafo de dependencias:** Un componente podía usar una directiva declarada en un módulo que se importaba en otro módulo que se importaba en el módulo raíz... imposible de rastrear.
- **Tree-shaking incompleto:** Si un módulo exportaba 20 componentes y solo usabas 1, los 20 podían acabar en el bundle.
- **Boilerplate innecesario:** Tenías que declarar el componente en un módulo para que funcionara.

Con **Standalone Components**, cada componente es autosuficiente: sabes exactamente qué necesita leyendo solo su `imports[]`. Angular 19 deshabilita `standalone: true` en el decorador porque **es el comportamiento por defecto**.

---

## 6. ChangeDetectionStrategy.OnPush

### ¿Qué se hizo?
Todos los componentes tienen configurado `changeDetection: ChangeDetectionStrategy.OnPush`.

### ¿Por qué?

Angular tiene dos estrategias de detección de cambios:

**Default:** Angular comprueba el árbol completo de componentes en cada evento del DOM, timer o promesa. En apps grandes, esto puede revisar cientos de componentes innecesariamente.

**OnPush:** Angular solo comprueba un componente cuando:
1. Una referencia de `@Input()` (o `input()` signal) cambia
2. Un event handler del propio componente se dispara
3. Un Signal que el template lee cambia

Con Angular Signals + OnPush, el sistema de detección de cambios se vuelve **quirúrgico**: solo re-renderiza exactamente el fragmento del DOM que debe cambiar. Esto es especialmente importante en el calendario, donde se dibujan decenas de elementos por hora.

---

## 7. Reactive Forms

### ¿Qué se hizo?
El formulario de citas (`AppointmentModalComponent`) usa **Reactive Forms** en lugar de Template-Driven Forms.

```typescript
form = this.fb.group({
  clientName: ['', Validators.required],
  serviceName: ['', Validators.required],
  teamMember:  ['', Validators.required],
  date:        ['', Validators.required],
  timeRange:   [null, [timeRangeRequired, timeRangeValidator]], // ← CVA
  status:      [AppointmentStatus.Pending, Validators.required],
  notes:       [''],
});
```

### ¿Por qué Reactive Forms y no Template-Driven?

| Criterio | Template-Driven | Reactive Forms |
|---|---|---|
| Control del estado | Indirecto (vía `ngModel`) | Directo (imperativo desde TS) |
| Validaciones complejas | Difíciles de componer | Funciones puras componibles |
| Testabilidad | Requiere el DOM | Testeable sin componente |
| Inicialización dinámica | Complicada | `patchValue()`/`reset()` triviales |
| Integración con CVA | Limitada | Total |

En el modal, el formulario se inicializa de dos formas distintas (creación vs. edición) y los valores vienen de un Signal externo (`appointment()`). Reactive Forms hace esto trivial con `patchValue()` en un `effect()`.

### Validadores personalizados
Se crearon dos validadores custom para el control `timeRange`:

```typescript
// Requiere que ambos campos (start y end) estén presentes
const timeRangeRequired: ValidatorFn = (control) => {
  const value = control.value as TimeRange | null;
  return value?.start && value?.end ? null : { required: true };
};

// Requiere que la hora de fin sea posterior a la de inicio
const timeRangeValidator: ValidatorFn = (control) => {
  const value = control.value as TimeRange | null;
  if (!value?.start || !value?.end) return null;
  return value.start >= value.end ? { timeRangeInvalid: true } : null;
};
```

Los validadores de Angular son simplemente funciones puras: reciben un `AbstractControl` y devuelven `null` (válido) o un objeto de error.

---

## 8. ControlValueAccessor en TimeRangeSelectorComponent

### ¿Qué se hizo?
Se extrajo la lógica de selección de horas en un **componente Angular con CVA (ControlValueAccessor)**. Este componente gestiona internamente dos `<input type="time">` pero expone al `FormGroup` padre un único valor compuesto `{ start: string, end: string }`.

```typescript
// Registro: le dice a Angular que este componente es un form control válido
providers: [{
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => TimeRangeSelectorComponent),
  multi: true,
}]
```

### Las 4 funciones de CVA explicadas en contexto

```typescript
// 1. writeValue — El padre envía el valor al hijo (modelo → vista)
// Ocurre cuando el modal hace: form.patchValue({ timeRange: { start: '09:00', end: '10:00' } })
writeValue(value: TimeRange | null): void {
  this.startTime.set(value?.start ?? '');  // Actualiza el signal interno
  this.endTime.set(value?.end ?? '');      // y el input se re-renderiza
}

// 2. registerOnChange — El hijo avisa al padre cuando el valor cambia (vista → modelo)
// Angular llama a esto una vez al inicio y le entrega la función `fn`.
// El hijo la guarda y la invoca cada vez que el usuario edita un campo.
registerOnChange(fn: (value: TimeRange) => void): void {
  this.onChange = fn;
}
// Uso en el template handler:
onStartChange(value: string): void {
  this.startTime.set(value);
  this.onChange({ start: value, end: this.endTime() }); // ← avisa al padre
}

// 3. registerOnTouched — El hijo avisa al padre que el usuario interactuó
// Necesario para que Angular active las clases CSS de validación (ng-touched).
registerOnTouched(fn: () => void): void {
  this.onTouched = fn;
}
// Uso en el template:
onBlur(): void {
  this.onTouched(); // ← se llama cuando el input pierde el foco
}

// 4. setDisabledState — El padre indica si el control debe deshabilitarse
// Se activa al llamar form.controls['timeRange'].disable()
setDisabledState(isDisabled: boolean): void {
  this.isDisabled.set(isDisabled); // Signal que deshabilita los inputs
}
```

### ¿Por qué CVA y no simples @Input()/@Output()?

| Sin CVA | Con CVA |
|---|---|
| El modal necesita gestionar `startTime` y `endTime` como controles separados | El modal tiene un único control `timeRange` |
| No se puede usar `formControlName` | Se usa `formControlName="timeRange"` igual que un `<input>` nativo |
| La validación de rango la gestiona el modal | La valida el propio `FormControl` con el validador adjunto |
| Si se reutiliza en otro formulario, hay que copiar toda la lógica | Se importa el componente y listo |

CVA es el patrón correcto cuando un componente visual complejo debe comportarse como un control de formulario de primera clase. Permite que el componente sea **completamente opaco** para el padre: el `FormGroup` no sabe (ni le importa) que internamente hay dos inputs.

---

## 9. Separación de HTML en archivos externos

### ¿Qué se hizo?
Se extrajo el `template: \`...\`` inline de cada componente a un archivo `.component.html` separado, usando `templateUrl`.

**Antes:**
```typescript
@Component({
  selector: 'app-day-view',
  template: `
    <div class="flex flex-col h-full...">
      <!-- 50+ líneas de HTML mezcladas con TypeScript -->
    </div>
  `
})
```

**Después:**
```typescript
@Component({
  selector: 'app-day-view',
  templateUrl: './day-view.component.html', // ← archivo separado
})
```

### ¿Por qué?

1. **Legibilidad:** Un archivo TypeScript con 200 líneas de HTML incrustado es extremadamente difícil de leer, depurar y mantener. Al separarlo, cada archivo tiene una sola responsabilidad.

2. **Autocompletado del editor:** Los archivos `.html` activan el Language Server de Angular para el HTML, lo que proporciona autocompletado de directivas, bindings y componentes. Dentro de un template string de TypeScript, este soporte es parcial.

3. **Code review:** Al revisar un PR, los cambios de lógica (`.ts`) y los cambios visuales (`.html`) aparecen en archivos distintos, lo que hace la revisión mucho más clara.

4. **Convención del ecosistema:** Es el estándar de facto en todos los proyectos Angular enterprise. Los generadores del CLI (`ng generate component`) crean siempre archivos separados por defecto.

### Corrección de rutas
Durante la extracción, el componente `appointment-card.component.ts` estaba ubicado en la raíz de `ui/` mientras su HTML se creó en `ui/appointment-card/`. Esto requirió ajustar el `templateUrl` a una ruta relativa que cruzara la carpeta:
```typescript
templateUrl: './appointment-card/appointment-card.component.html'
```

---

## 10. Cálculo de Posición de Citas en el Calendario

### ¿Qué se hizo?
Cada cita se posiciona absolutamente dentro de la cuadrícula de horas usando CSS calculado en TypeScript.

```typescript
// En DayViewComponent y WeekViewComponent
getAppointmentStyle(appointment: Appointment): Record<string, string> {
  const start = new Date(appointment.startTime);
  const hour = start.getHours();
  const minute = start.getMinutes();

  const end = new Date(appointment.endTime);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  const top = hour * this.hourHeight + (minute / 60) * this.hourHeight;
  const baseHeight = (durationMinutes / 60) * this.hourHeight;
  const height = Math.max(48, baseHeight); // ← altura mínima

  return {
    top: `${top}px`,
    height: `${height}px`,
    left: '4px',
    right: '4px',
  };
}
```

### Decisiones de diseño

**`hourHeight = 80px`:** Cada hora ocupa 80 píxeles en la cuadrícula. Esto significa que la cuadrícula completa mide `24 × 80 = 1920px` de altura, suficiente para ser legible y para permitir acomodar múltiples citas.

**Posición `top`:** Se calcula en píxeles teniendo en cuenta la fracción de hora:
- Una cita a las 09:30 queda en `9 * 80 + (30/60) * 80 = 720 + 40 = 760px` desde el tope.

**Altura mínima de 48px:** Sin este límite, una cita de 15 minutos mediría solo `(15/60) * 80 = 20px` — prácticamente invisible. El `Math.max(48, calculated)` garantiza que cualquier cita siempre sea clicable y legible.

**`overflow: hidden` en la tarjeta:** Se añadió para que el contenido de la tarjeta no se desborde fuera del bloque cuando la cita es muy corta.

---

## 11. NgOptimizedImage para el Logo

### ¿Qué se hizo?
Se usó la directiva `NgOptimizedImage` de Angular en lugar de un `<img>` nativo para mostrar el logo en la barra de navegación.

```html
<div class="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden ...">
  <img ngSrc="logo.png" alt="Appointment Viewer Logo" fill [priority]="true" class="object-cover" />
</div>
```

### ¿Por qué?
`NgOptimizedImage` aplica automáticamente varias optimizaciones de rendimiento:

1. **`loading="lazy"` por defecto:** Las imágenes fuera del viewport no se cargan hasta que el usuario las necesita. Con `[priority]="true"`, el logo se marca como imagen crítica (LCP candidate) y se precarga.

2. **`fetchpriority="high"`:** El navegador prioriza la descarga del logo sobre otros recursos.

3. **Prevención de Layout Shift (CLS):** Fuerza la definición de dimensiones, evitando que la imagen cause saltos de layout al cargarse.

4. **Warnings de desarrollo:** En modo dev, advierte si la imagen no tiene dimensiones o si se está usando un CDN sin proveedor configurado.

5. **Regla corporativa:** El `AGENTS.md` del proyecto indica explícitamente usar `NgOptimizedImage` para todas las imágenes estáticas, por lo que es parte del estándar del proyecto.

**Nota:** `NgOptimizedImage` no funciona con imágenes base64 inline; solo con URLs de archivos reales o CDNs.

---

## 12. Favicon de la Aplicación

### ¿Qué se hizo?
Se generó un icono personalizado para la aplicación con una imagen de calendario profesional en tonos azules, y se integró como favicon y logo de la app.

**Proceso:**
1. Generación de la imagen mediante IA (modelo de imagen)
2. Copia del archivo a `public/favicon.png` y `public/logo.png`
3. Actualización de `index.html`:
```html
<link rel="icon" type="image/png" href="favicon.png">
```

### ¿Por qué PNG en lugar de ICO?
Un `.ico` estándar no soporta bien imágenes generadas modernas con transparencia y calidad fotográfica. Todos los navegadores modernos (Chrome, Firefox, Safari, Edge) soportan `<link rel="icon" type="image/png">` perfectamente.

La carpeta `public/` es la que Angular mapea como assets estáticos (`angular.json`: `"glob": "**/*", "input": "public"`), por lo que cualquier archivo ahí es accesible directamente desde la raíz de la URL.

---

## 13. Spinner y Delay Artificial

### ¿Qué se hizo?
Al guardar o eliminar una cita, se muestra un spinner de carga con un retraso artificial de **800ms** antes de emitir el resultado.

```typescript
// En AppointmentModalComponent
onSubmit(): void {
  this.isSubmitting.set(true); // ← activa el spinner
  // ... lógica de guardado ...
  setTimeout(() => {
    this.saved.emit(result as Appointment);
    this.isSubmitting.set(false); // ← desactiva el spinner
  }, 800);
}
```

```html
<!-- En el botón de guardar -->
@if (isSubmitting()) {
  <svg class="animate-spin ..."> ... </svg>
  <span>Guardando...</span>
} @else {
  <span>{{ isEditing() ? 'Actualizar Cita' : 'Confirmar Cita' }}</span>
}
```

### ¿Por qué un delay artificial?
En esta fase, las operaciones de LocalStorage son síncronas e instantáneas. Sin el delay, el spinner aparecería y desaparecería tan rápido que el usuario nunca lo vería — generando la sensación de que nada ocurrió.

El delay de 800ms cumple dos objetivos:
1. **Feedback visual:** El usuario tiene confirmación visual de que su acción fue procesada.
2. **Preparación para API real:** Cuando la app se conecte a un backend, el delay se elimina y el spinner permanecerá activo durante la llamada HTTP real.

El botón se deshabilita durante el proceso (`[disabled]="isSubmitting()"`) para evitar envíos duplicados.

---

## 14. Modal de Confirmación de Eliminación

### ¿Qué se hizo?
Se reemplazó el `window.confirm()` nativo del navegador por un modal personalizado de Angular.

```html
@if (showDeleteConfirm()) {
  <div class="absolute inset-0 ..." (click)="showDeleteConfirm.set(false)">
    <div class="bg-white rounded-2xl ..." (click)="$event.stopPropagation()">
      <!-- ícono de advertencia, texto, botones Cancelar y Confirmar -->
    </div>
  </div>
}
```

### ¿Por qué?

**Problemas de `window.confirm()`:**
1. **UX inconsistente:** El estilo del diálogo varía radicalmente entre navegadores y sistemas operativos.
2. **Bloqueo del hilo:** `confirm()` bloquea todo el hilo de JavaScript hasta que el usuario responde.
3. **No personalizable:** No permite añadir íconos, estilos corporativos, spinners ni texto HTML.
4. **Restricciones modernas:** Algunos navegadores bloquean automáticamente los `confirm()` en iframes o en ciertas condiciones de seguridad.

El modal propio de Angular permite mostrar un spinner de "Eliminando..." mientras la operación transcurre, dando consistencia visual con el resto de la aplicación.

---

## 15. Cierre de Modales al Hacer Clic Fuera

### ¿Qué se hizo?
Todos los modales de la aplicación se cierran automáticamente cuando el usuario hace clic en el overlay oscuro que rodea el contenido.

**Técnica usada: event bubbling + stopPropagation**

```html
<!-- El overlay escucha el clic y cierra -->
<div class="fixed inset-0 ..." (click)="onClose()">

  <!-- El contenido del modal para la propagación del evento -->
  <div class="bg-white rounded-3xl ..." (click)="$event.stopPropagation()">
    <!-- contenido -->
  </div>

</div>
```

### ¿Cómo funciona?
- El div exterior (overlay) cubre toda la pantalla y escucha cualquier `click`.
- El div interior (el modal blanco) llama a `$event.stopPropagation()` para que el clic sobre él **no se propague** al overlay.
- Si el usuario hace clic en el overlay (fuera del modal), el evento llega al handler y el modal se cierra.
- Si el usuario hace clic dentro del modal blanco, el evento se detiene ahí y el modal permanece abierto.

Esta técnica es simple, no requiere librerías externas y funciona en todos los navegadores modernos. Es el patrón estándar para este tipo de UX.

---

## 16. Altura Mínima en Tarjetas de Cita

### ¿Qué se hizo?
Se aplicó un `min-height` de 48px al cálculo de posición de cada tarjeta de cita en el calendario, además de actualizar el CSS del componente `AppointmentCardComponent` para usar flexbox.

### ¿Por qué?

Sin esta restricción, las citas de corta duración (15 minutos o menos) se renderizaban como líneas planas de apenas 20px de altura:
- Prácticamente invisibles a simple vista
- Imposibles de hacer clic
- Sin espacio para mostrar el nombre del cliente o el servicio

**Solución en dos capas:**

1. **Capa de posicionamiento (`getAppointmentStyle`):** Se fuerza `height = Math.max(48, calculatedHeight)`. La tarjeta nunca será más pequeña de lo que necesita para mostrar su contenido mínimo.

2. **Capa de contenido (`appointment-card.component.html`):** El contenedor interior tiene `min-h-[48px] h-full flex flex-col overflow-hidden`. El `overflow-hidden` garantiza que si la duración real es muy corta, el texto no se desborde visualmente fuera del bloque asignado.

48px fue elegido como valor mínimo porque es:
- El tamaño mínimo recomendado por las guías de accesibilidad (WCAG) para áreas táctiles interactivas en dispositivos móviles.
- Suficiente para mostrar al menos el nombre del cliente en una línea.

---

## Resumen de Principios Aplicados

| Principio | Implementación concreta |
|---|---|
| **SRP** (Single Responsibility) | Un componente = una pantalla/elemento. Un servicio = una entidad. |
| **DIP** (Dependency Inversion) | `AppointmentService` depende de `IAppointmentRepository`, no de `MockAppointmentRepository`. |
| **OCP** (Open/Closed) | Añadir un repositorio HTTP no modifica el servicio ni los componentes. |
| **Separación de capas** | Domain → Data-Access → Features (las dependencias solo van hacia adentro). |
| **Inmutabilidad de signals** | Se usa `signal.set()` y `signal.update()`, nunca mutación directa. |
| **Contratos de interfaz** | CVA define un contrato estándar entre un control y su formulario padre. |
| **Feedback visual** | Spinners en operaciones asíncronas, estados deshabilitados, mensajes de error. |
| **Accesibilidad mínima** | Áreas táctiles ≥ 48px, atributos `alt` en imágenes, labels en inputs. |
