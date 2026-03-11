import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentCardComponent } from '../appointment-card/appointment-card.component';

interface DayColumn {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [CommonModule, AppointmentCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full">
      <div class="flex border-b border-gray-200 bg-gray-50">
        <div class="w-16 shrink-0 border-r border-gray-200"></div>
        @for (day of weekDays(); track day.date.getTime()) {
          <div
            class="flex-1 py-3 text-center border-r border-gray-200 last:border-r-0"
            [class.bg-blue-50]="day.isToday"
          >
            <div class="text-sm font-medium text-gray-600 uppercase">{{ day.dayName }}</div>
            <div
              class="text-xl font-semibold mt-0.5"
              [class]="day.isToday ? 'text-blue-600' : 'text-gray-800'"
            >
              {{ day.dayNumber }}
            </div>
          </div>
        }
      </div>

      <div class="flex flex-1 overflow-hidden">
        <div class="w-16 shrink-0 border-r border-gray-200 bg-gray-50 overflow-hidden">
          @for (hour of hours; track hour) {
            <div class="h-16 flex items-center justify-center text-xs text-gray-500 border-b border-gray-100">
              {{ formatHour(hour) }}
            </div>
          }
        </div>

        <div class="flex-1 overflow-y-auto relative flex">
          @for (day of weekDays(); track day.date.getTime()) {
            <div class="flex-1 border-r border-gray-200 last:border-r-0 relative min-w-30">
              @for (hour of hours; track hour) {
                <div class="h-16 border-b border-gray-100 relative" [class.bg-blue-50]="isCurrentHour(day.date, hour)">
                  <div class="absolute inset-0 border-b border-dashed border-gray-200"></div>
                </div>
              }

              @for (appointment of getDayAppointments(day.date); track appointment.id) {
                <div
                  class="absolute left-0.5 right-0.5 rounded-lg overflow-hidden cursor-pointer"
                  [style.top.px]="getAppointmentTop(appointment)"
                  [style.height.px]="getAppointmentHeight(appointment)"
                >
                  <app-appointment-card [appointment]="appointment" (clickAppointment)="onAppointmentClick($event)" />
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class WeekViewComponent {
  startDate = input.required<Date>();
  appointments = input.required<Appointment[]>();
  selectAppointment = output<Appointment>();

  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  private readonly hourHeight = 64;

  weekDays(): DayColumn[] {
    const start = new Date(this.startDate());
    const days: DayColumn[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      days.push({
        date,
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday:
          today.getDate() === date.getDate() &&
          today.getMonth() === date.getMonth() &&
          today.getFullYear() === date.getFullYear(),
      });
    }

    return days;
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  isCurrentHour(date: Date, hour: number): boolean {
    const now = new Date();
    return (
      now.getDate() === date.getDate() &&
      now.getMonth() === date.getMonth() &&
      now.getFullYear() === date.getFullYear() &&
      now.getHours() === hour
    );
  }

  getDayAppointments(date: Date): Appointment[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    return this
      .appointments()
      .filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= startOfDay && aptDate < endOfDay;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
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
}
