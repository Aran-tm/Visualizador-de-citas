import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '@app/domain/clients/models/client.model';
import { CLIENT_REPOSITORY } from '@app/domain/clients/tokens/client-repository.token';


@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly repository = inject(CLIENT_REPOSITORY);

  getAll(): Observable<Client[]> {
    return this.repository.getAll();
  }

  getById(id: string): Observable<Client | undefined> {
    return this.repository.getById(id);
  }

  save(client: Client): Observable<Client> {
    return this.repository.save(client);
  }

  delete(id: string): Observable<void> {
    return this.repository.delete(id);
  }
}
