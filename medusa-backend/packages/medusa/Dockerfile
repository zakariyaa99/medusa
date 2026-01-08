# Build stage
FROM node:20-alpine AS builder

# Install necessary tools
RUN apk add --no-cache git python3 make g++

# Set working directory
WORKDIR /app

# Copy Yarn configuration and patches
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

# Copy package files
COPY package.json yarn.lock ./

# Install ALL dependencies
RUN yarn install --network-timeout 600000 --no-immutable

# Copy source code
COPY . .

# Install turbo globally
RUN npm install -g turbo@^1.6.3

# Strategy: Build packages in dependency order
# Build foundational packages first
RUN turbo run build --filter=@medusajs/types --filter=@medusajs/utils || true

# Build framework packages
RUN turbo run build --filter=@medusajs/framework --filter=@medusajs/workflows-sdk || true

# Build core packages
RUN turbo run build --filter=@medusajs/core-flows --filter=@medusajs/modules-sdk || true

# Finally build medusa backend (the main package we need)
RUN cd packages/medusa && yarn build

# Production stage
FROM node:20-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/medusa/dist ./dist
COPY --from=builder /app/packages/medusa/node_modules ./node_modules
COPY --from=builder /app/packages/medusa/package.json ./

# Copy config files
COPY --from=builder /app/packages/medusa/medusa-config.js ./
COPY --from=builder /app/packages/medusa/ormconfig.json* ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 9000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]