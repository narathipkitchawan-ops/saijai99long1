import { Env } from "../config/env";
import { LineMessagingClient } from "./lineSdk";

export interface OrderItemDetail {
  s: string; // SKU or name
  q: number; // quantity
  u: string; // unit (BAG5, BAG10, KG, etc.)
}

export const SKU_NAMES: Record<string, string> = {
  CHK_BREAST: "🍗 อกไก่สด",
  CHK_LEG: "🍗 น่องไก่สด",
  CHK_HIP: "🍗 สะโพกไก่",
  CHK_WING: "🍗 ปีกไก่สด",
  PRK_BELLY: "🥩 หมูสามชั้น",
  PRK_NECK: "🥩 คอหมูสด",
};

export const UNIT_NAMES: Record<string, string> = {
  BAG10: "ถุง 10 กก.",
  BAG5: "ถุง 5 กก.",
  KG: "กก.",
};

export const SKU_PRICES_PER_KG: Record<string, number> = {
  CHK_BREAST: 75,
  CHK_LEG: 65,
  CHK_HIP: 70,
  CHK_WING: 85,
  PRK_BELLY: 160,
  PRK_NECK: 150,
};

/**
 * ส่งข้อความตอบกลับสรุปออเดอร์ด้วย LINE Flex Message (Bubble Receipt)
 * พร้อมปุ่ม Action เลือกชำระเงิน และ Quick Reply เสริม
 * (ฟรี 100% ไม่เสียโควต้า Push Message)
 */
