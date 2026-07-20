import { apiCall } from './client';
import {
  getCachedStructure,
  invalidateStructureCache,
  refreshStructureAfterMutation,
  setCachedStructure,
} from '../utils/structureCache';
import { parseStructure } from '../utils/files';

const structureRequests = new Map();
const statsRequests = new Map();
const recentResponses = new Map();
const REQUEST_REUSE_MS = 1000;

function getRecentResponse(key) {
  const entry = recentResponses.get(key);
  if (!entry || Date.now() - entry.savedAt > REQUEST_REUSE_MS) return null;
  return entry.value;
}

function setRecentResponse(key, value) {
  recentResponses.set(key, { savedAt: Date.now(), value });
  return value;
}

/* ==========================================================================
   Public Auth Endpoints
   ========================================================================== */

export function login({ username, password, email }) {
  const body = { password };
  if (email) body.email = email;
  else body.username = username;
  return apiCall('login/', { method: 'POST', body, isPublic: true });
}

export function createAccount({ username, password, email }) {
  const body = { username, password };
  if (email) body.email = email;
  return apiCall('createaccount/', { method: 'POST', body, isPublic: true });
}

export function forgotPassword({ email }) {
  return apiCall('forgot/', { method: 'POST', body: { email }, isPublic: true });
}

export function forgotCode({ email, otp }) {
  return apiCall('forgot/code/', {
    method: 'POST',
    body: { email },
    extraHeaders: { otp }, // OTP is expected in headers
    isPublic: true,
  });
}

export function verifyCode({ token, email, password }) {
  return apiCall('verify/code/', {
    method: 'POST',
    body: { email, password },
    extraHeaders: { token }, // Verification token in headers
    isPublic: true,
  });
}

/* ==========================================================================
   Structure & Folder Endpoints
   ========================================================================== */

export async function getStructure(userid, folderId, forceRefresh = false) {
  const path = folderId
    ? `structure/${userid}/${folderId}`
    : `structure/${userid}/`;
  const cacheKey = `${userid ?? 'anonymous'}:${folderId ?? 'root'}`;

  if (forceRefresh) {
    invalidateStructureCache(userid, 'refresh');
    recentResponses.delete(`structure:${cacheKey}`);
    recentResponses.delete(`stats:${userid ?? 'anonymous'}`);
    structureRequests.delete(cacheKey);
  } else {
    if (structureRequests.has(cacheKey)) return structureRequests.get(cacheKey);
    const recent = getRecentResponse(`structure:${cacheKey}`);
    if (recent) return recent;
  }

  if (!folderId && !forceRefresh) getCachedStructure(userid);

  const request = (async () => {
    try {
      const data = await apiCall(path);
      const details = data?.folder_structure_details;
      const structure = parseStructure(details || data);
      if (!folderId) setCachedStructure(structure, userid);
      return setRecentResponse(`structure:${cacheKey}`, structure);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('no folders left')) {
        return [];
      }
      throw err;
    } finally {
      structureRequests.delete(cacheKey);
    }
  })();

  structureRequests.set(cacheKey, request);
  return request;
}

export function getFolders(userid) {
  return apiCall(`folders/${userid}/`);
}

/* ==========================================================================
   File Operations Endpoints
   ========================================================================== */

export function uploadFile(userid, formData) {
  return mutateStructure(userid, 'upload', () => apiCall(`uploadfile/${userid}`, {
    method: 'POST',
    body: formData,
    isFormData: true,
  }));
}

export function uploadFolder(userid, formData) {
  return mutateStructure(userid, 'upload-folder', () => apiCall(`uploadfolder/${userid}/`, {
    method: 'POST',
    body: formData,
    isFormData: true,
  }));
}

export function downloadFile(userid, filename) {
  return apiCall(`download/${userid}/`, {
    method: 'GET',
    queryParams: `filename=${encodeURIComponent(filename)}&filepath=${encodeURIComponent(filename)}`,
    isBlob: true,
  });
}

export function shareFile(userid, filepath, time = 604800) {
  return apiCall(`access/${userid}/`, {
    method: 'POST',
    body: { filepath, time },
  });
}

export function deleteFile(userid, filepath, trash = 1, replace = 0) {
  return mutateStructure(userid, 'delete', () => apiCall(`deletefile/${userid}/`, {
    method: 'DELETE',
    queryParams: `filepath=${encodeURIComponent(filepath)}&trash=${trash}&replace=${replace}`,
  }));
}

export function deleteFromTrash(userid, filepath) {
  return mutateStructure(userid, 'trash-delete', () => apiCall(`trash/${userid}/`, {
    method: 'DELETE',
    queryParams: `filepath=${encodeURIComponent(filepath)}`,
  }));
}

export function recoverFromTrash(userid, trashpath) {
  return mutateStructure(userid, 'restore', () => apiCall(`recovertrash/${userid}/`, {
    method: 'PUT',
    body: { trashpath },
  }));
}


export function renameFile(userid, filename, newname) {
  return mutateStructure(userid, 'rename', () => apiCall(`updatefile/${userid}/`, {
    method: 'PUT',
    body: { filename, newname },
  }));
}

export function createFolder(userid, filename) {
  return mutateStructure(userid, 'create-folder', () => apiCall(`createfolder/${userid}/`, {
    method: 'PUT',
    body: { filename },
  }));
}

export function moveFile(userid, oldpath, newpath) {
  return mutateStructure(userid, 'move', () => apiCall(`changefilelocation/${userid}/`, {
    method: 'PUT',
    body: { oldpath, newlocation: newpath }, // Note the newlocation key
  }));
}

export function searchFile(userid, filename, options = {}) {
  return apiCall(`searchfile/${userid}/${encodeURIComponent(filename)}/`, options);
}

/* ==========================================================================
   User Account Settings
   ========================================================================== */

export function getUserStats(userid) {
  const cacheKey = `${userid ?? 'anonymous'}`;
  if (statsRequests.has(cacheKey)) return statsRequests.get(cacheKey);
  const recent = getRecentResponse(`stats:${cacheKey}`);
  if (recent) return recent;

  const request = apiCall(`userstats/${userid}/`)
    .then((data) => setRecentResponse(`stats:${cacheKey}`, data))
    .finally(() => statsRequests.delete(cacheKey));
  statsRequests.set(cacheKey, request);
  return request;
}

export function getTrashData(userid) {
  return apiCall(`trashdata/${userid}/`);
}

export function updateAccount({ username, password, email }) {
  const body = { username, password };
  if (email) body.email = email;
  return apiCall('updateacc/', { method: 'PUT', body });
}

export function deleteAccount({ username, password, email }) {
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : '';
  return apiCall('deleteacc/', {
    method: 'DELETE',
    queryParams: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}${emailParam}`,
  });
}

/* ==========================================================================
   Shared Public Access Link
   ========================================================================== */

export function accessSharedFile(userid, filesharing, time, token) {
  return apiCall(`share/${userid}/${filesharing}/${time}/${token}`, {
    isBlob: true,
    isPublic: true,
  });
}

async function mutateStructure(userid, reason, request) {
  const result = await request();
  refreshStructureAfterMutation(userid, reason);
  return result;
}
