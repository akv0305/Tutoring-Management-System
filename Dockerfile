# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci

# ── Stage 2: Build the application ──
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build Next.js
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    NEXTAUTH_URL="http://localhost:3000" \
    NEXTAUTH_SECRET="dummy-secret-for-build-only" \
    RESEND_API_KEY="re_dummy_build_key" \
    npm run build

# ── Stage 3: Production runtime ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install Prisma CLI at the exact version
RUN npm install -g prisma@6.19.2

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema + migrations (needed by start.sh for migrate)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x start.sh

USER nextjs
EXPOSE 3000

CMD ["./start.sh"]
