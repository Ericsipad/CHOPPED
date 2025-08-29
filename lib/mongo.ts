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
  // Require database name in MONGODB_URI
  const uri = process.env.MONGODB_URI as string
  const parsed = new URL(uri)
  const dbName = (parsed.pathname || '').replace(/^\//, '')
  if (!dbName) {
    throw new Error('MONGODB_URI must include a database name (e.g., mongodb+srv://.../mydb)')
  }
  const db = client.db(dbName)
  const collection = db.collection('users')
  // Ensure unique index on Supabase user ID (primary linkage), not on email
  await collection.createIndex({ supabaseUserId: 1 }, { unique: true })
  return collection
}

export async function getUserProfileImagesCollection() {
  const client = await getMongoClient()
  const uri = process.env.MONGODB_URI as string
  const parsed = new URL(uri)
  const dbName = (parsed.pathname || '').replace(/^\//, '')
  if (!dbName) {
    throw new Error('MONGODB_URI must include a database name (e.g., mongodb+srv://.../mydb)')
  }
  const db = client.db(dbName)
  const collection = db.collection('USER_PROFILE_IMAGES')
  await collection.createIndex({ userId: 1 }, { unique: true })
  return collection
}


export async function getProfileMatchingCollection() {
  const client = await getMongoClient()
  const uri = process.env.MONGODB_URI as string
  const parsed = new URL(uri)
  const dbName = (parsed.pathname || '').replace(/^\//, '')
  if (!dbName) {
    throw new Error('MONGODB_URI must include a database name (e.g., mongodb+srv://.../mydb)')
  }
  const db = client.db(dbName)
  const collection = db.collection('Profile_Matching')
  await collection.createIndex({ userId: 1 }, { unique: true })
  return collection
}


