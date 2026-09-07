import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { getBancaLogo, getBancaInfo, BancaInfo } from '../../utils/banca.utils';

@Component({
  selector: 'app-edital-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="bg-gradient-to-br from-[#f6f5ff] via-[#f9f8ff] to-[#edf0fe] dark:bg-gradient-to-br dark:from-[#13162d] dark:via-[#161a37] dark:to-[#1a1b3f] rounded-3xl p-4 sm:p-6 flex flex-col justify-between border-2 border-indigo-300/80 hover:border-indigo-500 dark:border-indigo-500/40 dark:hover:border-indigo-400/80 shadow-md shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden group text-[var(--on-surface)]">
      
      <!-- Ambient Glows: Identificação sutil de edital do usuário -->
      <div class="absolute -right-12 -top-12 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute -left-12 -bottom-12 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl pointer-events-none"></div>

      <!-- Top Accent Bar: Identificador Meu Edital -->
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[#38bdf8]"></div>

      <div class="relative z-10">
        <!-- Top Badges Row -->
        <div class="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Badge Exclusivo de Posse do Edital -->
            <span class="bg-gradient-to-r from-[#5d3bf6] to-[#7c3aed] text-white text-xs sm:text-[12.5px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm shadow-[#5d3bf6]/30">
              <span class="material-symbols-outlined !text-[15px]">verified</span>
              <span>Meu Edital</span>
            </span>

            <span class="bg-[var(--secondary)]/15 text-[var(--secondary)] text-xs sm:text-[13px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <span class="material-symbols-outlined !text-[15px]">stars</span>
              {{ edital.pareto_data?.high_priority_subjects || 2 }} Matérias Vitais (20%)
            </span>
            <span *ngIf="edital.concurso" class="bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-extrabold px-3 py-1 rounded-full">
              {{ edital.concurso }}
            </span>
            <span *ngIf="getEditalBancaName(edital)" class="inline-flex items-center gap-1.5 bg-[#fff3e0] dark:bg-amber-950/40 text-[#e65100] dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
              <span *ngIf="getEditalBanca(edital)" class="h-3.5 w-6 flex items-center justify-center bg-white rounded px-0.5 shadow-xs">
                <img [src]="getEditalBanca(edital)?.logo" [alt]="getEditalBancaName(edital)" class="max-h-full max-w-full object-contain" />
              </span>
              <span *ngIf="!getEditalBanca(edital)" class="material-symbols-outlined !text-[13px]">shield</span>
              <span class="truncate max-w-[110px]">{{ getEditalBanca(edital)?.shortName || getEditalBancaName(edital) }}</span>
            </span>
          </div>
          <span class="text-xs sm:text-[13px] font-bold text-[var(--on-surface-variant)]">{{ edital.created_at | date:'dd/MM/yyyy' }}</span>
        </div>

        <!-- Title & Cargo -->
        <h3 class="text-lg sm:text-xl font-black text-[var(--on-surface)] mb-1.5 leading-snug flex items-center gap-2">
          <span class="material-symbols-outlined !text-[20px] text-[var(--primary)] shrink-0">description</span>
          <span>{{ edital.title }}</span>
        </h3>
        <p class="text-xs sm:text-[13px] font-semibold text-[var(--on-surface-variant)] mb-4 flex items-center gap-1.5" *ngIf="edital.cargo">
          <span class="material-symbols-outlined !text-[16px] text-[var(--primary)] shrink-0">badge</span>
          <span>{{ edital.cargo }}</span>
        </p>

        <!-- Progress Bar -->
        <div class="space-y-1.5 mb-4 sm:mb-5 bg-white/90 dark:bg-[#0f1220]/75 backdrop-blur-xs p-3 sm:p-3.5 rounded-2xl border border-indigo-100/90 dark:border-indigo-500/20 shadow-xs">
          <div class="flex justify-between items-center text-xs sm:text-[13px] font-bold">
            <span class="text-[var(--on-surface-variant)] flex items-center gap-1.5 text-xs sm:text-[13px]">
              <span class="material-symbols-outlined !text-[16px] text-[var(--primary)]">checklist_rtl</span>
              Progresso do Checklist
            </span>
            <span class="text-[var(--primary)] font-black text-xs sm:text-[13px]">{{ progressPercentage }}%</span>
          </div>
          <div class="w-full h-2.5 bg-indigo-100/70 dark:bg-[var(--surface-container-high)] rounded-full overflow-hidden p-0.5">
            <div class="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full transition-all duration-300"
                 [style.width.%]="progressPercentage"></div>
          </div>
        </div>
      </div>

      <!-- Action Buttons Row (Responsive Grid on Mobile, Flex on Desktop) -->
      <div class="pt-3 border-t border-[var(--outline-variant)]/40 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
        <div class="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 w-full sm:w-auto flex-1">
          <a [routerLink]="['/disciplinas', edital.id]"
             class="btn-mesh py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-extrabold flex items-center justify-center gap-1.5 text-center"
             title="Mapa Geral das Disciplinas (Tabela Completa)">
            <span class="material-symbols-outlined !text-[17px]">grid_view</span>
            <span class="truncate">Mapa Geral</span>
          </a>

          <a *ngIf="edital.pareto_data?.pareto_analisado" [routerLink]="['/pareto', edital.id]"
             class="py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 bg-[var(--secondary)]/15 text-[var(--secondary)] hover:bg-[var(--secondary)]/25 transition-all text-center"
             title="Ver Relatório Pareto 80/20">
            <span class="material-symbols-outlined !text-[17px]">donut_large</span>
            <span class="truncate">Ver Pareto</span>
          </a>

          <a *ngIf="!edital.pareto_data?.pareto_analisado" [routerLink]="['/disciplinas', edital.id]"
             class="py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 transition-all text-center"
             title="Abrir Mapa para Executar Análise Pareto">
            <span class="material-symbols-outlined !text-[17px]">analytics</span>
            <span class="truncate">Analisar Pareto</span>
          </a>

          <a [routerLink]="['/sprints', edital.id]"
             class="btn-neo py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 text-[var(--on-surface)] text-center"
             title="Ver Cronograma de Estudos">
            <span class="material-symbols-outlined !text-[17px] text-[var(--primary)]">calendar_month</span>
            <span class="truncate">Ver Cronograma</span>
          </a>
        </div>

        <div class="flex items-center justify-end gap-2 w-full sm:w-auto">
          <!-- Role Specific Actions (Admin vs Student) -->
          <ng-container *ngIf="isAdmin">
            <button
              (click)="editEdital.emit(edital)"
              class="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#fff3e0] dark:bg-[#e65100]/25 text-[#e65100] dark:text-[#ffb74d] hover:bg-[#ffe0b2] dark:hover:bg-[#e65100]/40 transition-all cursor-pointer"
              title="Editar Análise de Edital">
              <span class="material-symbols-outlined !text-[15px]">edit</span>
              <span>Editar</span>
            </button>

            <button
              (click)="toggleSend.emit(edital.id)"
              class="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              [ngClass]="sendOpenId === edital.id ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[#e1dfff] dark:bg-[#2b20d2]/30 text-[#2b20d2] dark:text-[#c1c1ff] hover:bg-[#d5d2ff] dark:hover:bg-[#2b20d2]/50'">
              <span class="material-symbols-outlined !text-[15px]">send</span>
              <span>{{ sendOpenId === edital.id ? 'Fechar' : 'Enviar Link' }}</span>
            </button>

            <button
              (click)="deleteEdital.emit(edital)"
              class="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#ffdad6] dark:bg-[#ba1a1a]/30 text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffb4ab] dark:hover:bg-[#ba1a1a]/50 transition-all cursor-pointer"
              title="Excluir Edital">
              <span class="material-symbols-outlined !text-[15px]">delete</span>
              <span>Excluir</span>
            </button>
          </ng-container>

          <ng-container *ngIf="!isAdmin">
            <button
              (click)="editEdital.emit(edital)"
              class="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#fff3e0] dark:bg-[#e65100]/25 text-[#e65100] dark:text-[#ffb74d] hover:bg-[#ffe0b2] dark:hover:bg-[#e65100]/40 transition-all cursor-pointer"
              title="Editar Concurso">
              <span class="material-symbols-outlined !text-[15px]">edit</span>
              <span>Editar</span>
            </button>

            <ng-container *ngIf="dismissConfirmId === edital.id; else studentDismissBtn">
              <div class="flex gap-1 flex-1 sm:flex-initial justify-end">
                <button
                  (click)="confirmDismiss.emit(edital)"
                  class="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl text-xs font-bold bg-[#ba1a1a] text-white flex items-center justify-center gap-1 cursor-pointer">
                  <span class="material-symbols-outlined !text-[14px]">check</span>
                  Confirmar
                </button>
                <button
                  (click)="cancelDismiss.emit()"
                  class="py-2.5 px-2.5 rounded-xl text-xs font-bold border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer">
                  <span class="material-symbols-outlined !text-[14px]">close</span>
                </button>
              </div>
            </ng-container>
            <ng-template #studentDismissBtn>
              <button
                (click)="requestDismiss.emit(edital.id)"
                class="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#ffdad6] dark:bg-[#ba1a1a]/30 text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffb4ab] dark:hover:bg-[#ba1a1a]/50 transition-all cursor-pointer"
                title="Excluir Edital">
                <span class="material-symbols-outlined !text-[15px]">delete</span>
                <span>Excluir</span>
              </button>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </div>
  `
})
export class EditalCardComponent implements OnInit, OnChanges {
  @Input() edital: any;
  @Input() isAdmin: boolean = false;
  @Input() sendOpenId: string | null = null;
  @Input() dismissConfirmId: string | null = null;

  @Output() toggleSend = new EventEmitter<string>();
  @Output() deleteEdital = new EventEmitter<any>();
  @Output() editEdital = new EventEmitter<any>();
  @Output() requestDismiss = new EventEmitter<string>();
  @Output() confirmDismiss = new EventEmitter<any>();
  @Output() cancelDismiss = new EventEmitter<void>();

  progressPercentage: number = 0;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    this.calculateProgress();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['edital']) {
      this.calculateProgress();
    }
  }

  async calculateProgress(): Promise<void> {
    if (!this.edital?.id) return;
    try {
      const stored = localStorage.getItem(`edital_checklist_${this.edital.id}`);
      let checkedMap = stored ? JSON.parse(stored) : {};

      if (!stored || Object.keys(checkedMap).length === 0) {
        const remoteMap = await this.supabaseService.getUserEditalChecklist(this.edital.id);
        if (remoteMap && Object.keys(remoteMap).length > 0) {
          checkedMap = remoteMap;
          localStorage.setItem(`edital_checklist_${this.edital.id}`, JSON.stringify(checkedMap));
        }
      }

      const disciplines = this.extractDisciplines(this.edital);
      let totalSubtopics = 0;
      let completedSubtopics = 0;

      disciplines.forEach((disc: any) => {
        const discName = disc.nome;
        (disc.camada_2_topicos || []).forEach((topic: any) => {
          const topicName = topic.nome;
          const topicKey = `${discName}::${topicName}::__TOPIC__`;
          const isTopicChecked = !!checkedMap[topicKey];

          const subs = topic.camada_3_subtopicos || [];
          if (subs.length > 0) {
            subs.forEach((sub: any) => {
              totalSubtopics++;
              const subName = typeof sub === 'string' ? sub : (sub.nome || sub.name || 'Subtópico');
              const subKey = `${discName}::${topicName}::${subName}`;
              if (isTopicChecked || !!checkedMap[subKey]) {
                completedSubtopics++;
              }
            });
          } else {
            totalSubtopics++;
            if (isTopicChecked || !!checkedMap[`${discName}::${topicName}::${topicName}`]) {
              completedSubtopics++;
            }
          }
        });
      });

      if (totalSubtopics > 0) {
        this.progressPercentage = Math.round((completedSubtopics / totalSubtopics) * 100);
      } else {
        this.progressPercentage = 0;
      }
    } catch (e) {
      console.error('Erro ao ler checklist:', e);
      this.progressPercentage = 0;
    }
  }

  private extractDisciplines(editalInput: any): any[] {
    let pd = editalInput?.pareto_data || editalInput || {};
    if (typeof pd === 'string') {
      try { pd = JSON.parse(pd); } catch (e) { }
    }

    let basicas: any[] = [];
    let especificas: any[] = [];

    const parseCategoryGroup = (groupData: any, isBasica: boolean) => {
      const items: any[] = [];
      if (!groupData) return items;

      if (Array.isArray(groupData)) {
        for (const item of groupData) {
          if (!item) continue;
          const discName = item.disciplina || item.nome || item.name || 'Disciplina';
          const rawTopicos = Array.isArray(item.topicos) ? item.topicos : (Array.isArray(item.topics) ? item.topics : (Array.isArray(item.camada_2_topicos) ? item.camada_2_topicos : []));

          const topicosList = rawTopicos.map((t: any) => {
            const topName = typeof t === 'string' ? t : (t.nome || t.name || String(discName));
            const rawSubs = Array.isArray(t.subtopicos) ? t.subtopicos : (Array.isArray(t.assuntos) ? t.assuntos : (Array.isArray(t.camada_3_subtopicos) ? t.camada_3_subtopicos : []));
            return {
              nome: String(topName).trim(),
              camada_3_subtopicos: rawSubs.map((s: any) => typeof s === 'string' ? { nome: s.trim() } : { ...s, nome: String(s.nome || s.name || 'Assunto').trim() })
            };
          });

          items.push({
            nome: String(discName).trim(),
            isBasica: isBasica,
            camada_2_topicos: topicosList.length > 0 ? topicosList : [{ nome: String(discName).trim(), camada_3_subtopicos: [] }]
          });
        }
      } else if (typeof groupData === 'object') {
        for (const [discName, discVal] of Object.entries<any>(groupData)) {
          if (!discName) continue;
          const subs = Array.isArray(discVal?.subtopicos) ? discVal.subtopicos : (Array.isArray(discVal) ? discVal : []);
          items.push({
            nome: discName,
            isBasica: isBasica,
            camada_2_topicos: [{ nome: discName, camada_3_subtopicos: subs.map((s: any) => ({ nome: typeof s === 'string' ? s : (s.nome || s) })) }]
          });
        }
      }
      return items;
    };

    const mapaGeral = pd.mapa_geral || pd.mapa_geral_extraido || pd.mapa_completo;
    if (mapaGeral) {
      if (Array.isArray(mapaGeral.disciplinas_basicas) || Array.isArray(mapaGeral.disciplinas_especificas)) {
        const b = (mapaGeral.disciplinas_basicas || []).map((d: any) => ({ ...d, isBasica: true }));
        const e = (mapaGeral.disciplinas_especificas || []).map((d: any) => ({ ...d, isBasica: false }));
        if (b.length > 0 || e.length > 0) {
          basicas = b;
          especificas = e;
        }
      } else if (Array.isArray(mapaGeral.disciplinas) && mapaGeral.disciplinas.length > 0) {
        const discs = mapaGeral.disciplinas;
        basicas = discs.filter((d: any) => d.isBasica).map((d: any) => ({ ...d, isBasica: true }));
        especificas = discs.filter((d: any) => !d.isBasica).map((d: any) => ({ ...d, isBasica: false }));
      }
    }

    if (basicas.length === 0 && especificas.length === 0) {
      const cp = pd.conteudo_programatico?.conteudo_programatico || pd.conteudo_programatico || pd;
      if (cp) {
        basicas = parseCategoryGroup(cp.conhecimentos_gerais || cp.disciplinas_basicas, true);
        especificas = parseCategoryGroup(cp.conhecimentos_especificos || cp.disciplinas_especificas, false);
      }
    }

    if (basicas.length === 0 && especificas.length === 0 && Array.isArray(pd.subjects)) {
      especificas = pd.subjects.map((s: any) => ({
        nome: s.name || s.nome,
        isBasica: false,
        camada_2_topicos: (s.topics || []).map((t: any) => ({
          nome: t.name || t.nome,
          camada_3_subtopicos: (t.subtopics || []).map((sub: any) => ({
            nome: typeof sub === 'string' ? sub : (sub.name || sub.nome)
          }))
        }))
      }));
    }

    if (basicas.length === 0 && especificas.length === 0) {
      const genericArray = Array.isArray(pd.disciplinas) ? pd.disciplinas : (Array.isArray(pd) ? pd : []);
      if (genericArray.length > 0) {
        especificas = genericArray.map((d: any) => ({ ...d, isBasica: false }));
      }
    }

    const result = [...especificas, ...basicas];

    result.forEach(d => {
      d.nome = String(d.nome || d.disciplina || d.name || 'Disciplina').trim();
      if (!Array.isArray(d.camada_2_topicos)) {
        d.camada_2_topicos = Array.isArray(d.topicos) ? d.topicos : (Array.isArray(d.topics) ? d.topics : []);
      }
      if (d.camada_2_topicos.length === 0 && d.nome) {
        d.camada_2_topicos = [{ nome: d.nome, camada_3_subtopicos: [] }];
      }
      d.camada_2_topicos.forEach((t: any) => {
        if (!t) return;
        t.nome = String(t.nome || t.name || t.titulo || d.nome || 'Tópico').trim();
        if (!Array.isArray(t.camada_3_subtopicos)) {
          t.camada_3_subtopicos = Array.isArray(t.subtopicos) ? t.subtopicos : (Array.isArray(t.assuntos) ? t.assuntos : (Array.isArray(t.subtopics) ? t.subtopics : []));
        }
        if (t.camada_3_subtopicos.length === 0 && t.nome) {
          t.camada_3_subtopicos = [{ nome: t.nome }];
        }
        t.camada_3_subtopicos = t.camada_3_subtopicos.map((sub: any) => {
          if (typeof sub === 'string') return { nome: sub };
          if (sub && typeof sub === 'object') return { ...sub, nome: String(sub.nome || sub.name || sub.titulo || 'Subtópico').trim() };
          return { nome: String(sub) };
        });
      });
    });

    return result;
  }

  getEditalBancaName(edital: any): string {
    if (!edital) return '';
    return edital.banca ||
      edital.concurso_info?.banca ||
      edital.pareto_data?.concurso_info?.banca ||
      edital.pareto_data?.alertas_banca?.banca_identificada ||
      '';
  }

  getEditalBanca(edital: any): BancaInfo | null {
    const name = this.getEditalBancaName(edital);
    return getBancaInfo(name);
  }
}

