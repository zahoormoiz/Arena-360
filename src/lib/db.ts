import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;


/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Fix global type definition
declare global {

  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  // Typescript might complain "cached" is possibly undefined even after assignment if it thinks global can change
  // So we verify it again or cast it.
  const _cached = cached!; // Non-null assertion because we initialized it above

  if (_cached.conn) {
    return _cached.conn;
  }

  if (!_cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: 'arena360',
    };

    _cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    _cached.conn = await _cached.promise;
  } catch (e) {
    _cached.promise = null;
    throw e;
  }

  return _cached.conn;
}

export default dbConnect;
