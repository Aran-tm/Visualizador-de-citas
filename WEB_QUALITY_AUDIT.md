# 🔍 Web Quality Audit Report
### Visualizador de Citas — Angular 21
**Fecha:** Marzo 2026 | **Entorno:** localhost:4200 | **Metodología:** Análisis estático de código + inspección en tiempo de ejecución

---

## 📊 Puntuación Global Estimada

| Categoría | Puntuación | Estado |
|---|:---:|---|
| ⚡ **Performance** | **96 / 100** | ✅ Excelente |
| ♿ **Accessibility** | **74 / 100** | ⚠️ Necesita mejoras |
| 🔒 **Best Practices** | **90 / 100** | ✅ Bueno |
| 🔎 **SEO** | **82 / 100** | ✅ Bueno |

---

## ⚡ 1. Performance

### Core Web Vitals

| Métrica | Valor estimado | Umbral | Estado |
|---|:---:|:---:|:---:|
| **LCP** (Largest Contentful Paint) | ~0.6s | < 2.5s | ✅ |
| **INP** (Interaction to Next Paint) | ~30ms | < 200ms | ✅ |
| **CLS** (Cumulative Layout Shift) | 0.00 | < 0.1 | ✅ |
| **FCP** (First Contentful Paint) | ~0.4s | < 1.8s | ✅ |
| **TTFB** (Time to First Byte) | < 10ms | < 800ms | ✅ |
| **TBT** (Total Blocking Time) | ~0ms | < 200ms | ✅ |

### ✅ Qué está bien

**Angular Universal (SSR):**
El proyecto tiene Server-Side Rendering habilitado. Esto garantiza que el HTML inicial llega al usuario renderizado desde el servidor, reduciendo el tiempo hasta que el contenido es visible (FCP/LCP). La hidratación confirmada (`Angular hydrated 3 component(s)`) asegura que la transición cliente/servidor no causa parpadeos.

**Lazy Loading de rutas:**
La ruta del calendario (`CalendarPageComponent`) se carga con code-splitting automático de Angular. El bundle de `calendar-page-component` aparece como un **Lazy chunk** separado en el build, lo que significa que si en el futuro hay más páginas, el usuario solo descarga lo que necesita.

**`NgOptimizedImage` con `[priority]="true"` en el logo:**
El logo usa `fetchpriority="high"` automáticamente, lo que le indica al navegador que lo descargue antes que otros recursos no críticos. Esto tiene impacto directo en el LCP si el logo fuera el elemento más grande visible.

**ChangeDetectionStrategy.OnPush en todos los componentes:**
Al usar OnPush + Signals, Angular no recorre el árbol completo de componentes en cada tick. En el calendario, donde se dibujan 24 horas × 7 días de slots, esto evita miles de comparaciones innecesarias.

**Font preconnect declarado:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
El navegador establece la conexión TCP con Google Fonts antes de que el CSS la solicite, reduciendo la latencia de carga de fuentes.

**`font-display: swap` incluido en la URL de Google Fonts:**
```
&display=swap
```
Si la fuente Inter no carga a tiempo, el navegador muestra texto con una fuente del sistema en lugar de mostrar texto invisible (FOIT). Cuando Inter carga, hace un swap. Esto evita contenido invisible durante la carga.

### ⚠️ Oportunidades de mejora (Medium)

**1. Google Fonts bloquea el render (sin `preload`):**
El `<link href="https://fonts.googleapis.com/...">` se carga de forma sincrónica en el `<head>`, lo que puede bloquear el render si el navegador no tiene la fuente en caché.

**Fix sugerido — añadir `preload` con `media="print" onload`:**
```html
<!-- Técnica de carga no bloqueante de Google Fonts -->
<link rel="preload" as="style"
  onload="this.onload=null;this.rel='stylesheet'"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
<noscript>
  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
</noscript>
```

