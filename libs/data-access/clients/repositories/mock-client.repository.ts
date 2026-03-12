import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Client } from '@app/domain/clients/models/client.model';
import { ClientStatus } from '@app/domain/clients/enums/client-status.enum';
import { IClientRepository } from '@app/domain/clients/repositories/client.repository.interface';


const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@example.com',
    phone: '+34 600 111 222',
    status: ClientStatus.ACTIVE,
    createdAt: new Date('2025-01-15'),
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    phone: '+34 600 333 444',
    status: ClientStatus.ACTIVE,
    createdAt: new Date('2025-02-20'),
  },
];

export class MockClientRepository implements IClientRepository {
  private clients = [...MOCK_CLIENTS];

  getAll(): Observable<Client[]> {
    return of([...this.clients]);
  }

  getById(id: string): Observable<Client | undefined> {
    return of(this.clients.find((c) => c.id === id));
  }

  save(client: Client): Observable<Client> {
    const index = this.clients.findIndex((c) => c.id === client.id);
    if (index >= 0) {
      this.clients[index] = client;
    } else {
      this.clients.push(client);
    }
    return of(client);
  }

  delete(id: string): Observable<void> {
    this.clients = this.clients.filter((c) => c.id !== id);
    return of(undefined);
  }
}
