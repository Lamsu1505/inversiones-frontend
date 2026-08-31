import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';

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
  ;

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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