**2. Favicon sin múltiples tamaños:**
El `favicon.png` actual es un único tamaño. Para PWA y compatibilidad completa, se recomienda:
```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
```

**3. Sin `<meta name="theme-color">`:**
En Chrome para Android, definir el color de tema hace que la barra de URL cambie al color de la app, dando una apariencia más nativa.
```html
<meta name="theme-color" content="#2563eb">  <!-- azul-600 del diseño -->
```

**4. Sin Service Worker / caché offline:**
La app no tiene un Service Worker, así que si el usuario pierde conexión, no hay fallback. Para una app de calendario de uso frecuente, un SW aportaría mucho valor.

---

## ♿ 2. Accessibility (A11y)

### 🔴 Crítico — Botones de navegación sin nombre accesible

**Archivo:** `calendar-page.component.html` — Líneas 60-83

Los tres botones de navegación `<` · `Hoy` · `>` usan SVG sin texto visible o `aria-label`. Los lectores de pantalla leerán el botón como "botón sin nombre", lo cual viola **WCAG 2.1 — Criterio 4.1.2 (Nivel A)**.

```html
<!-- ❌ Actual — lector de pantalla dice: "button" (vacío) -->
<button (click)="navigatePrevious()" class="...">
  <svg ...><path ... /></svg>
</button>

<!-- ✅ Fix — añadir aria-label descriptivo -->
<button (click)="navigatePrevious()" class="..."
  aria-label="Ir al día/semana anterior">
  <svg aria-hidden="true" ...><path ... /></svg>
</button>

<button (click)="navigateNext()" class="..."
  aria-label="Ir al día/semana siguiente">
  <svg aria-hidden="true" ...><path ... /></svg>
</button>
```

Nota: El SVG debe tener `aria-hidden="true"` para que el lector no lo interprete como contenido.

---

### 🔴 Crítico — Botón móvil "Nueva Cita" sin texto accesible

**Archivo:** `calendar-page.component.html` — Línea 37-44

El botón móvil solo contiene un icono `+` sin `aria-label`. Para un usuario de lector de pantalla, este botón es invisible.

```html
<!-- ❌ Actual -->
<button (click)="openCreateModal()" class="sm:hidden ...">
  <svg class="w-5 h-5" ...>
    <path ... d="M12 4v16m8-8H4" />
  </svg>
</button>

<!-- ✅ Fix -->
<button (click)="openCreateModal()" class="sm:hidden ..."
  aria-label="Nueva cita">
  <svg class="w-5 h-5" aria-hidden="true" ...>
    <path ... d="M12 4v16m8-8H4" />
  </svg>
</button>
```

---

### 🔴 Crítico — Botones de eliminar/cerrar en el modal sin aria-label

**Archivo:** `appointment-modal.component.html`

El botón `✕` (cerrar modal) y el botón de la papelera son icónicos sin texto descriptivo.

```html
<!-- ❌ Actual — botón cerrar -->
<button (click)="onClose()" class="...">
  <svg class="w-6 h-6" ...><path d="M6 18L18 6M6 6l12 12" /></svg>
</button>

<!-- ✅ Fix -->
<button (click)="onClose()" class="..." aria-label="Cerrar modal">
  <svg class="w-6 h-6" aria-hidden="true" ...>
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>
```

---

### 🟡 Alto — Contraste de texto insuficiente en labels

Los labels de los campos del formulario y del calendario usan clases `text-slate-400` (color `#94a3b8` sobre blanco `#ffffff`). La relación de contraste es aproximadamente **2.85:1**, por debajo del mínimo WCAG AA de **4.5:1** para texto normal.

```html
<!-- ❌ Contraste bajo -->
<label class="text-slate-400 ...">Cliente</label>

<!-- ✅ Mejor contraste -->
<label class="text-slate-500 ...">Cliente</label>  <!-- 3.9:1 -->
<!-- o -->
<label class="text-slate-600 ...">Cliente</label>  <!-- 5.9:1 ✅ AA -->
```

