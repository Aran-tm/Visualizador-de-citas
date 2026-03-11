import { computed, inject, Injectable, signal } from '@angular/core';
import { Appointment } from '../../domain/models/appointment.model';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { APPOINTMENT_REPOSITORY } from '../../domain/tokens/appointment-repository.token';
import { IAppointmentRepository } from '../../domain/repositories/appointment.repository.interface';

export interface ValidationError {
  field: string;
  message: string;
}

export interface CreateAppointmentDto {
  clientName: string;
  serviceName: string;
  teamMember: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
}

export interface UpdateAppointmentDto extends Partial<CreateAppointmentDto> {}

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private repository: IAppointmentRepository = inject(APPOINTMENT_REPOSITORY);

  private appointmentsSignal = signal<Appointment[]>([]);
  private selectedDateSignal = signal<Date>(new Date());
  private viewModeSignal = signal<'day' | 'week'>('day');

  readonly appointments = computed(() => this.appointmentsSignal());
  readonly selectedDate = computed(() => this.selectedDateSignal());
  readonly viewMode = computed(() => this.viewModeSignal());

  readonly teamMembers = computed(() => {
    const members = new Set(this.appointmentsSignal().map((apt) => apt.teamMember));
    return Array.from(members);
  });

  readonly services = computed(() => {
    const services = new Set(this.appointmentsSignal().map((apt) => apt.serviceName));
    return Array.from(services);
  });

  readonly filteredAppointments = computed(() => {
    const date = this.selectedDateSignal();
    const mode = this.viewModeSignal();

    if (mode === 'day') {
      return this.repository.getByDate(date);
    } else {
      const startOfWeek = this.getStartOfWeek(date);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return this.repository.getByDateRange(startOfWeek, endOfWeek);
    }
  });

  constructor() {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.appointmentsSignal.set(this.repository.getAll());
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  setSelectedDate(date: Date): void {
    this.selectedDateSignal.set(date);
  }

  setViewMode(mode: 'day' | 'week'): void {
    this.viewModeSignal.set(mode);
  }

  navigatePrevious(): void {
    const current = this.selectedDateSignal();
    const newDate = new Date(current);
    if (this.viewModeSignal() === 'day') {
      newDate.setDate(current.getDate() - 1);
    } else {
      newDate.setDate(current.getDate() - 7);
    }
    this.selectedDateSignal.set(newDate);
  }

  navigateNext(): void {
    const current = this.selectedDateSignal();
    const newDate = new Date(current);
    if (this.viewModeSignal() === 'day') {
      newDate.setDate(current.getDate() + 1);
    } else {
      newDate.setDate(current.getDate() + 7);
    }
    this.selectedDateSignal.set(newDate);
  }

  navigateToday(): void {
    this.selectedDateSignal.set(new Date());
  }

  validateAppointment(dto: CreateAppointmentDto, excludeId?: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!dto.clientName?.trim()) {
      errors.push({ field: 'clientName', message: 'El nombre del cliente es requerido' });
    }

    if (!dto.serviceName?.trim()) {
      errors.push({ field: 'serviceName', message: 'El nombre del servicio es requerido' });
    }

    if (!dto.teamMember?.trim()) {
      errors.push({ field: 'teamMember', message: 'El miembro del equipo es requerido' });
    }

    if (!dto.startTime) {
      errors.push({ field: 'startTime', message: 'La hora de inicio es requerida' });
    }

    if (!dto.endTime) {
      errors.push({ field: 'endTime', message: 'La hora de fin es requerida' });
    }

    if (dto.startTime && dto.endTime) {
      if (dto.endTime <= dto.startTime) {
        errors.push({ field: 'endTime', message: 'La hora de fin debe ser mayor que la hora de inicio' });
      }
    }

    if (dto.startTime && dto.endTime && dto.teamMember) {
      if (this.repository.hasOverlap(dto.teamMember, dto.startTime, dto.endTime, excludeId)) {
        errors.push({ field: 'timeRange', message: 'Ya existe una cita para este miembro del equipo en ese horario' });
      }
    }

    return errors;
  }

  createAppointment(dto: CreateAppointmentDto): Appointment | ValidationError[] {
    const errors = this.validateAppointment(dto);
    if (errors.length > 0) {
      return errors;
    }

    const appointment = this.repository.create(dto);
    this.loadAppointments();
    return appointment;
  }

  updateAppointment(id: string, dto: UpdateAppointmentDto): Appointment | ValidationError[] | undefined {
    const existing = this.repository.getById(id);
    if (!existing) return undefined;

    const merged: CreateAppointmentDto = {
      clientName: dto.clientName ?? existing.clientName,
      serviceName: dto.serviceName ?? existing.serviceName,
      teamMember: dto.teamMember ?? existing.teamMember,
      startTime: dto.startTime ?? existing.startTime,
      endTime: dto.endTime ?? existing.endTime,
      status: dto.status ?? existing.status,
      notes: dto.notes ?? existing.notes,
    };

    const errors = this.validateAppointment(merged, id);
    if (errors.length > 0) {
      return errors;
    }

    const appointment = this.repository.update(id, dto);
    this.loadAppointments();
    return appointment;
  }

  deleteAppointment(id: string): boolean {
    const result = this.repository.delete(id);
    if (result) {
      this.loadAppointments();
    }
    return result;
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.repository.getById(id);
  }
}
