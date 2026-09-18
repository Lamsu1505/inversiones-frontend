import { effect, Injectable, signal } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly _hidden = signal(this.resolveInitial());
  readonly hidden = this._hidden.asReadonly();

  constructor() {
    effect(() => {
      localStorage.setItem('inversiones-hide-amounts', String(this._hidden()));
    });
  }

  toggle(): void { this._hidden.update((h) => !h); }

  private resolveInitial(): boolean {
    return localStorage.getItem('inversiones-hide-amounts') === 'true';
  }
}