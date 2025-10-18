# Simple Dockerfile for worker and Next app base
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || (echo "No package-lock.json, running npm install" && npm install)
COPY . .
# Default command can be overridden by docker-compose service
EXPOSE 9464
CMD ["npm", "run", "worker:dev"]
