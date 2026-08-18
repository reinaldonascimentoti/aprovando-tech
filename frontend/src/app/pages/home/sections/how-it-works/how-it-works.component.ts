import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { STEPS } from '../../home.constants';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.scss'],
})
export class HowItWorksComponent {
  readonly steps = STEPS;
}
