FROM node:10

EXPOSE 8080

RUN mkdir -p /opt/zombi

WORKDIR /opt/zombi

COPY package.json .

RUN npm install

COPY . .

CMD ["node", "src/app"]
