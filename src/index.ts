interface Env {
  APP_ENV?: string;
  LINE_CHANNEL_SECRET?: string;
}

interface LineWebhookEvent {
  type?: string;
  timestamp?: number;
  source?: {
    type?: string;
  };
}

interface LineWebhookBody {
  destination?: string;
  events?: LineWebhookEvent[];
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyLineSignature(
  rawBody: string,
  signature: string,
  channelSecret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(digest)));

  // Compare equal-length strings without an early character mismatch return.
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "saijai99long1", environment: env.APP_ENV ?? "unknown" });
    }

    if (request.method === "POST" && url.pathname === "/webhook/line") {
      if (!env.LINE_CHANNEL_SECRET) {
        return json({ ok: false, error: "LINE webhook secret is not configured" }, 503);
      }

      const rawBody = await request.text();
      const signature = request.headers.get("x-line-signature") ?? "";
      const valid = await verifyLineSignature(rawBody, signature, env.LINE_CHANNEL_SECRET);

      if (!valid) {
        return json({ ok: false, error: "Invalid LINE signature" }, 401);
      }

      let payload: LineWebhookBody;
      try {
        payload = JSON.parse(rawBody) as LineWebhookBody;
      } catch {
        return json({ ok: false, error: "Invalid JSON payload" }, 400);
      }

      // Staging scaffold: validate and acknowledge events only.
      // No customer profile, order, inventory, price, or delivery-fee data is stored.
      return json({
        ok: true,
        accepted: Array.isArray(payload.events) ? payload.events.length : 0,
        environment: env.APP_ENV ?? "unknown",
      });
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
};
