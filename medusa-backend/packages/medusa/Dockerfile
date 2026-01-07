# Build stage
FROM node:20-alpine AS builder

# Install necessary tools
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files from medusa package
COPY package.json yarn.lock ./

# Install dependencies using yarn (comes with node image)
# Use --ignore-scripts to avoid postinstall scripts that might require .yarn
RUN yarn install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Build using yarn (script "build" from package.json)
RUN yarn build

# Production stage
FROM node:20-alpine

# Install dumb-init for better signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built artifacts and dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy necessary configuration files
COPY --from=builder /app/medusa-config.js ./
COPY --from=builder /app/ormconfig.json ./

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

