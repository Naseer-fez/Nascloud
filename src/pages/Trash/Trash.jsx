import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getTrashData, recoverFromTrash, deleteFromTrash } from '../../api/endpoints';
import DeleteConfirmModal from '../../components/DeleteConfirmModal/DeleteConfirmModal';
import { SIDEBAR_REFRESH_EVENT } from '../../config';
import styles from './Trash.module.css';

function getFileIcon(name) {
  if (!name) return '📄';
  const ext = name.split('.').pop().toLowerCase();
  const images = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const audios = ['mp3', 'wav', 'ogg', 'aac'];
  const videos = ['mp4', 'mkv', 'avi', 'mov'];
  const zips = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  if (images.includes(ext)) return '🖼️';
  if (audios.includes(ext)) return '🎵';
  if (videos.includes(ext)) return '🎬';
  if (zips.includes(ext)) return '📦';
  return '📄';
}

export default function Trash() {
  const { userid } = useAuth();
  const { addToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTrashContents = useCallback(async () => {
    if (userid === null || userid === undefined) return;

    setLoading(true);
    try {
      const data = await getTrashData(userid);
      const trashItems = Array.isArray(data) ? data : data?.items || data?.return || [];
      setItems(trashItems.map((item) => ({
        name: item.name || item.Name || item.path?.split(/[\\/]/).pop() || 'Deleted item',
        path: item.path,
        type: item.type || 'file',
        originalPath: item.originalPath || item.originalpath || item.name,
        size: item.size,
        modified: item.modified,
      })));
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to load trash.', 'error');
    } finally {
      setLoading(false);
    }
  }, [userid, addToast]);

  useEffect(() => {
    fetchTrashContents();
  }, [fetchTrashContents]);

  const handleRestore = async (item) => {
    addToast(`Restoring "${item.name}"...`, 'info');
    try {
      await recoverFromTrash(userid, item.path);
      addToast(`Restored "${item.name}" successfully.`, 'success');
      
      fetchTrashContents();
      window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT));
    } catch (err) {
      addToast(err.message || 'Restore failed.', 'error');
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFromTrash(userid, deleteTarget.path);
      addToast(`Permanently deleted "${deleteTarget.name}".`, 'success');
      
      fetchTrashContents();
      window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT));
    } catch (err) {
      addToast(err.message || 'Permanent delete failed.', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Trash Explorer</h2>
        <span className={styles.subtitle}>Items moved here are stored temporarily</span>
      </header>

      <div className={styles.viewport}>
        {loading ? (
          <div className={styles.loading}>Loading trash...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🗑️</div>
            <h3>Your trash is empty</h3>
            <p>Delete items from the home drive to view them here.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.colName}>Name</div>
              <div className={styles.colActions}>Actions</div>
            </div>
            <div className={styles.tableBody}>
              {items.map((item, index) => (
                <div key={index} className={styles.row}>
                  <div className={styles.colName}>
                    <span className={styles.rowIcon}>{getFileIcon(item.name)}</span>
                    <span className={styles.rowName}>{item.name}</span>
                  </div>
                  <div className={styles.colActions}>
                    <button className={styles.btnRestore} onClick={() => handleRestore(item)}>
                      Restore
                    </button>
                    <button className={styles.btnDelete} onClick={() => setDeleteTarget(item)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        item={deleteTarget}
        isPermanent={true}
        onConfirm={handlePermanentDelete}
      />
    </div>
  );
}
