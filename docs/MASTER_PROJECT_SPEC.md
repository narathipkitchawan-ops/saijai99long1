# Saijai99 ERP & Automation — Master Project Specification

เอกสารนี้เป็นข้อกำหนดแม่บทของโครงการ บริษัท สายใจ 99 จำกัด ตามเอกสาร Master GPT / Antigravity Prompt ที่ผู้ใช้ส่งให้ ห้ามเปลี่ยนสถาปัตยกรรมหรือความหมายของ workflow โดยไม่มีการอนุมัติ

## เป้าหมายและสภาพแวดล้อม
- Local workspace: `D:\Saijai99\saijai99long1`
- GitHub: `narathipkitchawan-ops/saijai99long1`
- LINE OA Channel ID: `2012283264`
- Cloudflare staging Worker: `saijai99long1-staging`
- Runtime/toolchain ปัจจุบันใน repository: TypeScript + Wrangler v4 + `wrangler.jsonc`
- Branch ที่มีอยู่จริง: `master` (default) และ `staging`; ห้ามเปลี่ยนชื่อ branch โดยพลการ
- Google AI: Gemini สำหรับ OCR/แปลงออร์เดอร์ และ Google Cloud TTS สำหรับเสียงเตือน ตามข้อกำหนดต้นฉบับ
- Staging เป็นเป้าหมายการพัฒนาและทดสอบเท่านั้น; Production ต้องแยกการอนุมัติและการตั้งค่า

## สถาปัตยกรรมที่ต้องคงไว้
1. Cloudflare Worker เป็น entry point สำหรับ LINE Webhook, API และ scheduled jobs
2. Cloudflare D1 เป็น relational/operational data store ตาม schema ที่จะจัดทำ
3. Cloudflare KV ใช้เฉพาะข้อมูล cache/token ที่เหมาะสม ไม่ใช้แทน transactional database
4. Google Sheets ชื่อ `Saijai99_ERP_Master_DB` เป็น workbook หลัก โดยคงชื่อแท็บ 15 แท็บตามรายการด้านล่าง
5. Google Drive เป็น archive ตามโครงสร้างโฟลเดอร์ที่ระบุ
6. LINE Messaging API เป็นช่องทางสื่อสารกับลูกค้า
7. Gemini, Easy Slip และ Google Cloud TTS เป็น integration แยก service
8. LIFF เป็น frontend สำหรับ Break-Bulk kiosk และ GPS attendance

## Google Sheets — exact tab names
1. `Orders_Master`
2. `FrontStore_Bags_Inventory`
3. `FrontStore_Loose_Inventory`
4. `BreakBulk_Log`
5. `HQ_Warehouse_Inventory`
6. `ProcessingRoom`
7. `Market_Dispatch_Log`
8. `SuppliesInventory`
9. `SuppliesLog`
10. `Slip_Verification_Log`
11. `Livestock_Docs_Log`
12. `Vendor_Bills_Log`
13. `Employees_HR`
14. `AttendanceLog`
15. `Payroll_SSO_Tax`

## Drive archive — exact folder names
- `Saijai99_Cloud_Archive_Root/`
- `00_Dropzone_Incoming/`
- `01_Customer_Payment_Slips/YYYY/MM/DD/`
- `02_Livestock_Documents_Monthly/YYYY/MM_ชื่อเดือน/`
- `03_Vendor_Invoices_10_Companies/` โดยมี 10 บริษัทตามเอกสารต้นฉบับ
- `04_HR_Tax_And_Corporate_Vault/` พร้อมโฟลเดอร์เอกสารบริษัท, SSO, ภาษี, bank CSV และแฟ้มพนักงาน

