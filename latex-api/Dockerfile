FROM node:20-slim AS builder

RUN npm install -g pnpm
WORKDIR /build
COPY latex-api/package.json latex-api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY latex-api/tsconfig.json ./
COPY latex-api/src ./src
RUN pnpm run build


FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-xetex \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm
WORKDIR /app

# Bundle template assets (fonts, .cls, .sty files)
COPY public/templates ./templates

COPY latex-api/package.json latex-api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /build/dist ./dist

EXPOSE 3027
CMD ["node", "dist/index.js"]
