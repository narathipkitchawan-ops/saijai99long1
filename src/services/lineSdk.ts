/**
 * ============================================================================
 * SAIJAI 99 — LINE MESSAGING API & LIFF SDK CLIENT
 * Based on official LINE OpenAPI Specification (github.com/line/line-openapi)
 * Optimized for Cloudflare Workers (V8 Isolates, Web Crypto, Native Fetch)
 * ============================================================================
 */

export interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
}

export interface LineBotInfo {
  userId: string;
  basicId: string;
  premiumId?: string;
  displayName: string;
  pictureUrl?: string;
  chatMode: "chat" | "bot";
  markAsReadMode: "auto" | "manual";
}

export interface WebhookTestResult {
  success: boolean;
  timestamp: string;
  statusCode: number;
  reason: string;
  detail: string;
}

export interface QuickReplyItem {
  type: "action";
  action: {
    type: "postback" | "message" | "uri" | "camera" | "cameraRoll" | "location";
    label?: string; // Max 20 chars
    data?: string;
    displayText?: string;
    text?: string;
    uri?: string;
  };
}

export interface QuickReply {
  items: QuickReplyItem[];
}

export interface TextMessage {
  type: "text";
  text: string;
  quoteToken?: string;
  quickReply?: QuickReply;
}

export interface FlexMessage {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
  quickReply?: QuickReply;
}

export interface ImageMessage {
  type: "image";
  originalContentUrl: string;
  previewImageUrl: string;
  quickReply?: QuickReply;
}

export type LineMessage = TextMessage | FlexMessage | ImageMessage | Record<string, unknown>;

export interface LineWebhookEvent {
  type: string;
  mode?: string;
  timestamp: number;
  source: {
    type: "user" | "group" | "room";
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  replyToken?: string;
  message?: {
    id: string;
    type: string;
    text?: string;
    quoteToken?: string;
  };
  postback?: {
    data: string;
    params?: Record<string, string>;
  };
}

export interface LineWebhookPayload {
  destination?: string;
  events?: LineWebhookEvent[];
}

/**
 * ตรวจสอบความถูกต้องของ x-line-signature (HMAC-SHA256) ด้วย Web Crypto API
 * ป้องกันการปลอมแปลง Request จากภายนอก 100%
 */
export async function verifySignature(
  rawBody: string,
  signature: string,
  channelSecret: string,
): Promise<boolean> {
  if (!signature || !channelSecret) return false;

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

/**
 * LINE Messaging API SDK Client
 * รองรับการยิง API ครอบคลุมทั้ง Reply, Push, Multicast, Loading Animation, และ Webhook Test
 */
export class LineMessagingClient {
  private readonly baseUrl = "https://api.line.me";
  private readonly token: string;

  constructor(channelAccessToken: string) {
    this.token = channelAccessToken;
  }

  private async request<T = unknown>(
    path: string,
    options: RequestInit = {},
  ): Promise<{ ok: boolean; status: number; data: T; errorText?: string }> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.token}`);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json; charset=utf-8");
    }

    const response = await fetch(url, { ...options, headers });
    const ok = response.ok;
    const status = response.status;

    if (!ok) {
      const errorText = await response.text();
      return { ok: false, status, data: null as unknown as T, errorText };
    }

    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    return { ok: true, status, data };
  }

  /**
   * 1. ตอบกลับผู้ใช้ทันทีด้วย replyToken (ฟรี 100% ไม่เสียโควต้า Push)
   */
  async replyMessage(
    replyToken: string,
    messages: LineMessage[],
    notificationDisabled = false,
  ): Promise<{ ok: boolean; status: number; errorText?: string }> {
    return this.request("/v2/bot/message/reply", {
      method: "POST",
      body: JSON.stringify({
        replyToken,
        messages,
        notificationDisabled,
      }),
    });
  }

  /**
   * 2. ส่งข้อความแบบ Push Message หาผู้ใช้เจาะจง (หักโควต้าตามจำนวนผู้รับ)
   */
  async pushMessage(
    to: string,
    messages: LineMessage[],
    notificationDisabled = false,
  ): Promise<{ ok: boolean; status: number; errorText?: string }> {
    return this.request("/v2/bot/message/push", {
      method: "POST",
      body: JSON.stringify({
        to,
        messages,
        notificationDisabled,
      }),
    });
  }

  /**
   * 3. ส่งข้อความแบบ Multicast หาหลายคนพร้อมกัน
   */
  async multicast(
    to: string[],
    messages: LineMessage[],
    notificationDisabled = false,
  ): Promise<{ ok: boolean; status: number; errorText?: string }> {
    return this.request("/v2/bot/message/multicast", {
      method: "POST",
      body: JSON.stringify({
        to,
        messages,
        notificationDisabled,
      }),
    });
  }

  /**
   * 4. แสดง Loading Animation (จุดไข่ปลา ... กำลังประมวลผล) ระหว่างรอ AI คำนวณ
   */
  async showLoadingAnimation(chatId: string, loadingSeconds = 5): Promise<boolean> {
    const res = await this.request("/v2/bot/chat/loading/start", {
      method: "POST",
      body: JSON.stringify({
        chatId,
        loadingSeconds: Math.min(Math.max(loadingSeconds, 5), 60),
      }),
    });
    return res.ok;
  }

  /**
   * 5. ดึงข้อมูลโปรไฟล์ผู้ใช้ (User Profile)
   */
  async getProfile(userId: string): Promise<LineUserProfile | null> {
    const res = await this.request<LineUserProfile>(`/v2/bot/profile/${userId}`, {
      method: "GET",
    });
    return res.ok ? res.data : null;
  }

  /**
   * 6. ดึงข้อมูลพื้นฐานของบอท (Bot Info)
   */
  async getBotInfo(): Promise<LineBotInfo | null> {
    const res = await this.request<LineBotInfo>("/v2/bot/info", {
      method: "GET",
    });
    return res.ok ? res.data : null;
  }

  /**
   * 7. ดึง URL Webhook Endpoint ปัจจุบัน
   */
  async getWebhookEndpoint(): Promise<{ endpoint: string; active: boolean } | null> {
    const res = await this.request<{ endpoint: string; active: boolean }>(
      "/v2/bot/channel/webhook/endpoint",
      { method: "GET" },
    );
    return res.ok ? res.data : null;
  }

  /**
   * 8. ตั้งค่า URL Webhook Endpoint
   */
  async setWebhookEndpoint(endpoint: string): Promise<boolean> {
    const res = await this.request("/v2/bot/channel/webhook/endpoint", {
      method: "PUT",
      body: JSON.stringify({ endpoint }),
    });
    return res.ok;
  }

  /**
   * 9. สั่งทดสอบยิง Webhook Endpoint ผ่าน LINE Server (/v2/bot/channel/webhook/test)
   */
  async testWebhookEndpoint(endpoint?: string): Promise<WebhookTestResult | null> {
    const body = endpoint ? JSON.stringify({ endpoint }) : undefined;
    const res = await this.request<WebhookTestResult>("/v2/bot/channel/webhook/test", {
      method: "POST",
      body,
    });
    return res.ok ? res.data : null;
  }
}
