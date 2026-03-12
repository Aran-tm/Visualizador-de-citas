import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '@app/domain/appointments/models/appointment.model';
import { AppointmentStatus } from '@app/domain/appointments/enums/appointment-status.enum';

@Component({
  selector: 'app-appointment-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="group p-3.5 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md cursor-pointer transition-all duration-400 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 relative overflow-hidden flex flex-col h-full"
      (click)="onClick()"
    >
      <!-- Premium Border Gradient Overlay -->
      <div [class]="gradientOverlayClass()" class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div class="relative z-10 flex flex-col h-full">
        <!-- Top Row: Avatar and Status -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div [class]="avatarClass()" class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-inner">
              {{ initials() }}
            </div>
            <div class="flex flex-col min-w-0">
               <span class="font-bold text-[13px] text-slate-800 tracking-tight truncate leading-tight">{{ appointment().clientName }}</span>
               <span class="text-[10px] font-semibold text-slate-400 truncate">{{ appointment().teamMember }}</span>
            </div>
          </div>
          <div [class]="statusBadgeClass()" class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 shrink-0">
            <div class="w-1 h-1 rounded-full bg-current"></div>
            {{ appointment().status }}
          </div>
        </div>

        <!-- Middle: Service -->
        <div class="flex-1 min-h-0 mb-3">
          <div class="flex items-center gap-2 group/service">
            <div class="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover:scale-125 transition-transform shrink-0"></div>
            <span class="text-[11px] font-bold text-slate-600 truncate uppercase tracking-wide">{{ appointment().serviceName }}</span>
          </div>
        </div>

        <!-- Bottom: Time range -->
        <div class="mt-auto flex items-center justify-between pt-2 border-t border-slate-100/50">
           <div class="flex items-center gap-1.5 text-slate-500">
             <svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <span class="text-[11px] font-black tracking-tight text-slate-600">
               {{ formatTime(appointment().startTime) }} - {{ formatTime(appointment().endTime) }}
             </span>
           </div>
           
           <!-- Interaction Hint -->
           <div class="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
             <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
             </svg>
           </div>
        </div>
      </div>
    </div>
  `,
})
export class AppointmentCardComponent {
  appointment = input.required<Appointment>();
  clickAppointment = output<Appointment>();

  protected readonly AppointmentStatus = AppointmentStatus;

  initials(): string {
    const names = this.appointment().clientName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return (this.appointment().clientName[0] + (this.appointment().clientName[1] || '')).toUpperCase();
  }

  avatarClass(): string {
    const status = this.appointment().status;
    switch (status) {
      case AppointmentStatus.Confirmed: return 'bg-emerald-100 text-emerald-700';
      case AppointmentStatus.Pending: return 'bg-amber-100 text-amber-700';
      case AppointmentStatus.Cancelled: return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  statusBadgeClass(): string {
    const status = this.appointment().status;
    switch (status) {
      case AppointmentStatus.Confirmed: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case AppointmentStatus.Pending: return 'bg-amber-50 text-amber-600 border-amber-100';
      case AppointmentStatus.Cancelled: return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  gradientOverlayClass(): string {
    const status = this.appointment().status;
    switch (status) {
      case AppointmentStatus.Confirmed: return 'bg-gradient-to-br from-emerald-50/10 to-transparent';
      case AppointmentStatus.Pending: return 'bg-gradient-to-br from-amber-50/10 to-transparent';
      case AppointmentStatus.Cancelled: return 'bg-gradient-to-br from-rose-50/10 to-transparent';
      default: return 'bg-gradient-to-br from-slate-50/10 to-transparent';
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  onClick(): void {
    this.clickAppointment.emit(this.appointment());
  }
}
