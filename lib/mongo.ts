import { MongoClient } from 'mongodb'

let globalMongoClient: MongoClient | null = null

export async function getMongoClient(): Promise<MongoClient> {
  if (globalMongoClient) {
    return globalMongoClient
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  })
  await client.connect()
  globalMongoClient = client
  return client
}

export async function getUsersCollection() {
  const client = await getMongoClient()
  const db = client.db()
  const collection = db.collection('users')
  // Ensure unique index on Supabase user ID (primary linkage), not on email
  await collection.createIndex({ supabaseUserId: 1 }, { unique: true })
  return collection
}


