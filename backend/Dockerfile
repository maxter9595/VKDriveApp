FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY backend/ ./
RUN mkdir -p logs

EXPOSE 20000
CMD ["sh", "-c", "node scripts/init-db.js && node index.js"]
