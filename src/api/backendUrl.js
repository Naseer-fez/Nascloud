import { CLIENT_BACKEND_URL_KEY } from '../config';
import { logFez } from '../utils/testLogger';

export const BACKEND_SERVER_ERROR_MESSAGE = 'Server error. The backend link from the main server is not working.';

function normalizeBackendUrl(url) {
  return String(url || '').trim().replace(/\/+$/g, '');
}

export function saveBackendUrl(url) {
  const normalizedUrl = normalizeBackendUrl(url);
  if (!normalizedUrl) {
    logFez('Main server returned an empty backend URL');
    localStorage.removeItem(CLIENT_BACKEND_URL_KEY);
    throw new Error('Server error. The main server did not return a backend link.');
  }

  try {
    new URL(normalizedUrl);
  } catch {
    logFez('Main server returned an invalid backend URL', normalizedUrl);
    localStorage.removeItem(CLIENT_BACKEND_URL_KEY);
    throw new Error('Server error. The main server returned an invalid backend link.');
  }

  const oldUrl = localStorage.getItem(CLIENT_BACKEND_URL_KEY);
  localStorage.setItem(CLIENT_BACKEND_URL_KEY, normalizedUrl);
  logFez('Saved backend URL from main server', normalizedUrl);

  if (oldUrl !== normalizedUrl) {
    logFez('Backend URL changed from', oldUrl, 'to', normalizedUrl);
    const cacheKeys = ['structure_cache', 'home_folders_cache', 'folder_count_cache', 'storage_stats_cache'];
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && cacheKeys.some((prefix) => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      }
      logFez('All structure caches cleared due to backend URL update');
    } catch (e) {
      logFez('Error clearing localStorage structure caches', e);
    }
    window.dispatchEvent(new CustomEvent('nascloud-refresh'));
    window.dispatchEvent(new CustomEvent('nascloud-sidebar-refresh'));
  }

  return normalizedUrl;
}

export function getBackendUrl() {
  const backendUrl = normalizeBackendUrl(localStorage.getItem(CLIENT_BACKEND_URL_KEY));
  if (!backendUrl) {
    logFez('Backend URL missing before PersonalDrive request');
    throw new Error('Server error. Please access the drive again so the main server can resolve the backend link.');
  }
  return backendUrl;
}

export function hasBackendUrl() {
  return Boolean(normalizeBackendUrl(localStorage.getItem(CLIENT_BACKEND_URL_KEY)));
}

export function buildBackendUrl(path, queryParams = '') {
  const baseUrl = getBackendUrl();
  const route = String(path || '').replace(/^\/+/g, '');
  const url = `${baseUrl}/${route}`;
  return queryParams ? `${url}?${queryParams}` : url;
}
