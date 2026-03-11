import { InjectionToken } from '@angular/core';
import { IAppointmentRepository } from '../repositories/appointment.repository.interface';

export const APPOINTMENT_REPOSITORY = new InjectionToken<IAppointmentRepository>(
  'APPOINTMENT_REPOSITORY',
);
