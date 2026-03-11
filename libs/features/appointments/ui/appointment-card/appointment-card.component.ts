import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentStatus } from '@app/domain/appointments/enums/appointment-status.enum';

@Component({
  selector: 'app-appointment-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="group p-4 rounded-xl border-l-[6px] cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
      [class]="statusClasses()"
      (click)="onClick()"
    >
      <!-- Suble Status Indicator Blob -->
      <div class="absolute -right-4 -top-4 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity rounded-full bg-current"></div>

      <div class="relative z-10">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-bold text-sm tracking-tight truncate flex-1">{{ appointment().clientName }}</span>
          <span class="text-[10px] font-black uppercase tracking-tighter opacity-50">{{ appointment().status }}</span>
        </div>

        <div class="text-xs font-semibold opacity-85 mb-3 flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-current"></div>
          <span class="truncate">{{ appointment().serviceName }}</span>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-[11px] font-medium opacity-75">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ formatTime(appointment().startTime) }} - {{ formatTime(appointment().endTime) }}</span>
          </div>

          <div class="flex items-center gap-2 text-[11px] font-medium opacity-75">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="truncate">{{ appointment().teamMember }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AppointmentCardComponent {
  appointment = input.required<Appointment>();
  clickAppointment = output<Appointment>();

  protected readonly AppointmentStatus = AppointmentStatus;

  statusClasses(): string {
    const status = this.appointment().status;
    switch (status) {
      case AppointmentStatus.Confirmed:
        return 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-emerald-100/50';
      case AppointmentStatus.Pending:
        return 'bg-amber-50 border-amber-500 text-amber-800 shadow-amber-100/50';
      case AppointmentStatus.Cancelled:
        return 'bg-rose-50 border-rose-500 text-rose-800 shadow-rose-100/50';
      default:
        return 'bg-slate-50 border-slate-500 text-slate-800 shadow-slate-100/50';
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  onClick(): void {
    this.clickAppointment.emit(this.appointment());
  }
}
