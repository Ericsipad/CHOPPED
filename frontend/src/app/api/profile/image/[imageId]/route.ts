import { NextRequest } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { getProfilesCollection } from "@/lib/profile";
import { getSessionUserId } from "@/lib/supabaseServer";
import { generateBunnySignedUrl } from "@/lib/bunny";


async function streamFromBunny(path: string) {
  const zone = process.env.BUNNY_STORAGE_ZONE;
  const accessKey = process.env.BUNNY_ACCESS_KEY;
  const regionHost = process.env.BUNNY_STORAGE_REGION_HOST || "storage.bunnycdn.com";
  if (!zone || !accessKey) {
    throw new Error("Bunny env not set");
  }
  const url = `https://${regionHost}/${zone}/${path}`;
  const res = await fetch(url, {
    headers: { AccessKey: accessKey } as Record<string, string>,
  });
  if (!res.ok) {
    throw new Error(`Bunny fetch failed: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // private caching only; avoid public caches
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function GET(_req: NextRequest, context: { params: Promise<{ imageId: string }> }) {
  try {
    const { imageId } = await context.params;
    const userId = await getSessionUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const db = await getMongoDb();
    const profiles = await getProfilesCollection(db);
    const profile = await profiles.findOne({ "images.id": imageId }, { projection: { images: 1 } });
    if (!profile) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    const image = (profile.images || []).find((i) => i.id === imageId);
    if (!image) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    // Prefer derived when available for web delivery
    const fetchPath = image.derivedPath || image.storagePath;

    // If CDN token auth configured, redirect to signed URL (faster edges)
    const maybeSigned = generateBunnySignedUrl(fetchPath);
    if (maybeSigned) {
      return new Response(null, {
        status: 302,
        headers: { Location: maybeSigned },
      });
    }

    // Fallback to proxy streaming from Storage
    return await streamFromBunny(fetchPath);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Failed to fetch image", details: String(e) }), {
      status: 500,
    });
  }
}


