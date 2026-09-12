FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm

# Copy standard monorepo files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all packages for resolution
COPY artifacts/permionics-bd-suite artifacts/permionics-bd-suite
COPY lib lib

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the frontend
RUN pnpm --filter @workspace/permionics-bd-suite run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runner

# Copy the built Vite assets from builder
COPY --from=builder /app/artifacts/permionics-bd-suite/dist /usr/share/nginx/html

# Copy a custom nginx config to support React Router / Wouter fallback (SPA routing)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
