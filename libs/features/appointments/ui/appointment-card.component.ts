import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentStatus } from '@app/domain/appointments/enums/appointment-status.enum';

@Component({
  selector: 'app-appointment-card',
  imports: [CommonModule],
  templateUrl: './appointment-card/appointment-card.component.html',
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
