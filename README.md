# Saijai 99 (สายใจ 99) — ERP & 24/7 Store Automation Engine

ระบบบริหารจัดการร้านค้าปลีก-ส่งชิ้นส่วนไก่สดและหมูสดครบวงจร 24 ชั่วโมง (สาขาใหญ่พิษณุโลก) ทำงานบนสถาปัตยกรรม Serverless บน **Cloudflare Workers**, **Cloudflare D1 Database**, **Cloudflare KV**, **Google Gemini 1.5 Flash AI**, **LINE Messaging API (Flex Messages)**, **LINE LIFF**, และ **Google Apps Script Web App Bridge** ซิงค์ข้อมูลสู่ **Google Sheets / Google Drive**

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

```mermaid
flowchart TD
    subgraph Client["ช่องทางผู้ใช้งาน (Client Layer)"]
        LU["ลูกค้า (LINE OA)"]
        LP["พนักงานหน้าร้าน (LINE LIFF)"]
        OW["เจ้าของร้าน (Owner Approver)"]
    end

    subgraph LINE["LINE Platform"]
        LMA["Messaging API"]
        LIFF["LIFF App SDK"]
    end

    subgraph Cloudflare["Cloudflare Serverless Edge"]
        CW["Cloudflare Worker (saijai99-erp-worker)"]
        D1[("Cloudflare D1 (saijai99_db)")]
        KV[("Cloudflare KV (SAIJAI_KV)")]
        CRON["Cron Trigger (*/5 * * * *)"]
    end

    subgraph GoogleCloud["Google Ecosystem"]
        GEM["Google Gemini 1.5 Flash (AI OCR & NLP)"]
        GAS["Google Apps Script Web App Bridge"]
        GS[("Google Sheets (Orders & BreakBulk)")]
        GD[("Google Drive (10 บริษัทคู่ค้า & สลิป)")]
    end

    LU -->|ข้อความคำสั่งซื้อ / ส่งสลิป| LMA
    LP -->|แตกถุง 5/10 กก. & ตอกบัตร GPS| LIFF
    OW -->|อนุมัติสิทธิ์หมุนบิล| LMA

    LMA -->|POST /webhook/line| CW
    LIFF -->|API Call / Webview| CW

    CW -->|บันทึกคิวออเดอร์ & แตกถุง| D1
    CW -->|แคชโทเค็น & เซสชัน| KV
    CW -->|วิเคราะห์คำสั่งซื้อ & OCR บิล| GEM
    CRON -->|กวาดคิวทุก 5 นาที| CW
    CW -->|POST do_post (JSON Sync)| GAS
    GAS -->|Append Data| GS
    CW -->|ตอบกลับ Flex Message Mega Bubble| LMA
```

---

## 🚀 ฟังก์ชันหลักของระบบ (Core Capabilities)

### 1. ระบบรับออเดอร์อัตโนมัติด้วย AI & Flex Message
* **ด่านที่ 1 (Local Keyword Filtering):** ดักจับคีย์เวิร์ดตรงบางส่วน (Partial Match) ตาม 6 หมวดหมู่ ไม่เกิน 500 ตัวอักษร ช่วยประหยัด Token ของ AI ได้ 100%
* **ด่านที่ 2 (Google Gemini 1.5 Flash):** แปลงภาษาพูดของลูกค้า (เช่น *"น่องไก่ 2 กิโล เลือด 1 ก้อน ขายาว 10 โล โครงเต็ม 1 ถุง ในเมือง"*) ออกมาเป็น JSON SKU และคำนวณราคาอัตโนมัติตามราคาต่อ กก.
* **LINE Flex Message (Mega Bubble):** ส่งบิลสรุปรายการสั่งซื้อที่จัดระนาบตัวอักษรด้วย **CSS Baseline Alignment** พร้อม 4 ปุ่มเลือกชำระเงิน:
  1. 📱 **โอนสแกน QR พร้อมเพย์**
  2. 💵 **จ่ายเงินสดหน้างาน (COD)**
  3. 📑 **สิทธิ์หมุนบิล (Rolling Bill)**
  4. 🏪 **รับสินค้าและชำระที่หน้าร้าน 24 ชม.**

### 2. ระบบอนุมัติสิทธิ์หมุนบิลโดยเจ้าของร้าน (Owner Approval Gate)
* เมื่อลูกค้าเลือกชำระเงินแบบ **หมุนบิล** ระบบจะไม่เปิดบิลทันที แต่จะบันทึกสถานะเป็น **`PENDING_OWNER_APPROVAL`**
* ระบบแจ้งเตือนเงื่อนไขในห้องแชททันที และเปิดให้เจ้าของร้านกดอนุมัติ (`action=OWNER_DECISION&decision=APPROVE`) เพื่อเปลี่ยนสถานะเป็น `CONFIRMED`

