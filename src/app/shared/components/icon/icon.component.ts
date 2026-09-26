import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';

export type IconName =
  | 'chart'
  | 'trending'
  | 'history'
  | 'report'
  | 'eye'
  | 'eye-off'
  | 'moon'
  | 'sun'
  | 'user'
  | 'settings'
  | 'info'
  | 'plus' 
  | 'arrow-up' 
  | 'arrow-down' 
  | 'more-vertical'
  | 'search'
  | 'calculator'
  | 'total_investment'
  | 'total_profit'
  | 'swap'
  | 'edit'
  | 'archive'
  | 'trash'
  | 'restore'
  ;

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyMaskDirective],
})
export class IconComponent {
  name = input.required<IconName>();
  size = input<number>(20);

  @HostBinding('style.width.px')
  get widthPx(): number {
    return this.size();
  }

  @HostBinding('style.height.px')
  get heightPx(): number {
    return this.size();
  }
}