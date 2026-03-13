import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentCardComponent } from '../appointment-card/appointment-card.component';

@Component({
  selector: 'app-day-view',
  imports: [CommonModule, AppointmentCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-white select-none">
      <!-- Day View Header -->
      <div class="flex items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <h2 class="text-lg sm:text-xl font-bold text-slate-800">
          {{ date() | date: 'EEEE d' }} <span class="text-slate-400 font-medium whitespace-nowrap">de {{ date() | date: 'MMMM, y' }}</span>
        </h2>
      </div>

      <!-- Scrollable area: time column + grid scroll together -->
      <div class="flex flex-1 overflow-y-auto" #timeGrid>
        <div class="flex w-full h-[1920px]">
          <!-- Time Column (24 hours * 80px = 1920px) -->
          <div class="w-14 sm:w-20 shrink-0 border-r border-slate-100 bg-slate-50/30">
            @for (hour of hours; track hour) {
              <div class="h-20 flex items-start justify-center pt-3 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                {{ formatHour(hour) }}
              </div>
            }
          </div>

          <!-- Grid Area -->
          <div class="flex-1 relative bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:100%_80px]">
            @for (hour of hours; track hour) {
              <div class="h-20 relative group hover:bg-slate-50/30 transition-colors cursor-pointer" [class]="getCurrentHourClass(hour)" (click)="onTimeSlotClick(hour)">
                <div class="absolute inset-0 pointer-events-none border-b border-slate-100/50"></div>
              </div>
            }

            @for (appointment of dayAppointments(); track appointment.id) {
              <div
                class="absolute rounded-xl overflow-hidden cursor-pointer animate-fade-in z-10 hover:z-20 transition-all duration-300"
                [ngStyle]="getAppointmentStyle(appointment)"
              >
                <app-appointment-card [appointment]="appointment" (clickAppointment)="onAppointmentClick($event)" />
              </div>
            }
          </div>
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

  // Lógica de colisión
  private collisionGroups = new Map<string, { groupIndex: number; totalColumns: number }>();

  dayAppointments() {
    const list = [...this.appointments()].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    this.calculateCollisions(list);
    return list;
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
      return 'bg-blue-50/50';
    }
    return '';
  }

  // --- Lógica de posicionamiento y colisiones ---

  private calculateCollisions(appointments: Appointment[]): void {
    this.collisionGroups.clear();
    
    // Lista de columnas activas en el barrido actual (cada columna tiene una lista de citas)
    const columns: Appointment[][] = [];

    for (const apt of appointments) {
      const aptStart = new Date(apt.startTime).getTime();
      
      // Eliminar citas que ya terminaron (ya no colisionan)
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const lastAptInColumn = column[column.length - 1];
        if (new Date(lastAptInColumn.endTime).getTime() <= aptStart) {
          // Hay espacio en esta columna
          column.push(apt);
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Nueva columna necesaria
        columns.push([apt]);
      }
    }

    // Calcular el número total de columnas en el grupo de colisión actual para cada cita
    for (let i = 0; i < columns.length; i++) {
        for (const apt of columns[i]) {
            // Buscamos cuántas columnas simultáneas existen mientras esta cita ocurre
            const aptStart = new Date(apt.startTime).getTime();
            const aptEnd = new Date(apt.endTime).getTime();
            
            let maxConcurrentColumns = 1;
            for (const otherColumn of columns) {
                if (otherColumn === columns[i]) continue;
                // ¿Hay alguna cita en la otra columna que colisione con esta?
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
    
    // CSS grid-like calculation for width and offset
    const widthPercentage = 100 / collisionInfo.totalColumns;
    const leftPercentage = collisionInfo.groupIndex * widthPercentage;

    return {
      'top': `${top}px`,
      'height': `${height}px`,
      'left': `calc(${leftPercentage}% + 12px)`, // 12px = padding original (left-3)
      'width': `calc(${widthPercentage}% - 24px)` // 24px = padding total (left-3 + right-3)
    };
  }

  // ------------------------------------------

  onAppointmentClick(appointment: Appointment): void {
    this.selectAppointment.emit(appointment);
  }

  onTimeSlotClick(hour: number): void {
    const clickedDate = new Date(this.date());
    clickedDate.setHours(hour, 0, 0, 0);
    this.createAtTime.emit(clickedDate);
  }
}
