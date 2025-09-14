# backend/Dockerfile
FROM node:20-bookworm-slim

# Dependências p/ build nativo
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Instala deps sem rodar scripts (pra não disparar husky)
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copia o código
COPY . .

EXPOSE 3000
CMD ["npm","run","start:dev"]