FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package.json package-lock.json* /app/

# Installa dipendenze
RUN npm install

# Copia il codice
COPY . /app

# Comando di default
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]