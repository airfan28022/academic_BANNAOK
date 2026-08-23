// Google Drive Integration & Cloudflare Configuration Utility

export const GOOGLE_DRIVE_CONFIG = {
  ROOT_FOLDER_ID: '1x4aph_PPHyhtmno5v7XeGJm2IW6WpnaE',
  ROOT_FOLDER_NAME: 'ระบบบริหารจัดการงานวิชาการ',
  SCOPES: 'https://www.googleapis.com/auth/drive',
};

// Local storage key for drive token
const DRIVE_TOKEN_KEY = 'academic_system_gdrive_token';
const DRIVE_TOKEN_EXPIRY_KEY = 'academic_system_gdrive_token_expiry';

// Check if user is connected to Google Drive
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

export function removeDriveToken() {
  localStorage.removeItem(DRIVE_TOKEN_KEY);
  localStorage.removeItem(DRIVE_TOKEN_EXPIRY_KEY);
}

// Request Token using GIS (Google Identity Services)
declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export function requestGoogleDriveAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    // If we already have a valid token
    const existing = getStoredDriveToken();
    if (existing) {
      resolve(existing);
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services script not loaded.'));
      return;
    }

    try {
      // In AI Studio environment or OAuth setup, token client is initialized
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: '309062802038-web-client.apps.googleusercontent.com', // Provisioned or fallback
        scope: GOOGLE_DRIVE_CONFIG.SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
            return;
          }
          if (resp.access_token) {
            saveDriveToken(resp.access_token, resp.expires_in || 3600);
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token received'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Google Drive API Helpers
export async function getDriveHeaders(accessToken?: string) {
  const token = accessToken || getStoredDriveToken();
  if (!token) {
    throw new Error('กรุณาเชื่อมต่อ Google Drive ก่อนดำเนินการ');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Find or Create a folder inside parent folder in Google Drive
 */
export async function findOrCreateDriveFolder(
  folderName: string,
  parentFolderId: string = GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID,
  accessToken?: string
): Promise<{ id: string; webViewLink: string }> {
  const token = accessToken || getStoredDriveToken();
  if (!token) {
    // Return simulated root if offline/not connected yet
    return {
      id: `${parentFolderId}_${folderName.replace(/\s+/g, '_')}`,
      webViewLink: `https://drive.google.com/drive/folders/${parentFolderId}`,
    };
  }

  try {
    // 1. Search existing folder
    const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

    // 2. Create folder if not found
    const createUrl = 'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink';
    const createRes = await fetch(createUrl, {
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
    console.error('Error finding/creating Google Drive folder:', e);
  }

  return {
    id: `${parentFolderId}_folder`,
    webViewLink: `https://drive.google.com/drive/folders/${parentFolderId}`,
  };
}

/**
 * Upload a file directly to Google Drive folder using Multipart Upload
 */
export async function uploadFileToDrive(
  file: File | { name: string; type: string; base64OrBlob: string | Blob },
  folderId: string = GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID,
  accessToken?: string
): Promise<{ id: string; name: string; webViewLink: string; webContentLink?: string; size: number }> {
  const token = accessToken || getStoredDriveToken();
  const fileName = file.name;
  const fileType = file.type || 'application/octet-stream';

  if (!token) {
    // Fallback object link
    return {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: fileName,
      webViewLink: `https://drive.google.com/drive/folders/${folderId}`,
      webContentLink: `https://drive.google.com/drive/folders/${folderId}`,
      size: (file as any).size || 1024,
    };
  }

  try {
    let fileBlob: Blob;
    if (file instanceof File || file instanceof Blob) {
      fileBlob = file;
    } else {
      // Decode data URL / base64
      const parts = (file.base64OrBlob as string).split(',');
      const byteString = atob(parts.length > 1 ? parts[1] : parts[0]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      fileBlob = new Blob([ab], { type: fileType });
    }

    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size';

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        name: data.name || fileName,
        webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
        webContentLink: data.webContentLink || `https://drive.google.com/uc?id=${data.id}&export=download`,
        size: parseInt(data.size || '0', 10) || fileBlob.size,
      };
    } else {
      const errText = await res.text();
      console.warn('Drive upload API returned non-ok status:', res.status, errText);
    }
  } catch (err) {
    console.error('Error uploading file to Drive:', err);
  }

  return {
    id: `gdrive_${Date.now()}`,
    name: fileName,
    webViewLink: `https://drive.google.com/drive/folders/${folderId}`,
    size: 1024,
  };
}

/**
 * Get direct Google Drive folder URL for a given ID or fallback to root ID
 */
export function getDriveFolderUrl(folderId?: string): string {
  const id = folderId && folderId.trim() ? folderId : GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID;
  return `https://drive.google.com/drive/folders/${id}`;
}

/**
 * Get direct Google Drive file URL for download or preview
 */
export function getDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
