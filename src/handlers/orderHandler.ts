import { Env } from "../config/env";
import { parseOrderWithGemini, tryLocalRegexParse } from "../services/geminiAi";
import { replyOrderSummaryWithPaymentChoices, replyText } from "../services/lineService";
import { recordBreakBulk } from "./breakBulkHandler";

export async function handleTextMessage(
  userText: string,
  replyToken: string | undefined,
  env: Env,
): Promise<void> {
  // Step 1: กรองด้วย Regex ก่อนเพื่อประหยัด Token ของ Google AI
  const localCheck = tryLocalRegexParse(userText);
  if (localCheck.matched && localCheck.action === "BREAK_BULK" && localCheck.data) {
    await recordBreakBulk(localCheck.data.sku, localCheck.data.weightKg, env);
    if (replyToken) {
      await replyText(
        replyToken,
        `✅ บันทึกแตกถุง ${localCheck.data.sku} (+${localCheck.data.weightKg} กก.) ลงคิวเรียบร้อย`,
        env,
      );
    }
    return;
  }

  if (localCheck.matched && localCheck.action === "CHECK_CATALOG") {
    if (replyToken) {
      await replyText(
        replyToken,
        "📦 รายการสินค้า Saijai99: น่อง(CHK_LEG), อก(CHK_BREAST), สะโพก(CHK_HIP), ปีก(CHK_WING), สามชั้น(PRK_BELLY), คอหมู(PRK_NECK)\nพิมพ์รายการและจำนวนที่ต้องการสั่งได้เลยค่ะ",
        env,
      );
    }
    return;
  }

  // Step 2: ส่งให้ Gemini AI แปลงภาษาพูดเป็นรายการสั่งซื้อ
  const aiOrder = await parseOrderWithGemini(userText, env);
  if (aiOrder.intent === "ORDER" && replyToken) {
    const orderId = `SJ-${Date.now().toString().slice(-6)}`;
    const summaryText = (aiOrder.i || [])
      .map((item) => `• ${item.s} จำนวน ${item.q} (${item.u})`)
      .join("\n");

    await replyOrderSummaryWithPaymentChoices(
      replyToken,
      orderId,
      summaryText,
      1500,
      aiOrder.z || "CITY",
      env,
    );
  }
}

export async function handlePaymentPostback(
  postbackData: string,
  replyToken: string | undefined,
  env: Env,
): Promise<void> {
  const params = new URLSearchParams(postbackData);
  if (params.get("action") !== "PAY_METHOD") return;

  const method = params.get("method") ?? "UNKNOWN";
  const orderId = params.get("orderId") ?? "";

  // บันทึกสถานะการชำระเงินลงคิว D1 เพื่อซิงค์ขึ้น Google Sheets ให้แอดมินเห็นทันที
  await env.SAIJAI_DB.prepare(
    `INSERT INTO order_outbox (order_id, payment_method, status, created_at) VALUES (?, ?, 'CONFIRMED', datetime('now'))`,
  )
    .bind(orderId, method)
    .run();

  if (replyToken) {
    await replyText(
      replyToken,
      `✅ ยืนยันออร์เดอร์ #${orderId} รูปแบบชำระเงิน (${method}) เรียบร้อยค่ะ`,
      env,
    );
  }
}
