"use client";

import { useEffect, useState, useCallback } from "react";

export function PwaInteractions() {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY > 0 && window.scrollY === 0) {
      const y = e.touches[0].clientY;
      if (y > startY) {
        // Prevent default only if pulling down at the very top
        e.preventDefault();
        setCurrentY(y - startY);
      }
    }
  }, [startY]);

  const handleTouchEnd = useCallback(() => {
    if (currentY > 80 && !refreshing) {
      setRefreshing(true);
      // Trigger haptic feedback for the "pop" feel
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }
      
      // Simulate refresh delay then reload
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      // Snap back if threshold not met
      setStartY(0);
      setCurrentY(0);
    }
  }, [currentY, refreshing]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Global helper mapped to window for triggering haptics from buttons
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.triggerHaptic = (type = 'light') => {
        if (!navigator.vibrate) return;
        
        switch(type) {
          case 'light': navigator.vibrate(10); break;
          case 'medium': navigator.vibrate(20); break;
          case 'heavy': navigator.vibrate([30, 50, 30]); break;
          case 'success': navigator.vibrate([15, 50, 15, 50, 20]); break;
          default: navigator.vibrate(10);
        }
      };
    }
  }, []);

  const isActive = currentY > 0;
  // Calculate drag resistance
  const translateY = Math.min(currentY * 0.4, 80);

  return (
    <div className={`ptr-container ${isActive ? 'ptr-active' : ''} ${refreshing ? 'ptr-refreshing' : ''}`} style={isActive && !refreshing ? { transform: `translateY(${translateY}px)` } : {}}>
      <div className="ptr-spinner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 3.84-10.58L2 7"></path>
        </svg>
      </div>
    </div>
  );
}