## Target directory layout
ให้คงรูปแบบการแยกส่วนตามเอกสารต้นฉบับ:
- `.antigravity/rules.md`
- `.github/workflows/deploy-staging.yml`
- `public-liff/index-breakbulk-kiosk.html`
- `public-liff/index-attendance-gps.html`
- `gas-scripts/Saijai99_Sheets_Automation.gs`
- `src/index.ts`
- `src/config/{env.ts,constants.ts}`
- `src/services/{googleAuth,googleSheets,googleDrive,geminiAi,easySlip,voiceAlertTts,lineMessaging}.ts`
- `src/handlers/{orderDispatchHandler,breakBulkHandler,warehouseWipHandler,hrAttendancePayroll}.ts`
- `schema.sql`, `wrangler.jsonc`, `package.json`, `tsconfig.json`

## Operational rules
- Order dispatch: แยกในเมืองพิษณุโลก/ต่างจังหวัด และใช้รอบเวลาตามเอกสาร (18:00/21:00)
- Break-bulk: รองรับถุงโรงงาน 5/10 กก. และบันทึก movement ไปยัง loose inventory
- Market dispatch: จำกัด workflow ตามช่วง 22:00–06:00 และคำนวณยอดเบิกสุทธิหลังหักยอดคืน
- Processing room: บันทึก input/output, yield, drip loss และ WIP partial dispatch
- Slip verification: เก็บ `transRef` เพื่อป้องกันสลิปซ้ำ
- Attendance: GPS radius ตามข้อกำหนดเอกสาร 3.8 เมตร; ต้องทดสอบความแม่นยำจริงก่อนใช้ตัดสินเงินเดือน
- Payroll: แยก DAY_SHIFT/NIGHT_SHIFT และกติกา OT ตามเอกสาร; ต้องให้ผู้รับผิดชอบตรวจสอบกฎหมายและสูตรก่อนใช้งานจริง

## Security and data integrity
- ห้าม commit API keys, tokens, secrets, private keys, service-account JSON หรือค่าจริงลง Git
- ห้ามส่ง secret ผ่านแชต; ใช้ Cloudflare Worker secrets / GitHub Actions secrets / secure local environment เท่านั้น
- `xxx` เป็นเพียง marker ในเอกสาร ไม่ใช่ credential ที่ใช้งานได้ และห้ามนำไป deploy เป็นค่าจริง
- ห้ามใช้รหัส HR แบบ hard-coded เป็นกลไกยืนยันตัวตน production; ต้องเปลี่ยนเป็น secret ที่จัดการอย่างปลอดภัยก่อนเปิดใช้
- ห้ามสร้างราคา สต็อก ค่าขนส่ง หรือข้อมูลคู่ค้า/พนักงานปลอมเพื่อแสดงต่อลูกค้า
- หากข้อมูลจริงหรือ ID ยังไม่มี ให้แสดงสถานะ “ยังไม่พร้อม/รอยืนยันข้อมูล” และปิดการทำรายการที่ต้องพึ่งข้อมูลนั้น
- ป้องกัน duplicate webhook/event, idempotency ของ order/payment และ audit trail สำหรับ stock movement
- เก็บข้อมูลส่วนบุคคลเท่าที่จำเป็น จำกัดสิทธิ์ตามบทบาท และกำหนด retention policy ก่อนเปิดใช้งาน HR/payroll

## Change-control
- ทุกการเปลี่ยนแปลงต้อง additive/minimal-diff เป็นหลัก และรักษา endpoint เดิม `GET /health` กับ `POST /webhook/line`
- ห้ามเปลี่ยน Wrangler project, environment names, bindings หรือ deployment workflow โดยไม่ตรวจสอบของจริงและบันทึกผลกระทบ
- ห้าม deploy production จากงานนี้
- ทุก phase ต้องผ่าน typecheck/tests และ staging validation ก่อนเริ่ม phase ถัดไป
- ห้ามสร้างทรัพยากร Cloudflare/Google ใหม่หรือ migrate ข้อมูลโดยไม่มีการตรวจสอบชื่อ/ID และอนุมัติการเปลี่ยนแปลงเฉพาะรายการ
