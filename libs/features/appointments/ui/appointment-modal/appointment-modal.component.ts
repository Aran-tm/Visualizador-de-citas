import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentStatus } from '@app/domain/appointments/enums/appointment-status.enum';
import { AppointmentService, CreateAppointmentDto, ValidationError } from '../../services/appointment.service';
import { TimeRangeSelectorComponent, TimeRange } from '../time-range-selector/time-range-selector.component';

/** Validador personalizado: la hora de fin debe ser posterior a la de inicio */
const timeRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as TimeRange | null;
  if (!value?.start || !value?.end) return null;
  return value.start >= value.end ? { timeRangeInvalid: true } : null;
};

/** Validador: el objeto TimeRange debe tener start Y end para ser válido */
const timeRangeRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as TimeRange | null;
  return value?.start && value?.end ? null : { required: true };
};

@Component({
  selector: 'app-appointment-modal',
  imports: [CommonModule, ReactiveFormsModule, TimeRangeSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-modal.component.html',
})
export class AppointmentModalComponent {
  appointment = input<Appointment | null>(null);
  initialDate = input<Date | null>(null);
  close = output<void>();
  saved = output<Appointment>();
  deleted = output<string>();

  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);

  protected readonly AppointmentStatus = AppointmentStatus;
  protected readonly statusOptions = [
    { value: AppointmentStatus.Confirmed, label: 'Confirmada' },
    { value: AppointmentStatus.Pending, label: 'Pendiente' },
    { value: AppointmentStatus.Cancelled, label: 'Cancelada' },
  ];

  isEditing = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showDeleteConfirm = signal(false);
  errors = signal<ValidationError[]>([]);
  teamMembers = this.appointmentService.teamMembers;
  services = this.appointmentService.services;

  /**
   * El formulario ahora tiene un único control `timeRange` en lugar de
   * dos controles separados (startTime / endTime).
   *
   * `timeRange` acepta un objeto `{ start: string, end: string }` y Angular
   * lo conecta directamente con el <app-time-range-selector> gracias al CVA.
   */
  form = this.fb.group({
    clientName: ['', Validators.required],
    serviceName: ['', Validators.required],
    teamMember: ['', Validators.required],
    date: ['', Validators.required],
    timeRange: [null as TimeRange | null, [timeRangeRequired, timeRangeValidator]],
    status: [AppointmentStatus.Pending, Validators.required],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const appointment = this.appointment();
      const initialDate = this.initialDate();

      if (appointment) {
        this.isEditing.set(true);
        const startDate = new Date(appointment.startTime);
        const endDate = new Date(appointment.endTime);

        // writeValue se activa internamente al llamar patchValue
        this.form.patchValue({
          clientName: appointment.clientName,
          serviceName: appointment.serviceName,
          teamMember: appointment.teamMember,
          date: this.formatDateForInput(startDate),
          timeRange: {
            start: this.formatTimeForInput(startDate),
            end: this.formatTimeForInput(endDate),
          },
          status: appointment.status,
          notes: appointment.notes || '',
        });
      } else {
        this.isEditing.set(false);

        let dateToUse = new Date();
        let timeRange: TimeRange | null = null;

        if (initialDate) {
          dateToUse = new Date(initialDate);
          const end = new Date(initialDate);
          end.setHours(end.getHours() + 1);
          timeRange = {
            start: this.formatTimeForInput(initialDate),
            end: this.formatTimeForInput(end),
          };
        }

        this.form.reset({
          status: AppointmentStatus.Pending,
          date: initialDate ? this.formatDateForInput(dateToUse) : '',
          timeRange,
        });
      }
    }, { allowSignalWrites: true });
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTimeForInput(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.errors.set([]);

    const formValue = this.form.value;
    const date = formValue.date!;
    const timeRange = formValue.timeRange!;

    const [startHour, startMinute] = timeRange.start.split(':').map(Number);
    const [endHour, endMinute] = timeRange.end.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);

    const startTime = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    const endTime = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

    const dto: CreateAppointmentDto = {
      clientName: formValue.clientName!,
      serviceName: formValue.serviceName!,
      teamMember: formValue.teamMember!,
      startTime,
      endTime,
      status: formValue.status as AppointmentStatus,
      notes: formValue.notes || undefined,
    };

    let result: Appointment | ValidationError[] | undefined;

    if (this.isEditing()) {
      result = this.appointmentService.updateAppointment(this.appointment()!.id, dto);
    } else {
      result = this.appointmentService.createAppointment(dto);
    }

    if (Array.isArray(result)) {
      this.errors.set(result);
      this.isSubmitting.set(false);
    } else if (result) {
      setTimeout(() => {
        this.saved.emit(result as Appointment);
        this.isSubmitting.set(false);
      }, 800);
    }
  }

  onConfirmDelete(): void {
    if (!this.isEditing() || this.isDeleting()) return;
    this.isDeleting.set(true);

    setTimeout(() => {
      this.deleted.emit(this.appointment()!.id);
      this.isDeleting.set(false);
      this.showDeleteConfirm.set(false);
    }, 800);
  }

  onClose(): void {
    this.close.emit();
  }
}
