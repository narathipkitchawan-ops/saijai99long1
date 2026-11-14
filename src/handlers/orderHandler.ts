import { matchAutoResponseRule } from "../config/autoResponseRules";
import { Env } from "../config/env";
import { parseOrderWithGemini, tryLocalRegexParse } from "../services/geminiAi";
import {
  replyOrderSummaryWithPaymentChoices,
  replyText,
  SKU_PRICES_PER_KG,
} from "../services/lineService";
import { recordBreakBulk } from "./breakBulkHandler";

export async function handleTextMessage(
  userText: string,
  replyToken: string | undefined,
  env: Env,
): Promise<void> {
  // Step 1: กรองด้วยกฎตอบกลับอัตโนมัติ 6 หมวดหมู่ (Partial Match ไม่เกิน 500 ตัวอักษร)
  const autoRule = matchAutoResponseRule(userText);
  if (autoRule && replyToken) {
    await replyText(replyToken, autoRule.responseText, env);
    return;
  }

  // Step 2: กรองด้วย Regex ก่อนเพื่อประหยัด Token ของ Google AI
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

  // Step 3: ส่งให้ Gemini AI แปลงภาษาพูดเป็นรายการสั่งซื้อ
  const aiOrder = await parseOrderWithGemini(userText, env);
  if (aiOrder.intent === "ORDER" && replyToken) {
    const orderId = `SJ-${Date.now().toString().slice(-6)}`;
    const items = aiOrder.i || [];
    const summaryText = items
      .map((item) => `• ${item.s} จำนวน ${item.q} (${item.u})`)
      .join("\n");

    // คำนวณยอดเงินรวมจากรายการสินค้าตามราคาต่อ กก.
    let calculatedTotal = 0;
    for (const item of items) {
      const pricePerKg = SKU_PRICES_PER_KG[item.s] || 70;
      const kg = item.u === "BAG10" ? 10 : item.u === "BAG5" ? 5 : 1;
      calculatedTotal += item.q * kg * pricePerKg;
    }
    const finalTotal = calculatedTotal > 0 ? calculatedTotal : 1500;

    await replyOrderSummaryWithPaymentChoices(
      replyToken,
      orderId,
      summaryText,
      finalTotal,
      aiOrder.z || "CITY",
      env,
      items,
    );
  }
}

export async function handlePaymentPostback(
  postbackData: string,
  replyToken: string | undefined,
  env: Env,
): Promise<void> {
  const params = new URLSearchParams(postbackData);

  // ฟังก์ชันอนุมัติหมุนบิลจากเจ้าของร้าน (Owner Approval)
  if (params.get("action") === "OWNER_DECISION") {
    const orderId = params.get("orderId") ?? "";
    const decision = params.get("decision") ?? "REJECT";

    const newStatus = decision === "APPROVE" ? "CONFIRMED" : "REJECTED";
    await env.SAIJAI_DB.prepare(
      `UPDATE order_outbox SET status = ? WHERE order_id = ?`,
    )
      .bind(newStatus, orderId)
      .run();

    if (replyToken) {
      const notice = decision === "APPROVE"
        ? `✅ เจ้าของร้านอนุมัติสิทธิ์หมุนบิลออเดอร์ #${orderId} เรียบร้อย (เปิดบิลรายการสินค้าแล้ว)`
        : `❌ เจ้าของร้านไม่อนุมัติสิทธิ์หมุนบิลออเดอร์ #${orderId} (ยกเลิกการเปิดบิล)`;
      await replyText(replyToken, notice, env);
    }
    return;
  }

  if (params.get("action") !== "PAY_METHOD") return;

  const method = params.get("method") ?? "UNKNOWN";
  const orderId = params.get("orderId") ?? "";

  // เงื่อนไขพิเศษ: หมุนบิล ต้องส่งคำขออนุมัติไปยังเจ้าของร้านก่อน ถ้าไม่อนุมัติจะไม่เปิดบิล
  if (method === "ROLLING_BILL") {
    await env.SAIJAI_DB.prepare(
      `INSERT INTO order_outbox (order_id, payment_method, status, created_at) VALUES (?, 'ROLLING_BILL', 'PENDING_OWNER_APPROVAL', datetime('now'))`,
    )
      .bind(orderId)
      .run();

    if (replyToken) {
      await replyText(
        replyToken,
        `⏳ ส่งคำขอชำระแบบ [หมุนบิล] สำหรับออเดอร์ #${orderId} แล้วค่ะ\n⚠️ เงื่อนไข: สิทธิ์หมุนบิลต้องได้รับการอนุมัติจากเจ้าของร้านก่อน หากเจ้าของร้านไม่อนุมัติระบบจะไม่เปิดบิลรายการสินค้าค่ะ`,
        env,
      );
    }
    return;
  }

  // รูปแบบชำระเงินทั่วไป (พร้อมเพย์, จ่ายสดหน้างาน, รับหน้าร้าน) -> ยืนยันเปิดบิลได้ทันที
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

