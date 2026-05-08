FROM node:20-alpine

WORKDIR /app

# Build context is repository root (see compose.yaml).
COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
