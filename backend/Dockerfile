# backend/Dockerfile

# 1. Imagem base
FROM node:18

# 2. Define diretório de trabalho
WORKDIR /usr/src/app

# 3. Copia apenas os package.json pra instalar dependências
COPY package*.json ./

# 4. Instala dependências
RUN npm ci

# 5. Copia todo o código do backend para dentro da imagem
COPY . .

# 6. Expõe porta (a API roda na 3000 dentro do container)
EXPOSE 3000

# 7. Comando default (usado pelo docker-compose)
CMD ["npm", "run", "start:dev"]