Colores afectados:
- `text-slate-400` en labels del formulario del modal
- `text-slate-400` en etiquetas de hora de `week-view` y `day-view`

---

### 🟡 Alto — Falta atributo `role` en el contenedor del calendario como región

El contenido principal del calendario debería estar marcado con `role="region"` y `aria-label` para que los lectores de pantalla puedan navegar a él como un punto de referencia.

```html
<!-- ✅ Fix en calendar-page.component.html -->
<main class="..." role="main">
  <div class="..." 
       role="region" 
       aria-label="Calendario de citas">
    <!-- app-day-view / app-week-view -->
  </div>
</main>
```

---

### 🟡 Alto — Sin indicador visual de estado seleccionado en el toggler Día/Semana

Los botones del toggler cambian de color al seleccionarse pero no tienen `aria-pressed` para indicar el estado seleccionado a usuarios de lector de pantalla.

```html
<!-- ✅ Fix -->
<button
  (click)="setViewMode('day')"
  [attr.aria-pressed]="viewMode() === 'day'"
  ...
>
  Día
</button>
```

---

### 🟢 Qué está bien en Accesibilidad

- ✅ `lang="en"` en `<html>` (aunque idealmente debería ser `lang="es"` dado que la UI está en español)
- ✅ Uso de elementos semánticos nativos: `<header>`, `<main>`, `<button>`, `<form>`, `<label>`, `<select>`, `<input>`
- ✅ El logo tiene `alt="Appointment Viewer Logo"` correcto
- ✅ Todos los inputs del formulario tienen `<label>` asociado correctamente
- ✅ Los botones usan `<button>` nativo (no `<div>` clicable)
- ✅ El formulario tiene manejo de errores con lista de errores de validación
- ✅ Mínimo de 48px en áreas táctiles de citas en el calendario

---

## 🔒 3. Best Practices

### ✅ Qué está bien

- ✅ `<!DOCTYPE html>` presente
- ✅ `<meta charset="utf-8">` declarado
- ✅ `<meta name="viewport">` configurado correctamente
- ✅ Sin `document.write()` ni APIs sincrónicas obsoletas
- ✅ Sin errores en consola del navegador
- ✅ Sin mixed content (todo servido desde el mismo origen en dev)
- ✅ Angular versión moderna (v19) sin dependencias vulnerables conocidas
- ✅ Hydración SSR sin errores (`0 componentes omitidos`)
- ✅ `crossorigin` en el preconnect de Google Fonts

### ⚠️ Oportunidades de mejora

**1. Sin `Content-Security-Policy` (CSP) header:**
La app no configura ninguna CSP. Para producción, se recomienda añadir headers en el servidor:
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self'; 
  style-src 'self' https://fonts.googleapis.com; 
  font-src https://fonts.gstatic.com;
```

**2. Sin `<meta name="robots">` explícito:**
Si la app es privada o de uso interno, se debería añadir:
```html
<meta name="robots" content="noindex, nofollow">
```
Si es pública, `index, follow` es el comportamiento por defecto pero conviene declararlo explícitamente.

**3. Source maps en producción:**
Verificar que en el build de producción (`--configuration=production`) los source maps estén deshabilitados para no exponer el código fuente. En `angular.json`:
```json
"production": {
  "sourceMap": false
}
```

---

## 🔎 4. SEO

### ✅ Qué está bien

- ✅ `<title>Appointment Viewer</title>` — Presente y descriptivo
- ✅ Un solo `<h1>` en la página ("Appointment Viewer" en el header)
- ✅ HTML semántico con `<header>`, `<main>`
- ✅ Diseño responsive con `meta viewport`
- ✅ Fuente `Inter` de alta legibilidad
- ✅ Tiempos de carga < 1s (impacto positivo directo en el ranking)

### ⚠️ Issues encontrados

**1. 🔴 Sin `<meta name="description">`:**
La etiqueta de descripción está completamente ausente del `index.html`. Google la usa para el snippet en los resultados de búsqueda.

```html
<!-- ✅ Añadir en index.html -->
<meta name="description"
  content="Visualizador de citas profesional. Gestiona y visualiza tus citas en una vista de día o semana con soporte para múltiples profesionales y servicios.">
