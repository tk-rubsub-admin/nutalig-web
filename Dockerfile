# Stage 1
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install --force

COPY . .

ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# Stage 2
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/dist ./
ENTRYPOINT ["nginx", "-g", "daemon off;"]