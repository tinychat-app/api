FROM node:18.7
WORKDIR /app
COPY package.json  yarn.lock ./
RUN yarn install
COPY . .
ENV DATABASE_URL="file:./db.sqlite"
CMD ["yarn", "start"]