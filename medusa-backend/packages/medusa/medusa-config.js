module.exports = {
  projectConfig: {
    redisUrl: process.env.REDIS_URL,
    databaseUrl: process.env.DATABASE_URL,
    databaseType: "postgres",
    workerMode: process.env.MEDUSA_WORKER_MODE || "shared", // "server", "worker", or "shared"
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001",
      authCors: process.env.AUTH_CORS || "http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
      port: process.env.PORT || 9000,
    },
  },
  plugins: [
    // Uncomment and configure plugins as needed
    // `medusa-file-s3` for S3 storage
    // `medusa-payment-stripe` for Stripe payments
    // `medusa-cache-redis` for Redis cache
  ],
  modules: {
    // Redis-based cache service for better performance in production
    cacheService: {
      resolve: "@medusajs/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        ttl: 30, // Cache TTL in seconds
      },
    },
    // Redis-based event bus for reliable event handling
    eventBus: {
      resolve: "@medusajs/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    // Redis-based workflow engine for orchestration
    workflowEngine: {
      resolve: "@medusajs/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
  },
  featureFlags: {
    // Enable or disable feature flags
    // Example: "product_categories": true
  },
};