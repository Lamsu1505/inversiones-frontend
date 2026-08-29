import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login.css',
  template: `
    <div class="login">
      <div class="login__card" #card>

        <!-- Ícono de marca (provisional, pendiente de reemplazo). -->
        <div class="login__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 17 9 11 13 15 21 7"></polyline>
            <polyline points="15 7 21 7 21 13"></polyline>
          </svg>
        </div>

        <h1 class="login__title">Iniciar sesión</h1>
        <p class="login__subtitle">Ingresa con tu cuenta para continuar en el</p>

        <form class="login__form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <div class="login__field">
            <label class="login__label" for="email">Correo electrónico</label>
            <div class="login__input-wrapper">
              <!-- Ícono de sobre (reemplaza al ícono de persona anterior). -->
              <svg class="login__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                <path d="m3 7 9 6 9-6"></path>
              </svg>

              <input
                id="email"
                type="email"
                class="login__input"
                placeholder="ejemplo@correo.com"
                autocomplete="email"
                formControlName="email"
                [attr.aria-invalid]="emailInvalid()"
                aria-describedby="email-error"
              />
            </div>

            @if (emailInvalid()) {
              <p id="email-error" class="login__error-text" role="alert">
                @if (form.controls.email.hasError('required')) {
                  Ingresá tu correo electrónico.
                } @else {
                  Ingresá un correo electrónico válido.
                }
              </p>
            }
          </div>

          <div class="login__field">
            <label class="login__label" for="password">Contraseña</label>
            <div class="login__input-wrapper">
              <svg class="login__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>

              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                class="login__input login__input--password"
                placeholder="••••••••"
                autocomplete="current-password"
                formControlName="password"
                [attr.aria-invalid]="passwordInvalid()"
                aria-describedby="password-error"
              />
              <button
                type="button"
                class="login__toggle"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                @if (showPassword()) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                }
              </button>
            </div>
            @if (passwordInvalid()) {
              <p id="password-error" class="login__error-text" role="alert">
                La contraseña debe tener al menos 6 caracteres.
              </p>
            }
          </div>

          <label class="login__checkbox">
            <input type="checkbox" formControlName="rememberMe" />
            <span class="login__checkbox-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                   stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span>Mantener sesión iniciada</span>
          </label>

          @if (errorMessage(); as error) {
            <p class="login__form-error" role="alert" aria-live="polite">{{ error }}</p>
          }

          <button type="submit" class="login__submit" [disabled]="loading()">
            @if (loading()) {
              <span>Ingresando…</span>
            } @else {
              <span>Ingresar</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            }
          </button>
        </form>

        <p class="login__register">
          No tienes una cuenta?
          <a routerLink="/registrarse" class="login__register-link">Regístrate</a>
        </p>

        <div class="login__divider"><span>o</span></div>

        <button type="button" class="login__google" (click)="loginWithGoogle()">
          <svg class="login__google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.62 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.94S8.78 6.3 12 6.3c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.7 14.53 2.8 12 2.8 6.98 2.8 2.9 6.88 2.9 11.9S6.98 21 12 21c5.2 0 8.64-3.65 8.64-8.8 0-.59-.06-1.04-.15-1.5z"/>
          </svg>
          Continuar con Google
        </button>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  protected emailInvalid(): boolean {
    const control = this.form.controls.email;
    return control.invalid && control.touched;
  }

  protected passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.invalid && control.touched;
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    // TODO: reemplazar por una llamada real a AuthService (Supabase o
    // Spring Security JWT, según lo que se defina) cuando exista el backend.
    // Por ahora solo simulamos la espera para validar el flujo de UI.
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigateByUrl('/dashboard'); // ← esto es lo nuevo
    }, 800);
  }

  protected async loginWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    // TODO: reemplazar por una llamada real a AuthService (Supabase o
    // Spring Security JWT, según lo que se defina) cuando exista el backend.
    // Por ahora solo simulamos la espera para validar el flujo de UI.
    setTimeout(() => {
      this.loading.set(false);
    }, 2000);
  }
}