FROM node:20-alpine

WORKDIR /app

COPY ./app .

COPY app/package*.json ./

RUN npm install

RUN mkdir -p /data

CMD [ "node", "server.js" ]