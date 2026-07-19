import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { accessSharedFile } from '../../api/endpoints';
import styles from './ShareAccess.module.css';

export default function ShareAccess() {
  const { userid, filesharing, time, token } = useParams();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    // Try to decode fileName from base64 filesharing
    try {
      const decoded = atob(filesharing);
      const name = decoded.split('/').pop();
      setFileName(name || 'Shared Item');
      setLoading(false);
    } catch {
      setFileName('Shared Item');
      setLoading(false);
    }
  }, [filesharing]);

  const handleDownload = async () => {
    addToast('Verifying link and preparing download...', 'info');
    try {
      const result = await accessSharedFile(userid, filesharing, time, token);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Download started successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to download shared file.', 'error');
      setError('Access Link is expired or invalid.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <img src="/nascloud.svg" alt="NasCloud Logo" className={styles.logoIcon} />
          <h2>NasCloud</h2>
        </div>
        
        {loading ? (
          <div className={styles.loader}>Checking share link access...</div>
        ) : error ? (
          <div className={styles.errorSection}>
            <span className={styles.errorIcon}>⚠️</span>
            <h3>Access Expired</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div className={styles.info}>
            <div className={styles.fileBox}>📦</div>
            <h3 className={styles.fileName}>{fileName}</h3>
            <p className={styles.sub}>You have been invited to download this shared item.</p>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
