import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  templateUrl: './sparkline.component.html',
  styleUrl: './sparkline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklineComponent {
  values = input.required<number[]>();
  tone = input<'profit' | 'loss' | 'neutral'>('neutral');

  protected readonly points = computed(() => this.buildPoints(this.values()));

  private buildPoints(values: number[]): string {
    if (values.length < 2) return '';
    const width = 100;
    const height = 32;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // evita división por cero si todos los valores son iguales
    const stepX = width / (values.length - 1);

    return values
      .map((value, index) => {
        const x = index * stepX;
        const y = height - ((value - min) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }
}