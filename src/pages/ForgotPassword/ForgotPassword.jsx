import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { forgotPassword, forgotCode, verifyCode } from '../../api/endpoints';
import styles from './ForgotPassword.module.css';

export default function ForgotPassword() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    try {
      await forgotPassword({ email: email.trim() });
      addToast('OTP sent successfully. Please check your inbox.', 'success');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError('');
    try {
      const data = await forgotCode({ email: email.trim(), otp: otp.trim() });
      if (data?.return) {
        setVerificationToken(data.return);
        addToast('OTP code verified.', 'success');
        setStep(3);
      } else {
        throw new Error('Code verification failed.');
      }
    } catch (err) {
      setError(err.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    setLoading(true);
    setError('');
    try {
      await verifyCode({
        token: verificationToken,
        email: email.trim(),
        password: newPassword,
      });
      addToast('Password successfully changed.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Reset password failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logoIcon}>☁️</span>
          <h2>NasCloud</h2>
        </div>

        {step === 1 && (
          <>
            <p className={styles.subtitle}>Enter your email to receive a secure OTP code</p>
            <form onSubmit={handleSendOTP}>
              <div className={styles.group}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitBtn} disabled={loading || !email.trim()}>
                {loading ? 'Sending code...' : 'Send OTP Code'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className={styles.subtitle}>Enter the OTP verification code sent to {email}</p>
            <form onSubmit={handleVerifyOTP}>
              <div className={styles.group}>
                <label className={styles.label}>OTP Code</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitBtn} disabled={loading || !otp.trim()}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <p className={styles.subtitle}>Enter your new secure password</p>
            <form onSubmit={handleResetPassword}>
              <div className={styles.group}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitBtn} disabled={loading || !newPassword}>
                {loading ? 'Updating password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <div className={styles.footerLinks}>
          <Link to="/login" className={styles.link}>Return to Login</Link>
        </div>
      </div>
    </div>
  );
}
