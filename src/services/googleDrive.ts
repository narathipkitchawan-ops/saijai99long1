import { Env } from "../config/env";
import { VENDOR_FOLDERS } from "./geminiAi";

/**
 * ค้นหาหรือสร้างโฟลเดอร์อัตโนมัติบน Google Drive
 */
export async function getOrCreateFolder(
  folderName: string,
  parentId: string,
  accessToken: string,
): Promise<string> {
  const escapedName = folderName.replace(/'/g, "\\'");
  const q = `mimeType='application/vnd.google-apps.folder' and name='${escapedName}' and '${parentId}' in parents and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as { files?: Array<{ id: string; name: string }> };

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // หากยังไม่มีโฟลเดอร์ ให้สร้างใหม่ทันที
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  const created = (await createRes.json()) as { id: string };
  return created.id;
}

/**
 * จัดเส้นทางโฟลเดอร์อัตโนมัติสำหรับ:
 * 1) สลิปโอนเงิน (ปี -> เดือน -> วัน)
 * 2) เอกสารปศุสัตว์ (ปี -> เดือน)
 * 3) บิลค่าสินค้าแยก 10 บริษัท (ชื่อบริษัท -> ปี -> เดือน)
 */
export async function resolveArchiveFolderId(
  archiveType: "SLIP" | "LIVESTOCK" | "VENDOR_BILL",
  dateStr: string, // "YYYY-MM-DD"
  vendorCode: string | undefined,
  accessToken: string,
  env: Env,
): Promise<string> {
  const [year, month, day] = dateStr.split("-");

  if (archiveType === "SLIP") {
    const rootId = env.DRIVE_ROOT_SLIPS_FOLDER_ID || "xxx";
    const yId = await getOrCreateFolder(year, rootId, accessToken);
    const mId = await getOrCreateFolder(`${month}`, yId, accessToken);
    return await getOrCreateFolder(`${day}`, mId, accessToken);
  }

  if (archiveType === "LIVESTOCK") {
    const rootId = env.DRIVE_ROOT_LIVESTOCK_FOLDER_ID || "xxx";
    const yId = await getOrCreateFolder(year, rootId, accessToken);
    return await getOrCreateFolder(`${month}`, yId, accessToken);
  }

  // กรณีบิลค่าสินค้า 10 บริษัทคู่ค้า
  const rootId = env.DRIVE_ROOT_VENDORS_FOLDER_ID || "xxx";
  const companyFolderName = VENDOR_FOLDERS[vendorCode || "OTHER"] || VENDOR_FOLDERS.OTHER;
  const vendorFolderId = await getOrCreateFolder(companyFolderName, rootId, accessToken);
  const yId = await getOrCreateFolder(year, vendorFolderId, accessToken);
  return await getOrCreateFolder(`${month}`, yId, accessToken);
}
