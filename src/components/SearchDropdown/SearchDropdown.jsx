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

const searchCache = new Map();

export default function SearchDropdown({ searchQuery, isVisible, onClose, onNavigate }) {
  const { userid } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceTimer = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const query = searchQuery.trim();

    // Clear debounce timer and cancel pending requests immediately on input change/close
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query || !isVisible || query.length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setResults([]);
      setSearched(false);
      setLoading(false);
      return undefined;
    }

    debounceTimer.current = setTimeout(async () => {
      // Minimum length check
      if (query.length < 2) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }

      // Cancel previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Check local cache
      const cacheKey = `${userid ?? 'anonymous'}:${query.toLowerCase()}`;
      if (searchCache.has(cacheKey)) {
        setResults(searchCache.get(cacheKey));
        setLoading(false);
        setSearched(true);
        return;
      }

      // Cache miss -> Send request
      setLoading(true);
      try {
        const data = await searchFile(userid, query, { signal: controller.signal });
        const paths = Array.isArray(data)
          ? data.map((item) => item.path || item.filepath || item.name).filter(Boolean)
          : data?.return === 'File Found' && Array.isArray(data.path)
            ? data.path
            : [];

        const formattedResults = paths.map((path) => ({
          name: String(path).split('/').pop(),
          path: String(path),
        }));

        if (!controller.signal.aborted) {
          searchCache.set(cacheKey, formattedResults);
          setResults(formattedResults);
          setSearched(true);
        }
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          return;
        }
        console.error('Search failed:', err);
        setResults([]);
        setSearched(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, isVisible, userid]);

  if (!isVisible || !searchQuery.trim() || searchQuery.trim().length < 2) return null;

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
