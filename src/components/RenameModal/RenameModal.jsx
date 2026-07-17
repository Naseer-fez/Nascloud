import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { renameFile } from '../../api/endpoints';
import styles from './RenameModal.module.css';

export default function RenameModal({ isOpen, onClose, item, onSuccess }) {
  const { userid } = useAuth();
  const { addToast } = useToast();
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && item) {
      setNewName(item.name || '');
      setError('');
      setLoading(false);

      // Auto-select filename excluding extension
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIndex = item.name.lastIndexOf('.');
          const isFolder = item.type === 'folder' || item.type === 'directory' || !!item.children;
          if (dotIndex > 0 && !isFolder) {
            inputRef.current.setSelectionRange(0, dotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || trimmed === item.name) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const parts = item.path.split('/');
      parts[parts.length - 1] = trimmed;
      const newPath = parts.join('/');

      await renameFile(userid, item.path, newPath);
      addToast(`Renamed to "${trimmed}" successfully.`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Rename failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h3>Rename Item</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={loading}
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={loading || !newName.trim()}>
              {loading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
