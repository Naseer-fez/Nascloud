export const normalizePath = (value = '') => String(value).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

export const joinPath = (...parts) => normalizePath(parts.filter(Boolean).join('/').replace(/\/+/g, '/'));

export const basename = (path = '') => {
  const normalized = normalizePath(path);
  return normalized.split('/').filter(Boolean).pop() || 'Home';
};

export const dirname = (path = '') => {
  const parts = normalizePath(path).split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
};

export const itemName = (item) => item?.name || item?.Name || item?.filename || item?.Filename || '';

export const isFolder = (item) => {
  const type = String(item?.type || item?.kind || '').toLowerCase();
  return item?.children || item?.folder || item?.isFolder || type.includes('folder') || type.includes('dir');
};

export const itemPath = (item, parentPath = '') => {
  const parent = normalizePath(parentPath);
  const rawPath = normalizePath(item?.path || item?.filepath || item?.filename || '');

  if (!rawPath) return joinPath(parent, itemName(item));
  if (!parent || rawPath === parent || rawPath.startsWith(`${parent}/`)) return rawPath;

  return joinPath(parent, rawPath);
};

export const normalizeStructureItem = (item, parentPath = '') => {
  if (!item || typeof item !== 'object') return item;
  const name = itemName(item);
  const path = itemPath(item, parentPath);
  const rawChildren = item.children || item.items || item.files;
  const hasChildren = Array.isArray(rawChildren);
  const normalized = {
    ...item,
    name,
    path,
    type: item.type || item.kind || (hasChildren ? 'Folder' : 'file'),
    created: item.created || item.createdtime,
    modified: item.modified || item.updatedtime || item.date,
  };

  if (hasChildren) {
    normalized.children = rawChildren.map((child) => normalizeStructureItem(child, path));
  }

  return normalized;
};

export const normalizeStructureTree = (tree) => {
  if (Array.isArray(tree)) return tree.map((item) => normalizeStructureItem(item));
  if (tree && typeof tree === 'object') return normalizeStructureItem(tree);
  return [];
};

export const formatBytes = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

export const flattenTree = (node, parentPath = '') => {
  const items = Array.isArray(node) ? node : node?.children || node?.items || node?.files || [];
  return items.flatMap((item) => {
    const path = itemPath(item, parentPath);
    return [{ ...item, path }, ...flattenTree(item, path)];
  });
};

export const parseStructure = (payload) => {
  const root = payload?.folder_structure_details ?? payload?.value ?? payload?.return ?? payload;
  if (typeof root === 'string') {
    try {
      return normalizeStructureTree(JSON.parse(root));
    } catch {
      return [];
    }
  }
  return normalizeStructureTree(root || []);
};

export const getChildrenAtPath = (tree, targetPath = '') => {
  const normalizedTarget = normalizePath(targetPath);
  if (!normalizedTarget) return Array.isArray(tree) ? tree : tree?.children || [];
  const all = flattenTree(tree);
  const folder = all.find((item) => normalizePath(item.path) === normalizedTarget);
  return folder?.children || folder?.items || folder?.files || [];
};

export const injectIntoTree = (tree, parentPath, newItem) => {
  const normalized = normalizePath(parentPath);
  if (!normalized) {
    const items = Array.isArray(tree) ? tree : tree?.children || [];
    const alreadyExists = items.some((item) => normalizePath(itemPath(item)) === normalizePath(newItem.path));
    if (!alreadyExists) items.push(newItem);
    return;
  }
  const stack = Array.isArray(tree) ? [...tree] : [...(tree?.children || [])];
  while (stack.length) {
    const node = stack.pop();
    if (normalizePath(itemPath(node)) === normalized && isFolder(node)) {
      const children = node.children || node.items || node.files || [];
      const alreadyExists = children.some((item) => normalizePath(itemPath(item, normalized)) === normalizePath(newItem.path));
      if (!alreadyExists) {
        if (node.children) node.children.push(newItem);
        else if (node.items) node.items.push(newItem);
        else if (node.files) node.files.push(newItem);
        else node.children = [newItem];
      }
      return;
    }
    const nested = node.children || node.items || node.files || [];
    stack.push(...nested);
  }
};
