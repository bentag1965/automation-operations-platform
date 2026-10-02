FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY database ./database

CMD ["npm", "run", "start:api"]
