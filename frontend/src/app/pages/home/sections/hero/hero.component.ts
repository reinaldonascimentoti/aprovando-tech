import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HERO_COPY } from '../../home.constants';
import { SoftAuroraComponent } from '../../../../components/soft-aurora/soft-aurora.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, SoftAuroraComponent],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  readonly copy = HERO_COPY;

  @ViewChild('singleVideo') singleVideo!: ElementRef<HTMLVideoElement>;
  isFading = false;
  private isRestarting = false;

  ngAfterViewInit(): void {
    const vid = this.singleVideo?.nativeElement;
    if (vid) {
      vid.play().catch(() => {});
    }
  }

  onTimeUpdate(): void {
    const vid = this.singleVideo?.nativeElement;
    if (!vid || !vid.duration || this.isRestarting) return;

    const remaining = vid.duration - vid.currentTime;

    // Ultra-fast micro-dissolve 0.12s before end
    if (remaining <= 0.12 && !this.isFading) {
      this.isFading = true;
    }
  }

  onVideoEnded(): void {
    const vid = this.singleVideo?.nativeElement;
    if (!vid) return;

    this.isRestarting = true;
    this.isFading = true;
    vid.currentTime = 0;

    vid.play().then(() => {
      requestAnimationFrame(() => {
        this.isFading = false;
        this.isRestarting = false;
      });
    }).catch(() => {
      this.isFading = false;
      this.isRestarting = false;
    });
  }

  ngOnDestroy(): void {
    this.singleVideo?.nativeElement?.pause();
  }

  scrollToHowItWorks(): void {
    document.querySelector('#como-funciona')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

