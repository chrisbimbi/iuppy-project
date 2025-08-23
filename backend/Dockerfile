# backend/Dockerfile
FROM node:18-bullseye-slim

# Dependências de build p/ módulos nativos (argon2)
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia apenas manifestos para cache de deps
COPY package*.json ./
# (opcional) se o seu package.json referencia "@shared" local, o volume do compose cobre isso em runtime
RUN npm ci

# Copia código (será sobrescrito por volume no dev, mas é bom p/ build inicial)
COPY . .

EXPOSE 3000
CMD ["npm","run","start:dev"]