### 3. ระบบ One-Touch แตกถุงโรงงาน 5/10 กก. (`/liff/break-bulk`)
* หน้าจอ LIFF สีเข้ม (Dark Theme) สำหรับพนักงานหน้าร้าน
* ปุ่มชิ้นส่วนไก่-หมู (อก, น่อง, สะโพก, ปีก, สามชั้น, คอหมู) และปุ่มขนาดถุงโรงงาน (5 กก. / 10 กก.)
* ส่งเสียง Beep สังเคราะห์ **880Hz (A5 Note)** พร้อมระบบสั่นตอบสนอง **Haptic Vibration** (`navigator.vibrate(50)`)
* บันทึกตัดสต็อกลง Cloudflare D1 ทันที

### 4. ระบบตอกบัตรพนักงาน GPS & กะกลางคืน/กลางวัน (`/liff/attendance`)
* ตรวจสอบพิกัด GPS หน้าร้านสาขาใหญ่พิษณุโลก (`Lat: 16.8211`, `Lng: 100.2659`)
* แยกกะทำงานถาวร: กะกลางวัน (08:00 - 17:00 น.) และกะกลางคืน (22:00 - 07:00 น.)
* **Pre-Shift OT Engine:** พนักงานกะกลางคืนที่สแกนเข้างานตั้งแต่ **19:30 น. เป็นต้นไป** ระบบจะเริ่มคิดโอทีให้อัตโนมัติทันที

### 5. ห้องทดลอง WPT Baseline Synthesis & Flexbox Inspector (`/test/baseline`)
* ทดสอบเอนจินการเรนเดอร์ของเบราว์เซอร์และ WebView ตามมาตรฐานสากล **W3C Web Platform Tests (`baseline-synthesis-001.html`)**
* มีเครื่องมือจำลองการจัดระนาบฟอนต์ภาษาไทยและสัญลักษณ์ราคา `฿` พร้อมเส้นไกด์สีแดงแบบเรียลไทม์

### 6. ซิงค์ข้อมูล D1 สู่ Google Sheets ผ่าน Google Apps Script Bridge (#3)
* ทำงานอัตโนมัติทุก 5 นาทีผ่าน Cloudflare Cron Trigger (`*/5 * * * *`)
* รองรับการสั่งซิงค์สด On-Demand ผ่าน `GET/POST /api/sync/sheets`
* ซิงค์ทั้งตารางคำสั่งซื้อ (`order_outbox`) และตารางฉีกถุงหน้าร้าน (`break_bulk_queue`)

---

## 📋 กฎข้อความตอบกลับอัตโนมัติ 6 หมวดหมู่ (Auto-Response Rules)

| กฎที่ | ชื่อกฎ (Rule Name) | แอ็กชันแท็ก | ตัวอย่างคีย์เวิร์ด (ตรงบางส่วน 10 คำ) | เงื่อนไขพิเศษ |
| :-: | :--- | :--- | :--- | :---: |
| **1** | `[SJ99] สั่งซื้อและสอบถามราคาไก่สด` | `ลูกค้าสนใจไก่สด`, `รอรับออเดอร์` | น่องไก่, อกไก่, สะโพกไก่, ปีกไก่, ไก่สด, โครงไก่, สันในไก่, ตับไก่, กึ๋นไก่, ชิ้นส่วนไก่ | - |
| **2** | `[SJ99] สั่งซื้อและสอบถามราคาหมูสด` | `ลูกค้าสนใจหมูสด`, `รอรับออเดอร์` | หมูสามชั้น, สามชั้น, คอหมู, หมูสด, สันนอกหมู, สันในหมู, ซี่โครงหมู, หมูบด, เนื้อหมู, มันหมู | - |
| **3** | `[SJ99] สอบถามรอบรถส่งและพื้นที่จัดส่ง` | `สอบถามรอบส่ง`, `ลูกค้าขนส่ง` | รอบส่ง, ส่งกี่โมง, ตัดรอบ, ค่าส่ง, ส่งต่างจังหวัด, ส่งในเมือง, รถออกกี่โมง, ส่งถึงบ้านไหม, พิษณุโลกส่งไหม, จัดส่ง | แจ้งรอบรถในเมือง 24 ชม. และต่างจังหวัด (วัดโบสถ์ 08:30 น., บ้านกร่าง 15:30 น.) |
| **4** | `[SJ99] พิกัดหน้าร้านและเวลาเปิดทำการ` | `ลูกค้าหน้าร้าน` | ร้านอยู่ที่ไหน, พิกัดร้าน, แผนที่ร้าน, ร้านเปิดกี่โมง, ร้านปิดกี่โมง, เปิด24ชั่วโมงไหม, ไปรับหน้าร้าน, สาขาใหญ่, ที่ตั้งร้าน, เบอร์โทรหน้าร้าน | พิกัด 16.8211, 100.2659 เปิด 24 ชม. |
| **5** | `[SJ99] วิธีชำระเงินและแจ้งโอน` | `การชำระเงิน`, `รอตรวจสลิป` | เลขบัญชี, พร้อมเพย์, โอนเงิน, สแกนจ่าย, เก็บเงินปลายทาง, จ่ายสด, หมุนบิล, ส่งสลิป, แจ้งโอน, ใบเสร็จ | **หมุนบิลต้องผ่านการอนุมัติจากเจ้าของร้าน** |
| **6** | `[SJ99] พนักงานและระบบสต็อกหน้าร้าน` | `พนักงานร้าน`, `ระบบภายใน` | แกะถุง, ฉีกถุง, ตอกบัตร, เข้างาน, ลงเวลา, โอที, กะกลางคืน, กะกลางวัน, เช็คสต็อก, สต็อกหน้าร้าน | แนบลิงก์ LIFF ปุ่มลัดแตกถุง |

