import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconName, IconComponent } from '../../../../shared/components/icon/icon.component';

export type KpiTone = 'neutral' | 'profit' | 'loss';

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
})
export class KpiCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  subtitle = input<string>('');
  tone = input<KpiTone>('neutral');
}