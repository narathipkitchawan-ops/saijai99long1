import { Env } from "../config/env";

// รายชื่อ 10 บริษัทคู่ค้าสำหรับแยกโฟลเดอร์อัตโนมัติ
export const VENDOR_FOLDERS: Record<string, string> = {
  PPF: "1.บริษัท PPF",
  FARM9: "2.บริษัท ฟาร์ม 9",
  GOLDEN: "3.บริษัท โกลเด้น ไลน์ บิสซิเนส",
  CPF: "4.CPF",
  BETAGRO: "5.เบทาโกร",
  INTER: "6.อินเตอร์ชิกเก้น",
  RATCHANEE: "7.รัชนี",
  HIASONG: "8.เฮียซ้ง",
  SUPPLIES: "9.ถุง กุญแจ",
  OTHER: "10.บิลอื่นๆ",
};

export interface LocalRegexParseResult {
  matched: boolean;
  action?: "CHECK_CATALOG" | "BREAK_BULK";
  data?: {
    sku: string;
    weightKg: number;
  };
}

export interface ParsedOrderItem {
  s: string;
  q: number;
  u: "BAG5" | "BAG10" | "KG";
}

export interface ParsedOrderResult {
  intent?: string;
  z?: "CITY" | "OUTSKIRT";
  i?: ParsedOrderItem[];
}

export interface ClassifiedDocumentResult {
  docType?: "LIVESTOCK" | "VENDOR_BILL";
  vendorCode?: string;
  docNo?: string;
  amount?: number;
  date?: string;
}

/**
 * ด่านที่ 1: ใช้ Regex ดักจับคำสั่งพื้นฐานก่อน เพื่อไม่ให้เสีย Token ของ Gemini AI
 */
export function tryLocalRegexParse(text: string): LocalRegexParseResult {
  const clean = text.trim();

  // เช็กคำสั่งปุ่มลัดหรือเช็กสต็อกทั่วไป
  if (/^(เช็คสต็อก|สต็อก|ราคา|เมนู)$/i.test(clean)) {
    return { matched: true, action: "CHECK_CATALOG" };
  }

  // เช็กคำสั่งแตกถุงโรงงาน 5/10 กก. ลงกระบะขายปลีก (เช่น CMD-BB-CHK-BREAST-10)
  const bbMatch = clean.match(/^CMD-BB-([A-Z0-9-]+)-(5|10)$/);
  if (bbMatch) {
    return {
      matched: true,
      action: "BREAK_BULK",
      data: { sku: bbMatch[1], weightKg: parseInt(bbMatch[2], 10) },
    };
  }

  return { matched: false };
}

/**
 * ด่านที่ 2: เรียกใช้ Google AI (Gemini 1.5 Flash) แบบ Stateless ประหยัด Token สูงสุด
 */
export async function parseOrderWithGemini(text: string, env: Env): Promise<ParsedOrderResult> {
  const apiKey = env.GEMINI_API_KEY || "xxx";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // System Instruction สั้นกระชับ ใช้ Abbreviated Keys (i=items, s=sku, q=qty, u=unit, z=zone)
  const prompt = `แปลงคำสั่งซื้อร้านไก่-หมูสด Saijai99 เป็น JSON เท่านั้น:
SKU: CHK_LEG(น่อง), CHK_BREAST(อก), CHK_HIP(สะโพก), CHK_WING(ปีก), PRK_BELLY(สามชั้น), PRK_NECK(คอหมู)
Unit: BAG5(ถุง5โล), BAG10(ถุง10โล), KG(กิโล)
Zone: CITY(ในเมืองพิษณุโลก), OUTSKIRT(ต่างจังหวัด/รอบนอก)
Format: {"intent":"ORDER","z":"CITY|OUTSKIRT","i":[{"s":"SKU","q":number,"u":"BAG5|BAG10|KG"}]}
ข้อความลูกค้า: "${text}"`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
        responseMimeType: "application/json",
      },
    }),
  });

  const result = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawJson = result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(rawJson) as ParsedOrderResult;
}

/**
 * ฟังก์ชัน OCR แยกประเภทบิลค่าสินค้า 10 บริษัท หรือ ใบปศุสัตว์ ร.3/ร.4
 */
export async function classifyDocumentOCR(
  base64Image: string,
  mimeType: string,
  env: Env,
): Promise<ClassifiedDocumentResult> {
  const apiKey = env.GEMINI_API_KEY || "xxx";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `อ่านรูปเอกสารนี้และตอบเป็น JSON:
1. ถ้าเป็นใบอนุญาตเคลื่อนย้ายสัตว์ (ร.3, ร.4, รน.) ให้ระบุ docType="LIVESTOCK"
2. ถ้าเป็นบิลค่าสินค้า ให้ระบุ docType="VENDOR_BILL" และจำแนก vendorCode จากรายชื่อนี้: PPF, FARM9, GOLDEN, CPF, BETAGRO, INTER, RATCHANEE, HIASONG, SUPPLIES (ค่าถุง/กุญแจ/น้ำแข็ง), OTHER
JSON Format: {"docType":"LIVESTOCK|VENDOR_BILL","vendorCode":"...","docNo":"...","amount":0,"date":"YYYY-MM-DD"}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Image } }],
        },
      ],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    }),
  });

  const result = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return JSON.parse(result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}") as ClassifiedDocumentResult;
}
