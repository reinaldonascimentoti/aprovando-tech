import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FEATURES } from '../../home.constants';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
})
export class FeaturesComponent {
  readonly features = FEATURES;
}
