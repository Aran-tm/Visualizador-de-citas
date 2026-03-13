import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { DayViewComponent } from '@app/features/appointments/ui/day-view/day-view.component';
import { WeekViewComponent } from '@app/features/appointments/ui/week-view/week-view.component';
import { AppointmentModalComponent } from '@app/features/appointments/ui/appointment-modal/appointment-modal.component';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentService } from '@app/features/appointments/services/appointment.service';

@Component({
  selector: 'app-calendar-page',
  imports: [CommonModule, NgOptimizedImage, DayViewComponent, WeekViewComponent, AppointmentModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-page.component.html',
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
