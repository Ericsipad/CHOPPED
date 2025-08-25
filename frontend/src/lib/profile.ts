import { Db, ObjectId } from "mongodb";

export type GenderKey =
  | "straight_male"
  | "gay_male"
  | "straight_female"
  | "gay_female"
  | "bi_male"
  | "bi_female";

export type ProfileImage = {
  id: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  derivedPath?: string;
};

export type LocationInfo = {
  countryCode: string;
  countryName: string;
  stateCode?: string;
  stateName?: string;
  city?: string;
};

export type ProfileDoc = {
  _id?: ObjectId;
  supabaseUserId: string;
  displayName: string;
  age?: number;
  location?: LocationInfo;
  bio?: string;
  images?: ProfileImage[];
  disclosures?: {
    herpes?: boolean;
    hiv?: boolean;
    handicap?: boolean;
    autism?: boolean;
    digitalNomad?: boolean;
  };
  accepts?: {
    herpes?: boolean;
    hiv?: boolean;
    handicap?: boolean;
    autism?: boolean;
    digitalNomad?: boolean;
  };
  gender?: { iAm: GenderKey; matchWith: GenderKey };
  termsAcceptedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getProfilesCollection(db: Db) {
  const collection = db.collection<ProfileDoc>("profiles");

  // Ensure critical indexes exist (idempotent in MongoDB)
  await collection.createIndex({ supabaseUserId: 1 }, { unique: true, name: "uniq_supabaseUserId" });
  await collection.createIndex({ displayName: 1 }, { unique: true, name: "uniq_displayName" });
  await collection.createIndex({ "images.id": 1 }, { unique: true, sparse: true, name: "uniq_imageId" });
  await collection.createIndex({ "gender.iAm": 1, "gender.matchWith": 1 });
  await collection.createIndex({ age: 1 });
  await collection.createIndex({ "location.countryCode": 1, "location.stateCode": 1, "location.city": 1 });

  return collection;
}

export function sanitizeProfileForClient(profile: ProfileDoc) {
  const { _id, supabaseUserId, ...rest } = profile;
  return {
    id: _id?.toString() || null,
    supabaseUserId,
    ...rest,
  };
}


