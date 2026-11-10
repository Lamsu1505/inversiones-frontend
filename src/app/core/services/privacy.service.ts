import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'inversiones-hide-amounts';

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly _ocultarMontos = signal<boolean>(this.leerPreferencia());
  readonly ocultarMontos = this._ocultarMontos.asReadonly();

  constructor() {
    // Persiste la preferencia: al recargar, la app arranca como la dejaste.
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, String(this._ocultarMontos()));
      } catch {
        // Sin localStorage (modo privado estricto): la preferencia dura solo la sesión.
      }
    });
  }

  toggle(): void {
    this._ocultarMontos.update((oculto) => !oculto);
  }

  private leerPreferencia(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}