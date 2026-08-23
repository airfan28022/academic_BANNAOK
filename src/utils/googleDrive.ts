// Google Drive Integration & Google Apps Script (GAS) Bridge Utility
import { compressImage } from './storage';

export const GOOGLE_DRIVE_CONFIG = {
  ROOT_FOLDER_ID: '1x4aph_PPHyhtmno5v7XeGJm2IW6WpnaE',
  ROOT_FOLDER_NAME: 'ระบบบริหารจัดการงานวิชาการ',
  SCOPES: 'https://www.googleapis.com/auth/drive',
};

// Storage Keys
const GAS_SCRIPT_URL_KEY = 'academic_system_gas_script_url';
const DRIVE_TOKEN_KEY = 'academic_system_gdrive_token';
const DRIVE_TOKEN_EXPIRY_KEY = 'academic_system_gdrive_token_expiry';

// Default Google Apps Script URL deployed by user
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycby93xSKaPMlPV4VaazjSaTRcTkU9y4P-pxqSWJErha1gnj3K2btIcgHcDxehxXkRB933w/exec';

// Default / fallback GAS URL (can be set by user in Settings)
export function getStoredScriptUrl(): string {
  return localStorage.getItem(GAS_SCRIPT_URL_KEY) || DEFAULT_GAS_URL;
}

export function saveScriptUrl(url: string) {
  localStorage.setItem(GAS_SCRIPT_URL_KEY, url.trim());
}

export function removeScriptUrl() {
  localStorage.removeItem(GAS_SCRIPT_URL_KEY);
}

// Token management (if using OAuth direct)
export function getStoredDriveToken(): string | null {
  const token = localStorage.getItem(DRIVE_TOKEN_KEY);
  const expiry = localStorage.getItem(DRIVE_TOKEN_EXPIRY_KEY);
  if (!token) return null;
  if (expiry && parseInt(expiry, 10) < Date.now()) {
    localStorage.removeItem(DRIVE_TOKEN_KEY);
    localStorage.removeItem(DRIVE_TOKEN_EXPIRY_KEY);
    return null;
  }
  return token;
}

export function saveDriveToken(token: string, expiresInSeconds: number = 3600) {
  localStorage.setItem(DRIVE_TOKEN_KEY, token);
  localStorage.setItem(DRIVE_TOKEN_EXPIRY_KEY, String(Date.now() + (expiresInSeconds - 60) * 1000));
}

/**
 * Find or Create a folder inside parent folder in Google Drive via GAS or Drive API
 */
export async function findOrCreateDriveFolder(
  folderName: string,
  parentFolderId: string = GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID
): Promise<{ id: string; webViewLink: string }> {
  const scriptUrl = getStoredScriptUrl();

  // 1. If Google Apps Script Web App is configured, use it (zero login required)
  if (scriptUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s fast timeout

      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'createFolder',
          folderName,
          parentFolderId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.id) {
          return {
            id: data.id,
            webViewLink: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`,
          };
        }
      }
    } catch (e) {
      console.warn('GAS Folder creation failed or timed out, falling back:', e);
    }
  }

  // 2. Direct API via Token if available
  const token = getStoredDriveToken();
  if (token) {
    try {
      const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed=false`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

      const res = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          return {
            id: data.files[0].id,
            webViewLink: data.files[0].webViewLink || `https://drive.google.com/drive/folders/${data.files[0].id}`,
          };
        }
      }

      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        return {
          id: created.id,
          webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`,
        };
      }
    } catch (e) {
      console.warn('OAuth folder creation failed:', e);
    }
  }

  // Fallback link directly to root folder
  return {
    id: `${parentFolderId}_${folderName.replace(/\s+/g, '_')}`,
    webViewLink: `https://drive.google.com/drive/folders/${parentFolderId}`,
  };
}

/**
 * Upload a file directly to Google Drive via Google Apps Script (Recommended) or Drive API
 */
