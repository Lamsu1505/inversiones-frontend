import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  // En desktop la sidebar siempre está visible; en móvil arranca cerrada.
  // matchMedia se consulta una sola vez al construir el componente.
  protected readonly sidebarOpen = signal(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 850px)').matches : true
  );

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }
}