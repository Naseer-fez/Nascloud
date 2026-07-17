import React, { useEffect, useRef, useState } from 'react';
import { File, FileImage, Search } from 'lucide-react';
import { searchFile } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import styles from './SearchDropdown.module.css';

function ResultIcon({ name }) {
  const ext = (name || '').split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
    return <FileImage size={18} aria-hidden="true" />;
  }
  return <File size={18} aria-hidden="true" />;
}

export default function SearchDropdown({ searchQuery, isVisible, onClose, onNavigate }) {
  const { userid } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || !isVisible) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await searchFile(userid, query);
        const paths = Array.isArray(data)
          ? data.map((item) => item.path || item.filepath || item.name).filter(Boolean)
          : data?.return === 'File Found' && Array.isArray(data.path)
            ? data.path
            : [];

        setResults(paths.map((path) => ({
          name: String(path).split('/').pop(),
          path: String(path),
        })));
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, isVisible, userid]);

  if (!isVisible || !searchQuery.trim()) return null;

  const handleItemClick = (item) => {
    const parts = item.path.split('/');
    parts.pop();
    const parentFolder = parts.join('/');
    onNavigate(parentFolder ? encodeURIComponent(parentFolder) : '');
    onClose();
  };

  return (
    <div className={styles.dropdown}>
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Searching all files...</span>
        </div>
      ) : results.length > 0 ? (
        <div className={styles.resultsList}>
          {results.map((item) => {
            const parts = item.path.split('/');
            const parent = parts.length > 1 ? parts.slice(0, -1).join(' / ') : 'Home';
            return (
              <button key={item.path} className={styles.resultItem} onClick={() => handleItemClick(item)}>
                <span className={styles.itemIcon}><ResultIcon name={item.name} /></span>
                <span className={styles.itemMeta}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemPath}>{parent}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : searched ? (
        <div className={styles.empty}>
          <Search size={22} aria-hidden="true" />
          <p>No global results found</p>
        </div>
      ) : null}
    </div>
  );
}