export async function uploadFileToDrive(
  file: File | { name: string; type: string; base64OrBlob: string | Blob; size?: number },
  folderId: string = GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID
): Promise<{ id: string; name: string; webViewLink: string; webContentLink?: string; size: number }> {
  const fileName = file.name;
  const fileType = file.type || 'application/octet-stream';
  const scriptUrl = getStoredScriptUrl();
  const validFolderId = (folderId && !folderId.includes('_') && folderId.length > 5)
    ? folderId
    : GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID;

  // Convert to base64 if needed
  let base64String = '';
  let fileSize = file.size || 1024;

  if (file instanceof File || file instanceof Blob) {
    // If it's an image and larger than 400KB, optimize/compress to make upload super fast
    if (file.type && file.type.startsWith('image/') && file.size > 400 * 1024) {
      try {
        const compressed = await compressImage(file as File, 1920, 1920, 0.85);
        if (compressed && compressed.length > 100) {
          base64String = compressed;
          fileSize = Math.round((compressed.length * 3) / 4);
        }
      } catch (err) {
        console.warn('Image optimization skipped:', err);
      }
    }

    if (!base64String) {
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      fileSize = file.size;
    }
  } else if (typeof file.base64OrBlob === 'string') {
    base64String = file.base64OrBlob;
  }

  // Method 1: Google Apps Script Web App (Most reliable for Google Drive upload into specific task folder)
  if (scriptUrl && base64String) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s fast timeout to prevent freezing

      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'uploadFile',
          fileName,
          fileBase64: base64String,
          mimeType: fileType,
          folderId: validFolderId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.id) {
          return {
            id: data.id,
            name: data.name || fileName,
            webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
            webContentLink: data.downloadUrl || `https://drive.google.com/uc?id=${data.id}&export=download`,
            size: data.size || fileSize,
          };
        }
      }
    } catch (err) {
      console.warn('Upload via Google Apps Script timed out/failed, using direct local link fallback:', err);
    }
  }

  // Method 2: Direct OAuth Token if user authenticated
  const token = getStoredDriveToken();
  if (token && base64String) {
    try {
      const parts = base64String.split(',');
      const byteString = atob(parts.length > 1 ? parts[1] : parts[0]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const fileBlob = new Blob([ab], { type: fileType });

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({ name: fileName, parents: [validFolderId] })], { type: 'application/json' }));
      form.append('file', fileBlob);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          name: data.name || fileName,
          webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
          webContentLink: data.webContentLink || `https://drive.google.com/uc?id=${data.id}&export=download`,
          size: parseInt(data.size || '0', 10) || fileSize,
        };
      }
    } catch (err) {
      console.warn('OAuth direct upload failed:', err);
    }
  }

  // Fallback: Local reference with direct Google Drive Folder Link
  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: fileName,
    webViewLink: `https://drive.google.com/drive/folders/${validFolderId}`,
    webContentLink: `https://drive.google.com/drive/folders/${validFolderId}`,
    size: fileSize,
  };
}

/**
 * Get direct Google Drive folder URL for a given ID or fallback to root ID
 */
export function getDriveFolderUrl(folderId?: string): string {
  const id = folderId && folderId.trim() && !folderId.includes('_') ? folderId : GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID;
  return `https://drive.google.com/drive/folders/${id}`;
}

/**
 * Get direct Google Drive file URL for download or preview
 */
export function getDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Template Code for Google Apps Script
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT: สะพานเชื่อมระบบงานวิชาการ -> Google Drive
 * โฟลเดอร์ปลายทาง: 1x4aph_PPHyhtmno5v7XeGJm2IW6WpnaE
 */

const ROOT_FOLDER_ID = "1x4aph_PPHyhtmno5v7XeGJm2IW6WpnaE";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // 1. สร้างหรือค้นหาโฟลเดอร์งานวิชาการ
    if (action === "createFolder") {
      const folderName = data.folderName || "งานวิชาการ";
      const parentId = data.parentFolderId || ROOT_FOLDER_ID;
      const parentFolder = DriveApp.getFolderById(parentId);
      
      const existing = parentFolder.getFoldersByName(folderName);
      if (existing.hasNext()) {
        const f = existing.next();
        return jsonResponse({ status: "success", id: f.getId(), webViewLink: f.getUrl() });
      }
      
      const newFolder = parentFolder.createFolder(folderName);
      newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return jsonResponse({ status: "success", id: newFolder.getId(), webViewLink: newFolder.getUrl() });
    }

    // 2. อัปโหลดไฟล์ส่งงานเข้า Google Drive อัตโนมัติ
    if (action === "uploadFile") {
      const fileName = data.fileName || "เอกสาร";
      const mimeType = data.mimeType || "application/octet-stream";
      const base64Data = data.fileBase64.replace(/^data:.*?;base64,/, "");
      const folderId = (data.folderId && data.folderId.indexOf("1x4") === 0) ? data.folderId : ROOT_FOLDER_ID;

      const folder = DriveApp.getFolderById(folderId);
      const decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
      const file = folder.createFile(decodedBlob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return jsonResponse({
        status: "success",
        id: file.getId(),
        name: file.getName(),
        webViewLink: file.getUrl(),
        downloadUrl: file.getDownloadUrl(),
        size: file.getSize()
      });
    }

    return jsonResponse({ status: "error", message: "ไม่พบ Action ที่ระบุ" });
  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

function doGet(e) {
  return jsonResponse({
    status: "success",
    message: "ระบบเชื่อมต่อ Google Drive พร้อมทำงาน!",
    rootFolderId: ROOT_FOLDER_ID
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
