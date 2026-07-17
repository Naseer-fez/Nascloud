import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { shareFile } from '../../api/endpoints';
import { FRONTEND_URL } from '../../config';
import styles from './ShareModal.module.css';

export default function ShareModal({ isOpen, onClose, item }) {
  const { userid } = useAuth();
  const { addToast } = useToast();
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;

    setLink('');
    setError('');
    setCopied(false);
    setLoading(true);

    shareFile(userid, item.path)
      .then((data) => {
        // Backend returns access link in standard return key
        const rawLink = data?.return || data?.LINK || data?.link || data?.url || '';
        
        // Ensure link is fully qualified URL on FRONTEND_URL and includes /share/
        let normalized = rawLink;
        try {
          const urlObj = new URL(rawLink.startsWith('http') ? rawLink : `http://dummy.com/${rawLink}`);
          const pathSegments = urlObj.pathname.split('/').filter(Boolean);
          
          if (pathSegments.length >= 4) {
            const tokenVal = pathSegments.pop();
            const timeVal = pathSegments.pop();
            const filesharingVal = pathSegments.pop();
            const useridVal = pathSegments.pop();
            normalized = `${FRONTEND_URL}/share/${useridVal}/${filesharingVal}/${timeVal}/${tokenVal}`;
          } else {
            normalized = rawLink.startsWith('http')
              ? rawLink
              : `${FRONTEND_URL}${rawLink.startsWith('/') ? '' : '/'}${rawLink}`;
          }
        } catch {
          normalized = rawLink.startsWith('http')
            ? rawLink
            : `${FRONTEND_URL}${rawLink.startsWith('/') ? '' : '/'}${rawLink}`;
        }
        
        setLink(normalized);
      })
      .catch((err) => {
        setError(err.message || 'Failed to generate public share link.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, item, userid]);

  if (!isOpen || !item) return null;

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      addToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy link.', 'error');
    }
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h3>Share Link</h3>
        <p className={styles.subtitle}>Generate public access link for "{item.name}":</p>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Creating share link...</span>
          </div>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <div className={styles.linkWrapper}>
            <input className={styles.input} value={link} readOnly onClick={(e) => e.target.select()} />
            <button className={`${styles.btnCopy} ${copied ? styles.copied : ''}`} onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
