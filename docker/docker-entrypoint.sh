#!/bin/sh
set -e

echo "Running database migrations..."
pnpx prisma migrate deploy
echo "Database migrations completed."

# Execute the passed command (e.g., pnpm start)
exec "$@"