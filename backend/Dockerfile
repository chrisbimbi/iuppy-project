FROM node:18

WORKDIR /usr/src/app

# Copiar package.json e package-lock.json
COPY backend/package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos do backend
COPY backend .

# Copiar a pasta shared
COPY shared ../shared

# Exibir as dependências instaladas (para depuração)
RUN npm list

# Construir a aplicação
RUN npm run build

CMD ["npm", "run", "start:dev"]