export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: import('../enums/client-status.enum').ClientStatus;
  createdAt: Date;
}
