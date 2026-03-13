import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DayViewComponent } from '@app/features/appointments/ui/day-view/day-view.component';
import { WeekViewComponent } from '@app/features/appointments/ui/week-view/week-view.component';
import { AppointmentModalComponent } from '@app/features/appointments/ui/appointment-modal/appointment-modal.component';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentService } from '@app/features/appointments/services/appointment.service';

@Component({
  selector: 'app-calendar-page',
  imports: [CommonModule, DayViewComponent, WeekViewComponent, AppointmentModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-[100dvh] flex flex-col bg-slate-50 font-sans overflow-hidden">
      <!-- Main Header with Glassmorphism -->
      <header class="sticky top-0 z-30 w-full glass border-b border-slate-200/50 px-3 py-2 sm:px-6 sm:py-3 shrink-0">
        <div class="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4 sm:justify-between">
          
          <!-- Top row on mobile: Title + View Toggler + Add Button -->
          <div class="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-8">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <svg class="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 class="text-sm sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight whitespace-nowrap">
                Appointment Viewer
              </h1>
            </div>

            <div class="flex items-center gap-2">
              <!-- View Toggler -->
              <div class="flex items-center bg-slate-100/80 p-0.5 sm:p-1 rounded-xl border border-slate-200/50">
                <button
                  (click)="setViewMode('day')"
                  [class]="viewMode() === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'"
                  class="px-2.5 sm:px-5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
                >
                  Día
                </button>
                <button
                  (click)="setViewMode('week')"
                  [class]="viewMode() === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'"
                  class="px-2.5 sm:px-5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
                >
                  Semana
                </button>
              </div>

              <!-- Mobile Add Button (Icon only) -->
              <button
                (click)="openCreateModal()"
                class="sm:hidden flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Bottom row on mobile: Navigation Controls & Date Range -->
          <div class="flex items-center justify-between w-full sm:w-auto gap-3">
            <div class="flex flex-col sm:items-end sm:items-center min-w-0 flex-1">
              <span class="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                {{ viewMode() === 'day' ? 'Seleccionada' : 'Rango Actual' }}
              </span>
              <span class="text-xs sm:text-base font-bold text-slate-800 truncate">
                {{ formattedDate() }}
              </span>
            </div>

            <div class="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
              <button
                (click)="navigatePrevious()"
                class="p-1.5 sm:p-2.5 hover:bg-slate-50 transition-colors text-slate-600 border-r border-slate-100 cursor-pointer"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                (click)="navigateToday()"
                class="px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Hoy
              </button>

              <button
                (click)="navigateNext()"
                class="p-1.5 sm:p-2.5 hover:bg-slate-50 transition-colors text-slate-600 border-l border-slate-100 cursor-pointer"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Desktop Add Button -->
            <button
              (click)="openCreateModal()"
              class="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all duration-200 font-bold active:scale-95 whitespace-nowrap cursor-pointer"
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
      <main class="flex-1 min-h-0 p-2 sm:p-6 lg:p-8 flex flex-col">
        <div class="flex-1 bg-white sm:rounded-2xl sm:shadow-xl sm:shadow-slate-200/50 sm:border border-slate-200/60 overflow-hidden animate-fade-in relative flex flex-col w-full rounded-xl shadow-md border" style="container-type: inline-size;">
          @if (viewMode() === 'day') {
            <app-day-view
              class="flex-1 min-h-0"
              [date]="selectedDate()"
              [appointments]="appointments()"
              (selectAppointment)="openEditModal($event)"
              (createAtTime)="openCreateModalWithTime($event)"
            />
          } @else {
            <app-week-view
              class="flex-1 min-h-0"
              [startDate]="weekStartDate()"
              [appointments]="appointments()"
              (selectAppointment)="openEditModal($event)"
              (createAtTime)="openCreateModalWithTime($event)"
            />
          }
        </div>
      </main>

      @if (showModal()) {
        <app-appointment-modal
          [appointment]="selectedAppointment()"
          [initialDate]="pendingCreateDate()"
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
  pendingCreateDate = signal<Date | null>(null);

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
    this.pendingCreateDate.set(null);
    this.showModal.set(true);
  }

  openCreateModalWithTime(date: Date): void {
    this.selectedAppointment.set(null);
    this.pendingCreateDate.set(date);
    this.showModal.set(true);
  }

  openEditModal(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedAppointment.set(null);
    this.pendingCreateDate.set(null);
  }

  onAppointmentSaved(appointment: Appointment): void {
    this.closeModal();
  }

  onAppointmentDeleted(event: string): void {
    this.appointmentService.deleteAppointment(event);
    this.closeModal();
  }
}
