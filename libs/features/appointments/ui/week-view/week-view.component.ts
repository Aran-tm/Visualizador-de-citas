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
  imports: [CommonModule, AppointmentCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-white select-none">
      <!-- Week Header -->
      <div class="flex border-b border-slate-100 bg-slate-50/50">
        <div class="w-16 shrink-0 border-r border-slate-100"></div>
        @for (day of weekDays(); track day.date.getTime()) {
          <div
            class="flex-1 py-4 text-center border-r border-slate-100 last:border-r-0 transition-colors"
            [class.bg-blue-50/30]="day.isToday"
          >
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ day.dayName }}</div>
            <div
              class="inline-flex items-center justify-center w-10 h-10 text-lg font-bold rounded-xl transition-all"
              [class]="day.isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-700'"
            >
              {{ day.dayNumber }}
            </div>
          </div>
        }
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- Time Column -->
        <div class="w-16 shrink-0 border-r border-slate-100 bg-slate-50/30 overflow-hidden">
          @for (hour of hours; track hour) {
            <div class="h-20 flex items-start justify-center pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {{ formatHour(hour) }}
            </div>
          }
        </div>

        <!-- Weekly Grid -->
        <div class="flex-1 overflow-y-auto overflow-x-auto relative flex bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:100%_80px]">
          @for (day of weekDays(); track day.date.getTime()) {
            <div class="flex-1 border-r border-slate-100 last:border-r-0 relative min-w-[120px] sm:min-w-0 group/col transition-colors hover:bg-slate-50/10">
              @for (hour of hours; track hour) {
                <div class="h-20 relative cursor-pointer hover:bg-slate-50/30 transition-colors" [class.bg-blue-50/20]="isCurrentHour(day.date, hour)" (click)="onTimeSlotClick(day.date, hour)">
                  <div class="absolute inset-0 pointer-events-none border-b border-slate-100/50"></div>
                </div>
              }
              @for (appointment of getDayAppointments(day.date); track appointment.id) {
                <div
                  class="absolute rounded-xl overflow-hidden cursor-pointer animate-fade-in z-10 hover:z-20 transition-all duration-300"
                  [ngStyle]="getAppointmentStyle(appointment)"
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
  createAtTime = output<Date>();

  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  private readonly hourHeight = 80;

  // Lógica de colisión por día
  private collisionGroups = new Map<string, { groupIndex: number; totalColumns: number }>();
  private calculatedAppointments = new Map<string, Appointment[]>();

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

    // Precalcular las citas y colisiones por día
    this.calculatedAppointments.clear();
    days.forEach(day => {
        const dpApts = this.computeDayAppointments(day.date);
        this.calculateCollisions(dpApts);
        this.calculatedAppointments.set(day.date.toISOString().split('T')[0], dpApts);
    });

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

  private computeDayAppointments(date: Date): Appointment[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    return this.appointments()
      .filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= startOfDay && aptDate < endOfDay;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  getDayAppointments(date: Date): Appointment[] {
    const key = date.toISOString().split('T')[0];
    return this.calculatedAppointments.get(key) || [];
  }

  // --- Lógica de posicionamiento y colisiones ---

  private calculateCollisions(appointments: Appointment[]): void {
    // Lista de columnas activas en el barrido actual
    const columns: Appointment[][] = [];

    for (const apt of appointments) {
      const aptStart = new Date(apt.startTime).getTime();
      
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const lastAptInColumn = column[column.length - 1];
        if (new Date(lastAptInColumn.endTime).getTime() <= aptStart) {
          column.push(apt);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([apt]);
      }
    }

    for (let i = 0; i < columns.length; i++) {
        for (const apt of columns[i]) {
            const aptStart = new Date(apt.startTime).getTime();
            const aptEnd = new Date(apt.endTime).getTime();
            
            let maxConcurrentColumns = 1;
            for (const otherColumn of columns) {
                if (otherColumn === columns[i]) continue;
                const collides = otherColumn.some(otherApt => {
                    const oStart = new Date(otherApt.startTime).getTime();
                    const oEnd = new Date(otherApt.endTime).getTime();
                    return Math.max(aptStart, oStart) < Math.min(aptEnd, oEnd);
                });
                if (collides) maxConcurrentColumns++;
            }

            this.collisionGroups.set(apt.id, {
                groupIndex: i,
                totalColumns: maxConcurrentColumns
            });
        }
    }
  }

  getAppointmentStyle(appointment: Appointment): Record<string, string> {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    
    const hour = start.getHours();
    const minute = start.getMinutes();
    
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    
    const top = hour * this.hourHeight + (minute / 60) * this.hourHeight;
    const height = (durationMinutes / 60) * this.hourHeight;

    const collisionInfo = this.collisionGroups.get(appointment.id) || { groupIndex: 0, totalColumns: 1 };
    
    const widthPercentage = 100 / collisionInfo.totalColumns;
    const leftPercentage = collisionInfo.groupIndex * widthPercentage;

    return {
      'top': `${top}px`,
      'height': `${height}px`,
      'left': `calc(${leftPercentage}% + 4px)`, // 4px margin left
      'width': `calc(${widthPercentage}% - 8px)` // 8px total margin (left+right)
    };
  }

  onAppointmentClick(appointment: Appointment): void {
    this.selectAppointment.emit(appointment);
  }

  onTimeSlotClick(date: Date, hour: number): void {
    const clickedDate = new Date(date);
    clickedDate.setHours(hour, 0, 0, 0);
    this.createAtTime.emit(clickedDate);
  }
}
