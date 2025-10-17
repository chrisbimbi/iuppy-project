# 1) instalar deps e shared
FROM node:18-alpine AS deps
WORKDIR /usr/src/app
COPY frontend/package.json frontend/yarn.lock ./
COPY shared ./shared
RUN yarn install --frozen-lockfile

# 2) build de produção
FROM deps AS builder
WORKDIR /usr/src/app
COPY frontend ./
RUN yarn build

# 3) nginx para servir estáticos
FROM nginx:stable-alpine AS web
# remover config default
RUN rm /etc/nginx/conf.d/default.conf

# copiar nossa conf
COPY frontend/nginx.conf /etc/nginx/conf.d/

# copiar dist gerada no builder
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
