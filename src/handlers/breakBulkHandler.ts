import { Env } from "../config/env";

/**
 * บันทึกรายการฉีกถุงโรงงาน 5/10 กก. ลงกระบะขายปลีกใน D1 Queue
 */
export async function recordBreakBulk(sku: string, weightKg: number, env: Env): Promise<void> {
  await env.SAIJAI_DB.prepare(
    `INSERT INTO break_bulk_queue (sku, weight_kg, created_at) VALUES (?, ?, datetime('now'))`,
  )
    .bind(sku, weightKg)
    .run();
}
