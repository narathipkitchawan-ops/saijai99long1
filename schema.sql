-- ตารางเก็บคิวออร์เดอร์และวิธีชำระเงิน (QR, จ่ายสดหน้างาน, หมุนบิล, หน้าร้าน)
CREATE TABLE IF NOT EXISTS order_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- ตารางเก็บประวัติการฉีกถุงโรงงาน 5/10 กก. ลงกระบะขายปลีกหน้าร้าน 24 ชม.
CREATE TABLE IF NOT EXISTS break_bulk_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL,
  weight_kg INTEGER NOT NULL,
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
