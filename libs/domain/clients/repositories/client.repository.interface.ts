import { Observable } from 'rxjs';
import { Client } from '../models/client.model';

export interface IClientRepository {
  getAll(): Observable<Client[]>;
  getById(id: string): Observable<Client | undefined>;
  save(client: Client): Observable<Client>;
  delete(id: string): Observable<void>;
}
