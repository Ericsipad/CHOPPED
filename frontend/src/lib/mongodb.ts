import { MongoClient, Db } from "mongodb";

type CachedMongoConnection = {
  client: MongoClient | null;
  db: Db | null;
  uri: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongoConnection: CachedMongoConnection | undefined;
}

const cached: CachedMongoConnection = global.__mongoConnection || {
  client: null,
  db: null,
  uri: null,
};

async function createMongoClient(): Promise<{ client: MongoClient; db: Db }> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "chopped";

  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (cached.client && cached.db && cached.uri === uri) {
    return { client: cached.client, db: cached.db };
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cached.client = client;
  cached.db = db;
  cached.uri = uri;
  global.__mongoConnection = cached;

  return { client, db };
}

export async function getMongoDb(): Promise<Db> {
  const { db } = await createMongoClient();
  return db;
}


