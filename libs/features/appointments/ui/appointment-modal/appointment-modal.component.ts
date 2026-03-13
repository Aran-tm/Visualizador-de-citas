import { ChangeDetectionStrategy, Component, effect, inject, input, output, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentStatus } from '@app/domain/appointments/enums/appointment-status.enum';
import { AppointmentService, CreateAppointmentDto, ValidationError } from '../../services/appointment.service';

@Component({
  selector: 'app-appointment-modal',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/60">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-800">
              {{ isEditing() ? 'Detalles de la Cita' : 'Programar Nueva Cita' }}
            </h2>
          </div>
          <button (click)="onClose()" class="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex-1 overflow-y-auto p-6 space-y-6">
          @if (errors().length > 0) {
            <div class="bg-rose-50 border border-rose-100 rounded-2xl p-4 animate-fade-in">
              <div class="flex items-center gap-2 text-rose-800 font-bold mb-2 text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Errores de validación</span>
              </div>
              <ul class="list-disc list-inside text-xs text-rose-700 space-y-1 font-medium">
                @for (error of errors(); track error.field) {
                  <li>{{ error.message }}</li>
                }
              </ul>
            </div>
          }

          <div class="space-y-4">
            <div>
              <label class="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Cliente</label>
              <input
                type="text"
                formControlName="clientName"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
                placeholder="Nombre completo del cliente"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Servicio</label>
                <select
                  formControlName="serviceName"
                  class="custom-select w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  @for (service of services(); track service) {
                    <option [value]="service">{{ service }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Personal</label>
                <select
                  formControlName="teamMember"
                  class="custom-select w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  @for (member of teamMembers(); track member) {
                    <option [value]="member">{{ member }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Fecha</label>
                <input
                  type="date"
                  formControlName="date"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label class="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Estado</label>
                <select
                  formControlName="status"
                  class="custom-select w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 cursor-pointer"
                >
                  @for (status of statusOptions; track status.value) {
                    <option [value]="status.value">{{ status.label }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Hora Inicio</label>
                <input
                  type="time"
                  formControlName="startTime"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label class="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Hora Fin</label>
                <input
                  type="time"
                  formControlName="endTime"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Notas Adicionales</label>
              <textarea
                formControlName="notes"
                rows="3"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300 resize-none"
                placeholder="Agregar cualquier observación importante..."
              ></textarea>
            </div>
          </div>
        </form>

        <!-- Modal Footer -->
        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3">
          @if (isEditing()) {
            <button
              type="button"
              (click)="showDeleteConfirm.set(true)"
              class="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all font-bold text-sm active:scale-95 cursor-pointer"
            >
              Eliminar Cita
            </button>
          }
          <div class="flex-1"></div>
          <button
            type="button"
            (click)="onClose()"
            class="px-6 py-3 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-2xl transition-all active:scale-95 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="submit"
            (click)="onSubmit()"
            [disabled]="form.invalid || isSubmitting()"
            class="px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm active:scale-95 cursor-pointer"
          >
            {{ isSubmitting() ? 'Guardando...' : (isEditing() ? 'Actualizar Cita' : 'Confirmar Cita') }}
          </button>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm()) {
        <div class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in rounded-3xl">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-scale-in">
            <div class="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">¿Eliminar cita?</h3>
            <p class="text-slate-500 mb-6 text-sm">Esta acción no se puede deshacer. La cita será eliminada permanentemente del sistema.</p>
            
            <div class="flex gap-3 justify-center">
              <button 
                type="button" 
                (click)="showDeleteConfirm.set(false)" 
                class="px-5 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                (click)="onConfirmDelete()" 
                class="px-5 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95 cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class AppointmentModalComponent {
  appointment = input<Appointment | null>(null);
  initialDate = input<Date | null>(null);
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
  showDeleteConfirm = signal(false);
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
      const initialDate = this.initialDate();
      
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
        
        let dateToUse = new Date();
        let startTimeToUse = '';
        let endTimeToUse = '';

        if (initialDate) {
          dateToUse = new Date(initialDate);
          startTimeToUse = this.formatTimeForInput(initialDate);
          
          const end = new Date(initialDate);
          end.setHours(end.getHours() + 1);
          endTimeToUse = this.formatTimeForInput(end);
        }

        this.form.reset({
          status: AppointmentStatus.Pending,
          date: initialDate ? this.formatDateForInput(dateToUse) : '',
          startTime: startTimeToUse,
          endTime: endTimeToUse,
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
    const [startHour, startMinute] = formValue.startTime!.split(':').map(Number);
    const [endHour, endMinute] = formValue.endTime!.split(':').map(Number);
    
    // Use local timezone explicitly
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
      this.saved.emit(result);
      this.isSubmitting.set(false);
    }
  }

  onConfirmDelete(): void {
    if (!this.isEditing()) return;
    this.deleted.emit(this.appointment()!.id);
    this.showDeleteConfirm.set(false);
  }

  onClose(): void {
    this.close.emit();
  }
}
