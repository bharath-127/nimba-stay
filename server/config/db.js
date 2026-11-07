import mongoose from 'mongoose';

let transactionsSupported = false;

/**
 * Connect to MongoDB and detect whether the deployment supports
 * multi-document transactions.
 *
 * Transactions need a replica set (MongoDB Atlas, or a local replica set)
 * or a sharded cluster. A plain standalone `mongod` does not support them.
 * The booking service checks `supportsTransactions()` and chooses the
 * transactional path or the compensating-write fallback accordingly.
 */
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  transactionsSupported = Boolean(hello.setName) || hello.msg === 'isdbgrid';

  return {
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    replicaSet: hello.setName ?? null,
    transactionsSupported,
  };
}

export function supportsTransactions() {
  return transactionsSupported;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
