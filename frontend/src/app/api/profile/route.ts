import { NextRequest } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { getProfilesCollection, sanitizeProfileForClient, ProfileDoc } from "@/lib/profile";
import { getSessionUserId } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const db = await getMongoDb();
    const profiles = await getProfilesCollection(db);
    const all = await profiles
      .find({}, { projection: { /* never include email */ } })
      .limit(25)
      .toArray();
    return new Response(JSON.stringify(all.map(sanitizeProfileForClient)), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(e) }), {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const json = (await req.json()) as Partial<ProfileDoc>;

    // Never accept email, enforce supabaseUserId of session
    const payload: Partial<ProfileDoc> = {
      displayName: json.displayName,
      age: json.age,
      location: json.location,
      bio: json.bio,
      images: json.images,
      disclosures: json.disclosures,
      accepts: json.accepts,
      gender: json.gender,
      termsAcceptedAt: json.termsAcceptedAt ? new Date(json.termsAcceptedAt) : undefined,
      updatedAt: new Date(),
    };

    const db = await getMongoDb();
    const profiles = await getProfilesCollection(db);

    await profiles.updateOne(
      { supabaseUserId: userId },
      {
        $setOnInsert: { supabaseUserId: userId, createdAt: new Date() },
        $set: payload,
      },
      { upsert: true }
    );

    const saved = await profiles.findOne({ supabaseUserId: userId });
    if (!saved) {
      return new Response(JSON.stringify({ error: "Failed to save profile" }), { status: 500 });
    }

    return new Response(JSON.stringify(sanitizeProfileForClient(saved)), { status: 200 });
  } catch (e) {
    // Handle duplicate displayName gracefully
    const err = e as { code?: number; keyPattern?: { displayName?: number } };
    if (err?.code === 11000 && err?.keyPattern?.displayName) {
      return new Response(JSON.stringify({ error: "Display name not available" }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(e) }), {
      status: 500,
    });
  }
}


