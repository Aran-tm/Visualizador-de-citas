import { Component, effect, inject, input, output, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Appointment } from '../../../domain/models/appointment.model';
import { AppointmentStatus } from '../../../domain/enums/appointment-status.enum';
import { AppointmentService, CreateAppointmentDto, ValidationError } from '../../../application/services/appointment.service';

@Component({
  selector: 'app-appointment-modal',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">
            {{ isEditing() ? 'Editar Cita' : 'Nueva Cita' }}
          </h2>
          <button (click)="onClose()" class="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          @if (errors().length > 0) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center gap-2 text-red-800 font-semibold mb-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Por favor corrija los siguientes errores:</span>
              </div>
              <ul class="list-disc list-inside text-sm text-red-700 space-y-1">
                @for (error of errors(); track error.field) {
                  <li>{{ error.message }}</li>
                }
              </ul>
            </div>
          }

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              type="text"
              formControlName="clientName"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
            <select
              formControlName="serviceName"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Seleccione un servicio</option>
              @for (service of services(); track service) {
                <option [value]="service">{{ service }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Miembro del Equipo</label>
            <select
              formControlName="teamMember"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Seleccione un miembro</option>
              @for (member of teamMembers(); track member) {
                <option [value]="member">{{ member }}</option>
              }
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                formControlName="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                formControlName="status"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                @for (status of statusOptions; track status.value) {
                  <option [value]="status.value">{{ status.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
              <input
                type="time"
                formControlName="startTime"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
              <input
                type="time"
                formControlName="endTime"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              formControlName="notes"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Notas adicionales..."
            ></textarea>
          </div>

          <div class="flex gap-3 pt-4">
            @if (isEditing()) {
              <button
                type="button"
                (click)="onDelete()"
                class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                Eliminar
              </button>
            }
            <div class="flex-1"></div>
            <button
              type="button"
              (click)="onClose()"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || isSubmitting()"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ isSubmitting() ? 'Guardando...' : (isEditing() ? 'Guardar Cambios' : 'Crear Cita') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AppointmentModalComponent {
  appointment = input<Appointment | null>(null);
  close = output<void>();
  saved = output<Appointment>();
  deleted = output<string>();

  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private platformId = inject(PLATFORM_ID);

  protected readonly AppointmentStatus = AppointmentStatus;
  protected readonly statusOptions = [
    { value: AppointmentStatus.Confirmed, label: 'Confirmada' },
    { value: AppointmentStatus.Pending, label: 'Pendiente' },
    { value: AppointmentStatus.Cancelled, label: 'Cancelada' },
  ];

  isEditing = signal(false);
  isSubmitting = signal(false);
  errors = signal<ValidationError[]>([]);
  teamMembers = this.appointmentService.teamMembers;
  services = this.appointmentService.services;

  form = this.fb.group({
    clientName: ['', Validators.required],
    serviceName: ['', Validators.required],
    teamMember: ['', Validators.required],
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    status: [AppointmentStatus.Pending, Validators.required],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const appointment = this.appointment();
      if (appointment) {
        this.isEditing.set(true);
        const startDate = new Date(appointment.startTime);
        const endDate = new Date(appointment.endTime);

        this.form.patchValue({
          clientName: appointment.clientName,
          serviceName: appointment.serviceName,
          teamMember: appointment.teamMember,
          date: this.formatDateForInput(startDate),
          startTime: this.formatTimeForInput(startDate),
          endTime: this.formatTimeForInput(endDate),
          status: appointment.status,
          notes: appointment.notes || '',
        });
      } else {
        this.isEditing.set(false);
        this.form.reset({
          status: AppointmentStatus.Pending,
        });
      }
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
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
    const [startHour, startMinute] = formValue.startTime!.split(':').map(Number);
    const [endHour, endMinute] = formValue.endTime!.split(':').map(Number);

    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

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
      this.saved.emit(result);
      this.isSubmitting.set(false);
    }
  }

  onDelete(): void {
    if (!this.isEditing()) return;
    if (!isPlatformBrowser(this.platformId)) return;
    if (confirm('¿Está seguro de que desea eliminar esta cita?')) {
      this.deleted.emit(this.appointment()!.id);
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
