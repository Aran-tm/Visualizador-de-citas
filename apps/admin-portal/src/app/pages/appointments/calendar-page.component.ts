import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DayViewComponent } from '@app/features/appointments/ui/day-view/day-view.component';
import { WeekViewComponent } from '@app/features/appointments/ui/week-view/week-view.component';
import { AppointmentModalComponent } from '@app/features/appointments/ui/appointment-modal/appointment-modal.component';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentService } from '@app/features/appointments/services/appointment.service';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, DayViewComponent, WeekViewComponent, AppointmentModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-screen flex flex-col bg-gray-100">
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-4">
              <h1 class="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
              <div class="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  (click)="setViewMode('day')"
                  [class]="viewMode() === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'"
                  class="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                >
                  Día
                </button>
                <button
                  (click)="setViewMode('week')"
                  [class]="viewMode() === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'"
                  class="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                >
                  Semana
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                (click)="navigatePrevious()"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                (click)="navigateToday()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hoy
              </button>

              <span class="text-lg font-semibold text-gray-800 min-w-50 text-center">
                {{ formattedDate() }}
              </span>

              <button
                (click)="navigateNext()"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              (click)="openCreateModal()"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-hidden p-4">
        <div class="h-full max-w-7xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          @if (viewMode() === 'day') {
            <app-day-view
              [date]="selectedDate()"
              [appointments]="appointments()"
              (selectAppointment)="openEditModal($event)"
            />
          } @else {
            <app-week-view
              [startDate]="weekStartDate()"
              [appointments]="appointments()"
              (selectAppointment)="openEditModal($event)"
            />
          }
        </div>
      </main>

      @if (showModal()) {
        <app-appointment-modal
          [appointment]="selectedAppointment()"
          (close)="closeModal()"
          (saved)="onAppointmentSaved($event)"
          (deleted)="onAppointmentDeleted($event)"
        />
      }
    </div>
  `,
})
export class CalendarPageComponent {
  private appointmentService = inject(AppointmentService);

  showModal = signal(false);
  selectedAppointment = signal<Appointment | null>(null);

  appointments = this.appointmentService.filteredAppointments;
  selectedDate = this.appointmentService.selectedDate;
  viewMode = this.appointmentService.viewMode;

  weekStartDate = computed(() => {
    const date = this.selectedDate();
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  });

  formattedDate = computed(() => {
    const date = this.selectedDate();
    const mode = this.viewMode();

    if (mode === 'day') {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      const start = this.weekStartDate();
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  });

  setViewMode(mode: 'day' | 'week'): void {
    this.appointmentService.setViewMode(mode);
  }

  navigatePrevious(): void {
    this.appointmentService.navigatePrevious();
  }

  navigateNext(): void {
    this.appointmentService.navigateNext();
  }

  navigateToday(): void {
    this.appointmentService.navigateToday();
  }

  openCreateModal(): void {
    this.selectedAppointment.set(null);
    this.showModal.set(true);
  }

  openEditModal(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedAppointment.set(null);
  }

  onAppointmentSaved(appointment: Appointment): void {
    this.closeModal();
  }

  onAppointmentDeleted(event: string): void {
    this.appointmentService.deleteAppointment(event);
    this.closeModal();
  }
}
