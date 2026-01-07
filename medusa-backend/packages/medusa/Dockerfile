# Build stage
FROM node:20-alpine AS builder

# Install necessary tools
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy Yarn configuration and patches (required for yarn install)
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

# Copy package files from monorepo root (build context is medusa-backend)
COPY package.json yarn.lock ./

# Install dependencies using Yarn 3 with longer timeout for slow networks
# Uses Yarn 3.2.1 from .yarn/releases/ as specified in .yarnrc.yml
# Use --no-immutable to avoid lockfile validation issues and ensure all deps are installed
RUN yarn install --network-timeout 600000 --no-immutable && \
    yarn workspaces focus --all --production

# Copy source code (including packages directory)
COPY . .

# Install turbo globally to ensure consistent version and avoid npx overhead
# Using version from package.json (^1.6.3) for predictable behavior
RUN npm install -g turbo@^1.6.3

# Build all packages except problematic ones
# Excluding @medusajs/deps (external dependency issues) and medusa-dev-cli (build failures)
RUN turbo run build --filter=!@medusajs/deps --filter=!medusa-dev-cli

# Production stage
FROM node:20-alpine

# Install dumb-init for better signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built artifacts and dependencies from builder
COPY --from=builder /app/packages/medusa/dist ./dist
COPY --from=builder /app/packages/medusa/node_modules ./node_modules
COPY --from=builder /app/packages/medusa/package.json ./

# Copy necessary configuration files
COPY --from=builder /app/packages/medusa/medusa-config.js ./
COPY --from=builder /app/packages/medusa/ormconfig.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 9000

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Start command
CMD ["node", "dist/app.js"]