export async function replyOrderSummaryWithPaymentChoices(
  replyToken: string,
  orderId: string,
  summaryText: string,
  totalAmount: number,
  zone: string,
  env: Env,
  items?: OrderItemDetail[],
): Promise<void> {
  const accessToken = env.LINE_CHANNEL_ACCESS_TOKEN || "xxx";
  const isOutskirt = zone === "OUTSKIRT";
  const cutoffNotice = isOutskirt
    ? "🚛 สายต่างจังหวัด (ตัดรอบ 18:00 น. / รถออก 00:00-01:30 น.)"
    : "🛵 สายในเมืองพิษณุโลก (ตัดรอบ 21:00 น. / รถออก 02:00-04:00 น.)";

  // สร้างแถวรายการสินค้าแบบ Flexbox (Horizontal box with baseline alignment)
  const itemRows: unknown[] = items && items.length > 0
    ? items.map((it) => {
        const skuLabel = SKU_NAMES[it.s] || `• ${it.s}`;
        const unitLabel = UNIT_NAMES[it.u] || it.u;
        const kgMultiplier = it.u === "BAG10" ? 10 : it.u === "BAG5" ? 5 : 1;
        const pricePerKg = SKU_PRICES_PER_KG[it.s] || 70;
        const lineTotal = it.q * kgMultiplier * pricePerKg;

        return {
          type: "box",
          layout: "horizontal",
          alignItems: "baseline",
          margin: "sm",
          contents: [
            {
              type: "text",
              text: `${skuLabel} x${it.q} (${unitLabel})`,
              size: "sm",
              color: "#1e293b",
              flex: 4,
              wrap: true,
            },
            {
              type: "text",
              text: `฿${lineTotal.toLocaleString()}`,
              size: "sm",
              color: "#475569",
              align: "end",
              weight: "bold",
              flex: 2,
            },
          ],
        };
      })
    : summaryText.split("\n").filter(Boolean).map((line) => ({
        type: "box",
        layout: "horizontal",
        alignItems: "baseline",
        margin: "sm",
        contents: [
          {
            type: "text",
            text: line,
            size: "sm",
            color: "#1e293b",
            flex: 1,
            wrap: true,
          },
        ],
      }));

  const flexMessage = {
    type: "flex",
    altText: `🧾 สรุปออเดอร์ #${orderId} - ร้านสายใจ 99 (ยอดรวม ฿${totalAmount.toLocaleString()})`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#ea580c",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: "🍗 SAIJAI 99 FRESH MARKET",
                weight: "bold",
                color: "#ffedd5",
                size: "xs",
                flex: 1,
              },
              {
                type: "box",
                layout: "horizontal",
                backgroundColor: "#c2410c",
                cornerRadius: "12px",
                paddingStart: "8px",
                paddingEnd: "8px",
                paddingTop: "2px",
                paddingBottom: "2px",
                contents: [
                  {
                    type: "text",
                    text: "รอชำระเงิน",
                    color: "#ffffff",
                    size: "xxs",
                    weight: "bold",
                  },
                ],
              },
            ],
          },
          {
            type: "text",
            text: `ออเดอร์ #${orderId}`,
            weight: "bold",
            color: "#ffffff",
            size: "xl",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            backgroundColor: "#f8fafc",
            cornerRadius: "8px",
            paddingAll: "8px",
            contents: [
              {
                type: "text",
                text: cutoffNotice,
                size: "xs",
                color: "#475569",
                wrap: true,
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "รายการสินค้าที่สั่งซื้อ",
                size: "xs",
                color: "#94a3b8",
                weight: "bold",
              },
              {
                type: "separator",
                margin: "xs",
                color: "#e2e8f0",
              },
              ...itemRows,
            ],
          },
          {
            type: "separator",
            margin: "lg",
            color: "#cbd5e1",
          },
          {
            type: "box",
            layout: "horizontal",
            alignItems: "baseline",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "ยอดรวมสุทธิ",
                size: "md",
                weight: "bold",
                color: "#1e293b",
              },
              {
                type: "text",
                text: `฿${totalAmount.toLocaleString()}`,
                size: "xxl",
                weight: "bold",
                color: "#ea580c",
                align: "end",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#ea580c",
            height: "sm",
            action: {
              type: "postback",
              label: "📱 โอนสแกน QR", // ต้องไม่เกิน 20 ตัวอักษร
              data: `action=PAY_METHOD&method=PROMPTPAY_QR&orderId=${orderId}&amt=${totalAmount}`,
              displayText: "เลือก: โอนเงินผ่าน QR Code พร้อมเพย์",
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "postback",
              label: "💵 จ่ายเงินสด (COD)", // ต้องไม่เกิน 20 ตัวอักษร
              data: `action=PAY_METHOD&method=COD_CASH&orderId=${orderId}&amt=${totalAmount}`,
              displayText: "เลือก: ชำระเงินสดหน้างานกับพนักงานส่งของ",
            },
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "link",
                height: "sm",
                action: {
                  type: "postback",
                  label: "📑 หมุนบิล",
                  data: `action=PAY_METHOD&method=ROLLING_BILL&orderId=${orderId}&amt=${totalAmount}`,
                  displayText: "เลือก: หมุนบิล (จ่ายบิลเก่าเมื่อรับของใหม่)",
                },
              },
              {
                type: "button",
                style: "link",
                height: "sm",
                action: {
                  type: "postback",
                  label: "🏪 รับหน้าร้าน",
                  data: `action=PAY_METHOD&method=CASH_AT_STORE&orderId=${orderId}&amt=${totalAmount}`,
                  displayText: "เลือก: รับสินค้าและชำระที่หน้าร้านสาขาใหญ่ 24 ชม.",
                },
              },
            ],
          },
        ],
      },
    },
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
            label: "💵 จ่ายเงินสด (COD)",
            data: `action=PAY_METHOD&method=COD_CASH&orderId=${orderId}&amt=${totalAmount}`,
            displayText: "เลือก: ชำระเงินสดหน้างานกับพนักงาน",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "📑 หมุนบิล",
            data: `action=PAY_METHOD&method=ROLLING_BILL&orderId=${orderId}&amt=${totalAmount}`,
            displayText: "เลือก: หมุนบิล (จ่ายบิลเก่าเมื่อรับของใหม่)",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "🏪 รับหน้าร้าน",
            data: `action=PAY_METHOD&method=CASH_AT_STORE&orderId=${orderId}&amt=${totalAmount}`,
            displayText: "เลือก: ชำระเงินสดที่หน้าร้านสาขาใหญ่ (24 ชม.)",
          },
        },
      ],
    },
  };

  const client = new LineMessagingClient(accessToken);
  const resp = await client.replyMessage(replyToken, [flexMessage]);

  if (!resp.ok) {
    console.error("LINE Flex Reply Error:", resp.status, resp.errorText);

    // Fallback ส่งเป็นข้อความตัวหนังสือธรรมดาหากเกิดข้อผิดพลาดกับ Flex Message
    await client.replyMessage(replyToken, [
      {
        type: "text",
        text: `✅ สรุปรายการสั่งซื้อ #${orderId}\n${summaryText}\n💰 ยอดรวมสุทธิ: ${totalAmount.toLocaleString()} บาท\n${cutoffNotice}\n\nกรุณาเลือกวิธีชำระเงินด้านล่างค่ะ 👇`,
        quickReply: flexMessage.quickReply,
      },
    ]).catch(console.error);
  }
}

export async function replyText(replyToken: string, text: string, env: Env): Promise<void> {
  const accessToken = env.LINE_CHANNEL_ACCESS_TOKEN || "xxx";
  const client = new LineMessagingClient(accessToken);
  const resp = await client.replyMessage(replyToken, [{ type: "text", text }]);

  if (!resp.ok) {
    console.error("LINE replyText Error:", resp.status, resp.errorText);
  }
}


