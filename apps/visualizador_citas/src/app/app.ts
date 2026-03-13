import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-50 relative overflow-hidden">
      <!-- Ambient Background Blobs -->
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/20 blur-[120px] rounded-full"></div>

      <div class="relative z-10">
        <router-outlet />
      </div>
    </div>
  `,
})
export class App {}
