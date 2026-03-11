import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/appointments/calendar-page.component').then(
        (m) => m.CalendarPageComponent,
      ),
  },
  { path: '**', redirectTo: '' }
];
