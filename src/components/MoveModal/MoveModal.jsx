import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getStructure, moveFile } from '../../api/endpoints';
import styles from './MoveModal.module.css';

export default function MoveModal({ isOpen, onClose, item, onSuccess }) {
  const { userid } = useAuth();
  const { addToast } = useToast();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState('');
  const [selectedPath, setSelectedPath] = useState(''); // '' is Home (root)
  const [expandedFolders, setExpandedFolders] = useState({});

  const extractFolders = useCallback((data) => {
    const items = Array.isArray(data) ? data : data?.children || data?.items || [];
    return items
      .filter((i) => i.type === 'folder' || i.type === 'directory' || !!i.children)
      .map((folder) => ({
        name: folder.name,
        path: folder.path || folder.name,
        id: folder.id || folder.name,
        children: folder.children ? extractFolders(folder) : [],
      }));
  }, []);

  const loadFolders = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    setSelectedPath('');
    try {
      const data = await getStructure(userid);
      const tree = extractFolders(data);
      setFolders(tree);
    } catch (err) {
      setError(err.message || 'Failed to load directories.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, userid, extractFolders]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  if (!isOpen || !item) return null;

  const toggleExpand = (id) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMove = async () => {
    setMoving(true);
    setError('');
    try {
      // oldpath is item.path
      // newpath is selectedPath + filename
      const targetPath = selectedPath ? `${selectedPath}/${item.name}` : item.name;
      if (item.path === selectedPath || item.path === targetPath) {
        throw new Error('Destination folder cannot be the same as current folder.');
      }
      await moveFile(userid, item.path, targetPath);
      addToast(`Moved "${item.name}" successfully.`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to move item.');
    } finally {
      setMoving(false);
    }
  };

  const renderNode = (node, depth = 0) => {
    const isExpanded = !!expandedFolders[node.id];
    const isSelected = selectedPath === node.path;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`${styles.treeRow} ${isSelected ? styles.selectedRow : ''}`}
          style={{ paddingLeft: `${16 + depth * 16}px` }}
          onClick={() => setSelectedPath(node.path)}
        >
          {hasChildren ? (
            <span
              className={`${styles.chevron} ${isExpanded ? styles.open : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
            >
              ▸
            </span>
          ) : (
            <span className={styles.placeholderChevron} />
          )}
          <span className={styles.folderIcon}>📁</span>
          <span className={styles.folderName}>{node.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className={styles.children}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h3>Move "{item.name}"</h3>
        <p className={styles.subtitle}>Select destination directory:</p>

        <div className={styles.treeContainer}>
          {loading ? (
            <div className={styles.loading}>Loading directories...</div>
          ) : (
            <>
              {/* Home / Root row */}
              <div
                className={`${styles.treeRow} ${selectedPath === '' ? styles.selectedRow : ''}`}
                onClick={() => setSelectedPath('')}
              >
                <span className={styles.placeholderChevron} />
                <span className={styles.folderIcon}>🏠</span>
                <span className={styles.folderName}>Home (Root)</span>
              </div>
              {folders.map((f) => renderNode(f, 0))}
            </>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onClose} disabled={moving}>
            Cancel
          </button>
          <button className={styles.btnSubmit} onClick={handleMove} disabled={moving || loading}>
            {moving ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </div>
  );
}
