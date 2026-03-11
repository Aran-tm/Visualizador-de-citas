import { Injectable } from '@angular/core';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentStatus } from '@app/domain/appointments/enums/appointment-status.enum';
import { IAppointmentRepository } from '@app/domain/appointments/repositories/appointment.repository.interface';

@Injectable({
  providedIn: 'root',
})
export class MockAppointmentRepository implements IAppointmentRepository {
  private appointments: Appointment[] = [];
  private idCounter = 1;

  private teamMembers = ['Ana García', 'Carlos López', 'María Rodríguez', 'Juan Martínez'];
  private services = ['Corte de cabello', 'Coloración', 'Manicure', 'Pedicure', 'Tratamiento facial', 'Masaje'];
  private clients = [
    'Laura Sánchez',
    'Pedro Hernández',
    'Sofia Torres',
    'Diego Ramírez',
    'Valentina Cruz',
    'Andrés Flores',
    'Camila Vargas',
    'Mateo Castro',
  ];

  constructor() {
    this.generateMockData();
  }

  private generateMockData(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);

      this.teamMembers.forEach((teamMember, memberIndex) => {
        const dailyAppointments = Math.floor(Math.random() * 4) + 2;

        for (let i = 0; i < dailyAppointments; i++) {
          const startHour = 9 + i * 2 + Math.floor(Math.random() * 2);
          const duration = 30 + Math.floor(Math.random() * 3) * 30;

          const startTime = new Date(currentDate);
          startTime.setHours(startHour, Math.floor(Math.random() * 4) * 15, 0);

          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + duration);

          const clientIndex = Math.floor(Math.random() * this.clients.length);
          const serviceIndex = Math.floor(Math.random() * this.services.length);
          const statusValues = Object.values(AppointmentStatus);
          const status = statusValues[Math.floor(Math.random() * statusValues.length)];

          this.appointments.push({
            id: `apt-${this.idCounter++}`,
            clientName: this.clients[clientIndex],
            serviceName: this.services[serviceIndex],
            teamMember,
            startTime,
            endTime,
            status,
            notes: Math.random() > 0.7 ? 'Notas del cliente aquí' : undefined,
          });
        }
      });
    }

    this.appointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

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
