import { NextRequest } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { getProfilesCollection } from "@/lib/profile";
import { getSessionUserId } from "@/lib/supabaseServer";
import sharp from "sharp";
import { nanoid } from "nanoid";

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 20);


async function uploadToBunny(path: string, body: Buffer, contentType: string) {
  const zone = process.env.BUNNY_STORAGE_ZONE;
  const accessKey = process.env.BUNNY_ACCESS_KEY;
  const regionHost = process.env.BUNNY_STORAGE_REGION_HOST || "storage.bunnycdn.com";
  if (!zone || !accessKey) {
    throw new Error("Bunny env not set");
  }
  const url = `https://${regionHost}/${zone}/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: accessKey,
      "Content-Type": contentType,
    } as Record<string, string>,
    body,
  });
  if (!res.ok) {
    throw new Error(`Bunny upload failed: ${res.status} ${await res.text()}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }

    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      return new Response(JSON.stringify({ error: `File exceeds ${MAX_UPLOAD_MB}MB` }), { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const inputType = file.type || "application/octet-stream";

    // Convert non-web formats (e.g., HEIC/HEIF) to webp for delivery; keep original too
    let derivedBuffer: Buffer | null = null;
    const derivedExt = "webp";
    const derivedMime = "image/webp";
    try {
      // Sharp can handle HEIC/HEIF if libvips supports; fallback is to keep only original
      derivedBuffer = await sharp(inputBuffer).rotate().webp({ quality: 85 }).toBuffer();
    } catch {
      derivedBuffer = null;
    }

    const imageId = nanoid(16);
    const basePath = `profiles/${userId}/${imageId}`;

    // Upload original
    const origExt = (file.name.split(".").pop() || "bin").toLowerCase();
    const originalPath = `${basePath}/original.${origExt}`;
    await uploadToBunny(originalPath, inputBuffer, inputType);

    let derivedPath: string | undefined;
    if (derivedBuffer) {
      derivedPath = `${basePath}/derived.${derivedExt}`;
      await uploadToBunny(derivedPath, derivedBuffer, derivedMime);
    }

    // Save image metadata into profile (append, primary if first)
    const db = await getMongoDb();
    const profiles = await getProfilesCollection(db);
    const update = await profiles.findOneAndUpdate(
      { supabaseUserId: userId },
      {
        $setOnInsert: { supabaseUserId: userId, createdAt: new Date() },
        $push: {
          images: {
            id: imageId,
            storagePath: originalPath,
            mimeType: inputType,
            sizeBytes: file.size,
            ...(derivedPath ? { derivedPath } : {}),
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    );

    return new Response(
      JSON.stringify({ image: { id: imageId, primary: update.value?.images?.length === 1 } }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Upload failed", details: String(e) }), { status: 500 });
  }
}


