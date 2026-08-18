import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FOOTER_LINKS } from '../../home.constants';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly links = FOOTER_LINKS;
  readonly year = new Date().getFullYear();
}
