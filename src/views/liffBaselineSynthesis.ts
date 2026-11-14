export function renderBaselineSynthesisHtml(): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CSS Flexbox Baseline Synthesis Lab - Saijai 99</title>
  <link rel="help" href="https://drafts.csswg.org/css-align-3/#synthesize-baseline">
  <style>
    :root {
      --primary: #ea580c;
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --pass: #22c55e;
      --fail: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 16px; min-height: 100vh; line-height: 1.5; }
    .container { max-width: 680px; margin: 0 auto; }

    header { text-align: center; margin-bottom: 20px; }
    h1 { font-size: 22px; color: #fb923c; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: var(--text-muted); }

    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 16px; }
    .card-title { font-size: 15px; font-weight: 700; color: #fdba74; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .badge { font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
    .badge-wpt { background: #0369a1; color: #e0f2fe; }

    /* Test 1: Exact WPT baseline-synthesis-001 */
    .wpt-stage {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
      border: 2px dashed #475569;
      border-radius: 10px;
      padding: 24px;
      position: relative;
    }
    .wpt-container {
      display: flex;
      writing-mode: vertical-rl;
      align-items: baseline;
      text-orientation: mixed;
      border: 1px solid #15803d;
    }
    .wpt-item-1 {
      background: #22c55e;
      line-height: 100px;
      height: 50px;
      color: transparent;
      user-select: none;
    }
    .wpt-item-2 {
      background: #22c55e;
      width: 100px;
      height: 50px;
    }

    /* Test 2: Thai Typography Baseline Synthesis */
    .thai-stage {
      background: #182234;
      border-radius: 10px;
      padding: 16px;
      margin-top: 10px;
      position: relative;
    }
    .thai-flex-box {
      display: flex;
      background: #0b1120;
      border: 1px solid #38bdf8;
      border-radius: 8px;
      padding: 12px 16px;
      position: relative;
      transition: all 0.2s ease;
    }
    .baseline-guide {
      position: absolute;
      left: 0; right: 0;
      border-bottom: 1.5px dashed #f43f5e;
      pointer-events: none;
      opacity: 0.8;
      z-index: 10;
    }
    .thai-text {
      font-size: 18px;
      color: #f8fafc;
      flex: 1;
      position: relative;
    }
    .thai-price {
      font-size: 26px;
      font-weight: 800;
      color: #fb923c;
      position: relative;
    }

    /* Controls */
    .control-row {
      display: flex;
      gap: 10px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .btn-toggle {
      background: #334155;
      border: 1px solid #475569;
      color: var(--text);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-toggle.active {
      background: var(--primary);
      border-color: #f97316;
      color: white;
    }

    /* Metric result table */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    .metric-box {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
    }
    .metric-label { font-size: 11px; color: var(--text-muted); }
    .metric-val { font-size: 14px; font-weight: 700; color: #38bdf8; margin-top: 2px; }

    pre {
      background: #0b1120;
      padding: 12px;
      border-radius: 8px;
      font-size: 11.5px;
      color: #94a3b8;
      overflow-x: auto;
      border: 1px solid #1e293b;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🧪 Baseline Synthesis & Flexbox Inspector</h1>
      <p class="subtitle">W3C WPT (baseline-synthesis-001) x Saijai 99 Typography Engine</p>
    </header>

    <!-- CARD 1: Exact WPT Test -->
    <div class="card">
      <div class="card-title">
        <span>1. มาตรฐาน WPT: baseline-synthesis-001.html</span>
        <span class="badge badge-wpt">W3C CSS Spec</span>
      </div>
      <p style="font-size: 12.5px; color: #94a3b8; margin-bottom: 12px;">
        เกณฑ์ผ่านการทดสอบ: หากเบราว์เซอร์คำนวณ Baseline Synthesis ถูกต้อง จะต้องแสดงผลเป็น <strong>สี่เหลี่ยมสีเขียวขนาด 100x100px พอดีเป๊ะ</strong> (ไม่มีช่องว่างหรือขอบแหว่ง)
      </p>

      <div class="wpt-stage">
        <div class="wpt-container" id="wptTarget">
          <div class="wpt-item-1">text</div>
          <div class="wpt-item-2"></div>
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-label">ขนาดที่เรนเดอร์ได้จริง (W x H)</div>
          <div class="metric-val" id="wptDimensions">กำลังคำนวณ...</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">ผลการทดสอบ (WPT Compliance)</div>
          <div class="metric-val" id="wptResult">กำลังตรวจเช็ค...</div>
        </div>
      </div>
    </div>

    <!-- CARD 2: Thai Typography Baseline in Saijai 99 -->
    <div class="card">
      <div class="card-title">
        <span>2. การจัดระนาบฟอนต์ภาษาไทย (Saijai 99 Store Receipt)</span>
        <span class="badge" style="background:#ea580c; color:#fff;">Live Simulator</span>
      </div>
      <p style="font-size: 12.5px; color: #94a3b8;">
        จำลองการจัดแถวรายการสั่งซื้อ (สินค้า + ราคา) เมื่อใช้ <code>align-items: baseline</code> เทียบกับ <code>center</code>
      </p>

      <div class="control-row">
        <button class="btn-toggle active" onclick="setAlign('baseline')">align-items: baseline</button>
        <button class="btn-toggle" onclick="setAlign('center')">align-items: center</button>
        <button class="btn-toggle" onclick="setAlign('flex-start')">align-items: flex-start</button>
        <button class="btn-toggle" onclick="toggleGuide()">เส้นไกด์ Baseline (เปิด/ปิด)</button>
      </div>

      <div class="thai-stage">
        <div class="thai-flex-box" id="thaiBox" style="align-items: baseline;">
          <div class="baseline-guide" id="guideLine"></div>
          <div class="thai-text" id="sampleText">🍗 น่องไก่ติดสะโพก (ถุง 10 กก.)</div>
          <div class="thai-price" id="samplePrice">฿650</div>
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-label">Baseline Offset ของชื่อสินค้า</div>
          <div class="metric-val" id="textOffset">-- px</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Baseline Offset ของราคา</div>
          <div class="metric-val" id="priceOffset">-- px</div>
        </div>
      </div>

      <pre><code id="cssCodeSnippet">/* การตั้งค่า CSS ปัจจุบัน */
display: flex;
align-items: baseline;</code></pre>
    </div>

    <!-- CARD 3: LINE Flex Message Recommendation -->
    <div class="card">
      <div class="card-title">
        <span>3. การประยุกต์ใช้ใน LINE Flex Message</span>
      </div>
      <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
        💡 <strong>คำแนะนำเชิงเทคนิคสำหรับร้านสายใจ 99:</strong><br>
        * ใน LINE Messaging API แนะนำให้ใช้ <code>alignItems: "baseline"</code> สำหรับแถวสรุปยอดเงินและราคาสินค้า เพื่อให้เส้นฐานของตัวหนังสือไทย (เช่น สระ อา, น่อง) วางระนาบเดียวกันกับสัญลักษณ์ <code>฿</code> เสมอ<br>
        * สำหรับปุ่มกดหน้าร้าน (LIFF One-Touch) แนะนำให้ใช้ <code>align-items: center</code> คู่กับ <code>justify-content: center</code> เพื่อการกดที่แม่นยำทุกอุปกรณ์
      </p>
    </div>
  </div>

  <script>
    // 1. ตรวจสอบผล WPT baseline-synthesis-001
    function evaluateWpt() {
      const el = document.getElementById('wptTarget');
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      document.getElementById('wptDimensions').textContent = w + 'px x ' + h + 'px';

      const res = document.getElementById('wptResult');
      if (w === 100 && h === 100) {
        res.textContent = '✅ PASS (100x100px)';
        res.style.color = '#22c55e';
      } else {
        res.textContent = '⚠️ Synthesized: ' + w + 'x' + h + 'px';
        res.style.color = '#f59e0b';
      }
    }
    window.addEventListener('load', evaluateWpt);

    // 2. ควบคุม Thai Typography Baseline
    let showGuide = true;
    function setAlign(val) {
      document.querySelectorAll('.control-row .btn-toggle').forEach(b => {
        if (b.textContent.includes(val)) b.classList.add('active');
        else if (!b.textContent.includes('ไกด์')) b.classList.remove('active');
      });
      const box = document.getElementById('thaiBox');
      box.style.alignItems = val;
      document.getElementById('cssCodeSnippet').textContent =
        '/* การตั้งค่า CSS ปัจจุบัน */\\n' +
        'display: flex;\\n' +
        'align-items: ' + val + ';';
      updateOffsets();
    }

    function toggleGuide() {
      showGuide = !showGuide;
      document.getElementById('guideLine').style.display = showGuide ? 'block' : 'none';
    }

    function updateOffsets() {
      const box = document.getElementById('thaiBox');
      const text = document.getElementById('sampleText');
      const price = document.getElementById('samplePrice');
      const guide = document.getElementById('guideLine');

      const boxRect = box.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      const priceRect = price.getBoundingClientRect();

      document.getElementById('textOffset').textContent = Math.round(textRect.top - boxRect.top) + ' px จากขอบบน';
      document.getElementById('priceOffset').textContent = Math.round(priceRect.top - boxRect.top) + ' px จากขอบบน';

      // วางเส้นไกด์ไว้ที่ขอบล่างของตัวอักษร
      const baselineY = Math.max(textRect.bottom, priceRect.bottom) - boxRect.top - 6;
      guide.style.top = baselineY + 'px';
    }

    window.addEventListener('resize', updateOffsets);
    setTimeout(updateOffsets, 100);
  </script>
</body>
</html>`;
}