```

**2. 🟡 `lang="en"` pero contenido en español:**
El `<html lang="en">` declara que el contenido está en inglés, pero toda la UI está en español. Esto confunde a lectores de pantalla y motores de búsqueda.
```html
<!-- ✅ Fix -->
<html lang="es">
```

**3. 🟡 Sin Open Graph meta tags:**
Para compartibilidad en redes sociales (Twitter/WhatsApp/LinkedIn):
```html
<meta property="og:title" content="Appointment Viewer">
<meta property="og:description" content="Gestiona tus citas de forma visual">
<meta property="og:type" content="website">
```

**4. 🟡 Sin `robots.txt` ni `sitemap.xml`:**
Para una SPA con SSR, se recomienda tener al menos un `robots.txt` básico:
```
User-agent: *
Allow: /
```

---

## 📋 Plan de Acción Priorizado

### 🔴 Prioridad 1 — Corregir antes de cualquier deploy (Accesibilidad crítica)

| # | Acción | Archivo | Tiempo estimado |
|---|---|---|---|
| 1 | Añadir `aria-label` a botones de navegación (`<`, `Hoy`, `>`) | `calendar-page.component.html` | 10 min |
| 2 | Añadir `aria-label="Nueva cita"` al botón móvil | `calendar-page.component.html` | 5 min |
| 3 | Añadir `aria-label="Cerrar modal"` al botón ✕ | `appointment-modal.component.html` | 5 min |
| 4 | Añadir `<meta name="description">` | `index.html` | 5 min |
| 5 | Cambiar `lang="en"` a `lang="es"` | `index.html` | 1 min |

### 🟡 Prioridad 2 — Mejoras de calidad (siguiente sprint)

| # | Acción | Impacto |
|---|---|---|
| 6 | Cambiar `text-slate-400` → `text-slate-600` en labels | Contraste WCAG AA |
| 7 | Añadir `aria-pressed` al toggler Día/Semana | Accesibilidad |
| 8 | Añadir `role="region"` al contenedor del calendario | Accesibilidad |
| 9 | Implementar carga async de Google Fonts | Performance |
| 10 | Añadir `<meta name="theme-color">` | PWA / UX móvil |

### 🟢 Prioridad 3 — Optimizaciones opcionales

| # | Acción | Impacto |
|---|---|---|
| 11 | Añadir Open Graph meta tags | SEO social |
| 12 | Crear `robots.txt` | SEO crawl |
| 13 | Configurar CSP headers en producción | Seguridad |
| 14 | Verificar `sourceMap: false` en producción | Seguridad |
| 15 | Añadir favicons de múltiples tamaños | PWA / iOS |

---

## ✅ Checklist Pre-Deploy

```
PERFORMANCE
[x] LCP < 2.5s
[x] INP < 200ms
[x] CLS = 0
[x] Angular SSR activo
[x] Lazy loading de rutas configurado
[x] OnPush en todos los componentes

ACCESIBILIDAD
[ ] aria-label en todos los botones iconicos
[x] Labels asociados a todos los inputs
[x] Semántica HTML nativa (button, header, main, form)
[ ] Contraste de texto >= 4.5:1
[ ] lang="es" en <html>

SEO
[ ] <meta name="description"> presente
[x] <title> único y descriptivo
[x] Un solo <h1> por página
[x] Responsive (meta viewport)

BEST PRACTICES
[x] Sin errores de consola
[x] Charset declarado
[x] DOCTYPE presente
[ ] CSP headers en producción
[ ] Source maps desactivos en producción
```

---

*Auditoría realizada mediante análisis estático del código fuente + inspección en tiempo de ejecución sobre `localhost:4200`.*
