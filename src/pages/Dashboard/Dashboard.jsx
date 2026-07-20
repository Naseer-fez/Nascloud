import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL, MAIN_USERNAME_KEY, MAIN_PASSWORD_KEY, MAIN_API_KEY_STORAGE, MAIN_ACCESS_CODE_KEY } from '../../config';
import NasCloudLogo from '../../components/common/NasCloudLogo';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [optPassword, setOptPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

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

  const handleGoBack = () => {
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={handleGoBack} className={styles.logoBtn} title="Back to User Login">
            <NasCloudLogo size={80} usePinkGradient={true} />
          </button>
          <div className={styles.headerTitles}>
            <h1 className={styles.title}>Welcome, {username}</h1>
            <p className={styles.subtitle}>Central Server Management Console</p>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div className={styles.stackContent}>
        {/* Small Box / Button to trigger setup modal */}
        <div className={styles.infoTriggerBox} onClick={() => setShowSetupModal(true)}>
          <div className={styles.infoTriggerLeft}>
            <span className={styles.infoTriggerIcon}>ℹ️</span>
            <div>
              <h3 className={styles.infoTriggerTitle}>How to connect to local system</h3>
              <p className={styles.infoTriggerSubtitle}>Click here to view setup instructions and file details</p>
            </div>
          </div>
          <span className={styles.infoTriggerArrow}>View Setup →</span>
        </div>

        {/* Card 1: API Key, Frontend Code, and Optional Password */}
        <div className={styles.sectionCard}>
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

          <div className={styles.keyContainer}>
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

          <div className={styles.keyContainer}>
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
        </div>

        {/* Card 2: Action Buttons */}
        <div className={styles.actionCard}>
          {apiKey && (
            <>
              <button
                onClick={handleUpdateCredentials}
                className={`${styles.regenerateBtn} ${styles.saveBtn}`}
                disabled={loading}
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
            </>
          )}
          <button
            onClick={handleGoBack}
            className={styles.goBackActionBtn}
          >
            ← Go Back to User Login
          </button>
        </div>
      </div>

      {/* Setup Instructions Modal */}
      {showSetupModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSetupModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>How to connect to local system</h2>
              <button className={styles.closeBtn} onClick={() => setShowSetupModal(false)}>✕</button>
            </div>
            <ol className={styles.modalSteps}>
              <li>Copy your <strong>Central API Key</strong> and paste it into <code>NasCloudSetup.exe</code>.</li>
              <li>Provide your users with the <strong>Frontend Access Code</strong> and <strong>Optional Password</strong> so they can connect through the Access Gate.</li>
              <li>Ensure your backend <code>NasCloudServer.exe</code> is running.</li>
            </ol>
            <div className={styles.modalFooter}>
              <button className={styles.gotItBtn} onClick={() => setShowSetupModal(false)}>Got it, Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
