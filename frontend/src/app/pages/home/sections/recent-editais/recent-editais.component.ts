import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RECENT_EDITAIS, RecentEdital } from '../../home.constants';
import { getBancaLogo } from '../../../../utils/banca.utils';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-recent-editais',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recent-editais.component.html',
  styleUrls: ['./recent-editais.component.scss'],
})
export class RecentEditaisComponent implements OnInit {
  readonly getBancaLogo = getBancaLogo;
  editais: any[] = RECENT_EDITAIS;
  loading: boolean = false;
  selectedCategory: string = 'todos';

  readonly categories = [
    { id: 'todos', label: 'Todos os Editais' },
    { id: 'ti', label: 'Tecnologia da Informação' },
    { id: 'tribunais', label: 'Tribunais & Judiciário' },
    { id: 'fiscal', label: 'Fiscais & Finanças' },
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadRealEditais();
  }

  loadRealEditais(): void {
    this.loading = true;
    this.apiService.getPublicEditais().subscribe({
      next: (res: any) => {
        this.loading = false;
        const list = res?.data || res;
        if (Array.isArray(list) && list.length > 0) {
          this.editais = list;
        } else {
          this.editais = RECENT_EDITAIS;
        }
      },
      error: () => {
        this.loading = false;
        this.editais = RECENT_EDITAIS;
      }
    });
  }

  get filteredEditais(): any[] {
    const list = this.editais && this.editais.length > 0 ? this.editais : RECENT_EDITAIS;
    if (this.selectedCategory === 'todos') {
      return list;
    }
    return list.filter((e) => this.matchCategory(e, this.selectedCategory));
  }

  matchCategory(e: any, category: string): boolean {
    if (e.categoria === category) return true;
    const text = `${e.cargo || ''} ${e.title || ''} ${e.concurso || ''} ${e.orgao || ''}`.toLowerCase();
    if (category === 'ti') {
      return text.includes('ti') || text.includes('tecnologia') || text.includes('sistemas') || text.includes('software') || text.includes('dados') || text.includes('computação') || text.includes('infraestrutura') || text.includes('redes') || text.includes('desenvolvimento');
    }
    if (category === 'tribunais') {
      return text.includes('tribunal') || text.includes('trf') || text.includes('tjd') || text.includes('tjsp') || text.includes('judiciário') || text.includes('mpe') || text.includes('mp') || text.includes('defensoria') || text.includes('oab');
    }
    if (category === 'fiscal') {
      return text.includes('fiscal') || text.includes('auditor') || text.includes('receita') || text.includes('sefaz') || text.includes('banco') || text.includes('bcb') || text.includes('bnb') || text.includes('caixa') || text.includes('finanças') || text.includes('tcu');
    }
    return false;
  }

  setCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }

  getEditalOrgao(ed: any): string {
    if (ed.orgao) return ed.orgao;
    if (ed.concurso) return ed.concurso;
    const title = ed.title || '';
    const parts = title.split('—');
    if (parts.length > 1) return parts[0].trim();
    const slashParts = title.split('-');
    if (slashParts.length > 1) return slashParts[0].trim();
    return ed.concurso || 'EDITAL';
  }

  getEditalCargo(ed: any): string {
    return ed.cargo || ed.title || 'Cargo Geral';
  }

  getEditalBancaName(ed: any): string {
    if (!ed) return 'FGV';
    return ed.banca ||
      ed.concurso_info?.banca ||
      ed.pareto_data?.concurso_info?.banca ||
      ed.pareto_data?.alertas_banca?.banca_identificada ||
      'FGV';
  }

  getEditalBancaLogo(ed: any): string | null {
    const name = this.getEditalBancaName(ed);
    return getBancaLogo(name);
  }

  getEditalAno(ed: any): number | string {
    if (ed.ano) return ed.ano;
    if (ed.created_at) {
      const year = new Date(ed.created_at).getFullYear();
      if (!isNaN(year)) return year;
    }
    return 2026;
  }

  getEditalTopicosCount(ed: any): number {
    if (ed.topicosCount) return ed.topicosCount;
    const pd = ed.pareto_data;
    if (pd?.total_topicos) return pd.total_topicos;
    if (pd?.mapa_geral?.disciplinas) {
      let count = 0;
      pd.mapa_geral.disciplinas.forEach((d: any) => {
        count += (d.topicos?.length || d.camada_2_topicos?.length || 1);
      });
      if (count > 0) return count;
    }
    return 128;
  }

  getEditalQuestoesCount(ed: any): string {
    if (ed.questoesCount) return ed.questoesCount;
    if (ed.total_questoes) return `${ed.total_questoes}+`;
    return '3.450+';
  }

  getEditalScoreIA(ed: any): string {
    if (ed.scoreIA) return ed.scoreIA;
    if (ed.pareto_data?.score_ia) return `${ed.pareto_data.score_ia}%`;
    return '99%';
  }

  getEditalParetoPercent(ed: any): number {
    if (ed.paretoPercent) return ed.paretoPercent;
    if (ed.pareto_data?.pareto_percentage) return ed.pareto_data.pareto_percentage;
    if (ed.pareto_data?.pareto_percent) return ed.pareto_data.pareto_percent;
    return 84;
  }

  getEditalDateText(ed: any): string {
    if (ed.dataAnalise) return ed.dataAnalise;
    if (!ed.created_at) return 'Hoje';
    const d = new Date(ed.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  }
}
