# ====================================================================
# Stage 1: Build da aplicação Angular para Produção
# ====================================================================
FROM node:20-alpine AS build
WORKDIR /usr/src/app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build -- --configuration production

# ====================================================================
# Stage 2: Servidor Nginx de Produção de Alta Performance
# ====================================================================
FROM nginx:alpine AS production

# Remove os arquivos padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos otimizados gerados no Stage 1
COPY --from=build /usr/src/app/dist/frontend/browser /usr/share/nginx/html

# Copia a configuração do Nginx com suporte a roteamento SPA e cache
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

