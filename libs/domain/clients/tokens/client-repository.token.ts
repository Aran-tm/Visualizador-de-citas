import { InjectionToken } from '@angular/core';
import { IClientRepository } from '../repositories/client.repository.interface';

export const CLIENT_REPOSITORY = new InjectionToken<IClientRepository>(
  'IClientRepository',
);
