import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PeriodFilterComponent } from '../../shared/components/period-filter/period-filter.component';

@Component({
  selector: 'app-dashboard',
  imports: [PeriodFilterComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  
}