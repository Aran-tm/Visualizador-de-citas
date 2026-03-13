import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentStatus } from '@app/domain/appointments/enums/appointment-status.enum';

@Component({
  selector: 'app-appointment-card',
  imports: [CommonModule],
  template: `
    <div
      class="p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
      [class]="statusClasses()"
      (click)="onClick()"
    >
      <div class="font-semibold text-sm truncate">{{ appointment().clientName }}</div>
      <div class="text-xs opacity-90 truncate">{{ appointment().serviceName }}</div>
      <div class="flex items-center gap-1 mt-1 text-xs opacity-75">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formatTime(appointment().startTime) }} - {{ formatTime(appointment().endTime) }}</span>
      </div>
      <div class="flex items-center gap-1 mt-0.5 text-xs opacity-75">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="truncate">{{ appointment().teamMember }}</span>
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
        return 'bg-green-100 border-green-500 text-green-800';
      case AppointmentStatus.Pending:
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case AppointmentStatus.Cancelled:
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  onClick(): void {
    this.clickAppointment.emit(this.appointment());
  }
}
