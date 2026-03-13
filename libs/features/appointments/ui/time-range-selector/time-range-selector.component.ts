import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

/** Valor que este control produce y consume */
export interface TimeRange {
  start: string; // formato "HH:mm"
  end: string;   // formato "HH:mm"
}

/**
 * Control de formulario reutilizable que implementa ControlValueAccessor.
 *
 * Al usarlo con `formControlName="timeRange"`, Angular lo trata como
 * cualquier `<input>` nativo gracias a las cuatro funciones de CVA:
 *
 *  writeValue        – El padre le envía el valor actual (modelo → vista)
 *  registerOnChange  – El hijo avisa al padre cuando el valor cambia (vista → modelo)
 *  registerOnTouched – El hijo avisa al padre que el usuario interactuó
 *  setDisabledState  – El padre le indica si debe deshabilitarse
 */
@Component({
  selector: 'app-time-range-selector',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './time-range-selector.component.html',
  // Registro del control en el árbol de formularios de Angular
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeRangeSelectorComponent),
      multi: true,
    },
  ],
})
export class TimeRangeSelectorComponent implements ControlValueAccessor {
  // ── Estado interno ────────────────────────────────────────────────────────
  startTime = signal('');
  endTime = signal('');
  isDisabled = signal(false);

  // Callbacks registrados por Angular Forms
  private onChange: (value: TimeRange) => void = () => {};
  private onTouched: () => void = () => {};

  // ── 1. writeValue ─────────────────────────────────────────────────────────
  // El padre (FormGroup) le envía el valor al hijo.
  // Se llama al hacer: form.patchValue({ timeRange: { start: '09:00', end: '10:00' } })
  writeValue(value: TimeRange | null): void {
    this.startTime.set(value?.start ?? '');
    this.endTime.set(value?.end ?? '');
  }

  // ── 2. registerOnChange ───────────────────────────────────────────────────
  // Angular le entrega una función `fn` al hijo.
  // El hijo debe llamar a `fn(nuevoValor)` cada vez que el usuario lo modifica.
  registerOnChange(fn: (value: TimeRange) => void): void {
    this.onChange = fn;
  }

  // ── 3. registerOnTouched ──────────────────────────────────────────────────
  // Angular le entrega una función `fn` al hijo.
  // El hijo debe llamar a `fn()` cuando el usuario "toca" el control (blur).
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ── 4. setDisabledState ───────────────────────────────────────────────────
  // El padre le dice al hijo si debe estar deshabilitado.
  // Se activa al llamar: form.controls['timeRange'].disable()
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // ── Manejadores de eventos del template ───────────────────────────────────
  onStartChange(value: string): void {
    this.startTime.set(value);
    this.onChange({ start: value, end: this.endTime() });
  }

  onEndChange(value: string): void {
    this.endTime.set(value);
    this.onChange({ start: this.startTime(), end: value });
  }

  /** Avisa al padre que el usuario interactuó (necesario para lógica "touched") */
  onBlur(): void {
    this.onTouched();
  }
}
