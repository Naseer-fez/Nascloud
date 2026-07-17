import { basename, itemPath, normalizePath } from './files.js';

export const TRASH_ROOT = 'trash';
export const USER_TRASH_NAME = 'trash[1]';

export const isTrashRootPath = (path = '') => normalizePath(path).toLowerCase() === TRASH_ROOT;

export const isInsideTrashRoot = (path = '') => {
  const normalized = normalizePath(path).toLowerCase();
  return normalized === TRASH_ROOT || normalized.startsWith(`${TRASH_ROOT}/`);
};

export const isRootTrashItem = (item, parentPath = '') => isTrashRootPath(itemPath(item, parentPath));

export const visibleOutsideTrash = (items, parentPath = '') => (items || []).filter((item) => !isRootTrashItem(item, parentPath));

export const visibleInsideTrash = (tree) => {
  const items = Array.isArray(tree) ? tree : tree?.children || tree?.items || tree?.files || [];
  const root = items.find((item) => isRootTrashItem(item));
  return root?.children || root?.items || root?.files || [];
};

export const safeRootFolderName = (name = '') => (String(name).trim().toLowerCase() === TRASH_ROOT ? USER_TRASH_NAME : String(name).trim());

export const safeRootUploadRelativePath = (file) => {
  const relativePath = file.webkitRelativePath || file.name;
  const parts = normalizePath(relativePath).split('/').filter(Boolean);
  if (parts[0]?.toLowerCase() === TRASH_ROOT) {
    parts[0] = USER_TRASH_NAME;
    return parts.join('/');
  }
  return relativePath;
};

export const trashDisplayName = (path = '') => basename(path.replace(/^trash\/?/i, ''));
