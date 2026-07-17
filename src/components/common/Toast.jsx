import React from 'react';
import styles from './Toast.module.css';

export default function Toast({ id, message, type, onClose }) {
  const getIcon = () => {
    if (type === 'success') return '✓';
    if (type === 'error') return '⚠';
    return 'ℹ';
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeBtn} onClick={() => onClose(id)}>
        ✖
      </button>
    </div>
  );
}
