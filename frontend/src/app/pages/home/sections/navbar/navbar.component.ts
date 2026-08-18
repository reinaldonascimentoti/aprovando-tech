import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NAV_LINKS, HERO_COPY } from '../../home.constants';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  readonly navLinks = NAV_LINKS;
  readonly hero = HERO_COPY;

  scrolled = signal(false);
  mobileMenuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  scrollTo(anchor: string): void {
    this.mobileMenuOpen.set(false);
    const el = document.querySelector(anchor);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
