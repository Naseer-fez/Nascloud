import React, { useEffect, useRef, useState } from 'react';
import { FolderPlus } from 'lucide-react';
import styles from './NewFolderModal.module.css';

export default function NewFolderModal({ isOpen, directory, onClose, onCreate }) {
  const [folderName, setFolderName] = useState('New folder');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setFolderName('New folder');
    setError('');
    setLoading(false);

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = folderName.trim();

    if (!trimmed) {
      setError('Folder name is required.');
      return;
    }

    if (/[\\/]/.test(trimmed)) {
      setError('Use a folder name only, without slashes.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onCreate(trimmed);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create folder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="new-folder-title">
        <div className={styles.iconWrap} aria-hidden="true">
          <FolderPlus size={24} />
        </div>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>{directory ? `Inside ${directory}` : 'My Drive'}</p>
          <h3 id="new-folder-title">Create new folder</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="new-folder-name">Folder name</label>
          <input
            id="new-folder-name"
            ref={inputRef}
            type="text"
            className={styles.input}
            value={folderName}
            onChange={(event) => {
              setFolderName(event.target.value);
              if (error) setError('');
            }}
            disabled={loading}
            aria-describedby={error ? 'new-folder-error' : undefined}
          />

          {error && <p id="new-folder-error" className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={loading || !folderName.trim()}>
              {loading ? 'Creating...' : 'Create folder'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
