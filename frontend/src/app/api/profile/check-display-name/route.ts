import { NextRequest } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { getProfilesCollection } from "@/lib/profile";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = (searchParams.get("name") || "").trim();
    if (!name) {
      return new Response(JSON.stringify({ available: false }), { status: 200 });
    }

    const db = await getMongoDb();
    const profiles = await getProfilesCollection(db);
    const existing = await profiles.findOne({ displayName: name }, { projection: { _id: 1 } });
    return new Response(JSON.stringify({ available: !existing }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ available: false }), { status: 200 });
  }
}


