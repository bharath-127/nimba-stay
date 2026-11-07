import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ensureIndexes } from './models/index.js';
import { createApp } from './app.js';

async function main() {
  const db = await connectDB(env.mongoUri);
  await ensureIndexes();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Nimba Stay API listening on http://localhost:${env.port}`);
    console.log(`MongoDB: ${db.host}/${db.name} (${db.replicaSet ? `replica set ${db.replicaSet}` : 'standalone'})`);
    console.log(
      db.transactionsSupported
        ? 'Transactions: ENABLED - bookings are created atomically'
        : 'Transactions: NOT AVAILABLE on this deployment - using compensating-write fallback (unique index still enforces no double booking)'
    );
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start Nimba Stay API:', err.message);
  process.exit(1);
});
