// ============================================================
// home.constants.ts — Aprovando Tech Landing Page Copy & Data
// ============================================================

export interface NavLink {
  label: string;
  anchor: string;
}

export interface Stat {
  icon: string;
  value: string;
  label: string;
}

export interface Step {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  color?: string;
  gradient?: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

export interface Testimonial {
  name: string;
  role: string;
  concurso: string;
  quote: string;
  initials: string;
  color: string;
}

export interface RecentEdital {
  id: string;
  orgao: string;
  cargo: string;
  banca: string;
  ano: number;
  categoria: 'ti' | 'tribunais' | 'fiscal' | 'todos';
  tag: string;
  tagType: 'pareto' | 'hot' | 'new' | 'popular';
  topicosCount: number;
  questoesCount: string;
  paretoPercent: number;
  scoreIA: string;
  dataAnalise: string;
}

// ---- Navbar ----
export const NAV_LINKS: NavLink[] = [
  { label: 'Como funciona', anchor: '#como-funciona' },
  { label: 'Benefícios', anchor: '#beneficios' },
  { label: 'Depoimentos', anchor: '#depoimentos' },
  { label: 'Planos', anchor: '#planos' },
];

// ---- Hero ----
export const HERO_COPY = {
  brandBadge: 'APROVANDO TECH',
  headlineLine1: 'Aprovação Inteligente.',
  headlineLine2: 'Domine o essencial com',
  headlineHighlight: 'IA & Pareto.',
  subheadline: 'Estude com foco no que realmente cai.',
  description:
    'Simplifique sua jornada. Nossa IA analisa seu edital, prioriza os 80% cruciais e cria seu plano de estudos personalizado para o seu tempo.',
  ctaPrimary: 'Começar agora',
  ctaSecondary: 'Ver como funciona',
  searchPlaceholder: 'Buscar edital ou concurso',
};

// ---- Últimos Editais Analisados ----
export const RECENT_EDITAIS: RecentEdital[] = [
  {
    id: 'mpe-es-ti-2026',
    orgao: 'MPE-ES',
    cargo: 'Agente Especializado — Analista de Sistemas & Infraestrutura',
    banca: 'FGV',
    ano: 2026,
    categoria: 'ti',
    tag: 'Pareto 80/20 Calculado',
    tagType: 'pareto',
    topicosCount: 128,
    questoesCount: '3.450+',
    paretoPercent: 84,
    scoreIA: '99%',
    dataAnalise: 'Hoje',
  },
  {
    id: 'nav-brasil-2026',
    orgao: 'NAV Brasil',
    cargo: 'Engenheiro de Software & Analista de Tecnologia',
    banca: 'FGV',
    ano: 2026,
    categoria: 'ti',
    tag: 'Novo Edital',
    tagType: 'new',
    topicosCount: 94,
    questoesCount: '2.180+',
    paretoPercent: 78,
    scoreIA: '98%',
    dataAnalise: 'Ontem',
  },
  {
    id: 'trf1-ti-2026',
    orgao: 'TRF 1ª Região',
    cargo: 'Analista Judiciário — Tecnologia da Informação',
    banca: 'FGV',
    ano: 2026,
    categoria: 'tribunais',
    tag: 'Mais Acessado',
    tagType: 'popular',
    topicosCount: 142,
    questoesCount: '4.800+',
    paretoPercent: 82,
    scoreIA: '97%',
    dataAnalise: 'Há 2 dias',
  },
  {
    id: 'tse-unificado-2026',
    orgao: 'TSE Unificado',
    cargo: 'Técnico e Analista Judiciário (Todas as Áreas)',
    banca: 'Cebraspe',
    ano: 2026,
    categoria: 'tribunais',
    tag: 'Alta Demanda',
    tagType: 'hot',
    topicosCount: 160,
    questoesCount: '6.200+',
    paretoPercent: 86,
    scoreIA: '99%',
    dataAnalise: 'Há 3 dias',
  },
  {
    id: 'dataprev-2026',
    orgao: 'Dataprev',
    cargo: 'Analista de Tecnologia da Informação',
    banca: 'FGV',
    ano: 2026,
    categoria: 'ti',
    tag: 'Pareto 80/20 Calculado',
    tagType: 'pareto',
    topicosCount: 110,
    questoesCount: '3.900+',
    paretoPercent: 80,
    scoreIA: '96%',
    dataAnalise: 'Há 4 dias',
  },
  {
    id: 'bacen-ti-2026',
    orgao: 'Banco Central (Bacen)',
    cargo: 'Analista — Tecnologia da Informação & Finanças',
    banca: 'Cebraspe',
    ano: 2026,
    categoria: 'fiscal',
    tag: 'Edital Estratégico',
    tagType: 'popular',
    topicosCount: 175,
    questoesCount: '5.100+',
    paretoPercent: 88,
    scoreIA: '98%',
    dataAnalise: 'Há 5 dias',
  },
];

// ---- Stats ----
export const STATS: Stat[] = [
  { icon: 'description', value: '000+', label: 'Editais analisados' },
  { icon: 'quiz', value: '000+', label: 'Questões extraídas' },
  { icon: 'verified', value: '9.2/10', label: 'Score médio de qualidade IA' },
  { icon: 'group', value: '000+', label: 'Candidatos aprovados' },
];

// ---- How it works (7 passos do Fluxo Estratégico) ----
export const STEPS: Step[] = [
  {
    icon: 'account_tree',
    title: 'Mapa Geral das Disciplinas',
    subtitle: 'IA extrai todas as disciplinas e tópicos',
    badge: 'Visão Macro',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
  },
  {
    icon: 'donut_large',
    title: 'Análise de Pareto 80/20',
    subtitle: 'Prioriza os tópicos que mais caem',
    badge: 'Tópicos-Chave',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
  },
  {
    icon: 'hub',
    title: 'Mapa Inteligente de Prioridades',
    subtitle: 'Hierarquia de estudo focada no seu cargo',
    badge: 'Foco Hierárquico',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
  },
  {
    icon: 'tune',
    title: 'Régua de Corte',
    subtitle: 'Define a nota mínima e estratégia de aprovação',
    badge: 'Essencial',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  {
    icon: 'notifications_active',
    title: 'Alertas da Banca',
    subtitle: 'Padrões e dicas específicos da organizadora',
    badge: 'Padrões & Dicas',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
  },
  {
    icon: 'calendar_month',
    title: 'Cronograma Adaptado',
    subtitle: 'Plano de estudos no seu ritmo e tempo disponível',
    badge: 'Seu Ritmo',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  },
];

// ---- Features ----
export const FEATURES: Feature[] = [
  {
    icon: 'smart_toy',
    title: 'Análise Automática de Edital',
    description:
      'IA lê e interpreta qualquer edital de concurso em segundos, extraindo todo o conteúdo programático.',
    color: '#6D28D9',
  },
  {
    icon: 'calendar_month',
    title: 'Cronograma Personalizado',
    description:
      'Gera um plano de estudos adaptado ao seu tempo disponível, respeitando sua rotina e data da prova.',
    color: '#4F46E5',
  },
  {
    icon: 'quiz',
    title: 'Banco de Questões com IA',
    description:
      'Questões extraídas e classificadas automaticamente por tópico, nível de dificuldade e banca organizadora.',
    color: '#3B82F6',
  },
  {
    icon: 'notifications_active',
    title: 'Alertas de Padrão de Banca',
    description:
      'Identifica padrões históricos da banca do seu concurso para você estudar exatamente o que ela cobra.',
    color: '#7C3AED',
  },
  {
    icon: 'bar_chart',
    title: 'Dashboard de Progresso',
    description:
      'Acompanhe sua evolução com métricas de desempenho por disciplina, tópico e simulados.',
    color: '#2563EB',
  },
  {
    icon: 'tune',
    title: 'Régua de Corte Inteligente',
    description:
      'Calcula a nota mínima necessária e quais disciplinas priorizar para garantir sua aprovação.',
    color: '#059669',
  },
];

// ---- Testimonials ----
export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Nome do Aluno',
    role: 'Aprovado em',
    concurso: 'Concurso Público — Cargo Exemplo',
    quote:
      '"A Aprovando Tech mudou minha forma de estudar. Em vez de ler o edital inteiro por semanas, tive um plano pronto em minutos. Passei na primeira tentativa!"',
    initials: 'NA',
    color: '#6D28D9',
  },
  {
    name: 'Nome do Aluno 2',
    role: 'Aprovado em',
    concurso: 'Concurso Público — Cargo Exemplo 2',
    quote:
      '"O mapa de prioridades Pareto me ajudou a focar no que realmente importava. Economizei meses de estudo disperso e já estou convocado!"',
    initials: 'NA',
    color: '#4F46E5',
  },
  {
    name: 'Nome do Aluno 3',
    role: 'Aprovado em',
    concurso: 'Concurso Público — Cargo Exemplo 3',
    quote:
      '"Os alertas de padrão de banca foram cirúrgicos. Sabia exatamente o estilo das questões antes mesmo de abrir o material. Aprovado com folga!"',
    initials: 'NA',
    color: '#3B82F6',
  },
];

// ---- CTA Final ----
export const CTA_FINAL_COPY = {
  headline: 'Pronto para estudar com',
  headlineHighlight: 'inteligência?',
  subheadline:
    'Junte-se a candidatos que já usam a IA para estudar menos e aprovar mais. Comece agora, grátis.',
  cta: 'Analisar meu edital grátis',
  ctaNote: 'Sem cartão de crédito. Sem compromisso.',
};

// ---- Footer ----
export const FOOTER_LINKS = {
  product: [
    { label: 'Como funciona', anchor: '#como-funciona' },
    { label: 'Benefícios', anchor: '#beneficios' },
    { label: 'Planos', anchor: '#planos' },
    { label: 'Blog', anchor: '#' },
  ],
  company: [
    { label: 'Sobre nós', anchor: '#' },
    { label: 'Termos de uso', anchor: '#' },
    { label: 'Política de privacidade', anchor: '#' },
    { label: 'Contato', anchor: '#' },
  ],
};
