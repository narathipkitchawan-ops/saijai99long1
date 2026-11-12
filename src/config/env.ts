export interface Env {
  APP_ENV?: string;

  // Cloudflare Bindings
  SAIJAI_KV: KVNamespace;
  SAIJAI_DB: D1Database;

  // API Keys & Secrets (แทนที่ด้วย xxx ในตั้งค่า)
  LINE_CHANNEL_ACCESS_TOKEN: string;    // "xxx"
  LINE_CHANNEL_SECRET: string;          // "xxx"
  LIFF_ID_ATTENDANCE?: string;          // "xxx"
  LIFF_ID_BREAK_BULK?: string;          // "xxx"
  GEMINI_API_KEY: string;               // "xxx"
  EASYSLIP_API_KEY?: string;            // "xxx"
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string; // "xxx"
  GOOGLE_PRIVATE_KEY: string;           // "xxx"
  GOOGLE_TTS_API_KEY?: string;          // "xxx"
  HR_ADMIN_PASSCODE?: string;

  // Google Sheets & Drive Folder IDs
  GOOGLE_SPREADSHEET_ID: string;          // "xxx"
  DRIVE_ROOT_SLIPS_FOLDER_ID: string;     // "xxx"
  DRIVE_ROOT_LIVESTOCK_FOLDER_ID: string; // "xxx"
  DRIVE_ROOT_VENDORS_FOLDER_ID: string;   // "xxx"
  DRIVE_ROOT_HR_CORP_FOLDER_ID: string;   // "xxx"

  // Store Config
  HQ_LATITUDE: string;
  HQ_LONGITUDE: string;
  PROMPTPAY_ID: string; // "xxx"
}
