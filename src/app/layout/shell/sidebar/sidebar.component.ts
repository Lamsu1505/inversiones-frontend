import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IconName, IconComponent } from '../../../shared/components/icon/icon.component';
import { ThemeService } from '../../../core/services/theme.service';

interface NavItem {
  label: string;
  route: string;
  icon: IconName;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  
  protected readonly navItems: NavItem[] = [
    { label: 'Mis Inversiones', route: '/investments', icon: 'trending' },
    { label: 'Estadísticas', route: '/dashboard', icon: 'chart' },
    { label: 'Histórico', route: '/history', icon: 'history' },
    { label: 'Reportes', route: '/reports', icon: 'report' },
    { label: 'Calculadora', route: '/calculator', icon: 'calculator' },
  ];

  // Placeholder de "ocultar saldos" — sin efecto real todavía.
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


  protected readonly themeService = inject(ThemeService);

  protected toggleTheme(): void {
    console.log('SidebarComponent.toggleTheme()');
    this.themeService.toggle();
  }
}