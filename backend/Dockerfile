# ====================================================================
# Estágio Base
# ====================================================================
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# ====================================================================
# Estágio de Desenvolvimento (usado por docker-compose.dev.yml)
# ====================================================================
FROM base AS development
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ====================================================================
# Estágio de Build (compilação TypeScript)
# ====================================================================
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ====================================================================
# Estágio de Produção (Imagem final otimizada)
# ====================================================================
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Segurança: Executa como usuário não-root
USER node

EXPOSE 3000

# Healthcheck na rota /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]


