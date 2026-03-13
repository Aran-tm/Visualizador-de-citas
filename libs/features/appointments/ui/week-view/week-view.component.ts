import { ChangeDetectionStrategy, Component, computed, input, output, effect } from '@angular/core';
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
  templateUrl: './week-view.component.html',
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

  weekDays = computed(() => {
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
  });

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
    const baseHeight = (durationMinutes / 60) * this.hourHeight;
    const height = Math.max(48, baseHeight); // Min height of 48px so it's readable

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
