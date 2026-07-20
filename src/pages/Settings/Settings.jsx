import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateAccount, deleteAccount } from '../../api/endpoints';
import styles from './Settings.module.css';

export default function Settings() {
  const { logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Settings form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Delete account confirmation states
  const [delPassword, setDelPassword] = useState('');
  const [delError, setDelError] = useState('');
  const [delLoading, setDelLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!username.trim() && !email.trim() && !password) {
      setError('Please fill in at least one field to update.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {};
      if (username.trim()) payload.username = username.trim();
      if (email.trim()) payload.email = email.trim();
      if (password) payload.password = password;

      await updateAccount(payload);
      addToast('Account settings updated successfully.', 'success');
      
      // Clear password field
      setPassword('');
      setError('');
    } catch (err) {
      setError(err.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!delPassword) {
      setDelError('Please enter password to confirm deletion.');
      return;
    }

    setDelLoading(true);
    setDelError('');
    try {
      await deleteAccount({
        password: delPassword,
      });
      addToast('Your account has been deleted.', 'info');
      logout(); // Logs user out globally
      navigate('/login');
    } catch (err) {
      setDelError(err.message || 'Failed to delete account.');
    } finally {
      setDelLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      localStorage.setItem('theme', 'system');
      document.documentElement.removeAttribute('data-theme');
    } else {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    addToast(
      `Theme updated to ${newTheme === 'system' ? 'System Default' : newTheme === 'light' ? 'Sage Mist' : 'Forest Dark'}`, 
      'success'
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Account Settings</h2>
        <span className={styles.subtitle}>Manage your username, password, and preferences</span>
      </header>

      <div className={styles.grid}>
        {/* Form settings details */}
        <div className={styles.card}>
          <h3>Update Credentials</h3>
          <form onSubmit={handleUpdate}>
            <div className={styles.group}>
              <label className={styles.label}>New Username</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Leave blank to keep current"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>New Email Address</label>
              <input
                type="email"
                className={styles.input}
                placeholder="Leave blank to keep current"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>New Password</label>
              <input
                type="password"
                className={styles.input}
                placeholder="Leave blank to keep current"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Updating settings...' : 'Update Settings'}
            </button>
          </form>
        </div>

        {/* Theme Preferences Card */}
        <div className={styles.card}>
          <h3>Theme Preferences</h3>
          <p className={styles.cardDesc}>Select a visual style for your NasCloud dashboard.</p>
          
          <div className={styles.themeOptions}>
            <button
              type="button"
              className={`${styles.themeBtn} ${theme === 'dark' ? styles.themeBtnActive : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <span className={styles.themePreviewDark}></span>
              Forest Dark
            </button>
            
            <button
              type="button"
              className={`${styles.themeBtn} ${theme === 'light' ? styles.themeBtnActive : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <span className={styles.themePreviewLight}></span>
              Sage Mist (Light)
            </button>
            
            <button
              type="button"
              className={`${styles.themeBtn} ${theme === 'system' ? styles.themeBtnActive : ''}`}
              onClick={() => handleThemeChange('system')}
            >
              <span className={styles.themePreviewSystem}></span>
              System Default
            </button>
          </div>
        </div>

        {/* Danger zone delete accounts */}
        <div className={`${styles.card} ${styles.dangerCard}`}>
          <h3>Danger Zone</h3>
          <p className={styles.dangerSub}>Permanently delete your account and erase all files.</p>
          
          {!showConfirm ? (
            <button className={styles.deleteInitBtn} onClick={() => setShowConfirm(true)}>
              Delete My Account
            </button>
          ) : (
            <form onSubmit={handleDelete} className={styles.delForm}>
              <p className={styles.warningAlert}>
                ⚠ Warning: This operation is irreversible and all your uploaded documents will be erased immediately.
              </p>
              <div className={styles.group}>
                <label className={styles.label}>Confirm with password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Enter password to confirm"
                  value={delPassword}
                  onChange={(e) => setDelPassword(e.target.value)}
                  disabled={delLoading}
                />
              </div>
              
              {delError && <p className={styles.error}>{delError}</p>}

              <div className={styles.delActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowConfirm(false)} disabled={delLoading}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnConfirmDelete} disabled={delLoading || !delPassword}>
                  {delLoading ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
