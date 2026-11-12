/**
 * กฎเหล็ก HR ร้าน Saijai99:
 * 1. แบ่งเป็น DAY_SHIFT (กะกลางวัน) และ NIGHT_SHIFT (กะกลางคืน) แบบคงที่ ห้ามสลับกะเอง
 * 2. กะกลางคืนเริ่มงาน 22:00 น. หากสแกนเข้างานตั้งแต่ 19:30 น. เป็นต้นไป (19:30 - 22:00) ถือเป็นโอที (Pre-Shift OT)
 */
export interface AttendanceResult {
  empId: string;
  assignedShift: "DAY_SHIFT" | "NIGHT_SHIFT";
  scanTimeStr: string; // รูปแบบ "HH:mm" เช่น "19:30"
  status: "VALID" | "REJECTED_WRONG_SHIFT";
  preShiftOtHours: number;
  note: string;
}

export function evaluateEmployeeCheckIn(
  empId: string,
  assignedShift: "DAY_SHIFT" | "NIGHT_SHIFT",
  scanDate: Date,
): AttendanceResult {
  // แปลงเวลาเป็นโซนประเทศไทย (UTC+7)
  const thTime = new Date(scanDate.getTime() + 7 * 60 * 60 * 1000);
  const hours = thTime.getUTCHours();
  const minutes = thTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  const scanTimeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  // กรณีพนักงานกะกลางคืน (เริ่มงานปกติ 22:00 น. = 1320 นาที)
  if (assignedShift === "NIGHT_SHIFT") {
    const otStartMin = 19 * 60 + 30; // 19:30 น. = 1170 นาที
    const shiftStartMin = 22 * 60;   // 22:00 น. = 1320 นาที

    // ป้องกันการแอบสแกนผิดกะในช่วงกลางวัน (เช่น มาสแกนตอน 07:00 - 19:29 น. โดยไม่มีคำสั่งโยกย้าย)
    if (totalMinutes >= 7 * 60 && totalMinutes < otStartMin) {
      return {
        empId,
        assignedShift,
        scanTimeStr,
        status: "REJECTED_WRONG_SHIFT",
        preShiftOtHours: 0,
        note: "❌ ไม่สามารถสแกนได้: คุณอยู่กะกลางคืน (ห้ามสลับกะเองยกเว้นมีคำสั่งโยกย้าย)",
      };
    }

    // สแกนเข้างานช่วง 19:30 น. - 22:00 น. -> คิดเป็น Pre-Shift OT ทันที
    if (totalMinutes >= otStartMin && totalMinutes < shiftStartMin) {
      const otMinutes = shiftStartMin - totalMinutes;
      const otHours = Number((otMinutes / 60).toFixed(2));
      return {
        empId,
        assignedShift,
        scanTimeStr,
        status: "VALID",
        preShiftOtHours: otHours,
        note: `✅ บันทึกเข้างานกะกลางคืน + คิดโอทีล่วงหน้า (Pre-Shift OT) ${otHours} ชม. (สแกนเวลา ${scanTimeStr} น.)`,
      };
    }

    // สแกนเข้างานปกติหลัง 22:00 น.
    return {
      empId,
      assignedShift,
      scanTimeStr,
      status: "VALID",
      preShiftOtHours: 0,
      note: "✅ บันทึกเข้างานกะกลางคืนปกติ (เริ่มงาน 22:00 น.)",
    };
  }

  // กรณีพนักงานกะกลางวัน (เริ่มงานปกติ 08:00 น.)
  if (totalMinutes >= 19 * 60 || totalMinutes < 5 * 60) {
    return {
      empId,
      assignedShift,
      scanTimeStr,
      status: "REJECTED_WRONG_SHIFT",
      preShiftOtHours: 0,
      note: "❌ ไม่สามารถสแกนได้: คุณอยู่กะกลางวัน (ห้ามสลับกะเองยกเว้นมีคำสั่งโยกย้าย)",
    };
  }

  return {
    empId,
    assignedShift,
    scanTimeStr,
    status: "VALID",
    preShiftOtHours: 0,
    note: "✅ บันทึกเข้างานกะกลางวันสำเร็จ",
  };
}
