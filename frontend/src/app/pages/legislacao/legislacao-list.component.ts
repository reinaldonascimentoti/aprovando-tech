import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LegislacaoService, Legislacao } from '../../services/legislacao.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-legislacao-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--on-surface)] p-4 sm:p-6 md:p-8">

      <!-- Header -->
      <header class="neo-raised rounded-2xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined !text-[22px]">gavel</span>
          </div>
          <div>
            <h1 class="text-lg font-black text-[var(--on-surface)]">Comentador de Legislação</h1>
            <p class="text-xs text-[var(--on-surface-variant)]">Aprovando Tech • Análise Didática com IA</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="themeService.toggle()"
            class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-[var(--on-surface)]">
            <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">
              {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
            </span>
          </button>
          <button (click)="router.navigate([isAdmin ? '/admin' : '/student'])"
            class="btn-neo px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-[var(--primary)]">
            <span class="material-symbols-outlined !text-[16px]">arrow_back</span>
            <span class="hidden sm:inline">Dashboard</span>
          </button>
          <button (click)="router.navigate(['/legislacao/nova'])"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white font-bold text-xs shadow-md shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all">
            <span class="material-symbols-outlined !text-[18px]">add</span>
            Nova Legislação
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="rounded-3xl p-2.5 sm:p-3.5 mb-6 md:mb-8 bg-[var(--card-bg)] shadow-xs border border-[var(--outline-variant)] transition-colors">
        <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
            <!-- 1. Vade Mecum Tab -->
            <button 
              type="button"
              (click)="setAba('vade_mecum')"
              [ngClass]="abaAtiva === 'vade_mecum' ? 
                'bg-[#5d3bf6]/10 dark:bg-[#1e293b] border border-[#5d3bf6]/30 dark:border-[#7c3aed]/50 rounded-[22px] sm:rounded-3xl p-1.5 sm:p-2 pr-4 sm:pr-5 shadow-2xs' : 
                'p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-[22px] hover:bg-[var(--surface-container-low)] dark:hover:bg-[#334155]/40 border border-transparent'"
              class="flex items-center gap-3 transition-all duration-200 cursor-pointer shrink-0 group text-left">
              <div 
                [ngClass]="abaAtiva === 'vade_mecum' ? 
                  'bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white shadow-md shadow-purple-500/30' : 
                  'bg-[var(--surface-container-low)] dark:bg-[#334155] text-[var(--outline)] dark:text-[#94a3b8] group-hover:scale-105 group-hover:text-[#5d3bf6]'"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform">
                <span class="material-symbols-outlined !text-[22px] sm:!text-[24px]">menu_book</span>
              </div>
              <div class="flex flex-col justify-center">
                <span 
                  [ngClass]="abaAtiva === 'vade_mecum' ? 'font-extrabold text-[#5d3bf6] dark:text-[#e7e5e4]' : 'font-bold text-[var(--on-surface)] dark:text-[#cbd5e1] group-hover:text-[#5d3bf6]'"
                  class="text-sm sm:text-[15px] tracking-tight leading-tight whitespace-nowrap transition-colors">
                  Meu Vade Mecum
                </span>
                <span *ngIf="abaAtiva === 'vade_mecum'" class="text-xs font-semibold text-[var(--on-surface-variant)] dark:text-[#a78bfa] leading-tight whitespace-nowrap">
                  Suas leis salvas
                </span>
              </div>
            </button>

            <!-- 2. Catálogo Global Tab -->
            <button 
              type="button"
              (click)="setAba('catalogo')"
              [ngClass]="abaAtiva === 'catalogo' ? 
                'bg-[#5d3bf6]/10 dark:bg-[#1e293b] border border-[#5d3bf6]/30 dark:border-[#7c3aed]/50 rounded-[22px] sm:rounded-3xl p-1.5 sm:p-2 pr-4 sm:pr-5 shadow-2xs' : 
                'p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-[22px] hover:bg-[var(--surface-container-low)] dark:hover:bg-[#334155]/40 border border-transparent'"
              class="flex items-center gap-3 transition-all duration-200 cursor-pointer shrink-0 group text-left">
              <div 
                [ngClass]="abaAtiva === 'catalogo' ? 
                  'bg-gradient-to-tr from-[#5d3bf6] to-[#7c3aed] text-white shadow-md shadow-purple-500/30' : 
                  'bg-[var(--surface-container-low)] dark:bg-[#334155] text-[var(--outline)] dark:text-[#94a3b8] group-hover:scale-105 group-hover:text-[#5d3bf6]'"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform">
                <span class="material-symbols-outlined !text-[22px] sm:!text-[24px]">public</span>
              </div>
              <div class="flex flex-col justify-center">
                <span 
                  [ngClass]="abaAtiva === 'catalogo' ? 'font-extrabold text-[#5d3bf6] dark:text-[#e7e5e4]' : 'font-bold text-[var(--on-surface)] dark:text-[#cbd5e1] group-hover:text-[#5d3bf6]'"
                  class="text-sm sm:text-[15px] tracking-tight leading-tight whitespace-nowrap transition-colors">
                  Catálogo Global
                </span>
                <span *ngIf="abaAtiva === 'catalogo'" class="text-xs font-semibold text-[var(--on-surface-variant)] dark:text-[#a78bfa] leading-tight whitespace-nowrap">
                  Todas as legislações
                </span>
              </div>
            </button>
          </div>

          <!-- Barra de Busca (apenas Catálogo Global) -->
          <div *ngIf="abaAtiva === 'catalogo' && !loading" class="relative w-full xl:w-96 shrink-0 transition-all duration-300">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span class="material-symbols-outlined !text-[20px] text-[var(--on-surface-variant)]">search</span>
            </div>
            <input type="text" [(ngModel)]="searchQuery" (input)="filterCatalogo()"
              placeholder="Buscar por título, número ou ano..."
              class="w-full pl-11 pr-4 py-2.5 bg-[var(--surface-container-low)] dark:bg-[#334155]/40 border border-[var(--outline-variant)] rounded-[20px] text-sm focus:outline-none focus:border-[#5d3bf6] focus:ring-1 focus:ring-[#5d3bf6] text-[var(--on-surface)] transition-all placeholder-[var(--on-surface-variant)]/60">
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let _ of [1,2,3]"
          class="rounded-3xl p-6 bg-[var(--card-bg)] border border-[var(--outline-variant)] animate-pulse h-52"></div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && getLegislacoesExibidas().length === 0"
        class="neo-raised rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 mx-2 md:mx-6 xl:mx-12">
        <div class="w-20 h-20 rounded-2xl bg-[var(--primary)]/15 flex items-center justify-center">
          <span class="material-symbols-outlined !text-[44px] text-[var(--primary)]">gavel</span>
        </div>
        <h2 class="text-lg font-black text-[var(--on-surface)]">Nenhuma legislação cadastrada</h2>
        <p class="text-sm text-[var(--on-surface-variant)] max-w-sm">
          Envie uma lei, decreto ou instrução normativa para gerar comentários didáticos artigo por artigo.
        </p>
        <button (click)="router.navigate(['/legislacao/nova'])"
          class="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 text-white font-bold text-sm shadow-md shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all">
          <span class="material-symbols-outlined !text-[20px]">upload_file</span>
          Enviar primeira legislação
        </button>
      </div>

      <!-- Lista de cards (Meu Vade Mecum) -->
      <div *ngIf="!loading && legislacoesVadeMecum.length > 0 && abaAtiva === 'vade_mecum'" class="flex flex-col px-2 md:px-6 xl:px-12">
        <div *ngFor="let grupo of getVadeMecumGroupedByRamo()"
             class="mb-2 transition-all"
             [ngClass]="{'border-b-2 border-[#5d3bf6]/40 mb-6 pb-1': !isRamoExpanded(grupo.ramo)}">
          <div (click)="toggleRamo(grupo.ramo)"
              (mouseenter)="hoveredRamo = grupo.ramo"
              (mouseleave)="hoveredRamo = null"
              class="cursor-pointer text-xl font-black text-[var(--on-surface)] mb-4 flex items-center justify-between px-4 py-3 rounded-2xl select-none"
              [style.background]="hoveredRamo === grupo.ramo ? 'rgba(93,59,246,0.08)' : 'transparent'">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#5d3bf6]/10 flex items-center justify-center text-[#5d3bf6]">
                <span class="material-symbols-outlined !text-[20px]">book_ribbon</span>
              </div>
              {{ grupo.ramo }}
              <span class="text-xs font-bold text-[#5d3bf6] px-2.5 py-0.5 bg-[#5d3bf6]/15 rounded-full ml-1">{{ grupo.legislacoes.length }}</span>
            </div>
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform duration-300 pointer-events-none"
                 [class.rotate-180]="isRamoExpanded(grupo.ramo)"
                 [style.background]="(hoveredRamo === grupo.ramo || isRamoExpanded(grupo.ramo)) ? '#5d3bf6' : 'var(--surface-container-low)'"
                 [style.color]="(hoveredRamo === grupo.ramo || isRamoExpanded(grupo.ramo)) ? 'white' : 'var(--on-surface-variant)'">
              <span class="material-symbols-outlined !text-[20px]">expand_more</span>
            </div>
          </div>
          <div class="flex flex-col gap-5 mb-6" *ngIf="isRamoExpanded(grupo.ramo)">
            <div *ngFor="let leg of grupo.legislacoes"
              class="bg-gradient-to-br from-[#f8f9ff] via-[#fbfbfe] to-[#edf2fe] dark:bg-gradient-to-br dark:from-[#13162d] dark:via-[#161a37] dark:to-[#1a1b3f] rounded-3xl p-4 sm:p-6 flex flex-col justify-between border-2 border-indigo-200/90 dark:border-indigo-500/40 hover:border-indigo-400 dark:hover:border-indigo-400/80 shadow-md shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden group cursor-pointer"
              (click)="router.navigate(['/legislacao', leg.id])">

          <!-- Ambient Glows -->
          <div class="absolute -right-12 -top-12 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>
          <div class="absolute -left-12 -bottom-12 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl pointer-events-none"></div>

          <!-- Top Accent Bar -->
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5d3bf6] via-[#7c3aed] to-[#38bdf8]"></div>

          <div class="relative z-10 pt-1">
            <!-- Top Badges & Actions Row -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="bg-[#5d3bf6] text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span class="material-symbols-outlined !text-[15px]">verified</span>
                  <span>Meu Vade Mecum</span>
                </span>

                <span class="bg-[#5d3bf6]/10 text-[#5d3bf6] dark:text-[#a78bfa] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-[#5d3bf6]/20 uppercase">
                  {{ leg.tipo || 'Legislação' }}{{ leg.numero ? ' Nº ' + leg.numero : '' }}{{ leg.numero && leg.ano ? ' / ' : (leg.ano ? ' ' : '') }}{{ leg.ano || '' }}
                </span>

                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border"
                  [style.background-color]="getUserStatusBg(leg)"
                  [style.color]="getUserStatusColor(leg)"
                  [style.border-color]="getUserStatusColor(leg) + '40'">
                  <span *ngIf="isProcessing(leg.status)" class="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                    [style.background-color]="getUserStatusColor(leg)"></span>
                  {{ getUserStatusLabel(leg) }}
                </span>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-2 shrink-0 relative z-10" (click)="$event.stopPropagation()">
                <a [routerLink]="['/legislacao', leg.id]"
                   class="bg-[#5d3bf6] hover:bg-[#4c2be8] text-white py-1.5 px-3 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                   title="Ler Artigos e Título">
                  <span class="material-symbols-outlined !text-[16px]">auto_stories</span>
                  <span class="truncate">Ler Artigos</span>
                </a>

                <a [routerLink]="['/questoes']" [queryParams]="{legislacao: leg.id}"
                   class="py-1.5 px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 bg-white dark:bg-[#1e293b] text-[#5d3bf6] hover:bg-[#5d3bf6]/10 border border-[#5d3bf6]/30 transition-all text-center"
                   title="Resolver Questões">
                  <span class="material-symbols-outlined !text-[16px]">quiz</span>
                  <span class="truncate">Questões</span>
                </a>

                <button (click)="confirmarRemover(leg)"
                  class="px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                  title="Remover do Vade Mecum">
                  <span class="material-symbols-outlined !text-[14px]">delete</span>
                  <span>Remover</span>
                </button>
                
                <button *ngIf="isAdmin" (click)="confirmarExcluir(leg)"
                  class="px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                  title="Excluir do Catálogo Global (Admin)">
                  <span class="material-symbols-outlined !text-[14px]">delete_forever</span>
                  <span>Excluir</span>
                </button>
              </div>
            </div>

            <!-- Title -->
            <h3 class="text-lg sm:text-xl font-black text-[var(--on-surface)] mb-1.5 leading-snug flex items-center gap-2">
              <span class="material-symbols-outlined !text-[20px] text-[#5d3bf6] shrink-0">
                {{ leg.tipo === 'Lei' ? 'policy' : leg.tipo === 'Decreto' ? 'history_edu' : leg.tipo === 'Constituição' ? 'account_balance' : 'gavel' }}
              </span>
              <span>{{ leg.titulo }}</span>
            </h3>
          </div>

          <!-- Progress Section -->
          <div class="flex-1 space-y-2 mt-4 relative z-10" (click)="$event.stopPropagation()">
            <!-- Progresso do Estudo -->
            <div class="bg-white/70 dark:bg-[#1e293b]/60 p-2.5 sm:p-3 rounded-2xl border border-indigo-100/80 dark:border-[var(--outline-variant)]/60">
              <div class="flex justify-between items-center text-xs font-bold mb-1.5">
                <span class="text-[var(--on-surface)] flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <span class="material-symbols-outlined !text-[15px] text-[#5d3bf6]">checklist_rtl</span>
                  Progresso do Estudo
                </span>
                <span class="text-[#5d3bf6] font-black text-[11px] sm:text-xs">{{ getEstudoPercent(leg) }}% Concluído</span>
              </div>
              <div class="w-full h-1.5 bg-indigo-100/60 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#5d3bf6] to-[#3b82f6] rounded-full transition-all duration-300"
                     [style.width.%]="getEstudoPercent(leg)"></div>
              </div>
              <div class="flex justify-between items-center text-[10px] text-[var(--on-surface-variant)] mt-1 font-medium">
                <span>{{ getEstudoLidos(leg) }} de {{ getEstudoTotal(leg) }} artigos lidos</span>
              </div>
            </div>
            
            <!-- Progresso de Comentários (Admin) -->
            <div *ngIf="isAdmin && getComentariosProcessamento(leg)" class="bg-white/70 dark:bg-[#1e293b]/60 p-2.5 sm:p-3 rounded-2xl border border-indigo-100/80 dark:border-[var(--outline-variant)]/60">
              <div class="flex justify-between items-center text-xs font-bold mb-1.5">
                <span class="text-[var(--on-surface)] flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <span class="material-symbols-outlined !text-[15px] text-amber-500">admin_panel_settings</span>
                  Processamento de Comentários
                </span>
                <span class="text-amber-600 font-black text-[11px] sm:text-xs">{{ getComentariosProcessamento(leg)?.quantidade_processada || 0 }} / {{ getComentariosProcessamento(leg)?.quantidade_total || 0 }}</span>
              </div>
              <div class="w-full h-1.5 bg-indigo-100/60 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300"
                     [style.width.%]="getComentariosPercent(leg)"></div>
              </div>
            </div>
          </div>
          </div>
        </div>
        </div>
      </div>

      <!-- Lista (Catálogo Global) -->
      <div *ngIf="!loading && abaAtiva === 'catalogo'" class="flex flex-col px-2 md:px-6 xl:px-12">
        <div *ngIf="legislacoesCatalogoFiltradas.length === 0" class="neo-raised rounded-3xl p-10 text-center text-sm font-semibold text-[var(--on-surface-variant)]">
          Nenhuma legislação encontrada para a sua busca.
        </div>

        <div *ngFor="let grupo of getCatalogoGroupedByRamo()"
             class="mb-2 transition-all"
             [ngClass]="{'border-b-2 border-[#5d3bf6]/40 mb-6 pb-1': !isRamoExpanded(grupo.ramo)}">
          <div (click)="toggleRamo(grupo.ramo)"
              (mouseenter)="hoveredRamo = grupo.ramo"
              (mouseleave)="hoveredRamo = null"
              class="cursor-pointer text-lg font-black text-[var(--on-surface)] mb-4 flex items-center justify-between px-4 py-3 rounded-2xl select-none"
              [style.background]="hoveredRamo === grupo.ramo ? 'rgba(93,59,246,0.08)' : 'transparent'">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#5d3bf6]/10 flex items-center justify-center text-[#5d3bf6]">
                <span class="material-symbols-outlined !text-[20px]">book_ribbon</span>
              </div>
              {{ grupo.ramo }}
              <span class="text-xs font-bold text-[#5d3bf6] px-2.5 py-0.5 bg-[#5d3bf6]/15 rounded-full ml-1">{{ grupo.legislacoes.length }}</span>
            </div>
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform duration-300 pointer-events-none"
                 [class.rotate-180]="isRamoExpanded(grupo.ramo)"
                 [style.background]="(hoveredRamo === grupo.ramo || isRamoExpanded(grupo.ramo)) ? '#5d3bf6' : 'var(--surface-container-low)'"
                 [style.color]="(hoveredRamo === grupo.ramo || isRamoExpanded(grupo.ramo)) ? 'white' : 'var(--on-surface-variant)'">
              <span class="material-symbols-outlined !text-[20px]">expand_more</span>
            </div>
          </div>
          <div class="flex flex-col gap-4 mb-6" *ngIf="isRamoExpanded(grupo.ramo)">
            <div *ngFor="let leg of grupo.legislacoes"
              class="rounded-2xl p-3 sm:p-4 bg-[var(--card-bg)] border border-[var(--outline-variant)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all flex items-center justify-between gap-3 sm:gap-4 group">
          
          <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-[#5d3bf6]/10 to-[#7c3aed]/10 border border-[#5d3bf6]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#5d3bf6]">
              <span class="material-symbols-outlined !text-[20px] sm:!text-[24px]" *ngIf="leg.tipo === 'Lei'">policy</span>
              <span class="material-symbols-outlined !text-[20px] sm:!text-[24px]" *ngIf="leg.tipo === 'Decreto'">history_edu</span>
              <span class="material-symbols-outlined !text-[20px] sm:!text-[24px]" *ngIf="leg.tipo === 'Constituição'">account_balance</span>
              <span class="material-symbols-outlined !text-[20px] sm:!text-[24px]" *ngIf="leg.tipo !== 'Lei' && leg.tipo !== 'Decreto' && leg.tipo !== 'Constituição'">gavel</span>
            </div>

            <!-- Informações Principais -->
            <div class="flex-1 min-w-0 flex items-center gap-3">
              <div class="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#5d3bf6]/5 dark:bg-black/20 shrink-0 whitespace-nowrap">
                <span class="text-[11px] font-bold uppercase text-[#475569] dark:text-[#94a3b8]">
                  {{ leg.tipo || 'Legislação' }}
                </span>
                <span *ngIf="leg.numero || leg.ano" class="text-[11px] font-bold text-[#475569] dark:text-[#94a3b8]">
                  {{ leg.numero ? 'Nº ' + leg.numero : '' }}{{ leg.numero && leg.ano ? ' / ' : '' }}{{ leg.ano || '' }}
                </span>
              </div>
              <h3 class="text-sm sm:text-base font-black text-[var(--on-surface)] truncate" [title]="leg.titulo">{{ leg.titulo }}</h3>
            </div>
          </div>

          <!-- Metadados e Ação -->
          <div class="flex items-center justify-end gap-3 sm:gap-4 shrink-0">
            <!-- Quantidade de Artigos -->
            <div class="flex flex-col items-center sm:items-end justify-center">
              <span class="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider opacity-90">Artigos</span>
              <span class="text-sm font-black text-[var(--on-surface)] flex items-center gap-1">
                <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">article</span>
                {{ getEstudoTotal(leg) || '...' }}
              </span>
            </div>

            <!-- Questões (se tiver) -->
            <ng-container *ngIf="leg.total_questoes">
              <div class="w-[1px] h-8 bg-[var(--outline-variant)]/50 hidden sm:block"></div>
              <div class="flex flex-col items-center sm:items-end justify-center">
                <span class="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider opacity-90">Questões</span>
                <span class="text-sm font-black text-[var(--on-surface)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[16px] text-sky-600 dark:text-sky-400">quiz</span>
                  {{ leg.total_questoes }}
                </span>
              </div>
            </ng-container>

            <!-- Cards/Flashcards (se tiver) -->
            <ng-container *ngIf="leg.total_flashcards">
              <div class="w-[1px] h-8 bg-[var(--outline-variant)]/50 hidden sm:block"></div>
              <div class="flex flex-col items-center sm:items-end justify-center">
                <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider opacity-90">Cards</span>
                <span class="text-sm font-black text-[var(--on-surface)] flex items-center gap-1">
                  <span class="material-symbols-outlined !text-[16px] text-amber-600 dark:text-amber-400">style</span>
                  {{ leg.total_flashcards }}
                </span>
              </div>
            </ng-container>
            
            <div class="w-[1px] h-8 bg-[var(--outline-variant)]/50 hidden sm:block"></div>

            <!-- Ações -->
            <div class="flex items-center gap-2">
              <button *ngIf="isAdmin" (click)="confirmarExcluir(leg)"
                class="btn-neo p-2 rounded-xl text-[var(--error)] hover:bg-[var(--error)]/10 transition-all" title="Excluir do Catálogo">
                <span class="material-symbols-outlined !text-[18px]">delete</span>
              </button>

              <!-- Botão Adicionar -->
              <button *ngIf="!isAlreadyAdded(leg.id)"
                (click)="addToVadeMecum(leg)"
                [disabled]="addingLegId === leg.id"
                class="btn-neo px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] hover:opacity-90 shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50">
                <span class="material-symbols-outlined !text-[18px]">{{ addingLegId === leg.id ? 'hourglass_empty' : 'library_add' }}</span>
                {{ addingLegId === leg.id ? 'Adicionando...' : 'Adicionar ao Vade Mecum' }}
              </button>
              <span *ngIf="isAlreadyAdded(leg.id)"
                class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
                <span class="material-symbols-outlined !text-[18px]">check_circle</span>
                No Vade Mecum
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>

      <!-- Modal de confirmação de exclusão -->
      <div *ngIf="excluindoLeg"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="neo-raised rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 bg-[var(--card-bg)]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[var(--error)]/15 flex items-center justify-center">
              <span class="material-symbols-outlined !text-[20px] text-[var(--error)]">warning</span>
            </div>
            <h3 class="font-black text-[var(--on-surface)]">Excluir legislação?</h3>
          </div>
          <p class="text-sm text-[var(--on-surface-variant)]">
            Esta ação irá remover <strong>"{{ excluindoLeg.titulo }}"</strong> e todos os artigos e comentários associados. Esta ação é irreversível.
          </p>
          <div class="flex gap-3 justify-end">
            <button (click)="excluindoLeg = null"
              class="btn-neo px-4 py-2 rounded-xl text-sm font-semibold text-[var(--on-surface)]">Cancelar</button>
            <button (click)="executarExclusao()"
              [disabled]="excluindo"
              class="px-4 py-2 rounded-xl bg-[var(--error)] text-white font-bold text-sm disabled:opacity-50 cursor-pointer">
              {{ excluindo ? 'Excluindo...' : 'Excluir' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de confirmação de remoção do Vade Mecum -->
      <div *ngIf="removendoLeg"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="neo-raised rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 bg-[var(--card-bg)]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[var(--error)]/15 flex items-center justify-center">
              <span class="material-symbols-outlined !text-[20px] text-[var(--error)]">delete</span>
            </div>
            <h3 class="font-black text-[var(--on-surface)]">Remover do Vade Mecum?</h3>
          </div>
          <p class="text-sm text-[var(--on-surface-variant)]">
            Deseja remover <strong>"{{ removendoLeg.titulo }}"</strong> do seu Vade Mecum? Seu progresso será pausado e a legislação voltará para o Catálogo Global.
          </p>
          <div class="flex gap-3 justify-end">
            <button (click)="removendoLeg = null"
              class="btn-neo px-4 py-2 rounded-xl text-sm font-semibold text-[var(--on-surface)]">Cancelar</button>
            <button (click)="executarRemocao()"
              [disabled]="removendo"
              class="px-4 py-2 rounded-xl bg-[var(--error)] text-white font-bold text-sm disabled:opacity-50 cursor-pointer">
              {{ removendo ? 'Removendo...' : 'Remover' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LegislacaoListComponent implements OnInit, OnDestroy {
  legislacoesCatalogo: Legislacao[] = [];
  legislacoesCatalogoFiltradas: Legislacao[] = [];
  legislacoesVadeMecum: Legislacao[] = [];
  vadeMecumIds = new Set<string>();
  
  searchQuery: string = '';
  abaAtiva: 'vade_mecum' | 'catalogo' = 'vade_mecum';
  addingLegId: string | null = null;
  expandedRamos: Set<string> = new Set();
  hoveredRamo: string | null = null;
  vadeMecumGroups: { ramo: string; legislacoes: Legislacao[] }[] = [];
  catalogoGroups: { ramo: string; legislacoes: Legislacao[] }[] = [];
  
  loading = true;
  excluindoLeg: Legislacao | null = null;
  excluindo = false;
  
  removendoLeg: Legislacao | null = null;
  removendo = false;
  
  private subs: Subscription[] = [];

  constructor(
    public router: Router,
    public legislacaoService: LegislacaoService,
    public themeService: ThemeService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.carregar();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  carregar() {
    this.loading = true;
    
    // Carrega o Vade Mecum (específico do usuário)
    const subVade = this.legislacaoService.listar(false).subscribe({
      next: (data: any) => {
        this.legislacoesVadeMecum = Array.isArray(data) ? data : (data?.data || []);
        this.vadeMecumIds = new Set(this.legislacoesVadeMecum.map(l => l.id));
        this.vadeMecumGroups = this.groupByRamo(this.legislacoesVadeMecum);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.subs.push(subVade);

    // Carrega o Catálogo (global)
    const subCatalogo = this.legislacaoService.listar(true).subscribe({
      next: (data: any) => {
        this.legislacoesCatalogo = Array.isArray(data) ? data : (data?.data || []);
        this.filterCatalogo();
      },
      error: () => {}
    });
    this.subs.push(subCatalogo);
  }

  setAba(aba: 'vade_mecum' | 'catalogo') {
    this.abaAtiva = aba;
  }

  toggleRamo(ramo: string) {
    const next = new Set(this.expandedRamos);
    if (next.has(ramo)) {
      next.delete(ramo);
    } else {
      next.add(ramo);
    }
    this.expandedRamos = next;
  }

  isRamoExpanded(ramo: string): boolean {
    if (this.searchQuery.trim() !== '') return true;
    return this.expandedRamos.has(ramo);
  }

  getLegislacoesExibidas() {
    if (this.abaAtiva === 'catalogo') return this.legislacoesCatalogoFiltradas;
    return this.legislacoesVadeMecum;
  }

  filterCatalogo() {
    if (!this.searchQuery.trim()) {
      this.legislacoesCatalogoFiltradas = [...this.legislacoesCatalogo];
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.legislacoesCatalogoFiltradas = this.legislacoesCatalogo.filter(leg =>
        (leg.titulo && String(leg.titulo).toLowerCase().includes(q)) ||
        (leg.numero && String(leg.numero).toLowerCase().includes(q)) ||
        (leg.ano && String(leg.ano).toLowerCase().includes(q)) ||
        (leg.tipo && String(leg.tipo).toLowerCase().includes(q)) ||
        (leg.ramo_direito && String(leg.ramo_direito).toLowerCase().includes(q))
      );
    }
    this.catalogoGroups = this.groupByRamo(this.legislacoesCatalogoFiltradas);
  }

  getVadeMecumGroupedByRamo() {
    return this.vadeMecumGroups;
  }

  getCatalogoGroupedByRamo() {
    return this.catalogoGroups;
  }

  private groupByRamo(list: Legislacao[]) {
    const map = new Map<string, Legislacao[]>();
    for (const leg of list) {
      const ramo = leg.ramo_direito || 'Sem Classificação';
      if (!map.has(ramo)) map.set(ramo, []);
      map.get(ramo)!.push(leg);
    }
    return Array.from(map.entries())
      .map(([ramo, legislacoes]) => ({ ramo, legislacoes }))
      .sort((a, b) => {
        if (a.ramo === 'Sem Classificação') return 1;
        if (b.ramo === 'Sem Classificação') return -1;
        return a.ramo.localeCompare(b.ramo);
      });
  }

  isAlreadyAdded(id: string): boolean {
    return this.vadeMecumIds.has(id);
  }

  addToVadeMecum(leg: Legislacao) {
    if (this.isAlreadyAdded(leg.id)) return;
    this.addingLegId = leg.id;
    const sub = this.legislacaoService.adicionarAoVadeMecum(leg.id).subscribe({
      next: () => {
        this.vadeMecumIds.add(leg.id);
        this.legislacoesVadeMecum.push(leg); // Optimistic UI update
        this.vadeMecumGroups = this.groupByRamo(this.legislacoesVadeMecum);
        this.addingLegId = null;
      },
      error: () => { this.addingLegId = null; }
    });
    this.subs.push(sub);
  }

  confirmarRemover(leg: Legislacao) {
    this.removendoLeg = leg;
  }

  executarRemocao() {
    if (!this.removendoLeg) return;
    const leg = this.removendoLeg;
    this.removendo = true;
    
    // Optimistic UI
    this.vadeMecumIds.delete(leg.id);
    this.legislacoesVadeMecum = this.legislacoesVadeMecum.filter(l => l.id !== leg.id);
    this.vadeMecumGroups = this.groupByRamo(this.legislacoesVadeMecum);
    
    const sub = this.legislacaoService.removerDoVadeMecum(leg.id).subscribe({
      next: () => {
        this.removendo = false;
        this.removendoLeg = null;
      },
      error: () => {
        // Rollback se falhar
        this.vadeMecumIds.add(leg.id);
        this.legislacoesVadeMecum.push(leg);
        this.vadeMecumGroups = this.groupByRamo(this.legislacoesVadeMecum);
        this.removendo = false;
        this.removendoLeg = null;
      }
    });
    this.subs.push(sub);
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getStatusBg(status: string): string {
    const color = this.legislacaoService.getStatusColor(status);
    return color + '15';
  }

  getUserStatusLabel(leg: Legislacao): string {
    if (this.isAdmin) {
      return this.legislacaoService.getStatusLabel(leg.status);
    }
    if (leg.status === 'pendente') return 'Pendente';
    if (leg.status === 'extraindo' || leg.status === 'comentando') return 'Processando...';
    if (leg.status === 'erro') return 'Indisponível';
    if (leg.status === 'concluida') {
      const pct = this.getEstudoPercent(leg);
      if (pct === 100) return 'Concluída';
      if (pct > 0) return 'Em Estudo';
      return 'Disponível';
    }
    return this.legislacaoService.getStatusLabel(leg.status);
  }

  getUserStatusColor(leg: Legislacao): string {
    if (this.isAdmin) {
      return this.legislacaoService.getStatusColor(leg.status);
    }
    if (leg.status === 'pendente') return '#94a3b8';
    if (leg.status === 'extraindo' || leg.status === 'comentando') return '#f59e0b';
    if (leg.status === 'erro') return '#ef4444';
    if (leg.status === 'concluida') {
      const pct = this.getEstudoPercent(leg);
      if (pct === 100) return '#10b981';
      if (pct > 0) return '#7c3aed';
      return '#10b981';
    }
    return this.legislacaoService.getStatusColor(leg.status);
  }

  getUserStatusBg(leg: Legislacao): string {
    return this.getUserStatusColor(leg) + '15';
  }

  getEstudoTotal(leg: Legislacao): number {
    const proc = (leg.processamentos || []).find(p => p.etapa === 'comentarios')
      || (leg.processamentos || []).find(p => p.etapa === 'extracao');
    return proc?.quantidade_total || 0;
  }

  getEstudoLidos(leg: Legislacao): number {
    return Array.isArray(leg.artigos_lidos) ? leg.artigos_lidos.length : 0;
  }

  getEstudoPercent(leg: Legislacao): number {
    const total = this.getEstudoTotal(leg);
    if (!total) return 0;
    const lidos = this.getEstudoLidos(leg);
    return Math.min(100, Math.round((lidos / total) * 100));
  }

  isProcessing(status: string): boolean {
    return status === 'extraindo' || status === 'comentando';
  }

  getComentariosProcessamento(leg: any) {
    return (leg.processamentos || []).find((p: any) => p.etapa === 'comentarios');
  }

  getComentariosPercent(leg: any): number {
    const p = this.getComentariosProcessamento(leg);
    if (!p || !p.quantidade_total) return 0;
    return Math.round((p.quantidade_processada / p.quantidade_total) * 100);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  confirmarExcluir(leg: Legislacao) {
    this.excluindoLeg = leg;
  }

  executarExclusao() {
    if (!this.excluindoLeg) return;
    const leg = this.excluindoLeg;
    this.excluindo = true;

    // Optimistic UI
    this.legislacoesVadeMecum = this.legislacoesVadeMecum.filter(l => l.id !== leg.id);
    this.legislacoesCatalogo = this.legislacoesCatalogo.filter(l => l.id !== leg.id);
    this.vadeMecumIds.delete(leg.id);
    this.vadeMecumGroups = this.groupByRamo(this.legislacoesVadeMecum);
    this.filterCatalogo();

    const sub = this.legislacaoService.excluir(leg.id).subscribe({
      next: () => {
        this.excluindoLeg = null;
        this.excluindo = false;
      },
      error: () => {
        // Rollback se falhar
        if (this.vadeMecumIds.has(leg.id)) {
          this.legislacoesVadeMecum.push(leg);
        }
        this.legislacoesCatalogo.push(leg);
        this.vadeMecumIds.add(leg.id);
        this.vadeMecumGroups = this.groupByRamo(this.legislacoesVadeMecum);
        this.filterCatalogo();
        
        this.excluindo = false;
        this.excluindoLeg = null;
      },
    });
    this.subs.push(sub);
  }
}
