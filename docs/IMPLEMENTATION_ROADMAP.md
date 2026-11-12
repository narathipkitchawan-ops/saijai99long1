# Saijai99 Implementation Roadmap

แผนนี้จัดลำดับการพัฒนาตาม Master Project Specification โดยไม่เปลี่ยนโครงสร้างการทำงานเดิม

## Phase 0 — Baseline & architecture lock (เริ่มต้น)
- ยืนยัน repository, branches, Worker และ deployment ปัจจุบัน
- เก็บ Master Specification และ Antigravity rules ใน repository
- คง Worker health check และ LINE signature validation เดิม
- ห้าม deploy production และห้ามใช้ placeholder เป็นค่าจริง

## Phase 1 — Environment and data foundation
- จัดทำ environment contract และ constants ให้ตรงชื่อจริง
- ออกแบบ D1 schema จากฟิลด์ที่เจ้าของระบบยืนยัน ไม่เดาคอลัมน์ธุรกิจ
- ตรวจสอบ/จัดเตรียม D1 และ KV สำหรับ staging หลังยืนยัน account/resource naming
- กำหนด Google service account, Spreadsheet ID และ Drive folder IDs ผ่าน secrets/config ที่ปลอดภัย
- สร้าง Apps Script bootstrap สำหรับ 15 tabs โดยไม่ใส่ข้อมูลตัวอย่างที่อาจถูกเข้าใจว่าเป็นข้อมูลขายจริง

## Phase 2 — Google Sheets / Drive services
- Google OAuth service และ token cache
- Sheets read/write/append พร้อม validation, retry และ audit
- Drive folder routing ตามวันที่/ประเภทเอกสาร/บริษัทคู่ค้า
- ทดสอบ permissions และ idempotency ด้วยไฟล์ทดสอบที่ไม่ใช่ข้อมูลจริง

## Phase 3 — LINE OA and order workflow
- คง webhook signature verification
- parse event, deduplicate webhook delivery และจัดการ LINE reply/quick reply
- order workflow และ payment method ตามข้อมูลที่เจ้าของระบบยืนยัน
- ยังไม่เปิดเผยราคา/สต็อก/ค่าขนส่งจนกว่าจะเชื่อมต่อแหล่งข้อมูลจริงและผ่านการตรวจสอบ

## Phase 4 — Inventory, break-bulk, processing and dispatch
- HQ warehouse, front-store bag/loose inventory
- Break-bulk 5/10 kg พร้อม stock movement log
- Processing room, yield/drip loss, WIP partial dispatch
- Market dispatch 22:00–06:00 และ returns reconciliation
- Supplies inventory / waste log

## Phase 5 — Payments and document automation
- Easy Slip verification และ duplicate `transRef` protection
- Livestock documents ร.3/ร.4/รน.
- Vendor invoice classification 10 companies
- Gemini OCR/structured extraction พร้อม human review สำหรับข้อมูลความเชื่อมั่นต่ำ

## Phase 6 — LIFF, HR and payroll
- Break-bulk kiosk
- GPS attendance UI และ server-side geofence checks
- Employee records, fixed shifts, night OT
- Payroll, bank CSV import, SSO and tax exports
- ต้องมีการทดสอบความแม่นยำ GPS, access controls และตรวจสอบกฎหมาย/สูตรก่อน production

## Phase 7 — TTS, monitoring and release readiness
- Google Cloud TTS role-specific alerts
- structured logs, traces, alerts, backups and recovery procedure
- end-to-end tests: LINE -> order -> payment -> stock -> dispatch -> archive
- staging sign-off, rollback plan, separate production approval

## Exit criteria
แต่ละ phase ต้องมี:
1. รายการไฟล์และการเปลี่ยนแปลงที่ตรวจสอบได้
2. typecheck/test result
3. integration test evidence หรือรายการ blockers ที่ระบุชัด
4. ไม่มี secret ใน repository/logs
5. ไม่ใช้ข้อมูลจำลองเป็นข้อมูลขายจริง
6. ยืนยันว่า workflow เดิมและ endpoint เดิมยังทำงาน
