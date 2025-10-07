FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependência primeiro
COPY package*.json ./

# Instala dependências de produção
RUN npm install --omit=dev

# Agora copia todo o restante (inclusive src/)
COPY . .

EXPOSE 3000

CMD ["node", "src/server/ws-relay.js"]
