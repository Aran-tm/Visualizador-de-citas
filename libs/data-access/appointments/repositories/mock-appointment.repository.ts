import { Injectable } from '@angular/core';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { IAppointmentRepository } from '@app/domain/appointments/repositories/appointment.repository.interface';

@Injectable({
  providedIn: 'root',
})
export class MockAppointmentRepository implements IAppointmentRepository {
  private appointments: Appointment[] = [];
  private idCounter = 1;

  getAll(): Appointment[] {
    return [...this.appointments];
  }

  getById(id: string): Appointment | undefined {
    return this.appointments.find((apt) => apt.id === id);
  }

  getByDate(date: Date): Appointment[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    return this.appointments.filter((apt) => apt.startTime >= targetDate && apt.startTime < nextDay);
  }

  getByDateRange(startDate: Date, endDate: Date): Appointment[] {
    return this.appointments.filter((apt) => apt.startTime >= startDate && apt.startTime <= endDate);
  }

  getByTeamMember(teamMember: string): Appointment[] {
    return this.appointments.filter((apt) => apt.teamMember === teamMember);
  }

  create(appointment: Omit<Appointment, 'id'>): Appointment {
    const newAppointment: Appointment = {
      ...appointment,
      id: `apt-${this.idCounter++}`,
    };
    this.appointments.push(newAppointment);
    this.appointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    return newAppointment;
  }

  update(id: string, appointment: Partial<Appointment>): Appointment | undefined {
    const index = this.appointments.findIndex((apt) => apt.id === id);
    if (index === -1) return undefined;

    this.appointments[index] = { ...this.appointments[index], ...appointment };
    return this.appointments[index];
  }

  delete(id: string): boolean {
    const index = this.appointments.findIndex((apt) => apt.id === id);
    if (index === -1) return false;
    this.appointments.splice(index, 1);
    return true;
  }

  hasOverlap(teamMember: string, startTime: Date, endTime: Date, excludeId?: string): boolean {
    return this.appointments.some((apt) => {
      if (apt.teamMember !== teamMember) return false;
      if (excludeId && apt.id === excludeId) return false;

      const aptStart = apt.startTime.getTime();
      const aptEnd = apt.endTime.getTime();
      const newStart = startTime.getTime();
      const newEnd = endTime.getTime();

      return (newStart >= aptStart && newStart < aptEnd) || (newEnd > aptStart && newEnd <= aptEnd) || (newStart <= aptStart && newEnd >= aptEnd);
    });
  }
}
