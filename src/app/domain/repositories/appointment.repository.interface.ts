import { Appointment } from '../models/appointment.model';

export interface IAppointmentRepository {
  getAll(): Appointment[];
  getById(id: string): Appointment | undefined;
  getByDate(date: Date): Appointment[];
  getByDateRange(startDate: Date, endDate: Date): Appointment[];
  getByTeamMember(teamMember: string): Appointment[];
  create(appointment: Omit<Appointment, 'id'>): Appointment;
  update(id: string, appointment: Partial<Appointment>): Appointment | undefined;
  delete(id: string): boolean;
  hasOverlap(teamMember: string, startTime: Date, endTime: Date, excludeId?: string): boolean;
}
