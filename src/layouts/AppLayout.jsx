import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import UploadPanel from '../components/UploadPanel/UploadPanel';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return window.innerWidth < 768;
  });

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
      />
      <main className={styles.main}>
        <div className={styles.content}>
          <div key={location.pathname} className={styles.contentAnimated}>
            <Outlet />
          </div>
        </div>
      </main>
      <UploadPanel />
    </div>
  );
}
