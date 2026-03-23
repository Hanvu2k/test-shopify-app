FROM node:20-slim

# Install Playwright browser dependencies
RUN npx playwright install-deps chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npx vite build

EXPOSE 3737
CMD ["node", "--import", "tsx", "server/index.ts"]
