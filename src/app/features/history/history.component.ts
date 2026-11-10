import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { InvestmentsRepository } from '../../core/repositories/investments.repository';
import { INVESTMENT_TIPO_LABELS } from '../../core/models/investment/investment-tipo.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { toUserMessage } from '../../core/errors/error-message.util';

@Component({
  selector: 'app-history',
  imports: [IconComponent, RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repository = inject(InvestmentsRepository);

  protected readonly investmentsRes = rxResource({
    stream: () => this.repository.list(),
  });

  /** Todas las inversiones, por nombre (localeCompare para que tildes y Ñ ordenen bien). */
  private readonly ordenadas = computed(() =>
    this.investmentsRes.hasValue()
      ? [...this.investmentsRes.value()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      : [],
  );

  protected readonly activas = computed(() => this.ordenadas().filter((i) => i.activa));
  protected readonly inactivas = computed(() => this.ordenadas().filter((i) => !i.activa));

  /** El :id de la URL tal como viene (texto). null si se entró por /history. */
  private readonly idParam = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );

  /** El id como número válido, o null si no hay o no es un número. */
  protected readonly selectedId = computed(() => {
    const raw = this.idParam();
    const n = raw === null ? NaN : Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
  });

  /** La inversión que se está viendo. */
  protected readonly investment = computed(() => {
    const id = this.selectedId();
    return id === null ? null : (this.ordenadas().find((i) => i.id === id) ?? null);
  });

  /** El id de la URL es un número, pero no existe ninguna inversión con ese id. */
  protected readonly noEncontrada = computed(
    () => this.investmentsRes.hasValue() && this.selectedId() !== null && this.investment() === null,
  );

  protected readonly tipoLabel = computed(() => {
    const tipo = this.investment()?.tipo;
    return tipo ? INVESTMENT_TIPO_LABELS[tipo] : null;
  });

  protected readonly hayInversiones = computed(
    () => this.activas().length + this.inactivas().length > 0,
  );

  /** "Fondo de Inversión · Bancolombia", omitiendo lo que no exista. */
  protected readonly metaTexto = computed(() => {
    const inv = this.investment();
    if (!inv) return '';
    return [this.tipoLabel(), inv.entidad].filter(Boolean).join(' · ');
  });

  protected readonly errorCarga = computed(() => {
    const err = this.investmentsRes.error();
    return err ? toUserMessage(err) : null;
  });

  constructor() {
    // Sin id en la URL (o con uno que no es un número): abrir la primera
    // inversión. replaceUrl evita que "atrás" vuelva a /history y redirija
    // otra vez.
    effect(() => {
      if (!this.investmentsRes.hasValue() || this.selectedId() !== null) return;
      const primera = this.activas()[0] ?? this.inactivas()[0];
      if (primera) {
        this.router.navigate(['/history', primera.id], { replaceUrl: true });
      }
    });
  }

  protected onSeleccion(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.router.navigate(['/history', id]);
  }
}