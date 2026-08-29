import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
interface NavItem {
  label: string;
  route: string;
  icon: string; // nombre lógico, usado solo para el switch del template
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  // Config declarativa de la navegación. Si mañana agregan una pantalla,
  // se agrega un objeto aquí — no se toca el template.
  protected readonly navItems: NavItem[] = [
    { label: 'Estadísticas', route: '/dashboard', icon: 'chart' },
    { label: 'Mis Inversiones', route: '/investments', icon: 'trending' },
    { label: 'Histórico', route: '/history', icon: 'history' },
  ];

  // Placeholder de "ocultar saldos" — sin efecto real todavía.
  // Cuando se construya la feature de privacidad, esto se sube a un
  // servicio compartido para que otros componentes (KPIs, tabla) lo lean.
  protected readonly balancesHidden = signal(false);

  private readonly router = inject(Router);

  protected toggleBalancesVisibility(): void {
    this.balancesHidden.update((hidden) => !hidden);
  }

  protected logout(): void {
    // TODO(auth): reemplazar por authService.logout() cuando exista
    // core/services/auth.service.ts (ver Especs.md sección 13).
    console.log('Logout stub — pendiente de AuthService');
    this.router.navigateByUrl('/login');
  }
}