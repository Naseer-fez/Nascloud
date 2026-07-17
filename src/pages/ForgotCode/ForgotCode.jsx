import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import styles from './ForgotCode.module.css';

export default function ForgotCode() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/forgot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.return || 'Failed to send recovery email.');
      }

      setSent(true);
      addToast('Recovery email sent!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to send recovery email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandHeader}>
          <span className={styles.logo}>🔑</span>
          <h1>Recover Access Code</h1>
          <p className={styles.subtitle}>Enter your email to receive your access code</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                className={styles.input}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? 'Sending...' : 'Send Recovery Email'}
            </button>
          </form>
        ) : (
          <div className={styles.successBox}>
            <span className={styles.successIcon}>✉️</span>
            <h2 className={styles.successTitle}>Email Sent!</h2>
            <p className={styles.successText}>
              Your access code has been sent to <strong>{email}</strong>. Check your inbox.
            </p>
          </div>
        )}

        <div className={styles.backLink}>
          <button type="button" onClick={() => navigate('/login')} className={styles.linkBtn}>
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
