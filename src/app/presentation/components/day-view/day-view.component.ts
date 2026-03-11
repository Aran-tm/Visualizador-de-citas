import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../domain/models/appointment.model';
import { AppointmentCardComponent } from '../appointment-card/appointment-card.component';

@Component({
  selector: 'app-day-view',
  imports: [CommonModule, AppointmentCardComponent],
  template: `
    <div class="flex flex-col h-full">
      <div class="text-center py-3 border-b border-gray-200 bg-gray-50">
        <div class="text-lg font-semibold text-gray-800">
          {{ date() | date: 'EEEE d MMMM, y' }}
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <div class="w-16 shrink-0 border-r border-gray-200 bg-gray-50 overflow-hidden">
          @for (hour of hours; track hour) {
            <div class="h-16 flex items-center justify-center text-xs text-gray-500 border-b border-gray-100">
              {{ formatHour(hour) }}
            </div>
          }
        </div>

        <div class="flex-1 overflow-y-auto relative" #timeGrid>
          @for (hour of hours; track hour) {
            <div class="h-16 border-b border-gray-100 relative" [class]="getCurrentHourClass(hour)">
              <div class="absolute inset-0 border-b border-dashed border-gray-200"></div>
            </div>
          }

          @for (appointment of dayAppointments(); track appointment.id) {
            <div
              class="absolute left-1 right-1 rounded-lg overflow-hidden cursor-pointer"
              [style.top.px]="getAppointmentTop(appointment)"
              [style.height.px]="getAppointmentHeight(appointment)"
            >
              <app-appointment-card [appointment]="appointment" (clickAppointment)="onAppointmentClick($event)" />
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DayViewComponent {
  date = input.required<Date>();
  appointments = input.required<Appointment[]>();
  selectAppointment = output<Appointment>();
  createAtTime = output<Date>();

  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  private readonly hourHeight = 64;

  dayAppointments() {
    return this.appointments().sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  getCurrentHourClass(hour: number): string {
    const now = new Date();
    const currentDate = this.date();
    const isToday =
      now.getDate() === currentDate.getDate() &&
      now.getMonth() === currentDate.getMonth() &&
      now.getFullYear() === currentDate.getFullYear();

    if (isToday && now.getHours() === hour) {
      return 'bg-blue-50';
    }
    return '';
  }

  getAppointmentTop(appointment: Appointment): number {
    const start = new Date(appointment.startTime);
    const hour = start.getHours();
    const minute = start.getMinutes();
    return hour * this.hourHeight + (minute / 60) * this.hourHeight;
  }

  getAppointmentHeight(appointment: Appointment): number {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return (durationMinutes / 60) * this.hourHeight;
  }

  onAppointmentClick(appointment: Appointment): void {
    this.selectAppointment.emit(appointment);
  }

  onTimeSlotClick(hour: number): void {
    const clickedDate = new Date(this.date());
    clickedDate.setHours(hour, 0, 0, 0);
    this.createAtTime.emit(clickedDate);
  }
}
