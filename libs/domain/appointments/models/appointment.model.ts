import { AppointmentStatus } from '../enums/appointment-status.enum';

export interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  teamMember: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
}
