FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm

# Copy standard monorepo files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all packages for resolution
COPY artifacts/api-server artifacts/api-server
COPY lib lib

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the api-server
RUN pnpm --filter @workspace/api-server run build

# Deploy the api-server and its local workspace dependencies to a standalone folder
RUN pnpm deploy --filter @workspace/api-server --prod /app/out

FROM node:22-alpine AS runner

WORKDIR /app
RUN corepack enable pnpm

# Copy the deployed standalone workspace
COPY --from=builder /app/out ./
# Copy the built dist directory
COPY --from=builder /app/artifacts/api-server/dist ./dist

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["npm", "run", "start"]
