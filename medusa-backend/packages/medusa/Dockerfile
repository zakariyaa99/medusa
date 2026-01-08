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

# Build ONLY the main medusa package (skip problematic packages)
# This will build medusa and its required dependencies automatically
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
COPY --from=builder /app/packages/medusa/ormconfig.json* ./

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