import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentStatus } from '@app/domain/appointments/enums/appointment-status.enum';

@Component({
  selector: 'app-appointment-card',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; height: 100%; }
    .card {
      display: flex;
      flex-direction: row;
      height: 100%;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      border: 1px solid rgba(0,0,0,0.07);
    }
    .card:hover {
      transform: translateY(-1px) scale(1.008);
      box-shadow: 0 8px 24px -4px rgba(0,0,0,0.18);
    }
    .card:active { transform: scale(0.997); }
    .accent-bar {
      width: 4px;
      flex-shrink: 0;
    }
    .card-body {
      flex: 1;
      min-width: 0;
      padding: 5px 8px 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  `],
  template: `
    <div class="card" [class]="cardBgClass()" (click)="onClick()">
      <div class="accent-bar" [class]="accentBarClass()"></div>
      <div class="card-body">

        <!-- Client name + status badge -->
        <div class="flex items-start justify-between gap-1 min-w-0">
          <div class="flex items-center gap-1.5 min-w-0 flex-1">
            <div
              class="shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-black text-[9px]"
              [class]="avatarColorClass()"
            >{{ initials() }}</div>
            <div class="min-w-0 flex-1">
              <div class="font-bold text-[11px] leading-tight truncate" [class]="clientTextClass()">
                {{ appointment().clientName }}
              </div>
              @if (durationMinutes() > 45) {
                <div class="text-[9px] truncate text-slate-400 leading-none mt-0.5">
                  {{ appointment().teamMember }}
                </div>
              }
            </div>
          </div>
          @if (durationMinutes() > 30) {
            <div
              class="shrink-0 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wide border"
              [class]="statusBadgeClass()"
            >{{ statusLabel() }}</div>
          }
        </div>

        <!-- Service -->
        @if (durationMinutes() > 40) {
          <div class="flex items-center gap-1 min-w-0">
            <div class="w-1 h-1 rounded-full shrink-0" [class]="dotClass()"></div>
            <span class="text-[10px] font-semibold truncate uppercase tracking-wide text-slate-500">
              {{ appointment().serviceName }}
            </span>
          </div>
        }

        <!-- Time -->
        <div class="flex items-center gap-1 mt-auto" [class.pt-1]="durationMinutes() > 50" [class.border-t]="durationMinutes() > 50" style="border-color: rgba(0,0,0,0.06)">
          <svg class="w-2.5 h-2.5 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-[10px] font-bold tabular-nums text-slate-600">
            {{ formatTime(appointment().startTime) }}
            @if (durationMinutes() > 30) {
              <span class="opacity-60"> – {{ formatTime(appointment().endTime) }}</span>
            }
          </span>
        </div>
      </div>
    </div>
  `,
})
export class AppointmentCardComponent {
  appointment = input.required<Appointment>();
  clickAppointment = output<Appointment>();

  protected readonly AppointmentStatus = AppointmentStatus;

  durationMinutes(): number {
    const start = new Date(this.appointment().startTime);
    const end = new Date(this.appointment().endTime);
    return (end.getTime() - start.getTime()) / 60000;
  }

  initials(): string {
    const names = this.appointment().clientName.split(' ');
    if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
    return this.appointment().clientName.slice(0, 2).toUpperCase();
  }

  cardBgClass(): string {
    switch (this.appointment().status) {
      case AppointmentStatus.Confirmed: return 'bg-emerald-50/90';
      case AppointmentStatus.Pending:   return 'bg-amber-50/90';
      case AppointmentStatus.Cancelled: return 'bg-rose-50/70';
      default: return 'bg-slate-50/90';
    }
  }

  accentBarClass(): string {
    switch (this.appointment().status) {
      case AppointmentStatus.Confirmed: return 'bg-emerald-500';
      case AppointmentStatus.Pending:   return 'bg-amber-400';
      case AppointmentStatus.Cancelled: return 'bg-rose-400';
      default: return 'bg-slate-400';
    }
  }

  avatarColorClass(): string {
    switch (this.appointment().status) {
      case AppointmentStatus.Confirmed: return 'bg-emerald-200 text-emerald-800';
      case AppointmentStatus.Pending:   return 'bg-amber-200 text-amber-800';
      case AppointmentStatus.Cancelled: return 'bg-rose-200 text-rose-700';
      default: return 'bg-slate-200 text-slate-700';
    }
  }

  clientTextClass(): string {
    switch (this.appointment().status) {
      case AppointmentStatus.Confirmed: return 'text-emerald-900';
      case AppointmentStatus.Pending:   return 'text-amber-900';
      case AppointmentStatus.Cancelled: return 'text-rose-700 line-through opacity-70';
      default: return 'text-slate-800';
    }
  }

  statusBadgeClass(): string {
    switch (this.appointment().status) {
      case AppointmentStatus.Confirmed: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case AppointmentStatus.Pending:   return 'bg-amber-100 text-amber-700 border-amber-200';
      case AppointmentStatus.Cancelled: return 'bg-rose-100 text-rose-600 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }

  dotClass(): string {
    switch (this.appointment().status) {
      case AppointmentStatus.Confirmed: return 'bg-emerald-500';
      case AppointmentStatus.Pending:   return 'bg-amber-500';
      case AppointmentStatus.Cancelled: return 'bg-rose-400';
      default: return 'bg-slate-400';
    }
  }

  statusLabel(): string {
    switch (this.appointment().status) {
      case AppointmentStatus.Confirmed: return 'OK';
      case AppointmentStatus.Pending:   return 'Pend.';
      case AppointmentStatus.Cancelled: return 'Can.';
      default: return '—';
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  onClick(): void {
    this.clickAppointment.emit(this.appointment());
  }
}
