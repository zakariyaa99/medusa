# Build stage
FROM node:20-alpine AS builder

# Enable Corepack for Yarn 3
RUN corepack enable
RUN corepack prepare yarn@3.2.1 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies using Yarn 3
# Use --immutable (equivalent to --frozen-lockfile)
RUN yarn install --immutable

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine

# Install dumb-init for better signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/next-sitemap.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 8000

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Start command
CMD ["yarn", "start"]

