"use client";

import { useEffect } from "react";

export function PwaInteractions() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    window.triggerHaptic = (type = "light") => {
      if (!navigator.vibrate) {
        return;
      }

      switch (type) {
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(20);
          break;
        case "heavy":
          navigator.vibrate([30, 50, 30]);
          break;
        case "success":
          navigator.vibrate([15, 50, 15, 50, 20]);
          break;
        default:
          navigator.vibrate(10);
      }
    };

    return () => {
      delete window.triggerHaptic;
    };
  }, []);

  return null;
}
