# ====================================================================
# Imagem de Produção Otimizada do Backend Aprovando Tech
# ====================================================================
FROM node:20-alpine AS production
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Copia dependências e artefatos compilados
COPY package*.json ./
COPY node_modules ./node_modules
COPY dist ./dist

# Segurança: Executa como usuário não-root
USER node

EXPOSE 3000

# Healthcheck na rota /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]


