import crypto from "crypto";

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : undefined;
}

export function generateBunnySignedUrl(path: string, ttlSeconds = 300): string | null {
  const cdn = getEnv("BUNNY_THUMBS_CDN");
  const key = getEnv("BUNNY_THUMBS_TOKEN_KEY");
  if (!cdn || !key) return null;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const tokenBase = key + normalizedPath + expires;
  const token = crypto.createHash("md5").update(tokenBase).digest("hex");
  const url = `${cdn}${normalizedPath}?token=${token}&expires=${expires}`;
  return url;
}


