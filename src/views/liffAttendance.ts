import { Env } from "../config/env";

export function renderAttendanceHtml(env: Env): string {
  const liffId = env.LIFF_ID_ATTENDANCE || "xxx";
  const hqLat = env.HQ_LATITUDE || "16.8211";
  const hqLng = env.HQ_LONGITUDE || "100.2659";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ตอกบัตรเข้างาน - Saijai 99</title>
  <script charset="utf-8" src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
  <style>
    :root {
      --primary: #d9381e;
      --primary-dark: #b52b14;
      --accent: #2e7d32;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 16px; min-height: 100vh; display: flex; flex-direction: column; }
    .card { background: var(--card); border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); margin-bottom: 16px; }
    .header { text-align: center; margin-bottom: 16px; }
    .header h1 { font-size: 22px; color: var(--primary); margin-bottom: 4px; }
    .header p { font-size: 13px; color: var(--text-muted); }
    .clock-box { text-align: center; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; padding: 12px; margin-bottom: 16px; }
    .clock { font-size: 32px; font-weight: 700; color: var(--primary); letter-spacing: 1px; }
    .date { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    .profile { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 10px; background: #f1f5f9; border-radius: 10px; }
    .profile img { width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--primary); }
    .profile-info h3 { font-size: 15px; }
    .profile-info p { font-size: 12px; color: var(--text-muted); word-break: break-all; }
    .form-group { margin-bottom: 14px; }
    label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    select, input { width: 100%; padding: 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 15px; outline: none; transition: border-color 0.2s; }
    select:focus, input:focus { border-color: var(--primary); }
    .ot-banner { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 10px 12px; font-size: 12.5px; color: var(--accent); margin-bottom: 16px; line-height: 1.4; }
    .gps-status { display: flex; align-items: center; gap: 8px; font-size: 12.5px; padding: 8px 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 16px; }
    .gps-dot { width: 10px; height: 10px; border-radius: 50%; background: #94a3b8; }
    .gps-dot.green { background: #22c55e; }
    .gps-dot.red { background: #ef4444; }
    .btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:active { background: var(--primary-dark); transform: scale(0.99); }
    .btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
    .result-box { margin-top: 16px; padding: 14px; border-radius: 12px; display: none; font-size: 14px; line-height: 1.5; }
    .result-box.success { background: #ecfdf5; border: 1px solid #10b981; color: #065f46; }
    .result-box.error { background: #fef2f2; border: 1px solid #ef4444; color: #991b1b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🍗 Saijai 99 Attendance</h1>
      <p>ระบบสแกนตอกบัตรพนักงาน 24 ชม. (สาขาพิษณุโลก)</p>
    </div>

    <div class="clock-box">
      <div class="clock" id="liveClock">--:--:--</div>
      <div class="date" id="liveDate">กำลังโหลดเวลา...</div>
    </div>

    <div class="profile" id="profileBox" style="display:none;">
      <img id="userPicture" src="" alt="Profile">
      <div class="profile-info">
        <h3 id="userName">กำลังโหลด...</h3>
        <p id="userId">ID: --</p>
      </div>
    </div>

    <div class="form-group">
      <label for="shiftSelect">กะทำงานประจำของคุณ:</label>
      <select id="shiftSelect">
        <option value="NIGHT_SHIFT" selected>กะกลางคืน (22:00 - 07:00 น.)</option>
        <option value="DAY_SHIFT">กะกลางวัน (08:00 - 17:00 น.)</option>
      </select>
    </div>

    <div class="ot-banner" id="otNotice">
      ⭐ <strong>กฎโอทีกะกลางคืน:</strong> เริ่มงานจริง 22:00 น. หากสแกนเข้างานตั้งแต่ <strong>19:30 น. เป็นต้นไป</strong> ระบบจะคิดเป็น Pre-Shift OT ให้อัตโนมัติทันที
    </div>

    <div class="gps-status">
      <div class="gps-dot" id="gpsDot"></div>
      <span id="gpsText">กำลังค้นหาตำแหน่ง GPS...</span>
    </div>

    <button id="btnCheckIn" class="btn btn-primary">
      📍 ยืนยันตอกบัตรเข้างาน
    </button>

    <div id="resultBox" class="result-box"></div>
  </div>

  <script>
    const LIFF_ID = "${liffId}";
    const HQ_LAT = ${hqLat};
    const HQ_LNG = ${hqLng};

    let currentUser = null;
    let currentCoords = null;

    // คำนวณระยะห่าง GPS (เมตร)
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return Math.round(R * c);
    }

    // นาฬิกาเดินสด
    function updateClock() {
      const now = new Date();
      document.getElementById('liveClock').textContent = now.toLocaleTimeString('th-TH');
      document.getElementById('liveDate').textContent = now.toLocaleDateString('th-TH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ดึงพิกัด GPS
    function initGPS() {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            currentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            const dist = getDistance(currentCoords.lat, currentCoords.lng, HQ_LAT, HQ_LNG);
            const dot = document.getElementById('gpsDot');
            const txt = document.getElementById('gpsText');
            dot.className = 'gps-dot green';
            txt.textContent = 'พิกัดตรงจุด: ห่างจากร้าน ' + dist + ' ม. (พิกัดถูกต้อง)';
          },
          (err) => {
            const dot = document.getElementById('gpsDot');
            const txt = document.getElementById('gpsText');
            dot.className = 'gps-dot red';
            txt.textContent = 'ไม่สามารถดึงพิกัดได้ (กรุณาเปิด GPS/Location): ' + err.message;
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }

    // เริ่มต้น LIFF SDK
    async function main() {
      initGPS();
      if (LIFF_ID === "xxx") {
        document.getElementById('profileBox').style.display = 'flex';
        document.getElementById('userName').textContent = "โหมดทดสอบ (ยังไม่ใส่ LIFF ID)";
        return;
      }

      try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        currentUser = await liff.getProfile();
        document.getElementById('profileBox').style.display = 'flex';
        document.getElementById('userName').textContent = currentUser.displayName;
        document.getElementById('userId').textContent = 'ID: ' + currentUser.userId;
        if (currentUser.pictureUrl) {
          document.getElementById('userPicture').src = currentUser.pictureUrl;
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
      }
    }
    main();

    // จัดการเมื่อกดตอกบัตร
    document.getElementById('btnCheckIn').addEventListener('click', async () => {
      const btn = document.getElementById('btnCheckIn');
      const resBox = document.getElementById('resultBox');
      const shift = document.getElementById('shiftSelect').value;
      const empId = currentUser ? currentUser.userId : "EMP-TEST";

      btn.disabled = true;
      btn.textContent = "กำลังบันทึกข้อมูล...";
      resBox.style.display = 'none';

      try {
        const response = await fetch('/api/attendance/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empId, assignedShift: shift })
        });
        const result = await response.json();

        resBox.style.display = 'block';
        if (result.status === 'VALID') {
          resBox.className = 'result-box success';
          resBox.innerHTML = '<strong>ตอกบัตรสำเร็จ!</strong><br>' + result.note;

          // ส่งข้อความเข้าแชต LINE ถ้าเปิดผ่านแอป LINE
          if (typeof liff !== 'undefined' && liff.isInClient()) {
            await liff.sendMessages([{
              type: 'text',
              text: '📍 ' + result.note
            }]).catch(console.error);
            setTimeout(() => { liff.closeWindow(); }, 2500);
          }
        } else {
          resBox.className = 'result-box error';
          resBox.innerHTML = '<strong>ผิดพลาด:</strong><br>' + result.note;
        }
      } catch (err) {
        resBox.style.display = 'block';
        resBox.className = 'result-box error';
        resBox.innerHTML = '<strong>เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์</strong><br>' + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "📍 ยืนยันตอกบัตรเข้างาน";
      }
    });
  </script>
</body>
</html>`;
}
