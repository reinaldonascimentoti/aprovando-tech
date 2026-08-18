import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './sections/navbar/navbar.component';
import { HeroComponent } from './sections/hero/hero.component';
import { RecentEditaisComponent } from './sections/recent-editais/recent-editais.component';
import { StatsComponent } from './sections/stats/stats.component';
import { HowItWorksComponent } from './sections/how-it-works/how-it-works.component';
import { FeaturesComponent } from './sections/features/features.component';
import { TestimonialsComponent } from './sections/testimonials/testimonials.component';
import { CtaFinalComponent } from './sections/cta-final/cta-final.component';
import { FooterComponent } from './sections/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HeroComponent,
    RecentEditaisComponent,
    StatsComponent,
    HowItWorksComponent,
    FeaturesComponent,
    TestimonialsComponent,
    CtaFinalComponent,
    FooterComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
