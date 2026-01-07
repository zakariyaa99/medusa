# Build stage
FROM node:20-alpine AS builder

# Install necessary tools
RUN apk add --no-cache git

# Enable Corepack for Yarn 3
RUN corepack enable
RUN corepack prepare yarn@3.2.1 --activate

# Set working directory
WORKDIR /app

# Copy package files from monorepo root (build context is medusa-backend)
COPY package.json yarn.lock ./

# Install dependencies using Yarn 3 with longer timeout for slow networks
# Disable immutable mode temporarily to avoid peer dependency issues
RUN yarn install --network-timeout 600000

# Copy source code (including packages directory)
COPY . .

# Build only the medusa package
RUN cd packages/medusa && yarn build

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

# Start command
