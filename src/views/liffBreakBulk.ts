import { Env } from "../config/env";

export function renderBreakBulkHtml(env: Env): string {
  const liffId = env.LIFF_ID_BREAK_BULK || "xxx";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ปุ่มลัดแตกถุงโรงงาน - Saijai 99</title>
  <script charset="utf-8" src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
  <style>
    :root {
      --primary: #ea580c;
      --primary-dark: #c2410c;
      --bg: #0f172a;
      --card: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 14px; min-height: 100vh; display: flex; flex-direction: column; }
    .header { text-align: center; margin-bottom: 14px; }
    .header h1 { font-size: 20px; color: #fb923c; margin-bottom: 2px; }
    .header p { font-size: 12px; color: var(--text-muted); }

    .section-title { font-size: 13px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

    .grid-sku { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
    .sku-btn {
      background: var(--card); border: 2px solid #334155; border-radius: 12px; padding: 14px 10px;
      color: var(--text); text-align: center; cursor: pointer; transition: all 0.15s ease;
    }
    .sku-btn:active, .sku-btn.selected { border-color: #fb923c; background: #2d1d13; box-shadow: 0 0 10px rgba(251,146,60,0.3); }
    .sku-name { font-size: 16px; font-weight: 700; display: block; margin-bottom: 2px; }
    .sku-code { font-size: 11px; color: var(--text-muted); font-mono; }

    .grid-weight { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
    .weight-btn {
      background: var(--card); border: 2px solid #334155; border-radius: 12px; padding: 14px;
      color: var(--text); text-align: center; font-size: 18px; font-weight: 800; cursor: pointer; transition: all 0.15s ease;
    }
    .weight-btn:active, .weight-btn.selected { border-color: #22c55e; background: #0e2e1a; color: #4ade80; }

    .action-btn {
      width: 100%; padding: 18px; border: none; border-radius: 14px;
      background: linear-gradient(135deg, #ea580c, #f97316);
      color: white; font-size: 18px; font-weight: 800; cursor: pointer;
      box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .action-btn:active { transform: scale(0.98); }
    .action-btn:disabled { background: #475569; box-shadow: none; cursor: not-allowed; }

    .history-card { margin-top: 16px; background: var(--card); border-radius: 12px; padding: 12px; }
    .history-title { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
    .history-list { font-size: 13px; line-height: 1.6; }
    .history-item { display: flex; justify-content: space-between; border-bottom: 1px solid #334155; padding: 4px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ One-Touch Break-Bulk</h1>
    <p>ปุ่มลัดฉีกถุงโรงงาน 5/10 กก. เทลงกระบะขายปลีก 24 ชม.</p>
  </div>

  <div class="section-title">1. เลือกประเภทสินค้า:</div>
  <div class="grid-sku" id="skuGrid">
    <div class="sku-btn selected" data-sku="CHK_BREAST" data-name="อกไก่สด">
      <span class="sku-name">🍗 อกไก่</span>
      <span class="sku-code">CHK_BREAST</span>
    </div>
    <div class="sku-btn" data-sku="CHK_LEG" data-name="น่องไก่สด">
      <span class="sku-name">🍗 น่องไก่</span>
      <span class="sku-code">CHK_LEG</span>
    </div>
    <div class="sku-btn" data-sku="CHK_HIP" data-name="สะโพกไก่">
      <span class="sku-name">🍗 สะโพก</span>
      <span class="sku-code">CHK_HIP</span>
    </div>
    <div class="sku-btn" data-sku="CHK_WING" data-name="ปีกไก่">
      <span class="sku-name">🍗 ปีกไก่</span>
      <span class="sku-code">CHK_WING</span>
    </div>
    <div class="sku-btn" data-sku="PRK_BELLY" data-name="หมูสามชั้น">
      <span class="sku-name">🥩 สามชั้น</span>
      <span class="sku-code">PRK_BELLY</span>
    </div>
    <div class="sku-btn" data-sku="PRK_NECK" data-name="คอหมูสด">
      <span class="sku-name">🥩 คอหมู</span>
      <span class="sku-code">PRK_NECK</span>
    </div>
  </div>

  <div class="section-title">2. เลือกขนาดถุงโรงงาน:</div>
  <div class="grid-weight" id="weightGrid">
    <div class="weight-btn selected" data-weight="10">ถุง 10 กก.</div>
    <div class="weight-btn" data-weight="5">ถุง 5 กก.</div>
  </div>

  <button class="action-btn" id="btnBreakBulk">
    ✂️ ยืนยันฉีกถุงลงกระบะปลีก
  </button>

  <div class="history-card">
    <div class="history-title">ประวัติการฉีกถุงล่าสุด (เซสชันนี้):</div>
    <div class="history-list" id="historyList">
      <div style="color: #64748b; font-size: 12px;">ยังไม่มีรายการในรอบนี้</div>
    </div>
  </div>

  <script>
    const LIFF_ID = "${liffId}";
    let selectedSku = "CHK_BREAST";
    let selectedSkuName = "อกไก่สด";
    let selectedWeight = 10;
    const historyData = [];

    // Web Audio API เล่นเสียง Beep 880Hz
    function playBeep880Hz() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz (A5 Note)
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch (e) {
        console.warn("Audio Context error:", e);
      }
    }

    // จัดการเลือก SKU
    document.querySelectorAll('.sku-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sku-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedSku = btn.getAttribute('data-sku');
        selectedSkuName = btn.getAttribute('data-name');
      });
    });

    // จัดการเลือกน้ำหนัก
    document.querySelectorAll('.weight-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.weight-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedWeight = parseInt(btn.getAttribute('data-weight'), 10);
      });
    });

    // เริ่มต้น LIFF
    async function initLiff() {
      if (LIFF_ID !== "xxx") {
        try {
          await liff.init({ liffId: LIFF_ID });
        } catch (e) {
          console.error("LIFF Init error:", e);
        }
      }
    }
    initLiff();

    // กดปุ่มยืนยันฉีกถุง
    document.getElementById('btnBreakBulk').addEventListener('click', async () => {
      const btn = document.getElementById('btnBreakBulk');
      btn.disabled = true;

      // 1. ส่งเสียง Beep 880Hz ทันที
      playBeep880Hz();

      // 2. คำสั่งข้อความสัญลักษณ์ (CMD-BB-SKU-KG)
      const commandText = "CMD-BB-" + selectedSku + "-" + selectedWeight;
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      try {
        // ยิงเข้า API Worker บันทึกลง D1 ทันที
        await fetch('/api/breakbulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku: selectedSku, weightKg: selectedWeight })
        });

        // ส่งข้อความเข้าแชต LINE ถ้าเปิดในแอป
        if (typeof liff !== 'undefined' && liff.isInClient()) {
          await liff.sendMessages([{
            type: 'text',
            text: commandText
          }]).catch(console.error);
        }

        // อัปเดตประวัติหน้าจอ
        historyData.unshift({
          text: selectedSkuName + " (" + selectedSku + ") ขนาด " + selectedWeight + " กก.",
          time: timeStr
        });
        renderHistory();
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
      } finally {
        setTimeout(() => { btn.disabled = false; }, 300);
      }
    });

    function renderHistory() {
      const list = document.getElementById('historyList');
      if (historyData.length === 0) return;
      list.innerHTML = historyData.slice(0, 5).map(item =>
        '<div class="history-item">' +
          '<span>✂️ ' + item.text + '</span>' +
          '<span style="color:#94a3b8; font-size:11px;">' + item.time + '</span>' +
        '</div>'
      ).join('');
    }
  </script>
</body>
</html>`;
}
