import { Env } from "../config/env";

/**
 * ส่งข้อความตอบกลับ (Reply) แบบฟรี ไม่เสียโควต้า Push Message
 * พร้อมแนบปุ่ม Quick Reply ให้ลูกค้าเลือกวิธีชำระเงิน (รวมจ่ายหน้างาน & หมุนบิล)
 */
export async function replyOrderSummaryWithPaymentChoices(
  replyToken: string,
  orderId: string,
  summaryText: string,
  totalAmount: number,
  zone: string,
  env: Env,
): Promise<void> {
  const accessToken = env.LINE_CHANNEL_ACCESS_TOKEN || "xxx";
  const cutoffNotice =
    zone === "OUTSKIRT"
      ? "🚛 สายต่างจังหวัด (ตัดรอบ 18:00 น. / รถออก 00:00-01:30 น.)"
      : "🛵 สายในเมืองพิษณุโลก (ตัดรอบ 21:00 น. / รถออก 02:00-04:00 น.)";

  const payload = {
    replyToken,
    messages: [
      {
        type: "text",
        text: `✅ สรุปรายการสั่งซื้อ #${orderId}\n${summaryText}\n💰 ยอดรวมสุทธิ: ${totalAmount.toLocaleString()} บาท\n${cutoffNotice}\n\nกรุณาเลือกวิธีชำระเงินด้านล่างค่ะ 👇`,
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "📱 โอนสแกน QR",
                data: `action=PAY_METHOD&method=PROMPTPAY_QR&orderId=${orderId}&amt=${totalAmount}`,
                displayText: "เลือก: โอนเงินผ่าน QR Code",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "💵 จ่ายสดหน้างาน",
                data: `action=PAY_METHOD&method=COD_CASH&orderId=${orderId}&amt=${totalAmount}`,
                displayText: "เลือก: ชำระเงินสดหน้างานกับพนักงาน",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "📑 ลูกค้าหมุนบิล",
                data: `action=PAY_METHOD&method=ROLLING_BILL&orderId=${orderId}&amt=${totalAmount}`,
                displayText: "เลือก: หมุนบิล (จ่ายบิลเก่าเมื่อรับของใหม่)",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "🏪 รับและจ่ายหน้าร้าน",
                data: `action=PAY_METHOD&method=CASH_AT_STORE&orderId=${orderId}&amt=${totalAmount}`,
                displayText: "เลือก: ชำระเงินสดที่หน้าร้านสาขาใหญ่ (24 ชม.)",
              },
            },
          ],
        },
      },
    ],
  };

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function replyText(replyToken: string, text: string, env: Env): Promise<void> {
  const accessToken = env.LINE_CHANNEL_ACCESS_TOKEN || "xxx";
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}
