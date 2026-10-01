FROM oven/bun:1-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY staff.json ./
COPY src ./src

USER bun

CMD ["bun", "run", "src/index.ts"]