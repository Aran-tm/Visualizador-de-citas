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
    <div class="h-screen flex flex-col bg-slate-50 font-sans">
      <!-- Main Header with Glassmorphism -->
      <!-- Main Header with Glassmorphism -->
      <header class="sticky top-0 z-30 w-full glass border-b border-slate-200/50 px-4 py-3 sm:px-6">
        <div class="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
          <div class="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-8">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 class="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight whitespace-nowrap">
                Appointment Viewer
              </h1>
            </div>

            <!-- View Toggler (Mobile specific placement or responsive width) -->
            <div class="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
              <button
                (click)="setViewMode('day')"
                [class]="viewMode() === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'"
                class="px-3 sm:px-5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
              >
                Día
              </button>
              <button
                (click)="setViewMode('week')"
                [class]="viewMode() === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'"
                class="px-3 sm:px-5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
              >
                Semana
              </button>
            </div>
          </div>

          <!-- Navigation Controls & Date Range -->
          <div class="flex items-center justify-between w-full sm:w-auto gap-3">
            <div class="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
              <button
                (click)="navigatePrevious()"
                class="p-2 sm:p-2.5 hover:bg-slate-50 transition-colors text-slate-600 border-r border-slate-100"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                (click)="navigateToday()"
                class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors uppercase tracking-wider"
              >
                Hoy
              </button>

              <button
                (click)="navigateNext()"
                class="p-2 sm:p-2.5 hover:bg-slate-50 transition-colors text-slate-600 border-l border-slate-100"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div class="flex flex-col items-end sm:items-center min-w-0 sm:min-w-48">
              <span class="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                {{ viewMode() === 'day' ? 'Seleccionada' : 'Rango Actual' }}
              </span>
              <span class="text-xs sm:text-base font-bold text-slate-800 truncate max-w-[120px] sm:max-w-none">
                {{ formattedDate() }}
              </span>
            </div>

            <!-- Mobile Add Button (Icon only) -->
            <button
              (click)="openCreateModal()"
              class="sm:hidden flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 shrink-0"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <!-- Desktop Add Button -->
            <button
              (click)="openCreateModal()"
              class="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all duration-200 font-bold active:scale-95 whitespace-nowrap"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-hidden p-3 sm:p-6 lg:p-8">
        <div class="h-full max-w-[1600px] mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden animate-fade-in relative">
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
