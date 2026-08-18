# 🚀 Aprovando Tech - Backend (NestJS)

Backend da plataforma **Aprovando Tech**, construído com **NestJS**, **Supabase**, **BullMQ / Redis** e integrações de IA (**LangChain**, **OpenAI**, **Gemini**, **Groq**).

---

## 📁 Estrutura de Ambientes

O backend possui suporte nativo e isolado para ambientes de **Desenvolvimento** e **Produção**:

| Ambiente | Arquivo de Variáveis | Script Local | Script Docker |
| :--- | :--- | :--- | :--- |
| **Desenvolvimento** | `.env.development` | `npm run start:dev` | `docker compose -f docker-compose.dev.yml up -d` |
| **Produção** | `.env.production` | `npm run build && npm run start:prod` | `docker compose -f docker-compose.prod.yml up -d --build` |

---

## ⚙️ Configuração das Variáveis de Ambiente

Antes de iniciar, crie ou ajuste os arquivos de ambiente correspondentes copiando os modelos de exemplo:

### Desenvolvimento:
```bash
cp .env.development.example .env.development
```

### Produção:
```bash
cp .env.production.example .env.production
```

### Principais Variáveis:

| Variável | Descrição | Exemplo Dev | Exemplo Prod |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Identificador do ambiente | `development` | `production` |
| `PORT` | Porta HTTP do servidor | `3000` | `3000` |
| `CORS_ORIGIN` | Origens permitidas | `*` ou `http://localhost:4200` | `https://aprovandotech.com.br` |
| `SUPABASE_URL` | URL do projeto Supabase | `https://xyz.supabase.co` | `https://prod.supabase.co` |
| `SUPABASE_ANON_KEY` | Chave pública do Supabase | `eyJ...` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa backend | `eyJ...` | `eyJ...` |
| `REDIS_HOST` | Host do Redis para filas BullMQ | `127.0.0.1` (ou `redis` no Docker) | `redis` ou host gerenciado |
| `REDIS_PORT` | Porta do Redis | `6379` | `6379` |
| `REDIS_PASSWORD` | Senha do Redis (se houver) | *(vazio)* | `senha_forte` |
| `OPENAI_API_KEY` | Chave OpenAI | `sk-...` | `sk-...` |
| `GOOGLE_AI_API_KEY` | Chave Google Gemini | `AIza...` | `AIza...` |
| `GROQ_API_KEY` | Chave Groq | `gsk_...` | `gsk_...` |
| `JWT_SECRET` | Segredo para validação JWT | `dev-secret` | `chave-alta-segurança` |

---

## 💻 Executando Localmente (Node.js)

### 1. Pré-requisitos
- **Node.js**: `>= 20.x`
- **Redis**: Executando localmente na porta `6379` (ou via Docker)

### 2. Instalação das dependências
```bash
npm install
```

### 3. Rodar em Desenvolvimento (Hot-reload ativado)
Carrega `.env.development`:
```bash
npm run start:dev
```

### 4. Rodar em Produção
Compila o TypeScript para a pasta `dist/` e executa carregando `.env.production`:
```bash
npm run build
npm run start:prod
```

---

## 🐳 Executando com Docker

### 1. Ambiente de Desenvolvimento (Docker)
Inicia o Redis e o backend em modo hot-reload com volumes montados:
```bash
docker compose -f docker-compose.dev.yml up -d
```
Para ver os logs:
```bash
docker compose -f docker-compose.dev.yml logs -f backend
```

Para parar:
```bash
docker compose -f docker-compose.dev.yml down
```

---

### 2. Ambiente de Produção (Docker)
Constrói a imagem multi-stage otimizada (Alpine, sem dependências de desenvolvimento, executando como usuário não-root):
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Para verificar a saúde dos containers:
```bash
docker compose -f docker-compose.prod.yml ps
```

Para ver os logs de produção:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Para parar:
```bash
docker compose -f docker-compose.prod.yml down
```

---

## 🧪 Scripts Disponíveis no `package.json`

- `npm run build`: Compila o projeto TypeScript para `dist/`.
- `npm run start:dev`: Executa em modo desenvolvimento com `cross-env NODE_ENV=development` e auto-reload.
- `npm run start:debug`: Executa em modo debug com auto-reload.
- `npm run start:prod`: Executa a versão compilada em modo produção com `cross-env NODE_ENV=production`.
- `npm run format`: Formata arquivos `.ts` com Prettier.
- `npm run lint`: Executa ESLint para correção automática de código.
