import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TESTIMONIALS } from '../../home.constants';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
})
export class TestimonialsComponent {
  readonly testimonials = TESTIMONIALS;
}
