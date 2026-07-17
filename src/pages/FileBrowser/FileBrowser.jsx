import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, FolderOpen, UploadCloud } from 'lucide-react';
import { createFolder, deleteFile, downloadFile, getStructure } from '../../api/endpoints';
import { DRIVE_REFRESH_EVENT, SIDEBAR_REFRESH_EVENT } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ContextMenu from '../../components/ContextMenu/ContextMenu';
import DeleteConfirmModal from '../../components/DeleteConfirmModal/DeleteConfirmModal';
import FileList from '../../components/FileList/FileList';
import MoveModal from '../../components/MoveModal/MoveModal';
import NewFolderModal from '../../components/NewFolderModal/NewFolderModal';
import RenameModal from '../../components/RenameModal/RenameModal';
import ShareModal from '../../components/ShareModal/ShareModal';
import Skeleton from '../../components/common/Skeleton';
import Toolbar from '../../components/Toolbar/Toolbar';
import { getChildrenAtPath, isFolder, itemPath, normalizePath } from '../../utils/files';
import styles from './FileBrowser.module.css';

export default function FileBrowser() {
  const { folderId } = useParams();
  const { userid } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchValue, setSearchValue] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  const [selectedId, setSelectedId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [renameItem, setRenameItem] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteIsPermanent, setDeleteIsPermanent] = useState(false);
  const [newFolderDirectory, setNewFolderDirectory] = useState(null);

  const currentFolderPath = useMemo(
    () => normalizePath(folderId ? decodeURIComponent(folderId) : ''),
    [folderId],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFolderData = useCallback(async (force = false) => {
    if (userid === null || userid === undefined) return;

    if (force) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getStructure(userid, undefined, force);
      let items = [];

      if (currentFolderPath) {
        items = getChildrenAtPath(data, currentFolderPath);
      } else if (Array.isArray(data)) {
        items = data;
      } else if (data?.children) {
        items = data.children;
      } else if (data?.contents) {
        items = data.contents;
      } else if (data?.name) {
        items = [data];
      }

      setFiles(items);
      if (force) {
        addToast('Drive refreshed successfully.', 'success');
        window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT));
      }
    } catch (err) {
      setError(err.message || 'Failed to load folder contents.');
      if (force) {
        addToast(err.message || 'Failed to refresh.', 'error');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userid, currentFolderPath, addToast]);

  useEffect(() => {
    fetchFolderData();
  }, [fetchFolderData]);

  useEffect(() => {
    const refreshHandler = () => fetchFolderData();
    window.addEventListener(DRIVE_REFRESH_EVENT, refreshHandler);
    return () => window.removeEventListener(DRIVE_REFRESH_EVENT, refreshHandler);
  }, [fetchFolderData]);

  useEffect(() => {
    const folderHandler = (event) => {
      setNewFolderDirectory(normalizePath(event.detail?.directory || currentFolderPath));
    };

    window.addEventListener('nascloud-newfolder', folderHandler);
    return () => window.removeEventListener('nascloud-newfolder', folderHandler);
  }, [currentFolderPath]);

  const filteredFiles = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return files;
    return files.filter((item) => (item.name || '').toLowerCase().includes(query));
  }, [files, searchValue]);

  const folderSummary = useMemo(() => {
    const folderCount = files.filter((item) => isFolder(item)).length;
    return {
      folders: folderCount,
      files: files.length - folderCount,
      shown: filteredFiles.length,
      total: files.length,
    };
  }, [files, filteredFiles]);

  const handleNavigate = useCallback((path) => {
    const normalized = normalizePath(path);
    navigate(normalized ? `/folder/${encodeURIComponent(normalized)}` : '/');
  }, [navigate]);

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current += 1;
    if (event.dataTransfer.items?.length > 0) setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    if (!event.dataTransfer.files?.length) return;

    const droppedFiles = Array.from(event.dataTransfer.files);
    addToast(`Preparing ${droppedFiles.length} upload(s)...`, 'info');
    window.dispatchEvent(new CustomEvent('nascloud-upload-trigger', {
      detail: { files: droppedFiles, directory: currentFolderPath },
    }));
  };

  const handleContextMenuTrigger = (event, item) => {
    const path = itemPath(item, currentFolderPath);
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      item: { ...item, path },
    });
  };

  const handleFileClick = useCallback(async (item) => {
    setSelectedId(item.id || item.path || item.name);
    const filePath = itemPath(item, currentFolderPath);
    addToast(`Downloading "${item.name}"...`, 'info');

    try {
      const result = await downloadFile(userid, filePath);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Download complete.', 'success');
    } catch (err) {
      addToast(err.message || 'Download failed.', 'error');
    }
  }, [userid, currentFolderPath, addToast]);

  const handleContextAction = useCallback((actionId, item) => {
    switch (actionId) {
      case 'open':
        handleNavigate(itemPath(item, currentFolderPath));
        break;
      case 'download':
        handleFileClick(item);
        break;
      case 'rename':
        setRenameItem(item);
        break;
      case 'move':
        setMoveItem(item);
        break;
      case 'share':
        setShareItem(item);
        break;
      case 'trash':
        setDeleteItem(item);
        setDeleteIsPermanent(false);
        break;
      default:
        break;
    }
  }, [currentFolderPath, handleFileClick, handleNavigate]);

  const handleNewFolder = () => {
    setNewFolderDirectory(currentFolderPath);
  };

  const handleCreateFolder = async (name) => {
    const folderPath = normalizePath(`${newFolderDirectory || ''}/${name.trim()}`);
    await createFolder(userid, folderPath);
    addToast(`Folder "${name.trim()}" created.`, 'success');
    fetchFolderData();
    window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT));
  };

  const handleUploadFiles = (selectedFiles) => {
    window.dispatchEvent(new CustomEvent('nascloud-upload-trigger', {
      detail: { files: Array.from(selectedFiles), directory: currentFolderPath },
    }));
  };

  const handleUploadFolder = (selectedFiles) => {
    window.dispatchEvent(new CustomEvent('nascloud-upload-trigger', {
      detail: { files: Array.from(selectedFiles), directory: currentFolderPath, isFolderUpload: true },
    }));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    const deletePath = itemPath(deleteItem, currentFolderPath);

    try {
      await deleteFile(userid, deletePath, deleteIsPermanent ? 0 : 1);
      addToast(deleteIsPermanent ? 'Deleted permanently.' : `Moved "${deleteItem.name}" to Trash.`, 'success');
      setDeleteItem(null);
      fetchFolderData();
      window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT));
    } catch (err) {
      addToast(err.message || 'Action failed.', 'error');
    }
  };

  return (
    <div
      className={styles.viewport}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Toolbar
        currentPath={currentFolderPath}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onUploadFiles={handleUploadFiles}
        onUploadFolder={handleUploadFolder}
        onNewFolder={handleNewFolder}
        onRefresh={() => fetchFolderData(true)}
        isRefreshing={isRefreshing}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        summary={folderSummary}
      />

      <div className={styles.content}>
        <div className={styles.folderHeader}>
          <div className={styles.folderTitleBlock}>
            <p className={styles.eyebrow}>{currentFolderPath || 'Home'}</p>
            <h2>{currentFolderPath ? currentFolderPath.split('/').pop() : 'My Drive'}</h2>
          </div>
          <div className={styles.metaStrip}>
            <span>{folderSummary.folders} folders</span>
            <span>{folderSummary.files} files</span>
            {searchValue.trim() && <span>{folderSummary.shown} shown</span>}
          </div>
        </div>

        {loading ? (
          <Skeleton type={viewMode === 'grid' ? 'card' : 'row'} count={6} />
        ) : error ? (
          <div className={styles.errorState}>
            <AlertTriangle size={36} aria-hidden="true" />
            <h3>Error Loading View</h3>
            <p>{error}</p>
            <button className={styles.btnRetry} onClick={fetchFolderData}>Retry</button>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderOpen className={styles.emptyIcon} size={44} aria-hidden="true" />
            <h3>This folder is empty</h3>
            <p>Drag files here or use the Upload button to get started.</p>
          </div>
        ) : (
          <FileList
            files={filteredFiles}
            viewMode={viewMode}
            currentPath={currentFolderPath}
            onContextMenu={handleContextMenuTrigger}
            onNavigate={handleNavigate}
            onFileClick={handleFileClick}
            selectedId={selectedId}
          />
        )}
      </div>

      {dragActive && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragCard}>
            <UploadCloud className={styles.dragIcon} size={52} aria-hidden="true" />
            <h3>Drop your files here</h3>
            <p>Instantly upload them to the current folder</p>
          </div>
        </div>
      )}

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        item={contextMenu.item}
        onAction={handleContextAction}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0, item: null })}
      />

      <RenameModal
        isOpen={!!renameItem}
        onClose={() => setRenameItem(null)}
        item={renameItem}
        onSuccess={() => {
          fetchFolderData();
          window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT));
        }}
      />

      <NewFolderModal
        isOpen={newFolderDirectory !== null}
        directory={newFolderDirectory || ''}
        onClose={() => setNewFolderDirectory(null)}
        onCreate={handleCreateFolder}
      />

      <MoveModal
        isOpen={!!moveItem}
        onClose={() => setMoveItem(null)}
        item={moveItem}
        onSuccess={() => {
          fetchFolderData();
          window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT));
        }}
      />

      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        item={shareItem}
      />

      <DeleteConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        item={deleteItem}
        isPermanent={deleteIsPermanent}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
