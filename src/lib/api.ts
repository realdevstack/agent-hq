const API_KEY_STORAGE = "agent_hq_api_key";

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE);
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

// Bootstrap promise kept in-module so concurrent calls don't each
// fire their own auth.bootstrap on a fresh browser.
let bootstrapInFlight: Promise<string | null> | null = null;

async function ensureApiKey(): Promise<string | null> {
  const existing = getApiKey();
  if (existing) return existing;
  if (bootstrapInFlight) return bootstrapInFlight;

  bootstrapInFlight = (async () => {
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auth.bootstrap" }),
      });
      const text = await res.text();
      if (!text) return null;
      const parsed = JSON.parse(text) as {
        ok?: boolean;
        data?: { api_key?: string };
      };
      const key = parsed?.data?.api_key;
      if (key) {
        setApiKey(key);
        return key;
      }
      return null;
    } catch {
      return null;
    } finally {
      // Clear so subsequent calls after failure can retry.
      bootstrapInFlight = null;
    }
  })();

  return bootstrapInFlight;
}

export async function call<T = unknown>(
  action: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  // auth.bootstrap is the one call that doesn't need a key — and we skip
  // ensureApiKey on it to avoid infinite recursion.
  const key = action === "auth.bootstrap" ? getApiKey() : await ensureApiKey();

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
