import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CTA_FINAL_COPY } from '../../home.constants';

@Component({
  selector: 'app-cta-final',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cta-final.component.html',
  styleUrls: ['./cta-final.component.scss'],
})
export class CtaFinalComponent {
  readonly copy = CTA_FINAL_COPY;
}
