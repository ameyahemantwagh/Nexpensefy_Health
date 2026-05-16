# ──────────────────────────────────────────────
# Stage 1: deps — install production dependencies
# ──────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ──────────────────────────────────────────────
# Stage 2: builder — compile the Next.js app
# ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy all deps (including devDeps for build)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Next.js standalone output mode (set in next.config.ts)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ──────────────────────────────────────────────
# Stage 3: runner — minimal production image
# ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copy standalone server produced by Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
