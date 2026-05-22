FROM node:20-slim

# Dependências nativas para sharp e better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:store

# Garantir pastas de dados
RUN mkdir -p data public/uploads public/products

EXPOSE 3002

CMD ["node", "server.js"]
