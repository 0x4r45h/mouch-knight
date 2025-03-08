# Use the official Node.js image as the base image
FROM node:18 AS base
RUN npm install -g pnpm

# Install Rust and wasm-pack
FROM base AS rust-builder
RUN apk add --no-cache curl build-base openssl-dev
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN cargo install wasm-pack

# Build WASM
FROM rust-builder AS wasm-builder
WORKDIR /app
COPY wasm ./wasm
RUN cd wasm && wasm-pack build --target web


# Build Next.js app
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# Install the dependencies
RUN pnpm install

COPY . .
COPY --from=wasm-builder /app/wasm/pkg ./wasm/pkg
RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./
COPY --from=builder --chown=nextjs:nodejs /app/wasm/pkg ./wasm/pkg

USER nextjs

# Expose port 3000 to the outside world
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
