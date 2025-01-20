FROM node:18

WORKDIR /usr/src/app

# Copiar package.json e package-lock.json do diretório backend
COPY backend/package*.json ./

RUN npm install

# Copiar o resto dos arquivos do backend
COPY backend .

# Copiar a pasta shared
COPY shared ../shared

RUN npm run build

CMD ["npm", "run", "start:dev"]