import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';
import { BACKEND_SERVER_ERROR_MESSAGE, buildBackendUrl } from '../../api/backendUrl';
import { AUTH_TOKEN_KEY } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { refreshStructureAfterMutation } from '../../utils/structureCache';
import { logFez } from '../../utils/testLogger';
import styles from './UploadPanel.module.css';

function shouldSendNgrokHeader(url) {
  try {
    return new URL(url).hostname.includes('ngrok');
  } catch {
    return false;
  }
}

export default function UploadPanel() {
  const { userid } = useAuth();
  const { addToast } = useToast();
  const [uploads, setUploads] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const activeXHRs = useRef({});

  const cancelUpload = useCallback((id) => {
    activeXHRs.current[id]?.abort();
    delete activeXHRs.current[id];
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
  }, []);

  const startUpload = useCallback((file, directory) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const upload = {
      id,
      name: file.webkitRelativePath || file.name,
      progress: 0,
      status: 'uploading',
    };

    setUploads((prev) => [upload, ...prev]);
    setIsOpen(true);

    const formData = new FormData();
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const uploadDirectory = directory || '/';
    let url = '';

    try {
      url = buildBackendUrl(`uploadfile/${userid}`);
      formData.append('directory', uploadDirectory);
      formData.append('filepath', file, file.name);
    } catch (error) {
      setUploads((prev) => prev.map((item) => (
        item.id === id ? { ...item, status: 'error' } : item
      )));
      addToast(error.message || BACKEND_SERVER_ERROR_MESSAGE, 'error');
      logFez('Upload request could not resolve backend URL', error.message);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (shouldSendNgrokHeader(url)) xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    if (token && String(userid) !== '0') xhr.setRequestHeader('auth', token);

    activeXHRs.current[id] = xhr;
    logFez('Upload request started', { url, filename: upload.name });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      setUploads((prev) => prev.map((item) => (
        item.id === id ? { ...item, progress } : item
      )));
    };

    xhr.onload = () => {
      delete activeXHRs.current[id];
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploads((prev) => prev.map((item) => (
          item.id === id ? { ...item, status: 'success', progress: 100 } : item
        )));
        addToast(`Uploaded "${upload.name}".`, 'success');
        refreshStructureAfterMutation(userid, 'upload');
        return;
      }

      let errorMsg = 'Upload failed.';
      try {
        const response = JSON.parse(xhr.responseText);
        errorMsg = response.return || response.message || errorMsg;
      } catch {}
      setUploads((prev) => prev.map((item) => (
        item.id === id ? { ...item, status: 'error' } : item
      )));
      addToast(`Upload failed for "${upload.name}": ${errorMsg}`, 'error');
      logFez('Upload request failed', { url, status: xhr.status, errorMsg });
    };

    xhr.onerror = () => {
      delete activeXHRs.current[id];
      setUploads((prev) => prev.map((item) => (
        item.id === id ? { ...item, status: 'error' } : item
      )));
      addToast(`${BACKEND_SERVER_ERROR_MESSAGE} Upload failed for "${upload.name}".`, 'error');
      logFez('Upload request network error', { url, filename: upload.name });
    };

    xhr.send(formData);
  }, [userid, addToast]);

  const startFolderUpload = useCallback((files, directory) => {
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;

    const rootName = fileList[0]?.webkitRelativePath?.split('/')?.[0] || 'Folder';
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const upload = {
      id,
      name: rootName,
      progress: 0,
      status: 'uploading',
    };

    setUploads((prev) => [upload, ...prev]);
    setIsOpen(true);

    const formData = new FormData();
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const uploadDirectory = directory || '/';
    let url = '';

    try {
      url = buildBackendUrl(`uploadfolder/${userid}/`);
      formData.append('directory', uploadDirectory);
      fileList.forEach((file) => {
        formData.append('files', file, file.webkitRelativePath || file.name);
      });
    } catch (error) {
      setUploads((prev) => prev.map((item) => (
        item.id === id ? { ...item, status: 'error' } : item
      )));
      addToast(error.message || BACKEND_SERVER_ERROR_MESSAGE, 'error');
      logFez('Folder upload request could not resolve backend URL', error.message);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (shouldSendNgrokHeader(url)) xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    if (token && String(userid) !== '0') xhr.setRequestHeader('auth', token);

    activeXHRs.current[id] = xhr;
    logFez('Folder upload request started', { url, fileCount: fileList.length, folder: rootName });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      setUploads((prev) => prev.map((item) => (
        item.id === id ? { ...item, progress } : item
      )));
    };

    xhr.onload = () => {
      delete activeXHRs.current[id];
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploads((prev) => prev.map((item) => (
          item.id === id ? { ...item, status: 'success', progress: 100 } : item
        )));
        addToast(`Uploaded folder "${rootName}".`, 'success');
        refreshStructureAfterMutation(userid, 'upload-folder');
        return;
      }

      let errorMsg = 'Folder upload failed.';
      try {
        const response = JSON.parse(xhr.responseText);
        errorMsg = response.return || response.message || errorMsg;
      } catch {}
      setUploads((prev) => prev.map((item) => (
        item.id === id ? { ...item, status: 'error' } : item
      )));
      addToast(`Upload failed for "${rootName}": ${errorMsg}`, 'error');
      logFez('Folder upload request failed', { url, status: xhr.status, errorMsg });
    };

    xhr.onerror = () => {
      delete activeXHRs.current[id];
      setUploads((prev) => prev.map((item) => (
        item.id === id ? { ...item, status: 'error' } : item
      )));
      addToast(`${BACKEND_SERVER_ERROR_MESSAGE} Upload failed for "${rootName}".`, 'error');
      logFez('Folder upload request network error', { url, folder: rootName });
    };

    xhr.send(formData);
  }, [userid, addToast]);

  useEffect(() => {
    const handleTrigger = (event) => {
      const { files, directory, isFolderUpload } = event.detail;
      if (isFolderUpload) {
        startFolderUpload(files, directory);
        return;
      }
      files.forEach((file) => startUpload(file, directory));
    };

    window.addEventListener('nascloud-upload-trigger', handleTrigger);
    return () => window.removeEventListener('nascloud-upload-trigger', handleTrigger);
  }, [startFolderUpload, startUpload]);

  if (uploads.length === 0) return null;

  const totalUploading = uploads.filter((upload) => upload.status === 'uploading').length;

  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
      <button className={styles.header} onClick={() => setIsOpen((prev) => !prev)}>
        <span className={styles.title}>
          {totalUploading > 0 ? `Uploading ${totalUploading} file(s)` : 'Uploads completed'}
        </span>
        {isOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className={styles.list}>
          {uploads.map((upload) => (
            <div key={upload.id} className={styles.item}>
              <div className={styles.meta}>
                <span className={styles.name} title={upload.name}>{upload.name}</span>
                {upload.status === 'uploading' ? (
                  <button className={styles.cancelBtn} onClick={() => cancelUpload(upload.id)} title="Cancel upload">
                    <X size={14} aria-hidden="true" />
                  </button>
                ) : upload.status === 'success' ? (
                  <Check className={styles.successIcon} size={15} aria-hidden="true" />
                ) : (
                  <AlertTriangle className={styles.errorIcon} size={15} aria-hidden="true" />
                )}
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${upload.status === 'error' ? styles.errorFill : ''}`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <div className={styles.info}>
                <span>{upload.progress}%</span>
                <span>{upload.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
