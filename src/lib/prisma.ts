import { PrismaClient } from '@prisma/client';
import net from 'net';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbStatusCache: { isAvailable: boolean; checkedAt: number } | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Fast, non-blocking check to determine if the PostgreSQL database is reachable.
 * Uses a quick TCP socket probe with a short timeout and caches the result for 10 seconds.
 * This prevents 5000ms connection hangs on every request when the database is offline or not yet initialized.
 */
export async function isDatabaseAvailable(maxTimeoutMs = 250): Promise<boolean> {
  const cached = globalForPrisma.dbStatusCache;
  const now = Date.now();
  if (cached && (now - cached.checkedAt < 10000)) {
    return cached.isAvailable;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    globalForPrisma.dbStatusCache = { isAvailable: false, checkedAt: now };
    return false;
  }

  try {
    const url = new URL(dbUrl.replace(/^postgresql:\/\//, 'http://').replace(/^postgres:\/\//, 'http://'));
    const host = url.hostname || 'localhost';
    const port = parseInt(url.port || '5432', 10);

    const isConnected = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      let finished = false;

      const done = (result: boolean) => {
        if (!finished) {
          finished = true;
          socket.destroy();
          resolve(result);
        }
      };

      socket.setTimeout(maxTimeoutMs);
      socket.once('connect', () => done(true));
      socket.once('timeout', () => done(false));
      socket.once('error', () => done(false));

      try {
        socket.connect(port, host);
      } catch {
        done(false);
      }
    });

    globalForPrisma.dbStatusCache = { isAvailable: isConnected, checkedAt: now };
    return isConnected;
  } catch {
    globalForPrisma.dbStatusCache = { isAvailable: false, checkedAt: now };
    return false;
  }
}

export default prisma;

