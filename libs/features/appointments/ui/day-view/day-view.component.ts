import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentCardComponent } from '../appointment-card/appointment-card.component';

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [CommonModule, AppointmentCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-white select-none">
      <!-- Day View Header -->
      <div class="flex items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 class="text-lg sm:text-xl font-bold text-slate-800">
          {{ date() | date: 'EEEE d' }} <span class="text-slate-400 font-medium whitespace-nowrap">de {{ date() | date: 'MMMM, y' }}</span>
        </h2>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- Time Column -->
        <div class="w-14 sm:w-20 shrink-0 border-r border-slate-100 bg-slate-50/30 overflow-hidden">
          @for (hour of hours; track hour) {
            <div class="h-20 flex items-start justify-center pt-3 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
              {{ formatHour(hour) }}
            </div>
          }
        </div>

        <!-- Grid Area -->
        <div class="flex-1 overflow-y-auto relative bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:100%_80px]" #timeGrid>
          @for (hour of hours; track hour) {
            <div class="h-20 relative group hover:bg-slate-50/30 transition-colors" [class]="getCurrentHourClass(hour)">
              <div class="absolute inset-0 pointer-events-none border-b border-slate-100/50"></div>
            </div>
          }

          @for (appointment of dayAppointments(); track appointment.id) {
            <div
              class="absolute left-3 right-3 rounded-2xl overflow-hidden cursor-pointer animate-fade-in z-10 transition-all hover:z-20"
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
  private readonly hourHeight = 80;

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
