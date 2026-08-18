# Prompt para o Agent — Página Inicial (Landing Page) da Aprovando Tech

Copie e cole o conteúdo abaixo no agent que vai codar (Claude Code, Cursor, etc.).

---

## Contexto do projeto

Você vai criar a **página inicial (landing page pública)** da **Aprovando Tech**, uma plataforma de estudos para concursos públicos que usa IA para aplicar a metodologia **Pareto 80/20** sobre editais: o estudante envia o edital e a IA gera mapa de disciplinas, análise de prioridades, cronograma adaptado ao tempo disponível, régua de corte e alertas de banca.

- **Framework:** Angular 17 (standalone components, sem NgModules desnecessários; usar `signal()` onde fizer sentido para estado local).
- **Estilo:** SCSS. Se o projeto já usa Tailwind ou Angular Material, siga o padrão existente do repositório — verifique o `package.json` e os componentes existentes antes de decidir.
- **Referência de estrutura de página:** o site https://www.tecconcursos.com.br (referência de **estrutura/seções**, não de identidade visual — a Aprovando Tech tem sua própria marca).
- **Referência de identidade visual e produto:** as 3 imagens anexadas a este prompt (logo, painel do estudante, painel administrativo).

## Identidade visual (extraída da logo e dos painéis)

- **Cores primárias:** gradiente roxo/azul (indigo/violet), ex.: `#6D28D9` → `#4F46E5` → `#3B82F6`, com toques de magenta/rosa no gradiente da logo.
- **Fundo:** branco / cinza muito claro (`#F8F9FC` aprox.), cards brancos com sombra suave e cantos arredondados (~12px).
- **Tipografia:** sans-serif moderna, títulos em negrito, hierarquia limpa como nos painéis (título + subtítulo cinza pequeno abaixo).
- **Logo:** "A" estilizada com seta ascendente formando o "T", em efeito de vidro/glow roxo-azul, com o texto "APROVANDO TECH" abaixo, letras maiúsculas espaçadas.
- **Componentes visuais recorrentes nos painéis:** ícones dentro de quadrados coloridos arredondados, badges pequenos coloridos (ex. "Essencial" em verde, "BullMQ + OpenAI" em roxo claro), botões primários em gradiente roxo/azul com cantos arredondados, barra de navegação superior fixa e simples.

## Estrutura da página (inspirada no Tec Concursos, adaptada à marca)

Construa as seguintes seções, nesta ordem, como componentes standalone separados dentro de um componente `HomeComponent` (ou `LandingPageComponent`):

1. **Header/Navbar fixo**
   - Logo à esquerda (reaproveite o estilo da logo anexada).
   - Links de navegação: Como funciona, Planos, Blog/Conteúdo, Depoimentos.
   - Botões à direita: "Entrar" (secundário/outline) e "Começar agora" (primário, gradiente).
   - Fica fixo no topo com leve sombra ao rolar a página.

2. **Hero**
   - Headline forte focada no diferencial (ex.: "Estude o que realmente cai. Aprovação com Pareto 80/20 e IA").
   - Subheadline explicando o produto em 1-2 frases.
   - CTA primário ("Analisar meu edital grátis") + CTA secundário ("Ver como funciona").
   - Elemento visual à direita: mockup/preview estilizado do "Painel do Estudante" (pode ser uma versão simplificada/ilustrativa do card de fluxo estratégico da imagem 2).
   - Campo de busca opcional inspirado no Tec Concursos ("Buscar edital ou concurso") — avalie se faz sentido para o MVP; se não houver backend de busca ainda, deixe como componente de UI pronto para integrar.

3. **Prova social / números**
   - Faixa com estatísticas (ex.: nº de editais analisados, questões extraídas, score médio de qualidade IA — reaproveite os cards do Painel Administrativo como inspiração de layout: ícone + número grande + label).

4. **Como funciona (Fluxo Estratégico)**
   - Reaproveite diretamente os 7 passos do "Fluxo Estratégico de Estudos (Pareto 80/20 Hierárquico)" da imagem 2, como uma timeline horizontal (ou vertical em mobile) com ícone + título + subtítulo para cada etapa:
     Upload do Edital → Mapa Geral das Disciplinas → Análise de Pareto 80/20 → Mapa Inteligente de Prioridades → Régua de Corte → Alertas da Banca → Cronograma Adaptado.

5. **Benefícios/Features**
   - Grade de 4-6 cards (ícone + título + descrição curta), destacando: análise automática de edital, cronograma adaptado ao tempo do candidato, banco de questões com IA, alertas de padrão de banca, dashboard de progresso.

6. **Depoimentos**
   - Carrossel ou grid de 3 cards com foto/avatar, nome, cargo/concurso aprovado e citação curta.

7. **Planos/Preço (ou CTA final se ainda não houver planos definidos)**
   - Se não houver informação de preços, usar uma seção de CTA final forte (headline + botão) em vez de forçar uma tabela de planos.

8. **Footer**
   - Logo, links institucionais, links de produto, redes sociais, copyright.

## Requisitos técnicos

- Responsivo (mobile-first), breakpoints padrão Angular/CSS Grid ou Flexbox.
- Componentes standalone, tipados, sem `any`.
- Extrair textos para constantes/interfaces reutilizáveis (facilita troca de copy depois).
- Imagens/ícones: usar um set de ícones consistente (ex. lucide-angular ou o que já estiver no projeto).
- Acessibilidade básica: contraste adequado no gradiente roxo/azul, `alt` em imagens, navegação por teclado no menu.
- Não inventar métricas/depoimentos reais — usar placeholders claramente identificáveis como exemplo (ex. "Nome do Aluno", "000 editais analisados") para o time substituir depois.
- Seguir o design system e a paleta de cores acima com consistência em toda a página.

## Entregável

- `home.component.ts/html/scss` (ou pasta `pages/home/` com subcomponentes por seção: `hero`, `how-it-works`, `features`, `testimonials`, `cta-footer`, etc.).
- Rota configurada para a home (`''` ou `/inicio`).
