
// This service handles Google Drive API interactions directly from the browser.
// Note: In a production app, you should proxy these requests through a backend to keep secrets safe,
// but for this client-side demo, we'll do it directly.

const API_KEY = 'AIzaSyDF7GKF4zfqvxbDBa2dL46ItOFi6-_yTrQ'; // TODO: User needs to replace this
const CLIENT_ID = '129326930184-rkaqren7dsfhamkh96moek1tcd5mfe13.apps.googleusercontent.com'; // TODO: User needs to replace this
const FOLDER_ID = '1CV0gGZaggVN9l-_X5aXo_bS2a5zEx19J'; // Specific folder for uploads

// Scope for full Drive access (needed to upload and set permissions)
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const initGoogleDriveAuth = (callback: (token: string, expiresIn: number) => void) => {
  // @ts-ignore
  const client = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.access_token) {
        callback(response.access_token, response.expires_in);
      }
    },
  });
  return client;
};

export const uploadFileToDrive = async (file: File, accessToken: string) => {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [FOLDER_ID]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  // 1. Upload the file
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to Google Drive');
  }

  const data = await response.json();
  const fileId = data.id;

  // 2. Make the file public so it can be viewed by anyone
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  // 3. Return the viewable URL
  // Using lh3.googleusercontent.com which is more reliable for direct embedding than drive.google.com/uc
  return `https://lh3.googleusercontent.com/d/${fileId}`;
};
