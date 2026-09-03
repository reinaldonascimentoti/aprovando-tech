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
  private readonly FADE_TIME = 0.25;
  private fadeTimeout: any;

  ngAfterViewInit(): void {
    this.initAndPlayVideo();
  }

  private initAndPlayVideo(): void {
    const vid = this.singleVideo?.nativeElement;
    if (!vid) return;

    // Configurações críticas para garantir autoplay sem bloqueio do navegador
    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.autoplay = true;

    const startPlay = () => {
      vid.muted = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback: tenta novamente ao primeiro clique/toque do usuário na página
          const resumeOnInteraction = () => {
            vid.muted = true;
            vid.play().catch(() => {});
            window.removeEventListener('click', resumeOnInteraction);
            window.removeEventListener('touchstart', resumeOnInteraction);
          };
          window.addEventListener('click', resumeOnInteraction, { once: true });
          window.addEventListener('touchstart', resumeOnInteraction, { once: true });
        });
      }
    };

    if (vid.readyState >= 2) {
      startPlay();
    } else {
      vid.addEventListener('loadeddata', startPlay, { once: true });
      vid.addEventListener('canplay', startPlay, { once: true });
      // Força carregamento caso esteja pendente
      vid.load();
    }
  }

  onTimeUpdate(): void {
    const vid = this.singleVideo?.nativeElement;
    if (!vid || !vid.duration || this.isRestarting) return;

    const remaining = vid.duration - vid.currentTime;

    if (remaining <= this.FADE_TIME && !this.isFading) {
      this.isFading = true;
      clearTimeout(this.fadeTimeout);
      // Timeout de segurança para nunca travar invisível
      this.fadeTimeout = setTimeout(() => {
        if (this.isFading) {
          this.isFading = false;
        }
      }, 800);
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
    clearTimeout(this.fadeTimeout);
    this.singleVideo?.nativeElement?.pause();
  }

  scrollToHowItWorks(): void {
    document.querySelector('#como-funciona')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

