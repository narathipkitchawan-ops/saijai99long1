import { Env } from "./config/env";
import { evaluateEmployeeCheckIn } from "./handlers/hrAttendance";
import { handlePaymentPostback, handleTextMessage } from "./handlers/orderHandler";
import { getGoogleAccessToken } from "./services/googleAuth";

interface LineWebhookEvent {
  type?: string;
  replyToken?: string;
  timestamp?: number;
  source?: {
    type?: string;
    userId?: string;
  };
  message?: {
    type?: string;
    text?: string;
  };
  postback?: {
    data?: string;
  };
}

interface LineWebhookBody {
  destination?: string;
  events?: LineWebhookEvent[];
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
  /**
   * 1. รับ HTTP Webhook จาก LINE OA และคำสั่งจากหน้าจอ LIFF พนักงาน
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        service: "saijai99long1",
        environment: env.APP_ENV ?? "production",
      });
    }

    // Endpoint สำหรับ LIFF สแกนตอกบัตรเข้างาน (ตรวจกะกลางวัน/กลางคืน + คิด OT 19:30 น.)
    if (url.pathname === "/api/attendance/checkin" && request.method === "POST") {
      const body = (await request.json()) as {
        empId: string;
        assignedShift: "DAY_SHIFT" | "NIGHT_SHIFT";
      };
      const result = evaluateEmployeeCheckIn(body.empId, body.assignedShift, new Date());
      return json(result);
    }

    // Endpoint หลักสำหรับรับ Webhook จาก LINE Official Account
    if (url.pathname === "/webhook/line" && request.method === "POST") {
      if (!env.LINE_CHANNEL_SECRET || env.LINE_CHANNEL_SECRET === "xxx") {
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

      const events = payload.events ?? [];
      ctx.waitUntil(
        (async () => {
          for (const event of events) {
            if (event.type === "message" && event.message?.type === "text" && event.message.text) {
              await handleTextMessage(event.message.text, event.replyToken, env);
            } else if (event.type === "postback" && event.postback?.data) {
              await handlePaymentPostback(event.postback.data, event.replyToken, env);
            }
          }
        })(),
      );

      return json({ ok: true, accepted: events.length });
    }

    return new Response("Saijai99 ERP Worker Ready", { status: 200 });
  },

  /**
   * 2. Cron Trigger รันทุก 5 นาที: กวาดข้อมูลจาก Cloudflare D1 ไปบันทึกลง Google Sheets อัตโนมัติ
   */
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const pendingOrders = await env.SAIJAI_DB.prepare(
      `SELECT id, order_id, payment_method, status, created_at FROM order_outbox WHERE synced = 0 LIMIT 50`,
    ).all<{
      id: number;
      order_id: string;
      payment_method: string;
      status: string;
      created_at: string;
    }>();

    if (!pendingOrders.results || pendingOrders.results.length === 0) return;

    // ซิงค์ขึ้น Google Sheets เมื่อตั้งค่า GOOGLE_SPREADSHEET_ID และ Service Account แล้ว
    if (
      env.GOOGLE_SPREADSHEET_ID &&
      env.GOOGLE_SPREADSHEET_ID !== "xxx" &&
      env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      env.GOOGLE_SERVICE_ACCOUNT_EMAIL !== "xxx"
    ) {
      const accessToken = await getGoogleAccessToken(env);
      const values = pendingOrders.results.map((r) => [
        r.order_id,
        r.payment_method,
        r.status,
        r.created_at,
      ]);

      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SPREADSHEET_ID}/values/Orders!A:D:append?valueInputOption=USER_ENTERED`;
      const res = await fetch(sheetUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      });

      if (!res.ok) {
        throw new Error(`Google Sheets append failed (${res.status}): ${await res.text()}`);
      }
    }

    for (const row of pendingOrders.results) {
      await env.SAIJAI_DB.prepare(`UPDATE order_outbox SET synced = 1 WHERE id = ?`)
        .bind(row.id)
        .run();
    }
  },
};
