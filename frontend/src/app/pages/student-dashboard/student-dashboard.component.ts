import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#f7f9fc] p-4 md:p-8">
      <!-- Top Navigation Bar -->
      <header class="neo-raised rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 neo-raised rounded-xl flex items-center justify-center text-[#433fe5]">
            <span class="material-symbols-outlined !text-[28px] filled">school</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-[#191c1e]">Painel do Estudante</h1>
            <p class="text-xs text-[#464556]">Aprovando Tech • Estudo Estratégico Pareto 80/20</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-semibold text-[#464556]">Bem-vindo, <strong class="text-[#433fe5]">{{ user?.full_name }}</strong></span>
          <button (click)="logout()" class="btn-neo px-4 py-2 rounded-xl text-xs flex items-center gap-1">
            <span class="material-symbols-outlined !text-[16px]">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <!-- Student Banner / Quick Actions -->
      <div class="neo-raised rounded-3xl p-6 md:p-8 mb-8 bg-gradient-to-r from-[#f7f9fc] to-[#eceef1] flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <span class="bg-[#e1dfff] text-[#2b20d2] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Princípio de Pareto
          </span>
          <h2 class="text-2xl font-black text-[#191c1e]">Foque nos 20% do edital que representam 80% da sua nota</h2>
          <p class="text-xs text-[#464556] leading-relaxed">
            Envie seu edital para receber o mapa de prioridades de estudo em Sprints ou consulte as questões liberadas pelos professores.
          </p>
        </div>

        <div class="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <button (click)="activeTab = 'upload'" class="btn-mesh px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">analytics</span>
            <span>Analisar Novo Edital</span>
          </button>
          <button (click)="activeTab = 'questions'" class="btn-neo px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">quiz</span>
            <span>Banco de Questões</span>
          </button>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="neo-raised rounded-3xl p-6 md:p-8">
        <!-- Navigation Tabs -->
        <div class="flex border-b border-[#c7c4d8]/40 mb-6 gap-6 overflow-x-auto">
          <button 
            (click)="activeTab = 'editais'"
            [class.border-b-2]="activeTab === 'editais'"
            [class.border-[#433fe5]]="activeTab === 'editais'"
            [class.text-[#433fe5]]="activeTab === 'editais'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">folder_special</span>
            <span>Minhas Análises de Edital ({{ editais.length }})</span>
          </button>

          <button 
            (click)="activeTab = 'upload'"
            [class.border-b-2]="activeTab === 'upload'"
            [class.border-[#433fe5]]="activeTab === 'upload'"
            [class.text-[#433fe5]]="activeTab === 'upload'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">cloud_upload</span>
            <span>Enviar Edital para Pareto</span>
          </button>

          <button 
            (click)="activeTab = 'questions'"
            [class.border-b-2]="activeTab === 'questions'"
            [class.border-[#433fe5]]="activeTab === 'questions'"
            [class.text-[#433fe5]]="activeTab === 'questions'"
            class="pb-3 text-sm font-bold text-[#464556] transition-colors flex items-center gap-2 whitespace-nowrap">
            <span class="material-symbols-outlined">quiz</span>
            <span>Questões Liberadas ({{ questions.length }})</span>
          </button>
        </div>

        <!-- 1. My Editais List -->
        <div *ngIf="activeTab === 'editais'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div *ngFor="let ed of editais" class="neo-pressed rounded-3xl p-6 flex flex-col justify-between hover:shadow-inner transition-all">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="bg-[#6b38d4]/10 text-[#6b38d4] text-xs font-bold px-3 py-1 rounded-full">
                  {{ ed.pareto_data?.high_priority_subjects || 2 }} Matérias Vitais (20%)
                </span>
                <span class="text-xs font-semibold text-[#767587]">{{ ed.created_at | date:'dd/MM/yyyy' }}</span>
              </div>
              <h3 class="text-lg font-bold text-[#191c1e] mb-2">{{ ed.title }}</h3>
              <p class="text-xs text-[#464556] mb-6 leading-relaxed">{{ ed.pareto_data?.relevance_summary }}</p>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs font-bold mb-1">
                <span class="text-[#464556]">Progresso do Edital</span>
                <span class="text-[#433fe5]">66% Concluído</span>
              </div>
              <div class="w-full h-2.5 neo-pressed rounded-full overflow-hidden p-0.5 mb-4">
                <div class="h-full bg-gradient-to-r from-[#433fe5] to-[#6b38d4] rounded-full" style="width: 66%;"></div>
              </div>

              <div class="flex gap-3">
                <a [routerLink]="['/pareto', ed.id]" class="btn-mesh flex-1 py-3 rounded-xl text-xs font-bold text-center">
                  Ver Pareto 80/20
                </a>
                <a [routerLink]="['/sprints', ed.id]" class="btn-neo flex-1 py-3 rounded-xl text-xs font-bold text-center">
                  Cronograma Sprints
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Upload Edital Tab -->
        <div *ngIf="activeTab === 'upload'" class="max-w-2xl mx-auto space-y-6">
          <div class="text-center space-y-2 mb-6">
            <h3 class="text-xl font-bold text-[#191c1e]">Envie o Edital do seu Concurso Target</h3>
            <p class="text-xs text-[#464556]">A nossa Inteligência Artificial fará a leitura integral do edital e calculará os tópicos de maior custo-benefício.</p>
          </div>

          <div class="space-y-4">
            <div class="neo-pressed rounded-2xl p-4">
              <label class="text-xs font-bold text-[#464556] mb-1 block">Nome/Título do Concurso</label>
              <input 
                [(ngModel)]="editalTitle" 
                type="text" 
                placeholder="Ex: Edital Polícia Federal - Agente 2026"
                class="w-full bg-transparent border-none outline-none text-sm text-[#191c1e]">
            </div>

            <div class="neo-pressed rounded-3xl p-10 border-2 border-dashed border-[#c7c4d8] flex flex-col items-center justify-center text-center relative hover:border-[#433fe5] transition-colors cursor-pointer">
              <span class="material-symbols-outlined !text-[56px] text-[#433fe5] mb-2">cloud_upload</span>
              <p class="text-sm font-bold text-[#191c1e]">
                {{ selectedFile ? selectedFile.name : 'Clique para selecionar o PDF do Edital' }}
              </p>
              <p class="text-xs text-[#767587] mt-1">Formato PDF (máximo 50MB)</p>
              <input type="file" (change)="onFileSelected($event)" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>

            <button 
              (click)="submitEdital()" 
              [disabled]="isSubmitting"
              class="btn-mesh w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
              <span class="material-symbols-outlined">auto_awesome</span>
              <span>{{ isSubmitting ? 'Gerando Análise Pareto...' : 'Analisar Edital com IA Pareto 80/20' }}</span>
            </button>
          </div>
        </div>

        <!-- 3. Released Questions Bank Tab -->
        <div *ngIf="activeTab === 'questions'" class="space-y-6">
          <div class="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
            <div class="neo-pressed rounded-2xl px-4 py-2.5 flex items-center gap-2 w-full sm:w-80">
              <span class="material-symbols-outlined text-[#767587]">search</span>
              <input 
                [(ngModel)]="searchSubject" 
                placeholder="Buscar por matéria ou palavra-chave..."
                class="bg-transparent border-none outline-none text-xs w-full text-[#191c1e]">
            </div>
            <span class="text-xs font-semibold text-[#464556]">Mostrando {{ filteredQuestions.length }} questões revisadas</span>
          </div>

          <div *ngFor="let q of filteredQuestions" class="neo-pressed rounded-3xl p-6 space-y-4">
            <div class="flex items-center gap-2">
              <span class="bg-[#e1dfff] text-[#09006b] text-xs font-extrabold px-3 py-1 rounded-lg">{{ q.subject }}</span>
              <span class="bg-[#eceef1] text-[#464556] text-xs font-semibold px-3 py-1 rounded-lg">{{ q.topic }}</span>
              <span *ngIf="q.codigo" class="bg-[#eceef1] text-[#464556] text-xs font-semibold px-3 py-1 rounded-lg">{{ q.codigo }}</span>
            </div>

            <h4 class="text-sm font-bold text-[#191c1e] leading-relaxed">{{ q.statement }}</h4>

            <div *ngIf="q.tipo !== 'certo_errado'" class="space-y-2">
              <div *ngFor="let opt of q.options" 
                (click)="selectOption(q.id, opt.letter)"
                [class.bg-[#eefff2]]="selectedAnswers[q.id] === opt.letter && opt.letter === q.correct_option"
                [class.bg-[#ffdad6]]="selectedAnswers[q.id] === opt.letter && opt.letter !== q.correct_option"
                [class.neo-raised-sm]="selectedAnswers[q.id] !== opt.letter"
                class="p-3 rounded-2xl text-xs flex items-start gap-3 cursor-pointer transition-all hover:scale-[1.005]">
                <span class="w-6 h-6 rounded-full neo-pressed flex items-center justify-center font-bold text-[#433fe5] shrink-0">
                  {{ opt.letter }}
                </span>
                <span class="text-[#191c1e] mt-0.5">{{ opt.text }}</span>
              </div>
            </div>

            <div *ngIf="q.tipo === 'certo_errado'" class="flex gap-4">
              <div 
                (click)="selectOption(q.id, 'Certo')"
                [class.bg-[#eefff2]]="selectedAnswers[q.id] === 'Certo' && q.resposta_boolean === true"
                [class.bg-[#ffdad6]]="selectedAnswers[q.id] === 'Certo' && q.resposta_boolean === false"
                [class.neo-raised-sm]="selectedAnswers[q.id] !== 'Certo'"
                class="flex-1 p-3 rounded-2xl text-xs flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.005]">
                <span class="w-6 h-6 rounded-full neo-pressed flex items-center justify-center font-bold text-[#433fe5] shrink-0">C</span>
                <span class="text-[#191c1e] font-bold">Certo</span>
              </div>
              <div 
                (click)="selectOption(q.id, 'Errado')"
                [class.bg-[#eefff2]]="selectedAnswers[q.id] === 'Errado' && q.resposta_boolean === false"
                [class.bg-[#ffdad6]]="selectedAnswers[q.id] === 'Errado' && q.resposta_boolean === true"
                [class.neo-raised-sm]="selectedAnswers[q.id] !== 'Errado'"
                class="flex-1 p-3 rounded-2xl text-xs flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.005]">
                <span class="w-6 h-6 rounded-full neo-pressed flex items-center justify-center font-bold text-[#433fe5] shrink-0">E</span>
                <span class="text-[#191c1e] font-bold">Errado</span>
              </div>
            </div>

            <div *ngIf="selectedAnswers[q.id] !== undefined" class="p-4 rounded-2xl bg-white/70 neo-raised-sm text-xs space-y-1">
              <p class="font-bold" [class.text-[#00845a]]="isCorrectAnswer(q)" [class.text-[#ba1a1a]]="!isCorrectAnswer(q)">
                {{ isCorrectAnswer(q) ? '✓ Resposta Correta!' : '✗ Resposta Incorreta (Gabarito: ' + getCorrectAnswerLabel(q) + ')' }}
              </p>
              <p class="text-[#464556]"><strong>Explicação do Professor:</strong> {{ q.explanation }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  user: UserProfile | null = null;
  editais: any[] = [];
  questions: any[] = [];
  activeTab: 'editais' | 'upload' | 'questions' = 'editais';

  editalTitle = '';
  selectedFile: File | null = null;
  isSubmitting = false;
  searchSubject = '';
  selectedAnswers: { [key: string]: string } = {};

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadData();
  }

  loadData() {
    this.apiService.getEditais().subscribe(eds => this.editais = eds);
    this.apiService.getQuestions(true).subscribe(qs => this.questions = qs);
  }

  get filteredQuestions() {
    if (!this.searchSubject) return this.questions;
    const term = this.searchSubject.toLowerCase();
    return this.questions.filter(q =>
      q.subject.toLowerCase().includes(term) ||
      q.topic.toLowerCase().includes(term) ||
      q.statement.toLowerCase().includes(term)
    );
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  submitEdital() {
    this.isSubmitting = true;
    const title = this.editalTitle || (this.selectedFile ? this.selectedFile.name : 'Edital Personalizado');

    this.apiService.uploadEdital(this.selectedFile!, title, this.user?.id || 'usr-2').subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.selectedFile = null;
        this.editalTitle = '';
        this.loadData();
        this.activeTab = 'editais';
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  selectOption(questionId: string, letter: string) {
    this.selectedAnswers[questionId] = letter;
  }

  isCorrectAnswer(q: any): boolean {
    if (q.tipo === 'certo_errado') {
      const correctStr = q.resposta_boolean ? 'Certo' : 'Errado';
      return this.selectedAnswers[q.id] === correctStr;
    }
    return this.selectedAnswers[q.id] === q.correct_option;
  }

  getCorrectAnswerLabel(q: any): string {
    if (q.tipo === 'certo_errado') {
      return q.resposta_boolean ? 'Certo' : 'Errado';
    }
    return q.correct_option;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
