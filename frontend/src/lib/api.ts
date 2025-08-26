const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return API_BASE.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);
}

export async function apiFetch(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  return fetch(url, init);
}


