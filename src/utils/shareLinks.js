import { getBackendUrl } from '../api/backendUrl.js';

const SHARE_MARKER = '<>';

export const backendBase = () => getBackendUrl();

export const codeFromBackendShareValue = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.includes(SHARE_MARKER)) return text.split(SHARE_MARKER).pop().replace(/^\/+/g, '');
  if (/^https?:\/\//i.test(text)) {
    const url = new URL(text);
    const parts = url.pathname.split('/').filter(Boolean);
    const frontendShareIndex = parts.indexOf('share-download');
    if (frontendShareIndex >= 0) return parts.slice(frontendShareIndex + 1).join('/');
    const shareIndex = parts.indexOf('share');
    return shareIndex >= 0 ? parts.slice(shareIndex + 1).join('/') : parts.join('/');
  }
  return text.replace(/^\/?(share-download\/|share\/)?/i, '');
};

export const frontendShareLink = (value, origin = window.location.origin) => {
  const code = codeFromBackendShareValue(value);
  if (!code) return '';
  return `${origin.replace(/\/+$/g, '')}/share-download/${code.split('/').map(encodeURIComponent).join('/')}`;
};

export const backendSharePathFromCode = (code = '') => {
  const normalized = String(code || '').replace(/^\/+/g, '');
  return normalized.toLowerCase().startsWith('share/') ? `/${normalized}` : `/share/${normalized}`;
};
