import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL, MAIN_USERNAME_KEY, MAIN_PASSWORD_KEY, MAIN_API_KEY_STORAGE, MAIN_ACCESS_CODE_KEY } from '../../config';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [optPassword, setOptPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem(MAIN_USERNAME_KEY);
    const storedCode = localStorage.getItem(MAIN_ACCESS_CODE_KEY);
    const storedApiKey = localStorage.getItem(MAIN_API_KEY_STORAGE);

    // Check if user credentials exist in localStorage
    const password = localStorage.getItem(MAIN_PASSWORD_KEY);
    if (!storedUsername || !password) {
      navigate('/login');
      return;
    }

    setUsername(storedUsername);
    setAccessCode(storedCode || '');
    setApiKey(storedApiKey || '');
    setOptPassword(password || '');
  }, [navigate]);

  const handleGenerateApiKey = async () => {
    setLoading(true);
    const storedUsername = localStorage.getItem(MAIN_USERNAME_KEY);
    const storedPassword = localStorage.getItem(MAIN_PASSWORD_KEY);

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: storedUsername, password: storedPassword })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.return || 'Failed to generate API key.');
      }

      const data = await response.json();
      // Dashboard now returns structured JSON: { api_key, code }
      const newApiKey = data.api_key || '';
      const newCode = data.code || accessCode;

      setApiKey(newApiKey);
      setAccessCode(newCode);
      localStorage.setItem(MAIN_API_KEY_STORAGE, newApiKey);
      localStorage.setItem(MAIN_ACCESS_CODE_KEY, newCode);
      addToast('Central API Key regenerated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Error generating API key.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      addToast('API Key copied to clipboard!', 'success');
    }
  };

  const handleCopyCode = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode);
      addToast('Access Code copied to clipboard!', 'success');
    }
  };

  const handleCopyPassword = () => {
    if (optPassword) {
      navigator.clipboard.writeText(optPassword);
      addToast('Optional Password copied to clipboard!', 'success');
    }
  };

  const handleUpdateCredentials = async () => {
    if (!accessCode.trim()) {
      addToast('Access Code cannot be empty.', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register/user/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api: apiKey,
          code: accessCode.trim(),
          userpassword: optPassword || null
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.return || 'Failed to update credentials on Central Server.');
      }

      localStorage.setItem(MAIN_ACCESS_CODE_KEY, accessCode.trim());
      if (optPassword) {
        localStorage.setItem(MAIN_PASSWORD_KEY, optPassword);
      } else {
        localStorage.removeItem(MAIN_PASSWORD_KEY);
      }

      addToast('Access Credentials updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Error updating credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(MAIN_USERNAME_KEY);
    localStorage.removeItem(MAIN_PASSWORD_KEY);
    localStorage.removeItem(MAIN_API_KEY_STORAGE);
    localStorage.removeItem(MAIN_ACCESS_CODE_KEY);
    addToast('Logged out of Central Dashboard.', 'info');
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Welcome, {username}</h1>
            <p className={styles.subtitle}>Central Server Management Console</p>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.infoBox}>
            <h3>How to connect your Local Server:</h3>
            <ol className={styles.steps}>
              <li>Copy your <strong>Central API Key</strong> and paste it into the Setup GUI.</li>
              <li>Provide your users with the <strong>Frontend Access Code</strong> and <strong>Optional Password</strong> so they can connect through the Access Gate.</li>
              <li>Ensure your backend <code>start.exe</code> or <code>server_launcher.py</code> is running.</li>
            </ol>
          </div>

          <div className={styles.actionSection}>
            <div className={styles.keyContainer}>
              <span className={styles.keyLabel}>Your Central API Key (for SetupGUI):</span>
              <div className={styles.keyRow}>
                <input
                  type="text"
                  readOnly
                  value={apiKey || 'Not Generated'}
                  className={styles.keyInput}
                />
                {apiKey ? (
                  <button onClick={handleCopyKey} className={styles.copyBtn}>
                    Copy Key
                  </button>
                ) : (
                  <button onClick={handleGenerateApiKey} className={styles.copyBtn} disabled={loading}>
                    Generate
                  </button>
                )}
              </div>
            </div>

            <div className={styles.keyContainer} style={{ marginTop: '20px' }}>
              <span className={styles.keyLabel}>Your Frontend Access Code (for Users):</span>
              <div className={styles.keyRow}>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className={styles.keyInput}
                  style={{ color: '#60a5fa' }}
                  placeholder="Enter a custom Access Code"
                />
                {accessCode && (
                  <button onClick={handleCopyCode} className={styles.copyBtn} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                    Copy Code
                  </button>
                )}
              </div>
            </div>

            <div className={styles.keyContainer} style={{ marginTop: '20px' }}>
              <span className={styles.keyLabel}>Your Optional Password (for Users):</span>
              <div className={styles.keyRow}>
                <input
                  type="text"
                  value={optPassword}
                  onChange={(e) => setOptPassword(e.target.value)}
                  className={styles.keyInput}
                  style={{ color: '#60a5fa' }}
                  placeholder="Leave empty or enter a password"
                />
                {optPassword && (
                  <button onClick={handleCopyPassword} className={styles.copyBtn} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                    Copy Password
                  </button>
                )}
              </div>
            </div>

            {apiKey && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
                <button
                  onClick={handleUpdateCredentials}
                  className={styles.regenerateBtn}
                  disabled={loading}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {loading ? 'Processing...' : 'Save & Update Access Credentials'}
                </button>
                <button
                  onClick={handleGenerateApiKey}
                  className={styles.regenerateBtn}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Regenerate API Key'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
