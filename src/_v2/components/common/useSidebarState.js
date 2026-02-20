/**
 * @fileoverview Custom hook for Sidebar state management
 * @module components/common/useSidebarState
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { checkServerStatus } from '@/lib/serverStatus';

/**
 * Hook for managing sidebar state including server status polling,
 * responsive behavior, and menu open/close state
 * 
 * @param {boolean} isMobileProp - Mobile flag from parent component
 * @param {Function} setMenuOpen - State setter for menu open state
 * @param {number} mobileBreakpoint - Breakpoint for mobile detection
 * @returns {Object} Sidebar state object
 * @returns {Object} returns.serverStatus - Current server status with online, health, latencyMs, lastChecked
 * @returns {boolean} returns.isMobile - Current mobile state
 * 
 * @example
 * const { serverStatus, isMobile } = useSidebarState(isMobileProp, setMenuOpen, 768);
 */
export function useSidebarState(isMobileProp, setMenuOpen, mobileBreakpoint = 768) {
  const [serverStatus, setServerStatus] = useState({
    online: true,
    health: 'ok',
    latencyMs: null,
    lastChecked: null,
  });
  const [isMobileInternal, setIsMobileInternal] = useState(
    window.innerWidth < mobileBreakpoint
  );
  
  const location = useLocation();

  // Window resize detection
  useEffect(() => {
    if (isMobileProp !== undefined) return;

    const handleResize = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      setIsMobileInternal(mobile);
      if (!mobile) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileProp, mobileBreakpoint, setMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;
    if (isMobile) {
      setMenuOpen(false);
    }
  }, [location.pathname, isMobileProp, isMobileInternal, setMenuOpen]);

  // Server status polling
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkServerStatus();
      setServerStatus({
        online: status.online,
        health: status.health || (status.online ? 'ok' : 'down'),
        latencyMs: typeof status.latencyMs === 'number' ? status.latencyMs : null,
        lastChecked: status.lastChecked || new Date().toISOString(),
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileInternal;

  return {
    serverStatus,
    isMobile
  };
}
