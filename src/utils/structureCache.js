import {
  DRIVE_REFRESH_EVENT,
  FILE_FOLDER_CACHE_TTL_MS,
  FOLDER_COUNT_CACHE_KEY,
  HOME_FOLDERS_CACHE_KEY,
  HOME_FOLDERS_CACHE_LIMIT,
  SIDEBAR_REFRESH_EVENT,
  STORAGE_STATS_CACHE_KEY,
  STRUCTURE_CACHE_KEY,
} from '../config';
import { isFolder, itemPath, parseStructure } from './files.js';
import { logFez } from './testLogger';

const userScopedKey = (key, userid) => `${key}:${userid ?? 'anonymous'}`;

const readJsonCache = (key, userid) => {
  try {
    const raw = localStorage.getItem(userScopedKey(key, userid));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    logFez('Cache read failed; ignoring cached value', { key, userid, error: error.message });
    return null;
  }
};

const writeJsonCache = (key, userid, value) => {
  localStorage.setItem(userScopedKey(key, userid), JSON.stringify({
    savedAt: Date.now(),
    value,
  }));
};

export function isCacheFresh(entry, ttlMs = FILE_FOLDER_CACHE_TTL_MS) {
  return Boolean(entry?.savedAt && Date.now() - entry.savedAt <= ttlMs);
}

export function getCachedStructure(userid) {
  const entry = readJsonCache(STRUCTURE_CACHE_KEY, userid);
  if (!isCacheFresh(entry)) {
    logFez('Structure cache stale or missing; fetching backend', { userid });
    return null;
  }
  logFez('Structure cache fresh; available for non-authoritative UI hints', { userid });
  return entry.value;
}

export function setCachedStructure(payload, userid) {
  writeJsonCache(STRUCTURE_CACHE_KEY, userid, payload);
  logFez('Structure cache set', { userid });
  return payload;
}

export function invalidateStructureCache(userid, reason = 'mutation') {
  [
    STRUCTURE_CACHE_KEY,
    HOME_FOLDERS_CACHE_KEY,
    FOLDER_COUNT_CACHE_KEY,
    STORAGE_STATS_CACHE_KEY,
  ].forEach((key) => localStorage.removeItem(userScopedKey(key, userid)));
  logFez('Structure cache invalidated', { userid, reason });
}

export function refreshStructureAfterMutation(userid, reason) {
  invalidateStructureCache(userid, reason);
  window.dispatchEvent(new CustomEvent(DRIVE_REFRESH_EVENT, { detail: { reason } }));
  window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT, { detail: { reason } }));
  logFez('Structure refetch requested after mutation', { userid, reason });
}

const compactFolder = (item) => ({
  Name: item.Name || item.name || itemPath(item).split('/').pop() || 'Folder',
  path: itemPath(item),
  type: item.type || 'Folder',
  children: [],
});

const trimToLimit = (folders) => {
  const trimmed = [...folders];
  while (trimmed.length > 0 && JSON.stringify(trimmed).length > HOME_FOLDERS_CACHE_LIMIT) {
    trimmed.pop();
  }
  return trimmed;
};

export function getHomeFoldersFromStructure(payload) {
  const tree = parseStructure(payload);
  const rootItems = Array.isArray(tree) ? tree : tree?.children || tree?.items || tree?.files || [];
  return rootItems.filter(isFolder).map(compactFolder);
}

export function saveHomeFoldersCache(payload, userid) {
  const folders = trimToLimit(getHomeFoldersFromStructure(payload));
  const serialized = JSON.stringify(folders);
  if (serialized.length <= HOME_FOLDERS_CACHE_LIMIT) {
    writeJsonCache(HOME_FOLDERS_CACHE_KEY, userid, folders);
    logFez('Home folders cache set', { userid, count: folders.length });
  }
  return folders;
}

export function readHomeFoldersCache(userid) {
  const entry = readJsonCache(HOME_FOLDERS_CACHE_KEY, userid);
  if (!isCacheFresh(entry)) {
    logFez('Home folders cache stale or missing; ignoring', { userid });
    return [];
  }
  return Array.isArray(entry.value) ? entry.value : [];
}

export function normalizeStorageStats(payload) {
  const stats = payload?.return || payload || null;
  if (!stats || typeof stats !== 'object') return null;
  return {
    ...stats,
    usedspace: Number(stats.usedspace || 0),
    remaningspace: Number(stats.remaningspace || stats.remainingspace || 0),
  };
}

export function saveStorageStatsCache(payload, userid) {
  const stats = normalizeStorageStats(payload);
  if (!stats) return null;
  writeJsonCache(STORAGE_STATS_CACHE_KEY, userid, stats);
  logFez('Storage stats cache set', { userid });
  return stats;
}

export function readStorageStatsCache(userid) {
  const entry = readJsonCache(STORAGE_STATS_CACHE_KEY, userid);
  if (!isCacheFresh(entry)) {
    logFez('Storage stats cache stale or missing; ignoring', { userid });
    return null;
  }
  return normalizeStorageStats(entry.value);
}

export function normalizeFolderCount(payload) {
  const value = payload?.return ?? payload?.count ?? payload;
  if (value === null || value === undefined || value === '') return null;
  const count = Number(value);
  return Number.isFinite(count) ? count : null;
}

export function saveFolderCountCache(payload, userid) {
  const count = normalizeFolderCount(payload);
  if (count === null) return null;
  writeJsonCache(FOLDER_COUNT_CACHE_KEY, userid, count);
  logFez('Folder count cache set', { userid, count });
  return count;
}

export function readFolderCountCache(userid) {
  const entry = readJsonCache(FOLDER_COUNT_CACHE_KEY, userid);
  if (!isCacheFresh(entry)) {
    logFez('Folder count cache stale or missing; ignoring', { userid });
    return null;
  }
  return normalizeFolderCount(entry.value);
}

export function announceStructureUpdate(tree) {
  window.dispatchEvent(new CustomEvent('nascloud:structure-updated', { detail: { tree } }));
}

export function announceStorageStatsUpdate(stats) {
  window.dispatchEvent(new CustomEvent('nascloud:storage-stats-updated', { detail: { stats } }));
}

export function announceFolderCountUpdate(folderCount) {
  window.dispatchEvent(new CustomEvent('nascloud:folder-count-updated', { detail: { folderCount } }));
}
