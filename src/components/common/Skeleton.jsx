import React from 'react';
import styles from './Skeleton.module.css';

export default function Skeleton({ type = 'row', count = 5 }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className={styles.grid}>
        {items.map((_, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.pulseIcon} />
            <div className={styles.pulseText} style={{ width: '60%', height: '14px' }} />
            <div className={styles.pulseText} style={{ width: '40%', height: '10px', marginTop: '8px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {items.map((_, index) => (
        <div key={index} className={styles.row}>
          <div className={styles.pulseIcon} style={{ borderRadius: '4px' }} />
          <div className={styles.pulseText} style={{ width: '35%', height: '16px' }} />
          <div className={styles.pulseText} style={{ width: '15%', height: '12px' }} />
          <div className={styles.pulseText} style={{ width: '25%', height: '12px' }} />
          <div className={styles.pulseAction} />
        </div>
      ))}
    </div>
  );
}
