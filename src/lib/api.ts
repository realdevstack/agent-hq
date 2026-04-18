const API_KEY_STORAGE = "agent_hq_api_key";

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE);
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export async function call<T = unknown>(
  action: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const key = getApiKey();
  const res = await fetch("/api/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "X-API-Key": key } : {}),
    },
    body: JSON.stringify({ action, params }),
  });

  const text = await res.text();

  if (!text) {
    throw new Error(
      `Empty response from /api/command (status ${res.status}). ` +
        `If running locally with 'vite' only, functions are not served — ` +
        `use your deployed site or run 'netlify dev'.`,
    );
  }

  let parsed: { ok?: boolean; data?: unknown; error?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Non-JSON response (status ${res.status}): ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok || parsed.ok === false) {
    throw new Error(parsed.error || `Request failed: ${res.status}`);
  }
  return parsed.data as T;
}