---

## 🗄️ โครงสร้างฐานข้อมูล Cloudflare D1 (`saijai99_db`)

```sql
-- 1. ตารางคิวคำสั่งซื้อ
CREATE TABLE IF NOT EXISTS order_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, PENDING_OWNER_APPROVAL, REJECTED
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 2. ตารางคิวแตกถุงหน้าร้าน 24 ชม.
CREATE TABLE IF NOT EXISTS break_bulk_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL,
  weight_kg INTEGER NOT NULL,
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 3. ตารางกฎข้อความตอบกลับอัตโนมัติ
CREATE TABLE IF NOT EXISTS auto_response_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id TEXT UNIQUE NOT NULL,
  rule_name TEXT NOT NULL,
  action_tags TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'PARTIAL',
  keywords TEXT NOT NULL,
  response_text TEXT NOT NULL,
  requires_owner_approval INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 🌐 Endpoints & API Reference

| Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- |
| `GET` | `/health` | ตรวจสอบสถานะการทำงานของ Worker (Health Check) |
| `POST` | `/webhook/line` | รับ Webhook จาก LINE Messaging API (ตรวจสอบลายเซ็น HMAC-SHA256) |
| `GET` | `/liff/break-bulk` | หน้าจอเว็บแอป LIFF ปุ่มลัดแตกถุงโรงงาน 5/10 กก. |
| `POST` | `/api/breakbulk` | API บันทึกการฉีกถุงโรงงานลง D1 โดยตรง |
| `GET` | `/liff/attendance` | หน้าจอเว็บแอป LIFF ตอกบัตรพนักงาน GPS & Pre-Shift OT |
| `POST` | `/api/attendance/checkin` | API ประเมินกะทำงานและบันทึกเวลาเข้างาน |
| `GET` | `/test/baseline` | หน้าจอทดสอบ WPT Baseline Synthesis & Thai Typography Inspector |
| `GET/POST`| `/api/sync/sheets` | สั่งซิงค์ข้อมูล D1 ↔ Google Sheets ทันทีแบบ On-Demand |

---

## 🛠️ การพัฒนาและการ Deploy (CI/CD)

### เทคโนโลยีที่ใช้ (Tech Stack)
* **Runtime:** Cloudflare Workers (Node.js 22 Compatibility Mode)
* **CLI:** Wrangler v4 (`cloudflare/workers-sdk` PR #16716 standards)
* **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)
* **Language:** TypeScript 5.9+

### คำสั่งสำหรับนักพัฒนา
```bash
# ติดตั้ง Dependencies
npm install

# ตรวจสอบ Typecheck
npm run build

# รันเซิร์ฟเวอร์จำลองในเครื่อง
npm run dev

# Deploy ขึ้น Cloudflare Workers Production
npx wrangler deploy

# Execute Schema บน Cloudflare D1
npx wrangler d1 execute saijai99_db --file=./schema.sql --remote
```

---

## 📄 ข้อมูลอ้างอิงและมาตรฐาน (References)
* **Cloudflare Workers SDK Repository:** [cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk) (Wrangler v4 deploy pipelines, Node 22 runtime, and D1 automated bindings)
* **W3C CSS Box Alignment Specification:** [CSS Baseline Synthesis (WPT)](https://wpt.fyi/results/css/css-flexbox/baseline-synthesis-001.html)
* **LINE Messaging API Documentation:** [LINE Developers](https://developers.line.biz/en/docs/messaging-api/)

---

© 2026 Saijai 99 — Fresh Chicken & Pork Market (Phitsanulok). All Rights Reserved.
